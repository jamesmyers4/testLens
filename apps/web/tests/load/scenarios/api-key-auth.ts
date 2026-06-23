import http from "k6/http";
import { check } from "k6";
import { type Options } from "k6/options";
import { BASE_URL, spikeStages } from "../config";

export const options: Options = {
  stages: spikeStages,
  thresholds: {
    "checks{type:auth_rejected}": ["rate>0.99"],
  },
};

const ENDPOINT = `${BASE_URL}/api/runs`;
const BODY = JSON.stringify({});

export default function () {
  const missingHeader = http.post(ENDPOINT, BODY, {
    tags: { type: "auth_rejected" },
  });

  const malformedBearer = http.post(ENDPOINT, BODY, {
    headers: { Authorization: "Bearer invalid-token-xyz" },
    tags: { type: "auth_rejected" },
  });

  const wrongScheme = http.post(ENDPOINT, BODY, {
    headers: { Authorization: "Basic dXNlcjpwYXNz" },
    tags: { type: "auth_rejected" },
  });

  for (const res of [missingHeader, malformedBearer, wrongScheme]) {
    check(res, { "is 401": (r) => r.status === 401 }, { type: "auth_rejected" });
  }
}
