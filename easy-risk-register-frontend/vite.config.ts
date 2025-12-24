import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
function cspHeader({ mode }: { mode: string }) {
  if (mode === 'development') {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval'",
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

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': cspHeader({ mode }),
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy': cspHeader({ mode }),
    },
  },
}))
