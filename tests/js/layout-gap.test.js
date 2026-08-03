import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync(
  new URL("../../core/static/core/css/turn-activation.css", import.meta.url),
  "utf8",
);

describe("responsive single-screen layout", () => {
  it("uses a fixed-width flex viewport instead of a min-content grid", () => {
    expect(css).toContain("height: 100dvh;");
    expect(css).toContain("display: flex;");
    expect(css).toContain("flex-direction: column;");
    expect(css).not.toContain(
      "grid-template-rows: auto minmax(0, 1fr) auto;",
    );
    expect(css).not.toContain("position: sticky !important;");
  });

  it("keeps the mobile sticky navbar in flow without a duplicate spacer", () => {
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*?body\s*\{[\s\S]*?padding-top:\s*0\s*!important;/,
    );
    expect(css).toContain(".navbar-links {");
    expect(css).toContain("min-width: 0;");
  });

  it("uses separate width-and-height board sizing for all devices", () => {
    expect(css).toContain("@media (min-width: 901px)");
    expect(css).toContain("@media (min-width: 641px) and (max-width: 900px)");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css.match(/--board-cell-size:/g)).toHaveLength(3);
    expect(css).toContain("calc((100dvh - 260px) / 9)");
    expect(css).toContain("calc((100dvh - 360px) / 9)");
    expect(css).toContain("calc((100dvh - 405px) / 9)");
  });

  it("keeps the four board controls above non-interactive overlays", () => {
    expect(css).toMatch(
      /\.board-action\s*\{[\s\S]*?z-index:\s*30;/,
    );
    expect(css).toMatch(
      /\.board-action\s*\{[\s\S]*?pointer-events:\s*auto;/,
    );
    expect(css).toMatch(
      /\.pause-shade\s*\{[\s\S]*?pointer-events:\s*none\s*!important;/,
    );
  });
});
