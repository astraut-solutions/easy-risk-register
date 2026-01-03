import { expect, test } from '@playwright/test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const axePath = require.resolve('axe-core/axe.min.js')

test('axe audit on the workspace respects WCAG 2.1 AA', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')

  await page.addScriptTag({ path: axePath })
  const results = await page.evaluate(async () => {
    // @ts-expect-error
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2aa'] },
    })
  })

  if (results.violations.length > 0) {
    // eslint-disable-next-line no-console
    console.log('Axe violations:', results.violations.map((violation) => violation.id))
  }

  expect(results.violations).toHaveLength(0)
})
