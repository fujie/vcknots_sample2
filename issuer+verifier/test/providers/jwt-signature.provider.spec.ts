import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { generateKeyPairSync, createPublicKey } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { jwtSignature } from '../../src/providers/jwt-signature.provider'
import { JwtSignatureProvider } from '../../src/providers/provider.types'
import { Jwk } from '../../src/jwk.type'

function convertPublicKeyToJwk(publicKeyPem: string): Jwk {
  const keyObj = createPublicKey(publicKeyPem)
  const jwk = keyObj.export({ format: 'jwk' }) as Jwk
  return jwk
}

describe('JwtSignatureProvider', () => {
  const provider: JwtSignatureProvider = jwtSignature()

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

  const payload = { sub: '1234567890', name: 'Alice', iat: Math.floor(Date.now() / 1000) }
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' })

  const publicKeyJwk = convertPublicKeyToJwk(publicKey)

  it('should verify a valid JWT', async () => {
    const verified = await provider.verify(token, publicKeyJwk)
    assert.strictEqual(verified, true)
  })

  it('should reject invalid JWT', async () => {
    function base64urlEncode(input: string): string {
      return Buffer.from(input).toString('base64url')
    }

    const tamperedPayload = base64urlEncode(JSON.stringify({ sub: 'tampered' }))
    const tampered = token.replace(/^([^.]+)\.([^.]+)\.([^.]+)$/, `$1.${tamperedPayload}.$3`)
    await assert.rejects(() => provider.verify(tampered, publicKeyJwk), {
      message: 'Invalid signature detected.',
    })
  })

  it('should reject non-string token', async () => {
    await assert.rejects(() => provider.verify({} as unknown as string, publicKeyJwk), {
      message: 'Token is not supported.',
    })
  })
})
