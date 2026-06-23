import { test, expect } from '@playwright/test'
import { loadE2EState } from './helpers'

test.describe('Flaky Tests View', () => {
  test.beforeEach(async ({ page }) => {
    const { projectSlug, runId } = loadE2EState()
    await page.goto(`/projects/${projectSlug}/runs/${runId}/flaky`)
  })

  test('flaky view shows only flaky tests', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Flaky Tests' })).toBeVisible()
    await expect(page.locator('main').getByText('Login_FlakySSORedirect').first()).toBeVisible()
    await expect(page.locator('main').getByText('Login_WithValidCredentials_Passes')).not.toBeVisible()
    await expect(page.locator('main').getByText('Login_WithInvalidPassword_Fails')).not.toBeVisible()
  })

  test('flaky tests show retry count', async ({ page }) => {
    await expect(page.locator('main').getByText('Login_FlakySSORedirect').first()).toBeVisible()
    await expect(page.locator('main').getByText(/retries/i).first()).toBeVisible()
  })

  test('page shows flaky test count', async ({ page }) => {
    await expect(page.locator('main').getByText(/1 test/).first()).toBeVisible()
  })

  test('page mentions sort by retry count', async ({ page }) => {
    await expect(page.locator('main').getByText(/retry/i).first()).toBeVisible()
  })
})
