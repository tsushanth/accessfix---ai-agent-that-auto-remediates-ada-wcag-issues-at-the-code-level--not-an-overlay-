import { test } from "node:test";
import assert from "node:assert/strict";
import { scanHtml } from "./scan.js";

function violationIds(html: string): string[] {
  return scanHtml("test.html", html).violations.map((v) => v.ruleId);
}

test("missing-alt-text flags an img with no alt", () => {
  const ids = violationIds(`<html lang="en"><body><img src="a.jpg"></body></html>`);
  assert.ok(ids.includes("missing-alt-text"));
});

test("missing-alt-text passes an img with alt", () => {
  const ids = violationIds(`<html lang="en"><body><img src="a.jpg" alt="A cat"></body></html>`);
  assert.ok(!ids.includes("missing-alt-text"));
});

test("unlabeled-form-field flags an input with no label", () => {
  const ids = violationIds(`<html lang="en"><body><input type="text" name="q"></body></html>`);
  assert.ok(ids.includes("unlabeled-form-field"));
});

test("unlabeled-form-field passes an input with a matching label", () => {
  const ids = violationIds(
    `<html lang="en"><body><label for="q">Query</label><input type="text" id="q" name="q"></body></html>`,
  );
  assert.ok(!ids.includes("unlabeled-form-field"));
});

test("document-lang flags html with no lang attribute", () => {
  const ids = violationIds(`<html><body><p>hi</p></body></html>`);
  assert.ok(ids.includes("document-lang"));
});

test("document-lang passes html with a lang attribute", () => {
  const ids = violationIds(`<html lang="en"><body><p>hi</p></body></html>`);
  assert.ok(!ids.includes("document-lang"));
});

test("empty-accessible-name flags a link with no text or aria-label", () => {
  const ids = violationIds(`<html lang="en"><body><a href="/x"></a></body></html>`);
  assert.ok(ids.includes("empty-accessible-name"));
});

test("empty-accessible-name passes a link with text", () => {
  const ids = violationIds(`<html lang="en"><body><a href="/x">Read more</a></body></html>`);
  assert.ok(!ids.includes("empty-accessible-name"));
});

test("positive-tabindex flags tabindex greater than 0", () => {
  const ids = violationIds(`<html lang="en"><body><button tabindex="2">Go</button></body></html>`);
  assert.ok(ids.includes("positive-tabindex"));
});

test("positive-tabindex passes tabindex of 0", () => {
  const ids = violationIds(`<html lang="en"><body><button tabindex="0">Go</button></body></html>`);
  assert.ok(!ids.includes("positive-tabindex"));
});

test("skipped-heading-level flags h1 directly followed by h3", () => {
  const ids = violationIds(`<html lang="en"><body><h1>Title</h1><h3>Sub</h3></body></html>`);
  assert.ok(ids.includes("skipped-heading-level"));
});

test("skipped-heading-level passes sequential heading levels", () => {
  const ids = violationIds(`<html lang="en"><body><h1>Title</h1><h2>Sub</h2></body></html>`);
  assert.ok(!ids.includes("skipped-heading-level"));
});

test("low-contrast-text flags light gray on white", () => {
  const ids = violationIds(
    `<html lang="en"><body><p style="color: #999999; background-color: #ffffff;">hi</p></body></html>`,
  );
  assert.ok(ids.includes("low-contrast-text"));
});

test("low-contrast-text passes black on white", () => {
  const ids = violationIds(
    `<html lang="en"><body><p style="color: #000000; background-color: #ffffff;">hi</p></body></html>`,
  );
  assert.ok(!ids.includes("low-contrast-text"));
});
