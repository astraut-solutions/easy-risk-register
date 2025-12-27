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
  return (await res.json()) as T
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
  return (await res.json()) as T
}

