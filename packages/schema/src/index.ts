export type TestStatus = "passed" | "failed" | "skipped" | "flaky";

export type Framework = "xunit" | "nunit" | "playwright" | "jest" | "vitest" | "other";

export type Environment = "local" | "ci" | "staging" | "production";

export interface Attachment {
  name: string;
  type: "screenshot" | "video" | "trace" | "other";
  path?: string;
  base64?: string;
}

export interface Test {
  id: string;
  title: string;
  status: TestStatus;
  duration: number;
  retries: number;
  error?: {
    message: string;
    stack?: string;
  };
  tags: string[];
  attachments: Attachment[];
}

export interface Suite {
  name: string;
  file?: string;
  duration: number;
  parentSuite?: string;
  tests: Test[];
}

export interface TestRunReport {
  schemaVersion: string;
  runId: string;
  runAt: string;
  framework: Framework;
  environment?: Environment;
  branch?: string;
  commitHash?: string;
  duration: number;
  projectSlug: string;
  suites: Suite[];
}
