import type { CheerioAPI } from "cheerio";

export interface Violation {
  ruleId: string;
  wcagRef: string;
  severity: "error" | "warning";
  message: string;
  selector: string;
  snippet: string;
}

export interface Rule {
  id: string;
  wcagRef: string;
  description: string;
  check: ($: CheerioAPI) => Violation[];
}

export interface ScanResult {
  file: string;
  violations: Violation[];
}
