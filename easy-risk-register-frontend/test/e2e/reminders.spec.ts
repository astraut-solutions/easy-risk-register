import { expect, test } from '@playwright/test'

function formatDateInput(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

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

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const NotificationImpl = function Notification(this: any) {
      // no-op: tests cover the denied-permission fallback path (banner)
      return this
    } as any
    NotificationImpl.permission = 'denied'
    NotificationImpl.requestPermission = async () => 'denied'
    ;(window as any).Notification = NotificationImpl
  })
})

test('denied notifications: shows in-app reminder banner and supports snooze', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')

  await page.getByRole('button', { name: 'Create new risk' }).click()
  await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  await page.getByRole('textbox', { name: 'Title *' }).fill('Reminder smoke risk')
  await page.getByRole('textbox', { name: 'Description *' }).fill('Overdue date for reminder banner.')
  await setRange(page.getByLabel('Likelihood (1-5)'), 3)
  await setRange(page.getByLabel('Impact (1-5)'), 3)
  await page.locator('summary', { hasText: 'Details (optional)' }).click()
  const accountability = page.locator('summary', { hasText: 'Accountability (optional)' })
  await accountability.scrollIntoViewIfNeeded()
  await accountability.click()
  await page.getByLabel('Due date (optional)', { exact: true }).fill(formatDateInput(yesterday))
  await page.getByRole('button', { name: 'Add new risk' }).click()

  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('checkbox', { name: 'Enable reminders for due/review dates' }).check()
  await page.getByRole('checkbox', { name: /Use desktop notifications/i }).check()

  const banner = page.getByRole('region', { name: 'Risk reminder' })
  await expect(banner).toBeVisible()
  await expect(banner.getByText(/overdue/i)).toBeVisible()

  await banner.scrollIntoViewIfNeeded()
  await banner.getByRole('button', { name: 'Snooze reminders for 1 day' }).click()
  await expect(banner).toBeHidden()
})

test('cadence: does not re-show banner within frequency window', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')

  await page.getByRole('button', { name: 'Create new risk' }).click()
  await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  await page.getByRole('textbox', { name: 'Title *' }).fill('Reminder cadence risk')
  await page.getByRole('textbox', { name: 'Description *' }).fill('Cadence check for reminders.')
  await setRange(page.getByLabel('Likelihood (1-5)'), 3)
  await setRange(page.getByLabel('Impact (1-5)'), 3)
  await page.locator('summary', { hasText: 'Details (optional)' }).click()
  const accountability = page.locator('summary', { hasText: 'Accountability (optional)' })
  await accountability.scrollIntoViewIfNeeded()
  await accountability.click()
  await page.getByLabel('Due date (optional)', { exact: true }).fill(formatDateInput(yesterday))
  await page.getByRole('button', { name: 'Add new risk' }).click()

  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('checkbox', { name: 'Enable reminders for due/review dates' }).check()

  const banner = page.getByRole('region', { name: 'Risk reminder' })
  await expect(banner).toBeVisible()

  await page.reload()
  await page.waitForTimeout(750)
  await expect(page.getByRole('region', { name: 'Risk reminder' })).toBeHidden()
})
