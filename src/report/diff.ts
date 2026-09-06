import { createTwoFilesPatch } from "diff";

/** Renders a unified diff between original and fixed HTML — stands in for an auto-generated PR. */
export function buildUnifiedDiff(fileLabel: string, originalHtml: string, fixedHtml: string): string {
  return createTwoFilesPatch(
    `a/${fileLabel}`,
    `b/${fileLabel}`,
    originalHtml,
    fixedHtml,
    "before",
    "after",
  );
}
