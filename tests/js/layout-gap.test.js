import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const css = readFileSync(
  new URL("../../core/static/core/css/turn-activation.css", import.meta.url),
  "utf8",
);

describe("single-screen game layout", () => {
  it("locks the document to the dynamic viewport without page scrolling", () => {
    expect(css).toMatch(/html\s*\{[^}]*overflow:\s*hidden;/s);
    expect(css).toMatch(
      /body\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*hidden\s*!important;[^}]*grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+auto;/s,
    );
  });

  it("keeps navbar, game and footer inside the same viewport grid", () => {
    expect(css).toMatch(
      /\.site-navbar\s*\{[^}]*position:\s*relative\s*!important;/s,
    );
    expect(css).toMatch(
      /\.arcade-shell\.card-game-shell\s*\{[^}]*height:\s*100%;[^}]*overflow:\s*hidden\s*!important;/s,
    );
    expect(css).toMatch(
      /\.site-footer\s*\{[^}]*white-space:\s*nowrap;[^}]*text-overflow:\s*ellipsis;/s,
    );
  });

  it("sizes the tactical board from the available width and height", () => {
    expect(css).toMatch(/\.board-frame\s*\{[^}]*container-type:\s*size;/s);
    expect(css).toMatch(
      /width:\s*min\(100cqw,\s*calc\(100cqh\s*\*\s*13\s*\/\s*9\)\)\s*!important;/s,
    );
    expect(css).toMatch(
      /height:\s*min\(100cqh,\s*calc\(100cqw\s*\*\s*9\s*\/\s*13\)\)\s*!important;/s,
    );
  });
});
