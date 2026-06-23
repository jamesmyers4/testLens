import { test, expect } from '@playwright/test'
import { loadE2EState } from './helpers'

test.describe('Run Summary', () => {
  test.beforeEach(async ({ page }) => {
    const { projectSlug, runId } = loadE2EState()
    await page.goto(`/projects/${projectSlug}/runs/${runId}`)
  })

  test('scorecard shows correct passed/failed/flaky/skipped counts', async ({ page }) => {
    await expect(page.locator('main').getByText('Passed').first()).toBeVisible()
    await expect(page.locator('main').getByText('Failed').first()).toBeVisible()
    await expect(page.locator('main').getByText('Flaky').first()).toBeVisible()
    await expect(page.locator('main').getByText('Skipped').first()).toBeVisible()
    await expect(page.locator('main').getByText('Total').first()).toBeVisible()
  })

  test('meta row shows framework, environment, branch, commit, duration', async ({ page }) => {
    await expect(page.locator('main').getByText('xunit', { exact: true }).first()).toBeVisible()
    await expect(page.locator('main').getByText('ci', { exact: true }).first()).toBeVisible()
    await expect(page.locator('main').getByText('main', { exact: true }).first()).toBeVisible()
    await expect(page.locator('main').getByText('abc1234', { exact: true }).first()).toBeVisible()
    await expect(page.locator('main').getByText(/12\.5s|12500ms/).first()).toBeVisible()
  })

  test('quick-nav tabs link to /suites /tests /failed /flaky', async ({ page }) => {
    const { projectSlug, runId } = loadE2EState()
    const base = `/projects/${projectSlug}/runs/${runId}`

    await expect(page.getByRole('link', { name: 'Suites' })).toHaveAttribute('href', `${base}/suites`)
    await expect(page.getByRole('link', { name: 'All Tests' })).toHaveAttribute('href', `${base}/tests`)
    await expect(page.getByRole('link', { name: /Failed/ })).toHaveAttribute('href', `${base}/failed`)
    await expect(page.getByRole('link', { name: /Flaky/ })).toHaveAttribute('href', `${base}/flaky`)
  })

  test('failed tests preview shows failures with error messages', async ({ page }) => {
    await expect(page.locator('main').getByText('Top Failures')).toBeVisible()
    await expect(page.locator('main').getByText('Login_WithInvalidPassword_Fails').first()).toBeVisible()
    await expect(page.locator('main').getByText('Expected status 200 but got 401').first()).toBeVisible()
  })
})
