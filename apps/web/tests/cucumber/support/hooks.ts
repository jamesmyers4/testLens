import { Before, After, setWorldConstructor } from '@cucumber/cucumber'
import { chromium } from 'playwright'
import { CustomWorld } from './world'
import * as fs from 'fs'

setWorldConstructor(CustomWorld)

Before(async function (this: CustomWorld) {
  const authFile = this.authFilePath
  const storageState = fs.existsSync(authFile) ? authFile : undefined

  this.browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' })
  const context = await this.browser.newContext(storageState ? { storageState } : {})
  this.page = await context.newPage()
  await this.page.goto(this.baseUrl + '/')
})

After(async function (this: CustomWorld) {
  if (this.page) {
    await this.page.context().close()
  }
  if (this.browser) {
    await this.browser.close()
  }
})
