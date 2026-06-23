import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { CustomWorld } from '../support/world'

Given('I navigate to the home page', async function (this: CustomWorld) {
  await this.page.goto(this.baseUrl + '/')
})

Given('I navigate to the new project page', async function (this: CustomWorld) {
  await this.page.goto(this.baseUrl + '/projects/new')
})

Given('I navigate to the seeded project dashboard', async function (this: CustomWorld) {
  const { projectSlug } = this.loadState()
  await this.page.goto(`${this.baseUrl}/projects/${projectSlug}`)
})

Then('I should see a {string} heading', async function (this: CustomWorld, heading: string) {
  await expect(this.page.getByRole('heading', { name: heading })).toBeVisible()
})

Then('I should see {string} summary text', async function (this: CustomWorld, text: string) {
  await expect(this.page.locator('main').getByText(new RegExp(text)).first()).toBeVisible()
})

Then('I should see the seeded test project in the list', async function (this: CustomWorld) {
  const { projectName } = this.loadState()
  await expect(this.page.locator('main').getByText(projectName).first()).toBeVisible()
})

When('I click {string}', async function (this: CustomWorld, linkName: string) {
  await this.page.getByRole('link', { name: linkName, exact: true }).click()
})

Then('I should be on the new project page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/\/projects\/new/)
})

When('I fill in the project name {string}', async function (this: CustomWorld, name: string) {
  await this.page.locator('#name').fill(name)
})

When('I fill in the project slug with a unique value', async function (this: CustomWorld) {
  const slug = `bdd-${Date.now()}`
  this.createdSlugs.push(slug)
  await this.page.locator('#slug').fill(slug)
})

When('I submit the create project form', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: /create project/i }).click()
})

Then('I should be redirected to the new project dashboard', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/\/projects\/.+/, { timeout: 10000 })
})

Then('I should see the project name {string}', async function (this: CustomWorld, name: string) {
  await expect(this.page.getByRole('heading', { name })).toBeVisible()
})

Then('I should see a {string} message', async function (this: CustomWorld, msgPattern: string) {
  await expect(this.page.getByText(new RegExp(msgPattern, 'i'))).toBeVisible()
})

Then('I should see an upload link', async function (this: CustomWorld) {
  await expect(this.page.getByRole('link', { name: /upload a file/i })).toBeVisible()
})

Then('I should see a run history table', async function (this: CustomWorld) {
  await expect(this.page.getByRole('table')).toBeVisible()
})
