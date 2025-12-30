import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAnalyticsEvents, getAnalyticsEvents, trackEvent } from './analytics'

describe('analytics redaction', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(console, 'debug').mockImplementation(() => {})

    const store = new Map<string, string>()
    const localStorageShim: Storage = {
      get length() {
        return store.size
      },
      clear() {
        store.clear()
      },
      getItem(key: string) {
        return store.has(key) ? store.get(key)! : null
      },
      key(index: number) {
        return Array.from(store.keys())[index] ?? null
      },
      removeItem(key: string) {
        store.delete(key)
      },
      setItem(key: string, value: string) {
        store.set(key, String(value))
      },
    }

    Object.defineProperty(window, 'localStorage', {
      value: localStorageShim,
      configurable: true,
    })

    window.localStorage.setItem('easy-risk-register:analytics-enabled', '1')
    clearAnalyticsEvents()
  })

  it('redacts sensitive keys and oversized strings', () => {
    trackEvent('risk_modal_open', {
      description: 'secret description',
      mitigationPlan: 'super secret',
      passphrase: 'hunter2',
      encryptedFields: { v: 1, fields: { description: { v: 1, ivB64: 'x', ctB64: 'y' } } },
      nested: { token: 'abc', ok: true },
      long: 'a'.repeat(500),
      normal: 'short',
    })

    const events = getAnalyticsEvents()
    expect(events.length).toBeGreaterThanOrEqual(2)

    const riskEvent = events.find((event) => event.name === 'risk_modal_open')
    expect(riskEvent).toBeTruthy()
    expect(riskEvent?.props?.description).toBe('[redacted]')
    expect(riskEvent?.props?.mitigationPlan).toBe('[redacted]')
    expect(riskEvent?.props?.passphrase).toBe('[redacted]')
    expect(riskEvent?.props?.encryptedFields).toBe('[redacted]')
    expect((riskEvent?.props?.nested as any)?.token).toBe('[redacted]')
    expect(riskEvent?.props?.long).toBe('[redacted]')
    expect(riskEvent?.props?.normal).toBe('short')
  })
})
