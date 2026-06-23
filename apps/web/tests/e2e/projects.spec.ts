import { test, expect } from '@playwright/test'
import { loadE2EState } from './helpers'

test.describe('Projects', () => {
  test('home page shows project list', async ({ page }) => {
    const { projectName } = loadE2EState()
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
    await expect(page.locator('main').getByText(projectName).first()).toBeVisible()
  })

  test('"New Project" navigates to /projects/new', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'New Project', exact: true }).click()
    await expect(page).toHaveURL(/\/projects\/new/)
  })

  test('creating a project redirects to project dashboard', async ({ page }) => {
    const slug = `e2e-new-${Date.now()}`
    await page.goto('/projects/new')
    await page.locator('#name').fill('E2E New Project')
    await page.locator('#slug').fill(slug)
    await page.getByRole('button', { name: /create project/i }).click()
    await expect(page).toHaveURL(new RegExp(`/projects/${slug}`), { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'E2E New Project' })).toBeVisible()
  })

  test('project dashboard shows empty state with upload link when no runs exist', async ({ page }) => {
    const slug = `e2e-empty-${Date.now()}`
    await page.goto('/projects/new')
    await page.locator('#name').fill('E2E Empty Project')
    await page.locator('#slug').fill(slug)
    await page.getByRole('button', { name: /create project/i }).click()
    await expect(page).toHaveURL(new RegExp(`/projects/${slug}`), { timeout: 10000 })

    await expect(page.getByText(/no runs yet/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /upload a file/i })).toBeVisible()
  })

  test('project dashboard shows run history after upload', async ({ page }) => {
    const { projectSlug } = loadE2EState()
    await page.goto(`/projects/${projectSlug}`)
    await expect(page.getByRole('table')).toBeVisible()
    const rows = page.getByRole('row')
    await expect(rows).toHaveCount(2)
  })
})
