import http from "k6/http";
import { check, sleep } from "k6";
import { type Options } from "k6/options";
import { BASE_URL, rampUpStages } from "../config";

export const options: Options = {
  stages: rampUpStages,
  thresholds: {
    "http_req_duration{type:badge}": ["p(95)<200"],
    "http_req_failed{type:badge}": ["rate<0.01"],
  },
};

export default function () {
  const slug = __ENV.PROJECT_SLUG || "k6-test-project";

  const res = http.get(`${BASE_URL}/api/projects/${slug}/badge`, {
    tags: { type: "badge" },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "content-type is svg": (r) =>
      (r.headers["Content-Type"] ?? "").includes("image/svg+xml"),
  });

  sleep(0.5);
}
