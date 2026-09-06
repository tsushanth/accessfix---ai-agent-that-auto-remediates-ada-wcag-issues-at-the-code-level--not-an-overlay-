import { test } from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, meetsAAContrast, parseColor } from "./contrast.js";

test("parseColor handles 6-digit hex", () => {
  assert.deepEqual(parseColor("#336699"), { r: 51, g: 102, b: 153 });
});

test("parseColor handles 3-digit hex shorthand", () => {
  assert.deepEqual(parseColor("#fff"), { r: 255, g: 255, b: 255 });
});

test("parseColor handles rgb()", () => {
  assert.deepEqual(parseColor("rgb(10, 20, 30)"), { r: 10, g: 20, b: 30 });
});

test("parseColor handles named colors", () => {
  assert.deepEqual(parseColor("black"), { r: 0, g: 0, b: 0 });
});

test("parseColor returns null for unparseable input", () => {
  assert.equal(parseColor("not-a-color"), null);
});

test("contrastRatio of black on white is 21:1 (WCAG published max)", () => {
  const ratio = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
  assert.ok(Math.abs(ratio - 21) < 0.01, `expected ~21, got ${ratio}`);
});

test("contrastRatio of identical colors is 1:1", () => {
  const ratio = contrastRatio({ r: 100, g: 100, b: 100 }, { r: 100, g: 100, b: 100 });
  assert.ok(Math.abs(ratio - 1) < 0.001, `expected 1, got ${ratio}`);
});

test("meetsAAContrast requires 4.5:1 for normal text", () => {
  assert.equal(meetsAAContrast(4.5, false), true);
  assert.equal(meetsAAContrast(4.49, false), false);
});

test("meetsAAContrast requires only 3:1 for large text", () => {
  assert.equal(meetsAAContrast(3, true), true);
  assert.equal(meetsAAContrast(2.99, true), false);
});
