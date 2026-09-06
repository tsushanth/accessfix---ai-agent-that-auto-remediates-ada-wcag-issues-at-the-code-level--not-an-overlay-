import { test } from "node:test";
import assert from "node:assert/strict";
import { buildUnifiedDiff } from "./diff.js";

test("buildUnifiedDiff produces a patch header referencing the file label", () => {
  const diffText = buildUnifiedDiff("index.html", "<p>old</p>\n", "<p>new</p>\n");
  assert.ok(diffText.includes("a/index.html"));
  assert.ok(diffText.includes("b/index.html"));
});

test("buildUnifiedDiff marks removed and added lines", () => {
  const diffText = buildUnifiedDiff("index.html", "<img src=\"a.jpg\">\n", "<img src=\"a.jpg\" alt=\"A cat\">\n");
  assert.ok(diffText.includes("-<img src=\"a.jpg\">"));
  assert.ok(diffText.includes("+<img src=\"a.jpg\" alt=\"A cat\">"));
});

test("buildUnifiedDiff is empty of +/- hunks when input is unchanged", () => {
  const diffText = buildUnifiedDiff("index.html", "<p>same</p>\n", "<p>same</p>\n");
  assert.ok(!diffText.includes("\n-<p>same</p>"));
  assert.ok(!diffText.includes("\n+<p>same</p>"));
});
