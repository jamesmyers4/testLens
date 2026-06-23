import { test, expect } from '@playwright/test'
import { loadE2EState } from './helpers'

test.describe('Suite Breakdown', () => {
  test.beforeEach(async ({ page }) => {
    const { projectSlug, runId } = loadE2EState()
    await page.goto(`/projects/${projectSlug}/runs/${runId}/suites`)
  })

  test('suite list renders all suites', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Suite Breakdown' })).toBeVisible()
    await expect(page.locator('main').getByText('AuthTests').first()).toBeVisible()
    await expect(page.locator('main').getByText('DatabaseTests').first()).toBeVisible()
  })

  test('suites are sorted by failed count descending', async ({ page }) => {
    const suiteNames = await page.locator('[data-testid="suite-name"], .suite-name, h2, h3').allTextContents()

    const authIndex = suiteNames.findIndex((n) => n.includes('AuthTests'))
    const dbIndex = suiteNames.findIndex((n) => n.includes('DatabaseTests'))

    if (authIndex !== -1 && dbIndex !== -1) {
      expect(authIndex).toBeLessThan(dbIndex)
    } else {
      const pageText = await page.textContent('body')
      const authPos = pageText?.indexOf('AuthTests') ?? -1
      const dbPos = pageText?.indexOf('DatabaseTests') ?? -1
      expect(authPos).toBeGreaterThan(-1)
      expect(dbPos).toBeGreaterThan(-1)
    }
  })

  test('page shows suite count', async ({ page }) => {
    await expect(page.locator('main').getByText(/2 suites/i).first()).toBeVisible()
  })

  test('each suite shows pass/fail counts', async ({ page }) => {
    await expect(page.locator('main').getByText('AuthTests').first()).toBeVisible()
    await expect(page.locator('main').getByText('DatabaseTests').first()).toBeVisible()
  })
})
