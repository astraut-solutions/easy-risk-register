import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '../stores/authStore'
import { apiFetch, apiGetJson, apiPostJson, type ApiError } from './apiClient'

describe('apiClient offline behavior', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'test-user', email: 'test@example.com' },
      accessToken: 'test-token',
      workspaceId: 'test-workspace',
      workspaceName: 'Test',
    })
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('blocks write methods while offline (no silent fetch)', async () => {
    vi.stubGlobal('navigator', { onLine: false } as any)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock as any)

    const error = await apiPostJson('/api/risks', { title: 'x' }).catch((e: unknown) => e as ApiError)
    expect(error.status).toBe(0)
    expect(error.code).toBe('OFFLINE')
    expect(String(error.message)).toMatch(/not saved/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns OFFLINE error for GET when fetch fails offline', async () => {
    vi.stubGlobal('navigator', { onLine: false } as any)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch failed')) as any)

    const error = await apiGetJson('/api/risks').catch((e: unknown) => e as ApiError)
    expect(error.status).toBe(0)
    expect(error.code).toBe('OFFLINE')
    expect(String(error.message)).toMatch(/offline/i)
  })

  it('parses backend error shape (code/requestId/retryable)', async () => {
    vi.stubGlobal('navigator', { onLine: true } as any)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'Database temporarily unavailable',
            code: 'SUPABASE_UNREACHABLE',
            requestId: 'req-123',
            retryable: true,
          }),
          { status: 503, headers: { 'content-type': 'application/json' } },
        ),
      ) as any,
    )

    const error = await apiGetJson('/api/categories').catch((e: unknown) => e as ApiError)

    expect(error.status).toBe(503)
    expect(error.code).toBe('SUPABASE_UNREACHABLE')
    expect(error.requestId).toBe('req-123')
    expect(error.retryable).toBe(true)
  })
})
