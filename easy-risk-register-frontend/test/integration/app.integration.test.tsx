import React, { type ReactNode, forwardRef } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from '../../src/App'
import { useRiskStore } from '../../src/stores/riskStore'
import { DEFAULT_SETTINGS } from '../../src/stores/riskStore'
import { DEFAULT_CATEGORIES } from '../../src/constants/risk'
import { DEFAULT_FILTERS, computeRiskStats } from '../../src/utils/riskCalculations'
import { ToastProvider } from '../../src/components/feedback/ToastProvider'

// Framer Motion adds animation wrappers that we don't need for integration smoke tests.
// This mock keeps the DOM tree predictable while allowing refs to continue working.
vi.mock('framer-motion', () => {
  const createComponent = (component: string) =>
    forwardRef<HTMLDivElement, { children?: ReactNode } & Record<string, unknown>>(
      ({ children, ...props }, ref) => (
        <div data-motion-component={component} ref={ref} {...props}>
          {children}
        </div>
      ),
    )

  const componentCache = new Map<string, ReturnType<typeof createComponent>>()

  const motionProxy = new Proxy(
    {},
    {
      get: (_target, key: string) => {
        if (!componentCache.has(key)) {
          componentCache.set(key, createComponent(key))
        }
        return componentCache.get(key)!
      },
    },
  ) as Record<string, ReturnType<typeof createComponent>>

  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

const resetStorageMock = (storage?: Storage) => {
  if (!storage) return
  ;(['getItem', 'setItem', 'removeItem', 'clear'] as const).forEach((method) => {
    const fn = (storage as Record<string, unknown>)[method]
    if (typeof fn === 'function' && 'mockClear' in fn) {
      ;(fn as { mockClear: () => void }).mockClear()
    }
  })
}

const resetRiskStoreState = () => {
  useRiskStore.setState({
    initialized: false,
    risks: [],
    filteredRisks: [],
    categories: [...DEFAULT_CATEGORIES],
    filters: { ...DEFAULT_FILTERS },
    stats: computeRiskStats([]),
    settings: { ...DEFAULT_SETTINGS, tooltipsEnabled: false, onboardingDismissed: true },
  })

  const storeWithPersist = useRiskStore as typeof useRiskStore & {
    persist?: {
      clearStorage: () => void
    }
  }

  storeWithPersist.persist?.clearStorage?.()
  resetStorageMock(window.localStorage)
  resetStorageMock(window.sessionStorage)
}

describe('App integration', () => {
  beforeEach(() => {
    resetRiskStoreState()
  })

  it('seeds demo data and filters the risk list through the toolbar controls', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <App />
      </ToastProvider>,
    )

    expect(await screen.findByText(/Showing 3 of 3 risks/i)).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/search risks/i)
    await user.type(searchInput, 'phishing')

    expect(await screen.findByText(/Showing 1 of 3 risks/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reset/i }))

    expect(await screen.findByText(/Showing 3 of 3 risks/i)).toBeInTheDocument()
  }, 15000)

  it('creates a new risk from the New risk tab and surfaces it inside the table view', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <App />
      </ToastProvider>,
    )

    expect(await screen.findByText(/Showing 3 of 3 risks/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /create new risk/i }))

    expect(await screen.findByText(/Create risk/i)).toBeInTheDocument()

    const titleInput = await screen.findByLabelText(/title/i)
    await user.type(titleInput, 'AI model drift')

    const descriptionInput = screen.getByLabelText(/description/i)
    await user.type(descriptionInput, 'Model accuracy degrades when regional data arrives.')

    const mitigationInput = screen.getByLabelText(/mitigation plan/i)
    await user.type(mitigationInput, 'Add monitoring and retraining automation.')

    await user.click(screen.getByRole('button', { name: /add new risk/i }))

    expect(await screen.findByText(/Showing 4 of 4 risks/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /open risk table/i }))
    const table = await screen.findByRole('table', { name: /risk register table/i })
    expect(within(table).getByText(/AI model drift/i)).toBeInTheDocument()
  }, 30000)

  it('creates a new risk from a bundled template without any template network calls', async () => {
    const fetchSpy = vi
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(globalThis as any, 'fetch')
      .mockResolvedValue({
        ok: true,
        status: 200,
        // eslint-disable-next-line @typescript-eslint/require-await
        json: async () => ({}),
        text: async () => '{}',
      })

    try {
      const user = userEvent.setup()
      render(
        <ToastProvider>
          <App />
        </ToastProvider>,
      )

      expect(await screen.findByText(/Showing 3 of 3 risks/i)).toBeInTheDocument()
      fetchSpy.mockClear()

      await user.click(screen.getByRole('button', { name: /create new risk/i }))
      expect(await screen.findByText(/Create risk/i)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /browse & preview/i }))

      const modalTitle = await screen.findByRole('heading', { name: /Cyber templates/i })
      const modal = modalTitle.closest('[role="dialog"]') ?? modalTitle.parentElement
      expect(modal).toBeTruthy()

      const phishingTemplateButton = within(modal as HTMLElement).getByRole('button', {
        name: /Phishing \/ credential theft/i,
      })
      await user.click(phishingTemplateButton)

      await user.click(within(modal as HTMLElement).getByRole('button', { name: /use template/i }))

      expect(fetchSpy).not.toHaveBeenCalled()

      const titleInput = (await screen.findByLabelText(/title/i)) as HTMLInputElement
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement
      const mitigationPlanInput = screen.getByLabelText(/mitigation plan/i) as HTMLTextAreaElement

      expect(titleInput).toHaveValue('Phishing leads to credential compromise')
      expect(descriptionInput.value).toMatch(/phishing/i)
      expect(mitigationPlanInput.value).toMatch(/mfa/i)
    } finally {
      fetchSpy.mockRestore()
    }
  }, 30000)
})
