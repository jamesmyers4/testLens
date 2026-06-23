import { Given, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { CustomWorld } from '../support/world'

Given('I am on the run summary page for the seeded run', async function (this: CustomWorld) {
  const { projectSlug, runId } = this.loadState()
  await this.page.goto(`${this.baseUrl}/projects/${projectSlug}/runs/${runId}`)
})

Then('I should see {string} in the scorecard', async function (this: CustomWorld, label: string) {
  await expect(this.page.locator('main').getByText(label).first()).toBeVisible()
})

Then('I should see the framework {string}', async function (this: CustomWorld, framework: string) {
  await expect(this.page.locator('main').getByText(framework, { exact: true }).first()).toBeVisible()
})

Then('I should see the environment {string}', async function (this: CustomWorld, env: string) {
  await expect(this.page.locator('main').getByText(env, { exact: true }).first()).toBeVisible()
})

Then('I should see the branch {string}', async function (this: CustomWorld, branch: string) {
  await expect(this.page.locator('main').getByText(branch, { exact: true }).first()).toBeVisible()
})

Then('I should see the commit {string}', async function (this: CustomWorld, commit: string) {
  await expect(this.page.locator('main').getByText(commit, { exact: true }).first()).toBeVisible()
})

Then('the {string} tab should link to the suites view', async function (this: CustomWorld, tabName: string) {
  const { projectSlug, runId } = this.loadState()
  await expect(this.page.getByRole('link', { name: tabName })).toHaveAttribute(
    'href',
    `/projects/${projectSlug}/runs/${runId}/suites`
  )
})

Then('the {string} tab should link to the tests view', async function (this: CustomWorld, tabName: string) {
  const { projectSlug, runId } = this.loadState()
  await expect(this.page.getByRole('link', { name: tabName })).toHaveAttribute(
    'href',
    `/projects/${projectSlug}/runs/${runId}/tests`
  )
})

Then('the {string} tab should link to the failed view', async function (this: CustomWorld, tabName: string) {
  const { projectSlug, runId } = this.loadState()
  const link = this.page.getByRole('link', { name: new RegExp(tabName) })
  await expect(link).toHaveAttribute('href', `/projects/${projectSlug}/runs/${runId}/failed`)
})

Then('the {string} tab should link to the flaky view', async function (this: CustomWorld, tabName: string) {
  const { projectSlug, runId } = this.loadState()
  const link = this.page.getByRole('link', { name: new RegExp(tabName) })
  await expect(link).toHaveAttribute('href', `/projects/${projectSlug}/runs/${runId}/flaky`)
})

Then('I should see {string} section', async function (this: CustomWorld, sectionName: string) {
  await expect(this.page.locator('main').getByText(sectionName)).toBeVisible()
})

Then(
  'I should see {string} in the failures list',
  async function (this: CustomWorld, testName: string) {
    await expect(this.page.locator('main').getByText(testName).first()).toBeVisible()
  }
)

Then(
  'I should see the error message {string}',
  async function (this: CustomWorld, errorMsg: string) {
    await expect(this.page.locator('main').getByText(errorMsg).first()).toBeVisible()
  }
)
