import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync(
  new URL("../../core/static/core/css/turn-activation.css", import.meta.url),
  "utf8",
);

describe("navbar layout", () => {
  it("keeps the navbar in document flow without a top spacer", () => {
    expect(css).toMatch(/body\s*\{[^}]*padding-top:\s*0\s*!important;/s);
    expect(css).toMatch(/\.site-navbar\s*\{[^}]*position:\s*sticky\s*!important;/s);
  });
});
