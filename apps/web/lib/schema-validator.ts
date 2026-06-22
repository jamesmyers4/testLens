import { z } from "zod";

const AttachmentSchema = z.object({
  name: z.string(),
  type: z.enum(["screenshot", "video", "trace", "other"]),
  path: z.string().optional(),
  base64: z.string().optional(),
});

const TestSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["passed", "failed", "skipped", "flaky"]),
  duration: z.number(),
  retries: z.number(),
  error: z
    .object({
      message: z.string(),
      stack: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()),
  attachments: z.array(AttachmentSchema),
});

const SuiteSchema = z.object({
  name: z.string(),
  file: z.string().optional(),
  duration: z.number(),
  parentSuite: z.string().optional(),
  tests: z.array(TestSchema),
});

const TestRunReportSchema = z.object({
  schemaVersion: z.string(),
  runId: z.string(),
  runAt: z.string(),
  framework: z.enum(["xunit", "nunit", "playwright", "jest", "vitest", "other"]),
  environment: z.enum(["local", "ci", "staging", "production"]).optional(),
  branch: z.string().optional(),
  commitHash: z.string().optional(),
  duration: z.number(),
  projectSlug: z.string(),
  suites: z.array(SuiteSchema),
});

export type ValidatedRunPayload = z.infer<typeof TestRunReportSchema>;

export function validateRunPayload(body: unknown): ValidatedRunPayload {
  return TestRunReportSchema.parse(body);
}
