import { readFile } from "node:fs/promises";
import * as cheerio from "cheerio";
import { rules } from "./rules.js";
import type { ScanResult } from "../types.js";

export async function scanFile(filePath: string): Promise<ScanResult> {
  const html = await readFile(filePath, "utf8");
  return scanHtml(filePath, html);
}

export function scanHtml(file: string, html: string): ScanResult {
  const $ = cheerio.load(html);
  const violations = rules.flatMap((rule) => rule.check($));
  return { file, violations };
}
