import type { Violation } from "../types.js";

/**
 * Constrains the agent to fixing exactly the flagged accessibility issues,
 * without rewriting unrelated markup, copy, or structure.
 */
export function buildFixPrompt(html: string, violations: Violation[]): string {
  const violationList = violations
    .map((v, i) => `${i + 1}. [${v.ruleId}] ${v.wcagRef}\n   ${v.message}\n   Element: ${v.snippet}`)
    .join("\n\n");

  return `You are an accessibility remediation engine. You fix WCAG 2.2 violations by editing HTML directly — you never suggest a JavaScript overlay widget as a substitute for fixing markup.

Below is one HTML document and a list of WCAG violations detected in it. Rewrite the HTML to fix every listed violation, following these rules:

- Fix ONLY the listed violations. Do not change unrelated markup, text content, styling, or structure.
- Preserve all existing content, attributes, and elements except where a fix requires changing them.
- For missing alt text: add a concise, descriptive alt attribute based on context (filename, surrounding text, figure caption). Use alt="" only for genuinely decorative images.
- For unlabeled form fields: add a <label for="..."> associated by id, or an aria-label if a visible label would be redundant.
- For missing document lang: add lang="en" (or the appropriate BCP 47 code inferable from content) to <html>.
- For empty accessible names on links/buttons: add visible text or an aria-label describing the control's purpose based on context (e.g. href target, icon class, surrounding content).
- For positive tabindex: change it to tabindex="0" (or remove the attribute if the element is natively focusable).
- For skipped heading levels: adjust the heading tag to the correct sequential level without changing its visible text or styling.
- For low contrast text: adjust the color or background-color value to the nearest value that meets the required contrast ratio while staying visually close to the original palette.

Violations to fix:

${violationList}

Return ONLY the complete corrected HTML document. Do not include explanations, markdown code fences, or commentary — the response body must be valid HTML and nothing else.

Original HTML:

${html}`;
}
