/**
 * VCKnots Demo Server
 *
 * - port 3000 で HTML ページを配信
 * - API リクエストを port 8080 のバックエンドにプロキシ
 * - /callback の結果をトラッキングして Verifier ページにポーリング提供
 *
 * 起動方法:
 *   npx tsx demo/server.ts
 */

import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

// プロジェクトルートから npx tsx demo/server.ts で実行する想定
const DEMO_DIR = join(process.cwd(), 'demo')
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080'
const PORT = Number(process.env.DEMO_PORT ?? 3000)

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

// Verification result store (state → result)
const verificationResults = new Map<
  string,
  { verified: boolean; timestamp: number; payload?: unknown }
>()

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk: Buffer) => (data += chunk.toString()))
    req.on('end', () => resolve(data))
  })
}

// ── CORS helper ──────────────────────────────────────────
function setCors(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) {
  const origin = req.headers.origin ?? '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  // ── CORS: set headers on every response ────────────────
  setCors(req, res)

  // ── Preflight (OPTIONS) ────────────────────────────────
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // ── Demo result polling ─────────────────────────────────
  if (req.method === 'GET' && url.pathname.startsWith('/demo/results/')) {
    const state = decodeURIComponent(url.pathname.slice('/demo/results/'.length))
    const result = verificationResults.get(state)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result ?? { verified: false }))
    return
  }

  // ── Static files ────────────────────────────────────────
  if (req.method === 'GET') {
    const filePath = url.pathname === '/' ? '/index.html' : url.pathname
    const fullPath = join(DEMO_DIR, filePath)
    if (existsSync(fullPath) && !fullPath.includes('..')) {
      const ext = extname(fullPath)
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
      res.end(readFileSync(fullPath))
      return
    }
  }

  // ── Proxy to backend ───────────────────────────────────
  try {
    const backendUrl = `${BACKEND}${url.pathname}${url.search}`
    const headers: Record<string, string> = {}
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string' && k !== 'host') headers[k] = v
    }

    let body: string | undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await readBody(req)
    }

    const upstream = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: body ?? undefined,
    })

    const responseBody = await upstream.text()

    // Track /callback results for Verifier polling
    if (
      (url.pathname === '/callback' || url.pathname === '/callback-kbjwt') &&
      upstream.status === 200 &&
      body
    ) {
      const params = new URLSearchParams(body)
      const state = params.get('state')
      if (state) {
        let payload: unknown
        try {
          payload = JSON.parse(responseBody)
        } catch {}
        verificationResults.set(state, {
          verified: true,
          timestamp: Date.now(),
          payload,
        })
      }
    }

    const outHeaders: Record<string, string> = {}
    upstream.headers.forEach((v, k) => {
      // transfer-encoding と CORS ヘッダーはスキップ（自前で付与する）
      if (k === 'transfer-encoding') return
      if (k.startsWith('access-control-')) return
      outHeaders[k] = v
    })
    res.writeHead(upstream.status, outHeaders)
    res.end(responseBody)
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'backend_unavailable', message: String(err) }))
  }
})

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║         VCKnots Demo Server                  ║
╠══════════════════════════════════════════════╣
║  Demo UI:  http://localhost:${PORT}              ║
║  Backend:  ${BACKEND.padEnd(33)}║
╠══════════════════════════════════════════════╣
║  Pages:                                      ║
║    /issuer.html   - Issuer (発行者)          ║
║    /wallet.html   - Wallet (ウォレット)      ║
║    /verifier.html - Verifier (検証者)        ║
╚══════════════════════════════════════════════╝
`)
})
