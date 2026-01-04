import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { promises as dns } from 'node:dns'

// https://vite.dev/config/
function cspHeader({ mode }: { mode: string }) {
  if (mode === 'development') {
    return [
      "default-src 'self'",
      // Vite dev client + React Fast Refresh rely on inline scripts in dev.
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "script-src-attr 'none'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' http: https: ws: wss:",
      "media-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  }

  return [
    "default-src 'self'",
    "script-src 'self'",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' http: https:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

async function resolveProxyTarget(targets: string[]) {
  for (const candidate of targets) {
    try {
      const candidateHostname = new URL(candidate).hostname
      await dns.lookup(candidateHostname)
      return candidate
    } catch {
      // Any DNS hiccup means the unresolved candidate gets skipped.
    }
  }
  return null
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const fallbackTarget = 'http://localhost:3000'
  const candidateTargets = [env.API_PROXY_TARGET, env.VITE_API_BASE_URL].filter(
    (value): value is string => Boolean(value),
  )
  // The fallback logic is only needed when Vite runs on the host OS.
  // Dockerized containers signal that the API hostname already exists.
  const shouldFallback = env.VITE_RUNNING_IN_DOCKER !== 'true'
  const resolvedTarget =
    shouldFallback && candidateTargets.length > 0
      ? await resolveProxyTarget(candidateTargets)
      : null
  const apiProxyTarget = resolvedTarget ?? candidateTargets[0] ?? fallbackTarget

  return {
    plugins: [react()],
    server: {
      port: Number(process.env.PORT) || 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
      headers: {
        'Content-Security-Policy': cspHeader({ mode }),
      },
    },
    preview: {
      headers: {
        'Content-Security-Policy': cspHeader({ mode }),
      },
    },
  }
})
