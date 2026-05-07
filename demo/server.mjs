/**
 * VCKnots Demo Server
 *
 * - port 3000 で HTML ページを配信
 * - API リクエストを port 8080 のバックエンドにプロキシ
 * - /callback の結果をトラッキングして Verifier ページにポーリング提供
 *
 * 起動方法:
 *   node demo/server.mjs
 */

import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080'
const PORT = Number(process.env.DEMO_PORT ?? 3000)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

// Verification result store (state → result)
const verificationResults = new Map()

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk.toString()))
    req.on('end', () => resolve(data))
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

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
    const fullPath = join(__dirname, filePath)
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
    const headers = {}
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string' && k !== 'host') headers[k] = v
    }

    let body
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
        let payload
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

    const outHeaders = {}
    upstream.headers.forEach((v, k) => {
      if (k !== 'transfer-encoding') outHeaders[k] = v
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
