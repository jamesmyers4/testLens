import http from "k6/http";
import { check, sleep } from "k6";
import { type Options } from "k6/options";
import { BASE_URL, rampUpStages } from "../config";
import { authHeaders } from "../helpers/auth";

export const options: Options = {
  stages: rampUpStages,
  thresholds: {
    "http_req_duration{type:ingest}": ["p(95)<800"],
    "http_req_failed{type:ingest}": ["rate<0.01"],
  },
};

export default function () {
  const payload = JSON.stringify({
    schemaVersion: "1.0.0",
    runId: `k6-run-${__VU}-${__ITER}`,
    runAt: new Date().toISOString(),
    framework: "vitest",
    environment: "ci",
    branch: "main",
    duration: 1200,
    projectSlug: __ENV.PROJECT_SLUG || "k6-test-project",
    suites: [
      {
        name: "LoadTestSuite",
        duration: 800,
        tests: [
          {
            id: `test-${__VU}-${__ITER}`,
            title: "Load test passes",
            status: "passed",
            duration: 400,
            retries: 0,
            tags: [],
            attachments: [],
          },
        ],
      },
    ],
  });

  const res = http.post(`${BASE_URL}/api/runs`, payload, {
    headers: authHeaders(),
    tags: { type: "ingest" },
  });

  check(res, {
    "status is 201": (r) => r.status === 201,
  });

  sleep(1);
}
