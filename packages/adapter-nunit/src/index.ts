#!/usr/bin/env node
import { parseNUnit } from "./parser";
import { writeFileSync } from "fs";

type Environment = "local" | "ci" | "staging" | "production";
const VALID_ENVS: Environment[] = ["local", "ci", "staging", "production"];

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length - 1; i++) {
    if (argv[i].startsWith("--")) {
      result[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return result;
}

function toEnvironment(val?: string): Environment | undefined {
  return VALID_ENVS.includes(val as Environment) ? (val as Environment) : undefined;
}

const args = parseArgs(process.argv.slice(2));

if (!args["input"] || !args["project"]) {
  process.stderr.write(
    "Usage: testlens-convert --input <file> --project <slug> [--environment local|ci|staging|production] [--branch <branch>] [--commit <hash>] [--out <file>] [--endpoint <url>] [--api-key <key>]\n"
  );
  process.exit(1);
}

let report: ReturnType<typeof parseNUnit>;
try {
  report = parseNUnit(args["input"], args["project"], {
    environment: toEnvironment(args["environment"]),
    branch: args["branch"],
    commit: args["commit"],
  });
} catch (err) {
  process.stderr.write(`Parse error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}

const json = JSON.stringify(report, null, 2);

if (args["out"]) {
  writeFileSync(args["out"], json, "utf-8");
  process.stdout.write(`Written to ${args["out"]}\n`);
}

if (args["endpoint"] && args["api-key"]) {
  fetch(args["endpoint"], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args["api-key"]}`,
    },
    body: json,
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        process.stderr.write(`POST failed ${res.status}: ${text}\n`);
        process.exit(1);
      }
      process.stdout.write(`Uploaded to ${args["endpoint"]} — ${res.status}\n`);
    })
    .catch((err: unknown) => {
      process.stderr.write(`POST error: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    });
} else if (!args["out"]) {
  process.stdout.write(json + "\n");
}
