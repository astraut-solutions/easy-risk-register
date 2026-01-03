import { useAuthStore } from '../stores/authStore'

function getApiBaseUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
  const trimmed = base.replace(/\/+$/, '')
  if (trimmed) return trimmed
  if (import.meta.env.DEV) {
    // In dev we typically proxy to localhost:3000; make it explicit when no override is provided.
    return 'http://localhost:3000'
  }
  return ''
}

function joinUrl(base: string, path: string): string {
  if (!path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}

export type ApiError = {
  status: number
  message: string
  code?: string
  requestId?: string
  retryable?: boolean
  details?: unknown
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function isOnline() {
  if (typeof navigator === 'undefined') return true
  if (typeof navigator.onLine !== 'boolean') return true
  return navigator.onLine
}

async function parseApiErrorResponse(res: Response): Promise<ApiError> {
  const text = await res.text().catch(() => '')
  const contentType = res.headers.get('content-type') || ''

  const parsed = (() => {
    if (!text) return null
    if (!contentType.toLowerCase().includes('application/json')) {
      try {
        return JSON.parse(text) as any
      } catch {
        return null
      }
    }
    try {
      return JSON.parse(text) as any
    } catch {
      return null
    }
  })()

  if (parsed && typeof parsed === 'object') {
    const message = typeof parsed.error === 'string' ? parsed.error : text || res.statusText
    const err: ApiError = {
      status: res.status,
      message,
      code: typeof parsed.code === 'string' ? parsed.code : undefined,
      requestId: typeof parsed.requestId === 'string' ? parsed.requestId : undefined,
      retryable: typeof parsed.retryable === 'boolean' ? parsed.retryable : undefined,
      details: parsed.details,
    }
    return err
  }

  return { status: res.status, message: text || res.statusText }
}

function toNetworkApiError(error: unknown, method: string): ApiError {
  const offline = !isOnline()
  if (offline) {
    return {
      status: 0,
      code: 'OFFLINE',
      message: method && WRITE_METHODS.has(method) ? 'Offline: changes were not saved.' : 'Offline: unable to load data.',
      retryable: true,
    }
  }

  if (error && typeof error === 'object' && typeof (error as any).message === 'string') {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      message: (error as any).message,
      retryable: true,
    }
  }

  return {
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Network error',
    retryable: true,
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { accessToken, workspaceId } = useAuthStore.getState()

  const headers = new Headers(init.headers)
  const method = (init.method || 'GET').toUpperCase()

  if (WRITE_METHODS.has(method) && !isOnline()) {
    const error: ApiError = {
      status: 0,
      code: 'OFFLINE',
      message: 'Offline: changes were not saved. Reconnect and try again.',
      retryable: true,
    }
    throw error
  }

  if (accessToken && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${accessToken}`)
  }
  if (workspaceId && !headers.has('x-workspace-id')) {
    headers.set('x-workspace-id', workspaceId)
  }

  const url = joinUrl(getApiBaseUrl(), path)
  if (import.meta.env.DEV) {
    console.debug('[apiFetch]', { method, path, url, workspaceId, hasToken: Boolean(accessToken) })
  }
  try {
    return await fetch(url, { ...init, headers, method })
  } catch (error) {
    throw toNetworkApiError(error, method)
  }
}

function parseContentDispositionFilename(headerValue: string | null): string | null {
  if (!headerValue) return null
  const value = headerValue.trim()
  if (!value) return null

  // RFC 5987: filename*=UTF-8''encoded
  const starMatch = value.match(/filename\*\s*=\s*([^;]+)/i)
  if (starMatch) {
    const raw = starMatch[1]?.trim()
    if (raw) {
      const cleaned = raw.replace(/^UTF-8''/i, '').replace(/^"+|"+$/g, '')
      try {
        return decodeURIComponent(cleaned)
      } catch {
        return cleaned
      }
    }
  }

  const match = value.match(/filename\s*=\s*([^;]+)/i)
  if (!match) return null

  const raw = match[1]?.trim()
  if (!raw) return null
  return raw.replace(/^"+|"+$/g, '')
}

export async function apiGetBlob(
  path: string,
): Promise<{ blob: Blob; filename: string | null; contentType: string | null }> {
  const res = await apiFetch(path, { method: 'GET' })
  if (!res.ok) {
    throw await parseApiErrorResponse(res)
  }

  const blob = await res.blob()
  const filename = parseContentDispositionFilename(res.headers.get('content-disposition'))
  const contentType = res.headers.get('content-type')
  return { blob, filename, contentType }
}

export async function apiGetJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'GET' })
  if (!res.ok) {
    throw await parseApiErrorResponse(res)
  }
  const text = await res.text().catch(() => '')
  if (!text) {
    const error: ApiError = { status: res.status, message: 'Expected JSON response but got empty body' }
    throw error
  }

  try {
    return JSON.parse(text) as T
  } catch {
    const snippet = text.slice(0, 200)
    const contentType = res.headers.get('content-type') || 'unknown'
    const error: ApiError = {
      status: res.status,
      message: `Expected JSON response but got ${contentType}: ${snippet}`,
    }
    throw error
  }
}

export async function apiPostJson<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) {
    throw await parseApiErrorResponse(res)
  }
  const text = await res.text().catch(() => '')
  if (!text) return undefined as unknown as T

  try {
    return JSON.parse(text) as T
  } catch {
    const snippet = text.slice(0, 200)
    const contentType = res.headers.get('content-type') || 'unknown'
    const error: ApiError = {
      status: res.status,
      message: `Expected JSON response but got ${contentType}: ${snippet}`,
    }
    throw error
  }
}

export async function apiPatchJson<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) {
    throw await parseApiErrorResponse(res)
  }
  const text = await res.text().catch(() => '')
  if (!text) return undefined as unknown as T

  try {
    return JSON.parse(text) as T
  } catch {
    const snippet = text.slice(0, 200)
    const contentType = res.headers.get('content-type') || 'unknown'
    const error: ApiError = {
      status: res.status,
      message: `Expected JSON response but got ${contentType}: ${snippet}`,
    }
    throw error
  }
}

export async function apiDelete(path: string): Promise<void> {
  const res = await apiFetch(path, { method: 'DELETE' })
  if (!res.ok) {
    throw await parseApiErrorResponse(res)
  }
}

