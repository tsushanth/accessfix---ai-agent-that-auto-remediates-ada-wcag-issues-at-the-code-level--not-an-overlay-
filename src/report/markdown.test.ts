import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMarkdownReport } from "./markdown.js";
import type { ScanResult } from "../types.js";

const sampleViolation = {
  ruleId: "missing-alt-text",
  wcagRef: "WCAG 2.2 SC 1.1.1 (Non-text Content)",
  severity: "error" as const,
  message: "<img> is missing an alt attribute.",
  selector: "img",
  snippet: "<img>",
};

test("buildMarkdownReport reports remaining violations when fix is incomplete", () => {
  const before: ScanResult = { file: "index.html", violations: [sampleViolation] };
  const after: ScanResult = { file: "index.html", violations: [sampleViolation] };
  const report = buildMarkdownReport(before, after, "diff --git a/index.html b/index.html");

  assert.ok(report.includes("Before: 1 violation(s)"));
  assert.ok(report.includes("After: 1 violation(s)"));
  assert.ok(report.includes("Some violations remain"));
});

test("buildMarkdownReport reports success when all violations are fixed", () => {
  const before: ScanResult = { file: "index.html", violations: [sampleViolation] };
  const after: ScanResult = { file: "index.html", violations: [] };
  const report = buildMarkdownReport(before, after, "diff --git a/index.html b/index.html");

  assert.ok(report.includes("After: 0 violation(s)"));
  assert.ok(report.includes("All flagged violations fixed"));
});
