import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { CustomWorld } from '../support/world'

Given('I navigate to the settings page', async function (this: CustomWorld) {
  await this.page.goto(this.baseUrl + '/settings')
})

Then('I should see an {string} heading', async function (this: CustomWorld, heading: string) {
  await expect(this.page.getByRole('heading', { name: heading })).toBeVisible()
})

Then('I should see a {string} button', async function (this: CustomWorld, buttonName: string) {
  await expect(
    this.page.getByRole('button', { name: new RegExp(buttonName, 'i') })
  ).toBeVisible()
})

When('I click the {string} button', async function (this: CustomWorld, buttonName: string) {
  await this.page.getByRole('button', { name: buttonName }).click()
})

When('I enter the key name {string}', async function (this: CustomWorld, keyName: string) {
  const dialog = this.page.getByRole('dialog')
  await dialog.getByPlaceholder(/key name|e\.g\./i).fill(keyName)
})

When('I submit the create key form', async function (this: CustomWorld) {
  const dialog = this.page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Create' }).click()
})

Then('I should see a read-only key input with a value', async function (this: CustomWorld) {
  const dialog = this.page.getByRole('dialog')
  const keyInput = dialog.locator('input[readonly]')
  await expect(keyInput).toBeVisible({ timeout: 5000 })
  const value = await keyInput.inputValue()
  expect(value.length).toBeGreaterThan(10)
})

When('I close the dialog', async function (this: CustomWorld) {
  const dialog = this.page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Done' }).click()
  await expect(dialog).not.toBeVisible()
})

Then('the raw key value should no longer be visible', async function (this: CustomWorld) {
  await expect(this.page.getByRole('dialog')).not.toBeVisible()
})

When('I revoke the key named {string}', async function (this: CustomWorld, keyName: string) {
  const revokeButton = this.page
    .getByRole('row')
    .filter({ hasText: keyName })
    .first()
    .getByRole('button', { name: /revoke/i })
  await revokeButton.click()

  const confirmDialog = this.page.getByRole('dialog')
  await expect(confirmDialog).toBeVisible()
  await confirmDialog.getByRole('button', { name: /revoke key/i }).click()
})

Then('{string} should not appear in the key list', async function (this: CustomWorld, keyName: string) {
  await expect(
    this.page.getByRole('cell', { name: keyName })
  ).not.toBeVisible({ timeout: 5000 })
})
