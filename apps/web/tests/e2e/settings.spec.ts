import { test, expect } from '@playwright/test'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
  })

  test('settings page renders API key section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'API Keys' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Key' })).toBeVisible()
  })

  test('creating a key shows raw value with copy button', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Key' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByPlaceholder(/key name|e\.g\./i).fill('E2E Test Key')
    await dialog.getByRole('button', { name: 'Create' }).click()

    await expect(dialog.getByRole('button', { name: /copy/i })).toBeVisible({ timeout: 5000 })

    const keyInput = dialog.locator('input[readonly]')
    await expect(keyInput).toBeVisible()
    const rawKey = await keyInput.inputValue()
    expect(rawKey.length).toBeGreaterThan(10)
  })

  test('raw value not shown after dialog closes', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Key' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder(/key name|e\.g\./i).fill('E2E Close Test Key')
    await dialog.getByRole('button', { name: 'Create' }).click()

    await expect(dialog.locator('input[readonly]')).toBeVisible({ timeout: 5000 })
    const rawKey = await dialog.locator('input[readonly]').inputValue()

    await dialog.getByRole('button', { name: 'Done' }).click()
    await expect(dialog).not.toBeVisible()

    await expect(page.getByText(rawKey)).not.toBeVisible()
  })

  test('revoking a key removes it from the list', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Key' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder(/key name|e\.g\./i).fill('E2E Revoke Test Key')
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(dialog.locator('input[readonly]')).toBeVisible({ timeout: 5000 })
    await dialog.getByRole('button', { name: 'Done' }).click()
    await expect(dialog).not.toBeVisible()

    await expect(page.getByText('E2E Revoke Test Key').first()).toBeVisible()

    const revokeButton = page
      .getByRole('row')
      .filter({ hasText: 'E2E Revoke Test Key' })
      .first()
      .getByRole('button', { name: /revoke/i })
    await revokeButton.click()

    const confirmDialog = page.getByRole('dialog')
    await expect(confirmDialog).toBeVisible()
    await confirmDialog.getByRole('button', { name: /revoke key/i }).click()

    await expect(page.getByRole('cell', { name: 'E2E Revoke Test Key' })).not.toBeVisible({ timeout: 5000 })
  })
})
