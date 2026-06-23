import { Given, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { CustomWorld } from '../support/world'

Given('I am on the failed tests page for the seeded run', async function (this: CustomWorld) {
  const { projectSlug, runId } = this.loadState()
  await this.page.goto(`${this.baseUrl}/projects/${projectSlug}/runs/${runId}/failed`)
})

Then('I should see {string} in the test list', async function (this: CustomWorld, testName: string) {
  await expect(this.page.locator('main').getByText(testName).first()).toBeVisible()
})

Then('I should not see {string} in the test list', async function (this: CustomWorld, testName: string) {
  await expect(this.page.locator('main').getByText(testName)).not.toBeVisible()
})

Then('I should see {string} inline', async function (this: CustomWorld, errorMsg: string) {
  await expect(this.page.locator('main').getByText(errorMsg).first()).toBeVisible()
})
