import Anthropic from "@anthropic-ai/sdk";
import type { Violation } from "../types.js";
import { buildFixPrompt } from "./prompt.js";

const MODEL = "claude-sonnet-4-5-20250929";

function stripCodeFences(text: string): string {
  const fenced = /^```(?:html)?\s*\n([\s\S]*?)\n```\s*$/.exec(text.trim());
  return fenced ? fenced[1] : text.trim();
}

export async function fixHtml(html: string, violations: Violation[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key — the AI fix step requires it.",
    );
  }

  const client = new Anthropic({ apiKey });
  const prompt = buildFixPrompt(html, violations);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Agent response contained no text content.");
  }

  return stripCodeFences(textBlock.text);
}
