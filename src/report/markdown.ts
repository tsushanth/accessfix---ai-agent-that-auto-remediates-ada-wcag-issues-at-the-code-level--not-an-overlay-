import type { ScanResult } from "../types.js";

function violationSection(title: string, result: ScanResult): string {
  if (result.violations.length === 0) {
    return `### ${title}\n\nNo violations found.\n`;
  }
  const rows = result.violations
    .map((v, i) => `${i + 1}. **${v.ruleId}** — ${v.wcagRef}\n   - ${v.message}\n   - Selector: \`${v.selector}\``)
    .join("\n");
  return `### ${title}\n\n${result.violations.length} violation(s) found:\n\n${rows}\n`;
}

/** Human-readable before/after report — the artifact a small business owner or agency would see in place of a real PR description. */
export function buildMarkdownReport(before: ScanResult, after: ScanResult, diffText: string): string {
  return `# AccessFix Report — ${before.file}

## Summary

- Before: ${before.violations.length} violation(s)
- After: ${after.violations.length} violation(s)
- Status: ${after.violations.length === 0 ? "✅ All flagged violations fixed" : "⚠️ Some violations remain"}

${violationSection("Before", before)}

${violationSection("After", after)}

## Diff

\`\`\`diff
${diffText}
\`\`\`
`;
}
