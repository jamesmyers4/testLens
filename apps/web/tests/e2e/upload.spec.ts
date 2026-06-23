import { test, expect } from '@playwright/test'
import { loadE2EState, VALID_RUN_REPORT } from './helpers'

test.describe('Upload', () => {
  test('upload page renders dropzone', async ({ page }) => {
    const { projectSlug } = loadE2EState()
    await page.goto(`/projects/${projectSlug}/upload`)
    await expect(page.getByText(/drop testlens-run\.json here/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /browse file/i })).toBeVisible()
  })

  test('uploading invalid JSON shows error message', async ({ page }) => {
    const { projectSlug } = loadE2EState()
    await page.goto(`/projects/${projectSlug}/upload`)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"this": "does not match schema"}'),
    })

    await expect(
      page.getByText(/does not match the testlens schema|file does not match/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('uploading valid TestRunReport JSON redirects to run summary', async ({ page }) => {
    const { projectSlug } = loadE2EState()
    await page.goto(`/projects/${projectSlug}/upload`)

    const report = {
      ...VALID_RUN_REPORT,
      runId: `upload-e2e-${Date.now()}`,
      projectSlug,
    }

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'testlens-run.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(report)),
    })

    await expect(page).toHaveURL(/\/projects\/.+\/runs\/.+/, { timeout: 10000 })
  })
})
