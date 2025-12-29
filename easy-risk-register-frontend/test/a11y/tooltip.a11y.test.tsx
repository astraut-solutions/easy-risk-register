import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import { Input } from '../../src/design-system'

async function runAxe(target: Element) {
  const axeModule: any = await import('axe-core')
  const axe: any = axeModule.default ?? axeModule

  return axe.run(target, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
    rules: {
      'color-contrast': { enabled: false },
    },
  })
}

describe('A11y smoke: tooltip trigger', () => {
  it('has no serious/critical axe violations', async () => {
    const { container } = render(
      <div style={{ padding: 16 }}>
        <Input label="Title" tooltip="Help text" defaultValue="Example" />
      </div>,
    )

    const results = await runAxe(container)
    const serious = results.violations.filter((v: any) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious).toEqual([])
  })
})

