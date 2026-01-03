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

test('keyboard-only flow can create a risk and reach the table', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')

  const createRiskButton = page.getByRole('button', { name: 'Create new risk' })
  await createRiskButton.focus()
  await page.keyboard.press('Enter')

  const titleField = page.getByRole('textbox', { name: 'Title *' })
  await expect(titleField).toBeVisible()

  await titleField.focus()
  await page.keyboard.type('Keyboard-only risk')
  const descriptionField = page.getByRole('textbox', { name: 'Description *' })
  await descriptionField.focus()
  await page.keyboard.type('Created by the keyboard-only test.')

  await setRange(page.getByLabel('Likelihood (1-5)'), 3)
  await setRange(page.getByLabel('Impact (1-5)'), 3)

  const planSummary = page.locator('summary', { hasText: 'Plan (optional)' })
  await planSummary.focus()
  await page.keyboard.press('Enter')

  const addRiskButton = page.getByRole('button', { name: 'Add new risk' })
  await addRiskButton.focus()
  await page.keyboard.press('Enter')

  await expect(page.getByText(/Showing \d+ of \d+ risks/)).toBeVisible()

  const riskTableButton = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: 'Risk table' })
  await riskTableButton.focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: 'Risk Table' })).toBeVisible()
  await expect(page.getByText('Keyboard-only risk')).toBeVisible()

  const exportButton = page.getByRole('button', { name: 'Export' })
  await exportButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'Export CSV' })).toBeVisible()
  await page.keyboard.press('Escape')
})
