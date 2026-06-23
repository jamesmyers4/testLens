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

interface NUnitProperty {
  "@_name": string;
  "@_value": string;
}

interface NUnitFailure {
  message?: string | { "#text": string };
  "stack-trace"?: string | { "#text": string };
}

interface NUnitTestCase {
  "@_name"?: string;
  "@_fullname"?: string;
  "@_classname"?: string;
  "@_result"?: string;
  "@_duration"?: string;
  "@_runcount"?: string;
  failure?: NUnitFailure;
  properties?: { property?: NUnitProperty | NUnitProperty[] };
}

interface NUnitTestSuite {
  "@_type"?: string;
  "@_name"?: string;
  "@_fullname"?: string;
  "@_duration"?: string;
  "test-suite"?: NUnitTestSuite | NUnitTestSuite[];
  "test-case"?: NUnitTestCase | NUnitTestCase[];
}

interface NUnitDoc {
  "test-run"?: {
    "@_name"?: string;
    "@_duration"?: string;
    "@_start-time"?: string;
    "test-suite"?: NUnitTestSuite | NUnitTestSuite[];
  };
}

function getText(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "#text" in (val as object)) {
    return String((val as { "#text": unknown })["#text"]);
  }
  return "";
}

function mapResult(result: string, retries: number): TestStatus {
  const r = result.toLowerCase();
  if ((r === "passed" || r === "warning") && retries > 0) return "flaky";
  if (r === "passed" || r === "warning") return "passed";
  if (r === "failed" || r === "error") return "failed";
  return "skipped";
}

function asArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function collectTestCases(
  node: NUnitTestSuite,
  suiteMap: Map<string, { file: string; tests: Test[] }>,
  assemblyFile: string
): void {
  for (const child of asArray(node["test-suite"])) {
    collectTestCases(child, suiteMap, assemblyFile);
  }

  for (const t of asArray(node["test-case"])) {
    const className = t["@_classname"] ?? t["@_fullname"]?.split(".").slice(0, -1).join(".") ?? "Unknown";

    if (!suiteMap.has(className)) {
      suiteMap.set(className, { file: assemblyFile, tests: [] });
    }

    const result = t["@_result"] ?? "Failed";
    const runCount = Math.max(1, parseInt(t["@_runcount"] ?? "1", 10));
    const retries = runCount - 1;
    const status = mapResult(result, retries);
    const duration = Math.round(parseFloat(t["@_duration"] ?? "0") * 1000);

    const failure = t.failure;
    const errorMsg = failure ? getText(failure.message) : "";
    const error = errorMsg
      ? { message: errorMsg, stack: getText(failure?.["stack-trace"]) || undefined }
      : undefined;

    const rawProps = asArray(t.properties?.property);
    const tags = rawProps
      .filter((p) => !p["@_name"].startsWith("_"))
      .map((p) => p["@_value"])
      .filter(Boolean);

    suiteMap.get(className)!.tests.push({
      id: randomUUID(),
      title: t["@_name"] ?? "Unknown",
      status,
      duration,
      retries,
      error,
      tags,
      attachments: [],
    });
  }
}

export function parseNUnit(xmlPath: string, projectSlug: string, opts: ParseOpts): TestRunReport {
  const raw = readFileSync(xmlPath, "utf-8").replace(/^﻿/, "");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["test-suite", "test-case", "property", "trait"].includes(name),
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true,
    processEntities: true,
    allowBooleanAttributes: true,
  });

  const doc = parser.parse(raw) as NUnitDoc;
  const testRun = doc["test-run"];

  if (!testRun) {
    throw new Error("Invalid NUnit XML: missing <test-run> root element");
  }

  const assemblyFile = (testRun["@_name"] ?? "unknown").split(/[\\/]/).pop() ?? "unknown";
  const totalDuration = Math.round(parseFloat(testRun["@_duration"] ?? "0") * 1000);
  const runAt = testRun["@_start-time"]
    ? new Date(testRun["@_start-time"]).toISOString()
    : new Date().toISOString();

  const suiteMap = new Map<string, { file: string; tests: Test[] }>();

  for (const rootSuite of asArray(testRun["test-suite"])) {
    collectTestCases(rootSuite, suiteMap, assemblyFile);
  }

  const suites: Suite[] = Array.from(suiteMap.entries()).map(([className, { file, tests }]) => {
    const parts = className.split(".");
    const name = parts.at(-1) ?? className;
    const parentSuite = parts.length > 1 ? parts.slice(0, -1).join(".") : undefined;

    return {
      name,
      file,
      duration: tests.reduce((sum, t) => sum + t.duration, 0),
      parentSuite,
      tests,
    };
  });

  return {
    schemaVersion: "1.0.0",
    runId: randomUUID(),
    runAt,
    framework: "nunit",
    environment: opts.environment,
    branch: opts.branch,
    commitHash: opts.commit,
    duration: totalDuration,
    projectSlug,
    suites,
  };
}
