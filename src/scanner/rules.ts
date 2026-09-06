import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { Rule, Violation } from "../types.js";
import { contrastRatio, meetsAAContrast, parseColor } from "./contrast.js";

function snippetOf($: CheerioAPI, el: Cheerio<AnyNode>): string {
  const html = $.html(el) ?? "";
  return html.length > 200 ? `${html.slice(0, 200)}…` : html;
}

function selectorOf(el: Cheerio<AnyNode>): string {
  const node = el.get(0);
  if (!node || node.type !== "tag") return "unknown";
  const attribs = node.attribs ?? {};
  const id = attribs.id ? `#${attribs.id}` : "";
  const cls = attribs.class ? `.${attribs.class.trim().split(/\s+/).join(".")}` : "";
  return `${node.name}${id}${cls}`;
}

function parseInlineStyle(style: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const decl of style.split(";")) {
    const [prop, ...rest] = decl.split(":");
    if (!prop || rest.length === 0) continue;
    result[prop.trim().toLowerCase()] = rest.join(":").trim();
  }
  return result;
}

const missingAltText: Rule = {
  id: "missing-alt-text",
  wcagRef: "WCAG 2.2 SC 1.1.1 (Non-text Content)",
  description: "Images must have an alt attribute describing their content (or alt=\"\" if decorative).",
  check: ($) => {
    const violations: Violation[] = [];
    $("img").each((_, node) => {
      const el = $(node);
      if (el.attr("alt") === undefined) {
        violations.push({
          ruleId: missingAltText.id,
          wcagRef: missingAltText.wcagRef,
          severity: "error",
          message: `<img src="${el.attr("src") ?? ""}"> is missing an alt attribute.`,
          selector: selectorOf(el),
          snippet: snippetOf($, el),
        });
      }
    });
    return violations;
  },
};

const unlabeledFormField: Rule = {
  id: "unlabeled-form-field",
  wcagRef: "WCAG 2.2 SC 1.3.1 / 4.1.2 (Info and Relationships / Name, Role, Value)",
  description: "Form fields must have an associated <label>, aria-label, or aria-labelledby.",
  check: ($) => {
    const violations: Violation[] = [];
    $("input, textarea, select").each((_, node) => {
      const el = $(node);
      const type = (el.attr("type") ?? "text").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image"].includes(type)) return;

      const id = el.attr("id");
      const hasLabelFor = id ? $(`label[for="${id}"]`).length > 0 : false;
      const wrappedInLabel = el.closest("label").length > 0;
      const hasAriaLabel = Boolean(el.attr("aria-label") || el.attr("aria-labelledby"));

      if (!hasLabelFor && !wrappedInLabel && !hasAriaLabel) {
        violations.push({
          ruleId: unlabeledFormField.id,
          wcagRef: unlabeledFormField.wcagRef,
          severity: "error",
          message: `<${node.type === "tag" ? node.name : "field"}> has no accessible label (no <label for>, wrapping <label>, aria-label, or aria-labelledby).`,
          selector: selectorOf(el),
          snippet: snippetOf($, el),
        });
      }
    });
    return violations;
  },
};

const documentLang: Rule = {
  id: "document-lang",
  wcagRef: "WCAG 2.2 SC 3.1.1 (Language of Page)",
  description: "The <html> element must have exactly one valid lang attribute.",
  check: ($) => {
    const violations: Violation[] = [];
    const htmlEls = $("html");
    if (htmlEls.length === 0) return violations;
    const el = htmlEls.first();
    const lang = el.attr("lang");
    if (!lang || lang.trim() === "") {
      violations.push({
        ruleId: documentLang.id,
        wcagRef: documentLang.wcagRef,
        severity: "error",
        message: "<html> is missing a lang attribute.",
        selector: "html",
        snippet: "<html>",
      });
    }
    return violations;
  },
};

const emptyAccessibleName: Rule = {
  id: "empty-accessible-name",
  wcagRef: "WCAG 2.2 SC 2.4.4 / 4.1.2 (Link Purpose / Name, Role, Value)",
  description: "Links and buttons must have a non-empty accessible name (text content, aria-label, or aria-labelledby).",
  check: ($) => {
    const violations: Violation[] = [];
    $("a[href], button").each((_, node) => {
      const el = $(node);
      const text = el.text().trim();
      const ariaLabel = el.attr("aria-label")?.trim();
      const ariaLabelledby = el.attr("aria-labelledby")?.trim();
      const hasImgAlt = el.find("img[alt]").filter((_, img) => ($(img).attr("alt") ?? "").trim() !== "").length > 0;

      if (!text && !ariaLabel && !ariaLabelledby && !hasImgAlt) {
        const tag = node.type === "tag" ? node.name : "element";
        violations.push({
          ruleId: emptyAccessibleName.id,
          wcagRef: emptyAccessibleName.wcagRef,
          severity: "error",
          message: `<${tag}> has no accessible name (empty text content, no aria-label/aria-labelledby).`,
          selector: selectorOf(el),
          snippet: snippetOf($, el),
        });
      }
    });
    return violations;
  },
};

const positiveTabindex: Rule = {
  id: "positive-tabindex",
  wcagRef: "WCAG 2.2 SC 2.4.3 (Focus Order)",
  description: "Elements should not use a positive tabindex, which breaks natural focus order and can trap keyboard users.",
  check: ($) => {
    const violations: Violation[] = [];
    $("[tabindex]").each((_, node) => {
      const el = $(node);
      const raw = el.attr("tabindex") ?? "0";
      const value = Number.parseInt(raw, 10);
      if (Number.isFinite(value) && value > 0) {
        const tag = node.type === "tag" ? node.name : "element";
        violations.push({
          ruleId: positiveTabindex.id,
          wcagRef: positiveTabindex.wcagRef,
          severity: "warning",
          message: `<${tag} tabindex="${raw}"> uses a positive tabindex, which breaks natural document focus order.`,
          selector: selectorOf(el),
          snippet: snippetOf($, el),
        });
      }
    });
    return violations;
  },
};

const skippedHeadingLevel: Rule = {
  id: "skipped-heading-level",
  wcagRef: "WCAG 2.2 SC 1.3.1 (Info and Relationships)",
  description: "Heading levels should not skip (e.g. an <h1> followed directly by an <h3>).",
  check: ($) => {
    const violations: Violation[] = [];
    const headings = $("h1, h2, h3, h4, h5, h6").toArray();
    let previousLevel = 0;
    for (const node of headings) {
      const el = $(node);
      const level = Number.parseInt(node.name.slice(1), 10);
      if (previousLevel > 0 && level - previousLevel > 1) {
        violations.push({
          ruleId: skippedHeadingLevel.id,
          wcagRef: skippedHeadingLevel.wcagRef,
          severity: "warning",
          message: `<${node.name}> skips from heading level ${previousLevel} to ${level}.`,
          selector: selectorOf(el),
          snippet: snippetOf($, el),
        });
      }
      previousLevel = level;
    }
    return violations;
  },
};

const lowContrastText: Rule = {
  id: "low-contrast-text",
  wcagRef: "WCAG 2.2 SC 1.4.3 (Contrast, Minimum)",
  description: "Inline text color and background-color must meet a 4.5:1 contrast ratio (3:1 for large text).",
  check: ($) => {
    const violations: Violation[] = [];
    $("[style]").each((_, node) => {
      const el = $(node);
      const style = parseInlineStyle(el.attr("style") ?? "");
      if (!style.color || !style["background-color"]) return;

      const fg = parseColor(style.color);
      const bg = parseColor(style["background-color"]);
      if (!fg || !bg) return;

      const fontSizePx = style["font-size"] ? Number.parseFloat(style["font-size"]) : 16;
      const isBold = (style["font-weight"] ?? "").toLowerCase() === "bold" || Number.parseInt(style["font-weight"] ?? "400", 10) >= 700;
      const isLargeText = fontSizePx >= 24 || (isBold && fontSizePx >= 18.66);

      const ratio = contrastRatio(fg, bg);
      if (!meetsAAContrast(ratio, isLargeText)) {
        const tag = node.type === "tag" ? node.name : "element";
        violations.push({
          ruleId: lowContrastText.id,
          wcagRef: lowContrastText.wcagRef,
          severity: "error",
          message: `<${tag}> text/background contrast ratio is ${ratio.toFixed(2)}:1, below the required ${isLargeText ? "3:1" : "4.5:1"}.`,
          selector: selectorOf(el),
          snippet: snippetOf($, el),
        });
      }
    });
    return violations;
  },
};

export const rules: Rule[] = [
  missingAltText,
  unlabeledFormField,
  documentLang,
  emptyAccessibleName,
  positiveTabindex,
  skippedHeadingLevel,
  lowContrastText,
];
