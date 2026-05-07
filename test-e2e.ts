/**
 * VCKnots E2E テストスクリプト
 *
 * Issuer → Wallet(シミュレーション) → Verifier の一連のフローを実行します。
 *
 * 使い方:
 *   1. サーバーを起動: pnpm -F @trustknots/server start
 *   2. 別ターミナルで: npx tsx test-e2e.ts
 *
 * フロー:
 *   Step 1: Issuer にクレデンシャルオファーを要求
 *   Step 2: Authorization Server からアクセストークンを取得
 *   Step 3: アクセストークンを使ってクレデンシャルを発行
 *   Step 4: Verifier に認可リクエストを作成（Presentation Request）
 *   Step 5: Request Object JWT を取得・デコード
 *   Step 6: Wallet が VP Token を生成し、Verifier のコールバックに送信
 */

import { SignJWT, importJWK } from 'jose'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080'

// ── ユーティリティ ───────────────────────────────────────────

function section(title: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('='.repeat(60))
}

function info(label: string, value: unknown) {
  const display = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
  console.log(`  [INFO] ${label}: ${display}`)
}

function success(msg: string) {
  console.log(`  [OK] ${msg}`)
}

function fail(msg: string): never {
  console.error(`  [FAIL] ${msg}`)
  process.exit(1)
}

// ── Step 1: クレデンシャルオファーの取得 ─────────────────────

async function getCredentialOffer(): Promise<{
  credential_issuer: string
  credential_configuration_ids: string[]
  grants: Record<string, { 'pre-authorized_code': string }>
}> {
  section('Step 1: クレデンシャルオファーの取得')

  const res = await fetch(
    `${BASE_URL}/configurations/UniversityDegreeCredential/offer`,
    { method: 'POST' }
  )
  if (!res.ok) fail(`Offer request failed: ${res.status}`)

  const body = await res.text()
  info('Offer URI', body.substring(0, 120) + '...')

  // openid-credential-offer://?credential_offer={...} をパース
  const encoded = body.replace('openid-credential-offer://?credential_offer=', '')
  const offer = JSON.parse(decodeURIComponent(encoded))

  info('Issuer', offer.credential_issuer)
  info('Credential Configs', offer.credential_configuration_ids)
  success('クレデンシャルオファーを取得しました')
  return offer
}

// ── Step 2: アクセストークンの取得 ───────────────────────────

async function getAccessToken(preAuthCode: string): Promise<{
  access_token: string
  c_nonce: string
  c_nonce_expires_in: number
}> {
  section('Step 2: アクセストークンの取得')

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
    'pre-authorized_code': preAuthCode,
  })

  const res = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    body,
  })
  if (!res.ok) fail(`Token request failed: ${res.status} ${await res.text()}`)

  const token = await res.json() as any
  info('Token Type', token.token_type)
  info('Expires In', `${token.expires_in}秒`)
  info('c_nonce', token.c_nonce)
  success('アクセストークンを取得しました')
  return token
}

// ── Step 3: クレデンシャルの発行 ─────────────────────────────

async function issueCredential(
  accessToken: string,
  cNonce: string
): Promise<{ credential: string }> {
  section('Step 3: クレデンシャルの発行')

  // Go の MockKeyEntry と同じ鍵ペアを使用
  const walletPrivateJwk = {
    kty: 'EC' as const,
    crv: 'P-256',
    x: 'ezZgKwMueAyZLHUgSpzNkbOWDgjJXTAOJn8MftOnayQ',
    y: 'Fy_U4KyZQf-9jKpFJtH6OFFRXmwAcveyfuoDp1hSOFo',
    d: 'jAfOh_53IRxqpEsFojZK8iHP--L8ol3ePEo3DnwiIyM',
  }
  const walletKey = await importJWK(walletPrivateJwk, 'ES256')
  const holderDid = 'did:key:zDnaeYiwHNeMYaj21Wo9jPCowtnBrY8he8UCK8ZZN1mhhx8PM'

  // Proof JWT を作成
  // Pre-Authorized Code フローでは iss を省略する必要がある
  // kid に DID を指定する必要がある (jwk ヘッダーではなく)
  const proofJwt = await new SignJWT({
    aud: BASE_URL,
    nonce: cNonce,
  })
    .setProtectedHeader({
      alg: 'ES256',
      typ: 'openid4vci-proof+jwt',
      kid: holderDid,
    })
    .setIssuedAt()
    .sign(walletKey)

  const credentialRequest = {
    format: 'jwt_vc_json',
    credential_definition: {
      type: ['VerifiableCredential', 'UniversityDegreeCredential'],
    },
    proof: {
      proof_type: 'jwt',
      jwt: proofJwt,
    },
  }

  const res = await fetch(`${BASE_URL}/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(credentialRequest),
  })
  if (!res.ok) fail(`Credential request failed: ${res.status} ${await res.text()}`)

  const credentialResponse = await res.json() as any
  info('Credential (先頭100文字)', String(credentialResponse.credential).substring(0, 100) + '...')

  // JWT をデコードして中身を表示
  const parts = String(credentialResponse.credential).split('.')
  if (parts.length === 3) {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    info('発行者 (iss)', payload.iss)
    info('対象者 (sub)', payload.sub)
    if (payload.vc) {
      info('VC Type', payload.vc.type)
      info('VC Subject', payload.vc.credentialSubject)
    }
  }

  success('クレデンシャルが発行されました')
  return credentialResponse
}

// ── Step 4 & 5: Verifier への認可リクエスト ──────────────────

async function createPresentationRequest(): Promise<{
  requestUri: string
  state: string
  clientId: string
  nonce: string
  responseUri: string
  presentationDefinition: any
}> {
  section('Step 4: Verifier への認可リクエスト作成')

  const requestBody = {
    query: {
      presentation_definition: {
        id: 'e2e-test-presentation',
        input_descriptors: [
          {
            id: 'university-degree',
            name: 'UniversityDegreeCredential',
            purpose: 'E2Eテスト: 大学学位クレデンシャルの検証',
            format: {
              jwt_vc_json: {
                alg: ['ES256'],
              },
            },
            constraints: {
              fields: [
                {
                  path: ['$.vc.type'],
                  filter: {
                    type: 'array',
                    contains: { const: 'UniversityDegreeCredential' },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    state: 'e2e-test-state-001',
    base_url: BASE_URL,
    is_request_uri: true,
    response_uri: `${BASE_URL}/callback`,
    client_id: 'x509_san_dns:localhost',
  }

  const res = await fetch(`${BASE_URL}/request-object`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })
  if (!res.ok) fail(`Request object creation failed: ${res.status} ${await res.text()}`)

  const body = await res.text()
  info('Authorization Request URI', body.substring(0, 120) + '...')

  // openid4vp://authorize?... をパース
  const url = new URL(body)
  const clientId = url.searchParams.get('client_id') ?? ''
  const requestUriParam = url.searchParams.get('request_uri') ?? ''

  info('client_id', clientId)
  info('request_uri', requestUriParam)

  section('Step 5: Request Object JWT の取得')

  // request_uri から JWT を取得
  const jwtRes = await fetch(requestUriParam)
  if (!jwtRes.ok) fail(`Request JWT fetch failed: ${jwtRes.status}`)

  const requestJwt = await jwtRes.text()
  const jwtParts = requestJwt.split('.')
  let nonce = ''
  let responseUri = ''
  let presentationDefinition: any = null
  if (jwtParts.length === 3) {
    const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64url').toString())
    info('response_mode', payload.response_mode)
    info('response_uri', payload.response_uri)
    info('nonce', payload.nonce)
    info('state', payload.state)
    nonce = payload.nonce
    responseUri = payload.response_uri
    presentationDefinition = payload.presentation_definition
    if (payload.presentation_definition) {
      info('Presentation Definition ID', payload.presentation_definition.id)
    }
  }

  success('Request Object を取得・デコードしました')

  return {
    requestUri: body,
    state: requestBody.state,
    clientId: requestBody.client_id,
    nonce,
    responseUri,
    presentationDefinition,
  }
}

// ── Step 6: VP Token の生成と Verifier への提出 ──────────────

async function presentCredential(
  credential: string,
  state: string,
  nonce: string,
  responseUri: string,
  presentationDefinition: any
): Promise<void> {
  section('Step 6: VP Token の生成と Verifier への提出')

  info('nonce', nonce)
  info('response_uri', responseUri)

  // Wallet の鍵ペア (VP 署名用)
  const walletJwk = {
    kty: 'EC',
    crv: 'P-256',
    x: 'ezZgKwMueAyZLHUgSpzNkbOWDgjJXTAOJn8MftOnayQ',
    y: 'Fy_U4KyZQf-9jKpFJtH6OFFRXmwAcveyfuoDp1hSOFo',
    d: 'jAfOh_53IRxqpEsFojZK8iHP--L8ol3ePEo3DnwiIyM',
  }
  const walletPrivateKey = await importJWK(walletJwk, 'ES256')

  const holderDid = 'did:key:zDnaeYiwHNeMYaj21Wo9jPCowtnBrY8he8UCK8ZZN1mhhx8PM'

  // VP Token (Verifiable Presentation) を作成
  const vpToken = await new SignJWT({
    iss: holderDid,
    aud: 'x509_san_dns:localhost',
    vp: {
      type: ['VerifiablePresentation'],
      verifiableCredential: [credential],
      holder: holderDid,
    },
    nonce,
  })
    .setProtectedHeader({
      alg: 'ES256',
      typ: 'JWT',
      kid: holderDid,
    })
    .sign(walletPrivateKey)

  info('VP Token (先頭80文字)', vpToken.substring(0, 80) + '...')

  // Presentation Submission を作成
  const presentationSubmission = {
    id: 'e2e-submission-001',
    definition_id: presentationDefinition.id,
    descriptor_map: [
      {
        id: presentationDefinition.input_descriptors[0].id,
        format: 'jwt_vp_json',
        path: '$.vp',
        path_nested: {
          id: presentationDefinition.input_descriptors[0].id,
          format: 'jwt_vc_json',
          path: '$.verifiableCredential[0]',
        },
      },
    ],
  }

  // Verifier のコールバックに提出
  const formBody = new URLSearchParams({
    vp_token: vpToken,
    presentation_submission: JSON.stringify(presentationSubmission),
    state,
  })

  const callbackRes = await fetch(responseUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  })

  const callbackResponse = await callbackRes.json() as any
  info('Callback Status', callbackRes.status)
  info('Callback Response', callbackResponse)

  if (!callbackRes.ok) {
    fail(`Verification failed: ${JSON.stringify(callbackResponse)}`)
  }

  if (callbackResponse.redirect_uri) {
    // /verified エンドポイントを確認
    const verifiedRes = await fetch(callbackResponse.redirect_uri)
    const verifiedBody = await verifiedRes.json() as any
    info('Verified Response', verifiedBody)
  }

  success('クレデンシャルの検証が完了しました！')
}

// ── メインフロー ─────────────────────────────────────────────

async function main() {
  console.log('\n VCKnots E2E テスト')
  console.log(`  サーバー: ${BASE_URL}`)
  console.log(`  日時: ${new Date().toLocaleString('ja-JP')}`)

  try {
    // Step 1: Issuer からクレデンシャルオファーを取得
    const offer = await getCredentialOffer()

    const preAuthGrant =
      offer.grants['urn:ietf:params:oauth:grant-type:pre-authorized_code']
    if (!preAuthGrant) fail('Pre-authorized code grant が見つかりません')

    // Step 2: アクセストークンを取得
    const tokenResponse = await getAccessToken(preAuthGrant['pre-authorized_code'])

    // Step 3: クレデンシャルを発行
    const credentialResponse = await issueCredential(
      tokenResponse.access_token,
      tokenResponse.c_nonce
    )

    // Step 4 & 5: Verifier への認可リクエストを作成
    const { state, nonce, responseUri, presentationDefinition } =
      await createPresentationRequest()

    // Step 6: VP Token を生成して Verifier に提出
    await presentCredential(
      credentialResponse.credential,
      state,
      nonce,
      responseUri,
      presentationDefinition
    )

    section('テスト完了')
    console.log('\n  Issuer → Wallet → Verifier の全フローが正常に動作しました！\n')
  } catch (err) {
    console.error('\n  [ERROR]', err)
    process.exit(1)
  }
}

main()
