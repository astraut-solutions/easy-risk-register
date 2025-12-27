import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget =
    env.API_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://localhost:3000'

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
