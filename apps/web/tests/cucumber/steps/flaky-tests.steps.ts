import { Given, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { CustomWorld } from '../support/world'

Given('I am on the flaky tests page for the seeded run', async function (this: CustomWorld) {
  const { projectSlug, runId } = this.loadState()
  await this.page.goto(`${this.baseUrl}/projects/${projectSlug}/runs/${runId}/flaky`)
})

Then('I should see {string} in the flaky test list', async function (this: CustomWorld, testName: string) {
  await expect(this.page.locator('main').getByText(testName).first()).toBeVisible()
})

Then('I should not see {string} in the flaky test list', async function (this: CustomWorld, testName: string) {
  await expect(this.page.locator('main').getByText(testName)).not.toBeVisible()
})

Then('I should see retry count information', async function (this: CustomWorld) {
  await expect(this.page.locator('main').getByText(/retries/i).first()).toBeVisible()
})

Then('I should see retry-related text on the page', async function (this: CustomWorld) {
  await expect(this.page.locator('main').getByText(/retry/i).first()).toBeVisible()
})
