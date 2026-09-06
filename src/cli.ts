import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { scanFile, scanHtml } from "./scanner/scan.js";
import { fixHtml } from "./fixer/agent.js";
import { buildUnifiedDiff } from "./report/diff.js";
import { buildMarkdownReport } from "./report/markdown.js";
import type { ScanResult } from "./types.js";

function printScanResult(result: ScanResult): void {
  if (result.violations.length === 0) {
    console.log(`${result.file}: 0 violations`);
    return;
  }
  console.log(`${result.file}: ${result.violations.length} violation(s)\n`);
  for (const [i, v] of result.violations.entries()) {
    console.log(`${i + 1}. [${v.severity}] ${v.ruleId} — ${v.wcagRef}`);
    console.log(`   ${v.message}`);
    console.log(`   at ${v.selector}`);
    console.log();
  }
}

async function runScan(filePath: string): Promise<ScanResult> {
  const result = await scanFile(filePath);
  printScanResult(result);
  return result;
}

async function runFix(filePath: string): Promise<void> {
  const before = await runScan(filePath);
  if (before.violations.length === 0) {
    console.log("\nNo violations to fix.");
    return;
  }

  console.log(`\nSending ${before.violations.length} violation(s) to the AI agent...`);
  const originalHtml = await readFile(filePath, "utf8");
  const fixedHtml = await fixHtml(originalHtml, before.violations);

  const after = scanHtml(filePath, fixedHtml);
  const diffText = buildUnifiedDiff(basename(filePath), originalHtml, fixedHtml);
  const report = buildMarkdownReport(before, after, diffText);

  const outputDir = "output";
  await mkdir(outputDir, { recursive: true });
  const stem = basename(filePath, extname(filePath));

  const fixedPath = join(outputDir, `${stem}.fixed.html`);
  const diffPath = join(outputDir, `${stem}.diff`);
  const reportPath = join(outputDir, `${stem}.report.md`);

  await writeFile(fixedPath, fixedHtml, "utf8");
  await writeFile(diffPath, diffText, "utf8");
  await writeFile(reportPath, report, "utf8");

  console.log(`\nWrote:`);
  console.log(`  ${fixedPath}`);
  console.log(`  ${diffPath}`);
  console.log(`  ${reportPath}`);
  console.log(
    `\n${before.violations.length} -> ${after.violations.length} violations after fix.`,
  );
}

async function runCheck(filePath: string): Promise<void> {
  const result = await runScan(filePath);
  if (result.violations.length > 0) {
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  const [command, filePath] = process.argv.slice(2);

  if (!command || !filePath) {
    console.error("Usage: accessfix <scan|fix|check> <path-to-html-file>");
    process.exitCode = 1;
    return;
  }

  try {
    switch (command) {
      case "scan":
        await runScan(filePath);
        break;
      case "fix":
        await runFix(filePath);
        break;
      case "check":
        await runCheck(filePath);
        break;
      default:
        console.error(`Unknown command: ${command}. Use scan, fix, or check.`);
        process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
