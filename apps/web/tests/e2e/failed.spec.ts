import { test, expect } from '@playwright/test'
import { loadE2EState } from './helpers'

test.describe('Failed Tests View', () => {
  test.beforeEach(async ({ page }) => {
    const { projectSlug, runId } = loadE2EState()
    await page.goto(`/projects/${projectSlug}/runs/${runId}/failed`)
  })

  test('failed view shows only failed tests', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Failed Tests' })).toBeVisible()
    await expect(page.locator('main').getByText('Login_WithInvalidPassword_Fails').first()).toBeVisible()
    await expect(page.locator('main').getByText('Insert_WithDuplicateKey_Throws').first()).toBeVisible()
    await expect(page.locator('main').getByText('Login_WithValidCredentials_Passes')).not.toBeVisible()
    await expect(page.locator('main').getByText('Login_FlakySSORedirect')).not.toBeVisible()
  })

  test('error messages are visible inline without expanding', async ({ page }) => {
    await expect(page.locator('main').getByText('Expected status 200 but got 401').first()).toBeVisible()
    await expect(page.locator('main').getByText('Unique constraint violation on column: email').first()).toBeVisible()
  })

  test('stack traces are visible on expand', async ({ page }) => {
    const testTitle = page.locator('main').getByText('Login_WithInvalidPassword_Fails').first()
    // Go up 3 levels: p → div.flex-1 → div.flex-row → div.card
    const card = testTitle.locator('../../..')
    const expandButton = card.getByRole('button')

    if ((await expandButton.count()) > 0) {
      await expandButton.first().click()
      await expect(page.locator('main').getByText(/AuthTests\.cs/)).toBeVisible()
    } else {
      await expect(page.locator('main').getByText(/AuthTests\.cs/)).toBeVisible()
    }
  })

  test('page shows failure count', async ({ page }) => {
    await expect(page.locator('main').getByText(/2 failures/).first()).toBeVisible()
  })
})
