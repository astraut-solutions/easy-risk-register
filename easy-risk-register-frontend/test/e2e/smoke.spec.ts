import { expect, test } from '@playwright/test'

async function setRange(
  locator: ReturnType<import('@playwright/test').Page['locator']>,
  value: number,
) {
  await locator.evaluate((el, nextValue) => {
    if (!(el instanceof HTMLInputElement)) return
    try {
      el.valueAsNumber = Number(nextValue)
    } catch {
      el.value = String(nextValue)
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}

test('local-only: create risk, drill down matrix, export CSV', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Risk management workspace' })).toBeVisible()
  await expect(page.getByText('Local-only until you sign in')).toBeVisible()

  await page.getByRole('button', { name: 'Create new risk' }).click()
  await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Title *' }).fill('Playwright smoke risk')
  await page.getByRole('textbox', { name: 'Description *' }).fill('Created by Playwright E2E smoke test.')
  await setRange(page.getByLabel('Likelihood (1-5)'), 5)
  await setRange(page.getByLabel('Impact (1-5)'), 5)
  await expect(page.getByLabel('Likelihood (1-5)')).toHaveAttribute('aria-valuenow', '5')
  await expect(page.getByLabel('Impact (1-5)')).toHaveAttribute('aria-valuenow', '5')
  await page.getByRole('button', { name: 'Add new risk' }).click()

  await page.getByRole('button', { name: 'Executive overview' }).click()
  await expect(page.getByRole('heading', { name: 'Risk matrix' })).toBeVisible()

  await page
    .getByRole('gridcell', { name: /Risk cell: Likelihood 5, Impact 5, \d+ risk/ })
    .click()

  await expect(page.getByRole('heading', { name: 'Risk Table' })).toBeVisible()
  await expect(page.getByText('Playwright smoke risk')).toBeVisible()

  await page.getByRole('button', { name: 'Export' }).click()
  await page.getByRole('menuitem', { name: 'Export CSV' }).click()
  await expect(page.getByRole('heading', { name: 'Export CSV' })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download CSV' }).click()
  const download = await downloadPromise
  await expect(download.suggestedFilename()).toMatch(/\.csv$/)
})
