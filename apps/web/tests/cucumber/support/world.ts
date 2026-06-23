import { World, IWorldOptions } from '@cucumber/cucumber'
import type { Browser, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

interface E2EState {
  projectSlug: string
  projectName: string
  runId: string
  userId: string
}

export class CustomWorld extends World {
  browser!: Browser
  page!: Page
  readonly baseUrl: string
  createdSlugs: string[]

  constructor(options: IWorldOptions) {
    super(options)
    this.baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
    this.createdSlugs = []
  }

  loadState(): E2EState {
    const statePath = path.resolve(__dirname, '../../helpers/.e2e-state.json')
    if (!fs.existsSync(statePath)) {
      throw new Error(
        'E2E state file missing. Run `npx playwright test` first to seed test data and save auth state.'
      )
    }
    return JSON.parse(fs.readFileSync(statePath, 'utf-8')) as E2EState
  }

  get authFilePath(): string {
    return path.resolve(__dirname, '../../helpers/.auth.json')
  }
}
