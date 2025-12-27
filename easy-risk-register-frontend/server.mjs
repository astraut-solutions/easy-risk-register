import crypto from 'node:crypto'
import { createReadStream } from 'node:fs'
import { access, readFile, stat } from 'node:fs/promises'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, 'dist')
const port = Number(process.env.PORT ?? 8080)
const apiProxyTarget = process.env.API_PROXY_TARGET || null

const indexPath = path.join(distDir, 'index.html')
await access(indexPath)
const indexHtmlTemplate = await readFile(indexPath, 'utf8')

function contentSecurityPolicy(nonce) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' http: https: ws: wss:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.js':
      return 'application/javascript; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.svg':
      return 'image/svg+xml'
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.ico':
      return 'image/x-icon'
    case '.woff':
      return 'font/woff'
    case '.woff2':
      return 'font/woff2'
    case '.ttf':
      return 'font/ttf'
    case '.map':
      return 'application/json; charset=utf-8'
    default:
      return 'application/octet-stream'
  }
}

function injectNonceIntoScripts(html, nonce) {
  return html.replace(/<script\b(?![^>]*\bnonce=)/g, `<script nonce="${nonce}"`)
}

function toSafePathname(reqUrl, hostHeader) {
  const url = new URL(reqUrl ?? '/', `http://${hostHeader ?? 'localhost'}`)
  const pathname = decodeURIComponent(url.pathname)
  if (!pathname.startsWith('/')) return '/'
  return pathname
}

async function tryStat(filePath) {
  try {
    return await stat(filePath)
  } catch {
    return null
  }
}

function proxyApiRequest(req, res, { target }) {
  const targetUrl = new URL(target)
  const reqUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

  const transport = targetUrl.protocol === 'https:' ? https : http

  const upstreamHeaders = { ...req.headers }
  delete upstreamHeaders.host

  const upstreamReq = transport.request(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      method: req.method,
      path: `${targetUrl.pathname.replace(/\/$/, '')}${reqUrl.pathname}${reqUrl.search}`,
      headers: upstreamHeaders,
    },
    (upstreamRes) => {
      res.statusCode = upstreamRes.statusCode ?? 502
      for (const [key, value] of Object.entries(upstreamRes.headers)) {
        if (value !== undefined) res.setHeader(key, value)
      }
      upstreamRes.pipe(res)
    },
  )

  upstreamReq.on('error', () => {
    res.statusCode = 502
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Bad Gateway' }))
  })

  req.pipe(upstreamReq)
}

const server = http.createServer(async (req, res) => {
  const pathname = toSafePathname(req.url, req.headers.host)
  if (apiProxyTarget && (pathname === '/api' || pathname.startsWith('/api/'))) {
    proxyApiRequest(req, res, { target: apiProxyTarget })
    return
  }

  const nonce = crypto.randomBytes(16).toString('base64')
  const csp = contentSecurityPolicy(nonce)

  res.setHeader('Content-Security-Policy', csp)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Method Not Allowed')
    return
  }

  const requestedPath = pathname === '/' ? '/index.html' : pathname
  const resolvedPath = path.normalize(path.join(distDir, requestedPath))

  const isInDist =
    resolvedPath === distDir || resolvedPath.startsWith(`${distDir}${path.sep}`)
  if (isInDist) {
    const fileStat = await tryStat(resolvedPath)
    if (fileStat?.isFile()) {
      res.statusCode = 200
      res.setHeader('Content-Type', mimeType(resolvedPath))
      if (pathname.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else if (pathname === '/' || pathname.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      }

      if (req.method === 'HEAD') {
        res.end()
        return
      }

      createReadStream(resolvedPath).pipe(res)
      return
    }
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  const html = injectNonceIntoScripts(indexHtmlTemplate, nonce)

  if (req.method === 'HEAD') {
    res.end()
    return
  }

  res.end(html)
})

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Serving ${distDir} on http://localhost:${port}`)
})
