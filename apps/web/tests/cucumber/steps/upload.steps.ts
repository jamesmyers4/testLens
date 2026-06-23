import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { CustomWorld } from '../support/world'

const VALID_RUN_REPORT = {
  schemaVersion: '1.0.0',
  runId: '',
  runAt: new Date().toISOString(),
  framework: 'xunit',
  environment: 'local',
  branch: 'bdd-branch',
  commitHash: 'bdd12345',
  duration: 3000,
  projectSlug: '',
  suites: [
    {
      name: 'BDDSuite',
      duration: 3000,
      tests: [
        {
          id: 'bdd-test-1',
          title: 'BDD_Upload_Passes',
          status: 'passed',
          duration: 1500,
          retries: 0,
          tags: [],
          attachments: [],
        },
      ],
    },
  ],
}

Given('I am on the upload page for the test project', async function (this: CustomWorld) {
  const { projectSlug } = this.loadState()
  await this.page.goto(`${this.baseUrl}/projects/${projectSlug}/upload`)
})

Then('I should see the file drop zone', async function (this: CustomWorld) {
  await expect(this.page.getByText(/drop testlens-run\.json here/i)).toBeVisible()
})

Then('I should see a browse file button', async function (this: CustomWorld) {
  await expect(this.page.getByRole('button', { name: /browse file/i })).toBeVisible()
})

When('I upload an invalid JSON file', async function (this: CustomWorld) {
  const fileInput = this.page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"this": "does not match schema"}'),
  })
})

Then('I should see a schema error message', async function (this: CustomWorld) {
  await expect(
    this.page.getByText(/does not match the testlens schema|file does not match/i)
  ).toBeVisible({ timeout: 5000 })
})

When('I upload a valid test run report', async function (this: CustomWorld) {
  const { projectSlug } = this.loadState()
  const report = {
    ...VALID_RUN_REPORT,
    runId: `bdd-upload-${Date.now()}`,
    projectSlug,
  }

  const fileInput = this.page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'testlens-run.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(report)),
  })
})

Then('I should be redirected to a run summary page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/\/projects\/.+\/runs\/.+/, { timeout: 10000 })
})
