# AccessFix — Local MVP Scaffold Plan

## Goal of this MVP

Prove the one thing that differentiates this product from overlay vendors:
**scan real HTML for WCAG 2.2 violations, then have an AI agent rewrite the
actual markup to fix them — not inject a JS shim.** Everything else (SaaS
dashboard, Shopify/WordPress connectors, GitHub App, billing, hosted CI) is
future work. This scaffold runs entirely on a developer's machine against
local HTML fixture files.

Core loop to demo:

```
scan (find violations) → fix (AI agent rewrites HTML) → check (re-scan, prove 0 violations)
```

That loop is the whole pitch: "real fixes, not a lawsuit magnet," and "an
accessibility Dependabot" (the `check` command is the regression gate a CI
pipeline would call, even though no CI is actually wired up here).

## Stack

**Node.js + TypeScript CLI.** No framework, no server, no database.

- `cheerio` — parse/query/mutate HTML without a browser (fast, deterministic,
  avoids jsdom's flaky rendering/canvas support needed for real browser-based
  a11y engines like axe-core).
- Hand-rolled rule checks for a focused set of high-signal WCAG 2.2 failures
  (see below) — not a full axe-core integration. A handful of well-understood
  rules is enough to prove the scan→fix→verify loop; broad rule coverage is a
  post-MVP concern.
- `@anthropic-ai/sdk` — the actual "AI coding agent" step. Given the flagged
  violations + surrounding HTML, it asks Claude to return corrected HTML
  (add `alt`, associate `<label>`s, fix heading order, add accessible names,
  fix low-contrast inline colors, remove positive `tabindex`, etc.).
- `diff` (npm package) — render a unified diff between original and
  agent-fixed HTML, standing in for the "auto-generated PR" artifact.
- Plain `node:test` (built-in, no extra test runner dependency) for unit
  tests on the scanner rules.

No React/Next/Express/Vite — there's no UI and nothing to serve.

## Explicitly out of scope for this scaffold

- **Auth / accounts / billing** — nothing to log into; it's a CLI over local
  files.
- **Hosting / deployment** — runs on localhost only.
- **Real CMS integration** (Shopify/WordPress) — out of scope; fixtures are
  plain static HTML files, which is the common denominator all target
  platforms render down to.
- **Real GitHub PR creation** — the "PR" is simulated as a written diff file
  + markdown report on disk. No GitHub API/token needed.
- **Real CI wiring** — the `check` command is built to be CI-callable (exits
  non-zero on violations) but we don't actually create a GitHub Action or
  webhook.
- **Full WCAG 2.2 rule coverage / axe-core parity** — a curated subset of
  ~6-8 rules chosen for being both common in real lawsuits and clearly
  fixable by rewriting markup (missing alt text, unlabeled form fields,
  missing/duplicate document `lang`, empty link/button accessible names,
  positive `tabindex` / keyboard traps, low text/background contrast,
  skipped heading levels).
- **Browser-rendered contrast/visual regression checking** — contrast is
  computed mathematically (WCAG relative luminance formula) from CSS/inline
  color values in the HTML, not from a rendered screenshot.

**One unavoidable exception:** an Anthropic API key. The core value prop is
literally "an AI agent fixes the code," so an LLM call is not optional —
that's the one piece of external dependency/config this scaffold requires
(`ANTHROPIC_API_KEY` in a local `.env`, never committed).

## File / directory layout

```
accessfix-mvp/
  package.json
  tsconfig.json
  .env.example
  .gitignore
  README.md
  src/
    cli.ts                  # entrypoint: `scan`, `fix`, `check` subcommands
    types.ts                # Violation, Rule, ScanResult types
    scanner/
      rules.ts              # rule definitions (id, WCAG SC ref, check fn)
      scan.ts               # loads HTML, runs all rules, returns violations[]
      contrast.ts           # WCAG relative luminance / contrast ratio math
    fixer/
      agent.ts              # sends violations+HTML to Claude, returns fixed HTML
      prompt.ts             # prompt template constraining the agent's edits
    report/
      diff.ts               # unified diff between original and fixed HTML
      markdown.ts           # human-readable before/after violation report
  fixtures/
    sample-site/
      index.html             # seeded with ~6-8 real WCAG violations
      about.html              # a second page, different violation mix
  output/                     # gitignored — fixed HTML, diffs, reports land here
```

## How this will be verified

1. **Unit tests (`node --test`)** on the deterministic parts — no API key
   required:
   - Each rule in `scanner/rules.ts` gets a known-bad HTML snippet (must
     flag) and a known-good snippet (must pass clean).
   - `contrast.ts` tested against WCAG's published example ratios.
   - `report/diff.ts` and `report/markdown.ts` tested against fixed
     input/output pairs.

2. **Manual run-through (the real demo)**, requires `ANTHROPIC_API_KEY` set
   in `.env`:
   ```
   npm run scan  -- fixtures/sample-site/index.html
   # → prints violation list with WCAG SC references

   npm run fix   -- fixtures/sample-site/index.html
   # → calls the AI agent, writes:
   #     output/index.fixed.html
   #     output/index.diff
   #     output/index.report.md

   npm run check -- output/index.fixed.html
   # → re-scans the fixed file, exits 0 with "0 violations" if the agent's
   #   fix actually holds up — this is the "CI gate" being demoed
   ```
   Success criteria: `scan` on the original fixture reports the seeded
   violations; `check` on the agent-fixed output reports zero; the diff/
   report files are legible enough to stand in for what an agency or small
   business owner would see in a real auto-generated PR.
