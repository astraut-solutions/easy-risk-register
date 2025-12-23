import React, { type ReactNode, forwardRef } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from '../../src/App'
import { useRiskStore } from '../../src/stores/riskStore'
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

const waitForRiskCards = async (expectedCount: number) => {
  await waitFor(() => {
    expect(screen.getAllByRole('article', { name: /risk card/i })).toHaveLength(expectedCount)
  })
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

    await waitForRiskCards(3)
    expect(screen.getByText(/Payment processor outage/i)).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/search risks/i)
    await user.type(searchInput, 'phishing')

    await waitForRiskCards(1)
    expect(screen.getByText(/Phishing vulnerability/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reset/i }))

    await waitForRiskCards(3)
  }, 15000)

  it('creates a new risk from the New risk tab and surfaces it inside the table view', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <App />
      </ToastProvider>,
    )

    await waitForRiskCards(3)

    await user.click(screen.getByRole('button', { name: /create new risk/i }))

    expect(await screen.findByText(/Create risk/i)).toBeInTheDocument()

    const titleInput = await screen.findByLabelText(/title/i)
    await user.type(titleInput, 'AI model drift')

    const descriptionInput = screen.getByLabelText(/description/i)
    await user.type(descriptionInput, 'Model accuracy degrades when regional data arrives.')

    const mitigationInput = screen.getByLabelText(/mitigation plan/i)
    await user.type(mitigationInput, 'Add monitoring and retraining automation.')

    await user.click(screen.getByRole('button', { name: /add new risk/i }))

    await screen.findByText(/AI model drift/i)

    await user.click(screen.getByRole('button', { name: /open risk table/i }))
    const table = await screen.findByRole('table', { name: /risk register table/i })
    expect(within(table).getByText(/AI model drift/i)).toBeInTheDocument()
  }, 15000)
})
