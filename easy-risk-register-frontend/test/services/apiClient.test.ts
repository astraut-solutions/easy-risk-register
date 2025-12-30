import { describe, it, expect, beforeEach, vi } from 'vitest'

import { apiGetBlob } from '../../src/services/apiClient'
import { useAuthStore } from '../../src/stores/authStore'

describe('apiGetBlob', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', email: 'user@example.com' },
      accessToken: 'token-123',
      workspaceId: 'workspace-abc',
      workspaceName: 'Personal',
    })
  })

  it('attaches auth headers and returns blob + filename', async () => {
    const fetchMock = vi.fn(async (_url: any, init: any) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('authorization')).toBe('Bearer token-123')
      expect(headers.get('x-workspace-id')).toBe('workspace-abc')

      return new Response(new Blob(['pdf']), {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename=\"risks.pdf\"',
        },
      })
    })
    vi.stubGlobal('fetch', fetchMock as any)

    const { blob, filename, contentType } = await apiGetBlob('/api/exports/risks.pdf')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(contentType).toContain('application/pdf')
    expect(filename).toBe('risks.pdf')
    expect(blob.size).toBeGreaterThan(0)
  })

  it('parses RFC5987 filename*', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(new Blob(['pdf']), {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': "attachment; filename*=UTF-8''risk-register-2025-01-01.pdf",
        },
      })
    })
    vi.stubGlobal('fetch', fetchMock as any)

    const { filename } = await apiGetBlob('/api/exports/risks.pdf')
    expect(filename).toBe('risk-register-2025-01-01.pdf')
  })
})

