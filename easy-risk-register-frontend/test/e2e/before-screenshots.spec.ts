import { devices, expect, test } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs/promises'

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function writeScreenshot(page: import('@playwright/test').Page, outPath: string) {
  await ensureDir(path.dirname(outPath))
  await page.screenshot({ path: outPath, fullPage: true })
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

async function createSampleRisk(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Create new risk' }).click()
  await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Title *' }).fill('Baseline screenshot risk')
  await page.getByRole('textbox', { name: 'Description *' }).fill('Created by Playwright screenshot run.')
  await setRange(page.getByLabel('Likelihood (1-5)'), 4)
  await setRange(page.getByLabel('Impact (1-5)'), 4)
  await page.getByRole('button', { name: 'Add new risk' }).click()

  await expect(page.getByRole('button', { name: 'Create new risk' })).toBeVisible()
}

async function openSettings(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
}

async function ensureMaturityEnabled(page: import('@playwright/test').Page) {
  const maturityToggle = page.getByRole('checkbox', { name: 'Enable maturity radar' })
  await expect(maturityToggle).toBeVisible()
  if (!(await maturityToggle.isChecked())) {
    await maturityToggle.check()
  }
}

test.describe('baseline: before screenshots', () => {
  test('desktop', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Risk management workspace' })).toBeVisible()

    const baseDir = path.join('test', 'artifacts', 'baseline-before', 'desktop')

    await page.getByRole('button', { name: 'Create new risk' }).click()
    await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible()
    await writeScreenshot(page, path.join(baseDir, '01-new-risk.png'))

    await page.getByRole('button', { name: 'Cancel' }).click()
    const discard = page.getByRole('button', { name: 'Discard draft' })
    if (await discard.isVisible().catch(() => false)) {
      await discard.click()
    }

    await createSampleRisk(page)

    await page.getByRole('button', { name: /^Executive overview\b/ }).click()
    await expect(page.getByRole('heading', { name: 'Risk matrix' })).toBeVisible()
    await writeScreenshot(page, path.join(baseDir, '02-overview.png'))

    await page.getByRole('button', { name: /^Risk table\b/ }).click()
    await expect(page.getByRole('heading', { name: 'Risk Table' })).toBeVisible()
    await writeScreenshot(page, path.join(baseDir, '03-risk-table.png'))

    await openSettings(page)
    await ensureMaturityEnabled(page)
    await writeScreenshot(page, path.join(baseDir, '04-settings.png'))

    await page.getByRole('button', { name: /^Dashboard charts\b/ }).click()
    await expect(page.getByRole('heading', { name: 'Dashboard charts' })).toBeVisible()
    await writeScreenshot(page, path.join(baseDir, '05-dashboard-charts.png'))

    await page.getByRole('button', { name: /^Maturity radar\b/ }).click()
    await expect(page.getByRole('heading', { name: 'Maturity self-assessment (radar)' })).toBeVisible()
    await writeScreenshot(page, path.join(baseDir, '06-maturity-radar.png'))
  })

  test.describe('mobile', () => {
    const iPhone13 = devices['iPhone 13']
    test.use({
      viewport: iPhone13.viewport,
      userAgent: iPhone13.userAgent,
      deviceScaleFactor: iPhone13.deviceScaleFactor,
      isMobile: iPhone13.isMobile,
      hasTouch: iPhone13.hasTouch,
    })

    test('mobile', async ({ page }) => {
      test.setTimeout(90_000)
      await page.goto('/')
      await expect(page.getByRole('heading', { name: 'Risk management workspace' })).toBeVisible()

      const baseDir = path.join('test', 'artifacts', 'baseline-before', 'mobile')

      await createSampleRisk(page)

      await page.getByRole('button', { name: /^Executive overview\b/ }).click()
      await expect(page.getByRole('heading', { name: 'Risk matrix' })).toBeVisible()
      await writeScreenshot(page, path.join(baseDir, '01-overview.png'))

      await page.getByRole('button', { name: /^Risk table\b/ }).click()
      await expect(page.getByRole('heading', { name: 'Risk Table' })).toBeVisible()
      await writeScreenshot(page, path.join(baseDir, '02-risk-table.png'))

      await page.getByRole('button', { name: /^Dashboard charts\b/ }).click()
      await expect(page.getByRole('heading', { name: 'Dashboard charts' })).toBeVisible()
      await writeScreenshot(page, path.join(baseDir, '03-dashboard-charts.png'))

      await openSettings(page)
      await writeScreenshot(page, path.join(baseDir, '04-settings.png'))

      const maturityButton = page.getByRole('button', { name: /^Maturity radar\b/ })
      if (await maturityButton.isVisible().catch(() => false)) {
        await maturityButton.click()
        await Promise.race([
          page.getByRole('heading', { name: 'Maturity self-assessment (radar)' }).waitFor({ state: 'visible' }),
          page.getByText('Maturity radar is disabled').waitFor({ state: 'visible' }),
          page.waitForTimeout(500),
        ])
        await writeScreenshot(page, path.join(baseDir, '05-maturity-radar.png'))
      }
    })
  })
})
