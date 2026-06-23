import { type Stage } from "k6/options";

export const BASE_URL: string = __ENV.BASE_URL || "http://localhost:3000";

export const rampUpStages: Stage[] = [
  { duration: "30s", target: 10 },
  { duration: "1m", target: 50 },
  { duration: "30s", target: 0 },
];

export const spikeStages: Stage[] = [
  { duration: "10s", target: 100 },
  { duration: "30s", target: 100 },
  { duration: "10s", target: 0 },
];
