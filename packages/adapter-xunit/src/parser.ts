import { XMLParser } from "fast-xml-parser";
import type { TestRunReport, Suite, Test, TestStatus } from "@testlens/schema";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";

type Environment = "local" | "ci" | "staging" | "production";

interface ParseOpts {
  environment?: Environment;
  branch?: string;
  commit?: string;
}

interface XUnitTrait {
  "@_name": string;
  "@_value": string;
}

interface XUnitFailure {
  message?: string | { "#text": string };
  "stack-trace"?: string | { "#text": string };
}

interface XUnitTest {
  "@_name"?: string;
  "@_method"?: string;
  "@_classname"?: string;
  "@_time"?: string;
  "@_result"?: string;
  "@_retries"?: string;
  traits?: { trait?: XUnitTrait[] };
  failure?: XUnitFailure;
}

interface XUnitCollection {
  "@_name"?: string;
  "@_time"?: string;
  test?: XUnitTest[];
}

interface XUnitAssembly {
  "@_name"?: string;
  "@_run-date"?: string;
  "@_run-time"?: string;
  collection?: XUnitCollection[];
}

interface XUnitDoc {
  assemblies?: { assembly?: XUnitAssembly[] };
}

function getText(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "#text" in (val as object)) {
    return String((val as { "#text": unknown })["#text"]);
  }
  return "";
}

function mapResult(result: string, retries: number): TestStatus {
  if (result === "Pass" && retries > 0) return "flaky";
  if (result === "Pass") return "passed";
  if (result === "Fail") return "failed";
  if (result === "Skip") return "skipped";
  return "failed";
}

export function parseXUnit(xmlPath: string, projectSlug: string, opts: ParseOpts): TestRunReport {
  const raw = readFileSync(xmlPath, "utf-8").replace(/^﻿/, "");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["assembly", "collection", "test", "trait"].includes(name),
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true,
    processEntities: true,
    allowBooleanAttributes: true,
  });

  const doc = parser.parse(raw) as XUnitDoc;
  const assemblies = doc.assemblies?.assembly ?? [];
  const suites: Suite[] = [];
  let totalDuration = 0;

  for (const assembly of assemblies) {
    const assemblyFile = (assembly["@_name"] ?? "unknown").split(/[\\/]/).pop() ?? "unknown";
    const collections = assembly.collection ?? [];

    for (const col of collections) {
      const suiteName = col["@_name"] ?? assemblyFile;
      const suiteDuration = Math.round(parseFloat(col["@_time"] ?? "0") * 1000);
      const tests: Test[] = [];

      for (const t of col.test ?? []) {
        const result = t["@_result"] ?? "Fail";
        const retries = Math.max(0, parseInt(t["@_retries"] ?? "0", 10));
        const status = mapResult(result, retries);
        const duration = Math.round(parseFloat(t["@_time"] ?? "0") * 1000);

        const failure = t.failure;
        const errorMsg = failure ? getText(failure.message) : "";
        const error = errorMsg
          ? { message: errorMsg, stack: getText(failure?.["stack-trace"]) || undefined }
          : undefined;

        const traits = t.traits?.trait ?? [];
        const tags = traits.map((tr) => tr["@_value"] ?? tr["@_name"]).filter(Boolean);

        tests.push({
          id: randomUUID(),
          title: t["@_method"] ?? t["@_name"] ?? "Unknown",
          status,
          duration,
          retries,
          error,
          tags,
          attachments: [],
        });
      }

      suites.push({ name: suiteName, file: assemblyFile, duration: suiteDuration, tests });
      totalDuration += suiteDuration;
    }
  }

  const first = assemblies[0];
  const runAt =
    first?.["@_run-date"] && first?.["@_run-time"]
      ? new Date(`${first["@_run-date"]}T${first["@_run-time"]}`).toISOString()
      : new Date().toISOString();

  return {
    schemaVersion: "1.0.0",
    runId: randomUUID(),
    runAt,
    framework: "xunit",
    environment: opts.environment,
    branch: opts.branch,
    commitHash: opts.commit,
    duration: totalDuration,
    projectSlug,
    suites,
  };
}
