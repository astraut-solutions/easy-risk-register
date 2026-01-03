const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')
const querystring = require('querystring')

function walkFiles(rootDir) {
  const results = []
  const stack = [rootDir]

  while (stack.length) {
    const dir = stack.pop()
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
        continue
      }
      if (entry.isFile() && entry.name.endsWith('.js')) {
        results.push(fullPath)
      }
    }
  }

  return results
}

function isDynamicSegment(segment) {
  const match = /^\[(.+)\]$/.exec(segment)
  return match ? match[1] : null
}

function normalizePathname(pathname) {
  if (!pathname) return '/'
  if (pathname.length > 1) return pathname.replace(/\/+$/, '')
  return pathname
}

function buildRoutes() {
  const rootDir = path.join(__dirname, '..')
  const apiDir = path.join(rootDir, 'api')
  const serverApiDir = path.join(rootDir, 'server', 'api')

  const files = [
    ...walkFiles(apiDir).map(f => ({ file: f, base: apiDir })),
    ...walkFiles(serverApiDir).map(f => ({ file: f, base: serverApiDir }))
  ]

  const routes = []

  for (const { file, base } of files) {
    const rel = path.relative(base, file).replace(/\\/g, '/')
    if (rel.startsWith('_lib/')) continue

    let routePath = `/api/${rel.replace(/\.js$/, '')}`
    routePath = routePath.replace(/\/index$/, '')
    routePath = routePath.replace(/\/+/g, '/')

    // Avoid duplication if the same route is found in both places (favor server/api)
    if (routes.find(r => r.routePath === routePath)) continue

    const segments = routePath.split('/').filter(Boolean)
    const pattern = segments.map(segment => {
      const name = isDynamicSegment(segment)
      return name ? { type: 'param', name } : { type: 'literal', value: segment }
    })

    routes.push({
      file,
      routePath,
      pattern,
      handler: require(file),
    })
  }

  routes.sort((a, b) => {
    const aDynamic = a.pattern.filter(s => s.type === 'param').length
    const bDynamic = b.pattern.filter(s => s.type === 'param').length
    if (aDynamic !== bDynamic) return aDynamic - bDynamic
    return b.pattern.length - a.pattern.length
  })

  return routes
}

function matchRoute(routes, pathname) {
  const pathSegments = normalizePathname(pathname).split('/').filter(Boolean)

  for (const route of routes) {
    const params = {}
    let matched = true
    let pathIdx = 0

    for (let i = 0; i < route.pattern.length; i++) {
      const segmentSpec = route.pattern[i]

      if (segmentSpec.type === 'param' && segmentSpec.name.startsWith('...')) {
        // Catch-all segment: consumes all remaining path segments
        const paramName = segmentSpec.name.slice(3)
        params[paramName] = pathSegments.slice(pathIdx)
        pathIdx = pathSegments.length
        break
      }

      if (pathIdx >= pathSegments.length) {
        matched = false
        break
      }

      const segmentValue = pathSegments[pathIdx]
      if (segmentSpec.type === 'literal') {
        if (segmentSpec.value !== segmentValue) {
          matched = false
          break
        }
      } else {
        params[segmentSpec.name] = segmentValue
      }
      pathIdx++
    }

    if (matched && pathIdx === pathSegments.length) {
      return { route, params }
    }
  }

  return null
}

function setResponseHelpers(res) {
  res.status = function status(code) {
    res.statusCode = code
    return res
  }

  res.json = function json(payload) {
    if (!res.getHeader('content-type')) {
      res.setHeader('content-type', 'application/json; charset=utf-8')
    }
    console.log(`[dev-api] ${res.statusCode} response body:`, JSON.stringify(payload))
    res.end(JSON.stringify(payload))
  }

  return res
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

async function parseRequestBody(req) {
  const method = String(req.method || 'GET').toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return undefined

  const body = await readBody(req)
  if (!body.length) return undefined

  const contentType = String(req.headers['content-type'] || '').toLowerCase()
  const raw = body.toString('utf8')

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw)
    } catch {
      return undefined
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return querystring.parse(raw)
  }

  return raw
}

function parseQuery(urlObj) {
  const query = {}
  for (const [key, value] of urlObj.searchParams.entries()) {
    if (query[key] === undefined) {
      query[key] = value
      continue
    }
    if (Array.isArray(query[key])) {
      query[key].push(value)
      continue
    }
    query[key] = [query[key], value]
  }
  return query
}

function start() {
  const port = Number.parseInt(process.env.PORT || '3000', 10)
  const routes = buildRoutes()

  const server = http.createServer(async (req, res) => {
    setResponseHelpers(res)

    try {
      const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
      const match = matchRoute(routes, urlObj.pathname)

      if (!match) {
        res.status(404).json({ error: 'Not found' })
        return
      }

      req.query = parseQuery(urlObj)
      for (const [key, value] of Object.entries(match.params)) {
        if (req.query[key] === undefined) req.query[key] = value
      }

      req.body = await parseRequestBody(req)

      await match.route.handler(req, res)
    } catch (error) {
      res.status(500).json({
        error: 'Dev API server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  server.listen(port, () => {
    process.stdout.write(`[dev-api] listening on http://localhost:${port}\n`)
  })
}

start()

