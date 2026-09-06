# AccessFix (local MVP)

A CLI that proves the core AccessFix pitch: **scan real HTML for WCAG 2.2
violations, then have an AI agent rewrite the actual markup to fix them —
not bolt on a JS overlay widget.**

```
scan (find violations) → fix (AI agent rewrites HTML) → check (re-scan, prove 0 violations)
```

`check` is the piece a CI pipeline would call on every deploy — an
accessibility regression gate, the same idea as Dependabot but for WCAG
compliance. This scaffold runs entirely on your machine against local HTML
fixture files. There is no server, no database, no SaaS dashboard, no
Shopify/WordPress connector, and no real GitHub PR creation here — those are
future work described in `plan.md`. The "PR" this tool produces is a diff
file + markdown report written to disk.

## What it checks

A curated set of 7 high-signal WCAG 2.2 failure modes — not full axe-core
coverage — chosen for being both common in real accessibility lawsuits and
clearly fixable by rewriting markup:

- Missing image `alt` text (SC 1.1.1)
- Unlabeled form fields (SC 1.3.1 / 4.1.2)
- Missing document `lang` (SC 3.1.1)
- Empty link/button accessible names (SC 2.4.4 / 4.1.2)
- Positive `tabindex` (SC 2.4.3)
- Skipped heading levels (SC 1.3.1)
- Low text/background contrast, computed from the WCAG relative luminance
  formula against inline `color`/`background-color` styles (SC 1.4.3)

## Setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...   (only needed for `fix`)
```

> If your shell has `NODE_ENV=production` set, `npm install` will skip
> devDependencies (tsx/typescript). Run `npm install --include=dev` instead.

## Usage

```bash
# 1. Scan a fixture for violations — no API key required
npm run scan -- fixtures/sample-site/index.html

# 2. Have the AI agent fix them — requires ANTHROPIC_API_KEY
npm run fix -- fixtures/sample-site/index.html
# writes:
#   output/index.fixed.html   — the corrected HTML
#   output/index.diff         — unified diff (original vs. fixed)
#   output/index.report.md    — human-readable before/after report

# 3. Re-scan the fixed file to confirm the fix holds — this is the CI gate.
# Exits 0 with "0 violations" on success, exits 1 if any remain.
npm run check -- output/index.fixed.html
```

A second fixture, `fixtures/sample-site/about.html`, has a different mix of
violations to scan/fix independently.

## Tests

Unit tests cover the deterministic parts (scanner rules, contrast math, diff
and report rendering) and need no API key:

```bash
npm test
```

## Project layout

```
src/
  cli.ts              # entrypoint: scan, fix, check subcommands
  types.ts            # Violation, Rule, ScanResult types
  scanner/
    rules.ts           # the 7 rule definitions
    scan.ts            # loads HTML, runs all rules
    contrast.ts         # WCAG relative luminance / contrast ratio math
  fixer/
    agent.ts           # sends violations + HTML to Claude, returns fixed HTML
    prompt.ts           # prompt template constraining the agent's edits
  report/
    diff.ts            # unified diff between original and fixed HTML
    markdown.ts          # human-readable before/after violation report
fixtures/sample-site/  # seeded HTML pages with real WCAG violations
output/                # gitignored — fix results land here
```
