import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync(
  new URL("../../core/static/core/css/turn-activation.css", import.meta.url),
  "utf8",
);

describe("responsive single-screen layout", () => {
  it("locks only the document height to the dynamic viewport", () => {
    expect(css).toMatch(/html\s*\{[^}]*overflow:\s*hidden;/s);
    expect(css).toMatch(
      /body\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden\s*!important;[^}]*grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto;/s,
    );
  });

  it("keeps the established navbar and control layouts intact", () => {
    expect(css).toMatch(
      /\.site-navbar\s*\{[^}]*position:\s*sticky\s*!important;/s,
    );
    expect(css).not.toMatch(
      /\.navbar-links\s*\{[^}]*grid-template-columns:/s,
    );
    expect(css).not.toMatch(
      /\.board-action-ring\s*\{[^}]*grid-template-areas:/s,
    );
    expect(css).not.toMatch(/\.site-footer\s*\{/s);
  });

  it("uses separate board sizing for desktop, tablet and mobile", () => {
    expect(css).toMatch(/@media \(min-width: 901px\)/);
    expect(css).toMatch(
      /@media \(min-width: 641px\) and \(max-width: 900px\)/,
    );
    expect(css).toMatch(/@media \(max-width: 640px\)/);
    expect(css.match(/--board-cell-size:/g)).toHaveLength(3);
    expect(css).toMatch(/calc\(\(100dvh - 280px\) \/ 9\)/);
    expect(css).toMatch(/calc\(\(100dvh - 350px\) \/ 9\)/);
    expect(css).toMatch(/calc\(\(100dvh - 415px\) \/ 9\)/);
  });
});
