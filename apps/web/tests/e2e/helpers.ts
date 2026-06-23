import * as fs from 'fs'
import * as path from 'path'

interface E2EState {
  projectSlug: string
  projectName: string
  runId: string
  userId: string
}

export function loadE2EState(): E2EState {
  const statePath = path.resolve(__dirname, '../helpers/.e2e-state.json')
  return JSON.parse(fs.readFileSync(statePath, 'utf-8')) as E2EState
}

export const VALID_RUN_REPORT = {
  schemaVersion: '1.0.0',
  runId: 'e2e-upload-test-run',
  runAt: new Date().toISOString(),
  framework: 'xunit' as const,
  environment: 'local' as const,
  branch: 'test-branch',
  commitHash: 'e2e12345',
  duration: 3000,
  projectSlug: '',
  suites: [
    {
      name: 'UploadTestSuite',
      duration: 3000,
      tests: [
        {
          id: 'test-1',
          title: 'Upload_ReturnsSuccess',
          status: 'passed' as const,
          duration: 1500,
          retries: 0,
          tags: [],
          attachments: [],
        },
        {
          id: 'test-2',
          title: 'Upload_WithBadData_Fails',
          status: 'failed' as const,
          duration: 1500,
          retries: 0,
          error: { message: 'Expected 200 but got 400' },
          tags: [],
          attachments: [],
        },
      ],
    },
  ],
}
