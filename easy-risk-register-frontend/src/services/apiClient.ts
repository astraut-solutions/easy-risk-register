import { useAuthStore } from '../stores/authStore'

function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  return (base ?? '').replace(/\/+$/, '')
}

function joinUrl(base: string, path: string): string {
  if (!path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}

export type ApiError = {
  status: number
  message: string
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { accessToken, workspaceId } = useAuthStore.getState()

  const headers = new Headers(init.headers)
  if (accessToken && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${accessToken}`)
  }
  if (workspaceId && !headers.has('x-workspace-id')) {
    headers.set('x-workspace-id', workspaceId)
  }

  const url = joinUrl(getApiBaseUrl(), path)
  return fetch(url, { ...init, headers })
}

export async function apiGetJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'GET' })
  if (!res.ok) {
    const message = await res.text().catch(() => '')
    const error: ApiError = { status: res.status, message: message || res.statusText }
    throw error
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
    const message = await res.text().catch(() => '')
    const error: ApiError = { status: res.status, message: message || res.statusText }
    throw error
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
    const message = await res.text().catch(() => '')
    const error: ApiError = { status: res.status, message: message || res.statusText }
    throw error
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
    const message = await res.text().catch(() => '')
    const error: ApiError = { status: res.status, message: message || res.statusText }
    throw error
  }
}

