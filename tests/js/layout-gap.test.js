import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync(
  new URL("../../core/static/core/css/turn-activation.css", import.meta.url),
  "utf8",
);

describe("responsive single-screen layout", () => {
  it("locks only the document height to the dynamic viewport", () => {
    expect(css).toContain("height: 100dvh;");
    expect(css).toContain("overflow: hidden !important;");
    expect(css).toContain("grid-template-rows: auto minmax(0, 1fr) auto;");
  });

  it("keeps the established navbar and control layouts intact", () => {
    expect(css).toContain("position: sticky !important;");
    expect(css).not.toContain("grid-template-columns: repeat(5");
    expect(css).not.toContain("grid-template-areas:");
    expect(css).not.toContain(".site-footer {");
  });

  it("uses separate board sizing for desktop, tablet and mobile", () => {
    expect(css).toContain("@media (min-width: 901px)");
    expect(css).toContain("@media (min-width: 641px) and (max-width: 900px)");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css.match(/--board-cell-size:/g)).toHaveLength(3);
    expect(css).toContain("calc((100dvh - 280px) / 9)");
    expect(css).toContain("calc((100dvh - 350px) / 9)");
    expect(css).toContain("calc((100dvh - 415px) / 9)");
  });
});
