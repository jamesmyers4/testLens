import { test, expect } from '@playwright/test'
import { loadE2EState } from './helpers'

test.describe('All Tests View', () => {
  test.beforeEach(async ({ page }) => {
    const { projectSlug, runId } = loadE2EState()
    await page.goto(`/projects/${projectSlug}/runs/${runId}/tests`)
  })

  test('all tests render with status badges', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'All Tests' })).toBeVisible()
    await expect(page.locator('main').getByText('Login_WithValidCredentials_Passes').first()).toBeVisible()
    await expect(page.locator('main').getByText('Login_WithInvalidPassword_Fails').first()).toBeVisible()
    await expect(page.locator('main').getByText('Login_FlakySSORedirect').first()).toBeVisible()
    await expect(page.locator('main').getByText('Delete_NonExistent_Skipped').first()).toBeVisible()
  })

  test('filter buttons are visible for each status', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'passed' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'failed' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'flaky' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'skipped' })).toBeVisible()
  })

  test('filter by status shows only matching tests', async ({ page }) => {
    const { projectSlug, runId } = loadE2EState()
    await page.goto(`/projects/${projectSlug}/runs/${runId}/tests?status=failed`)
    await expect(page.locator('main').getByText('Login_WithInvalidPassword_Fails').first()).toBeVisible()
    await expect(page.locator('main').getByText('Insert_WithDuplicateKey_Throws').first()).toBeVisible()
    await expect(page.locator('main').getByText('Login_WithValidCredentials_Passes')).not.toBeVisible()
  })

  test('filter by passed status shows only passed tests', async ({ page }) => {
    const { projectSlug, runId } = loadE2EState()
    await page.goto(`/projects/${projectSlug}/runs/${runId}/tests?status=passed`)
    await expect(page.locator('main').getByText('Login_WithValidCredentials_Passes').first()).toBeVisible()
    await expect(page.locator('main').getByText('Login_WithInvalidPassword_Fails')).not.toBeVisible()
  })

  test('page shows test count', async ({ page }) => {
    await expect(page.locator('main').getByText(/8 of 8 tests/).first()).toBeVisible()
  })
})
