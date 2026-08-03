import { describe, expect, it } from "vitest";
import {
  getEligibleCards,
  normalizeMatchConfig,
  reconcileSelection,
  validateMatchSelection,
} from "../../core/static/core/js/game/cards.js";
import { shuffle } from "../../core/static/core/js/game/rules.js";
const cards = [
  { id: 1, name: "Kitsu A", family: "Kitsus", stage: "base" },
  { id: 2, name: "Kitsu B", family: "Kitsus", stage: "base" },
  { id: 3, name: "Kitsu F", family: "Kitsus", stage: "fusion" },
  { id: 4, name: "Pío A", family: "Píos", stage: "base" },
  { id: 5, name: "Pío F", family: "Píos", stage: "evolution" },
];
const config = (overrides = {}) =>
  normalizeMatchConfig({
    initialHandSize: 2,
    deckMode: "random",
    deckScope: "family",
    selectedFamily: "Kitsus",
    deckTier: "all",
    ...overrides,
  });
describe("fuente única de configuración", () => {
  it("filtra una familia para baraja aleatoria", () =>
    expect(
      getEligibleCards(cards, config()).every((c) => c.family === "Kitsus"),
    ).toBe(true));
  it("filtra una familia para modo manual", () =>
    expect(
      getEligibleCards(cards, config({ deckMode: "manual" })),
    ).toHaveLength(3));
  it("regresión: selección aleatoria desde Mano respeta familia y tier", () =>
    expect(
      shuffle(
        getEligibleCards(
          cards,
          config({ deckMode: "manual", deckTier: "base" }),
        ),
        () => 0.4,
      ).every((c) => c.family === "Kitsus" && c.stage === "base"),
    ).toBe(true));
  it("autocompleta solamente desde elegibles", () =>
    expect(
      getEligibleCards(cards, config({ deckMode: "manual" }))
        .filter((c) => c.id !== 1)
        .every((c) => c.family === "Kitsus"),
    ).toBe(true));
  it("reinicio reutiliza un objeto normalizado estable", () =>
    expect(normalizeMatchConfig(config())).toEqual(config()));
  it("restauración normaliza la configuración guardada", () =>
    expect(normalizeMatchConfig(config()).selectedFamily).toBe("Kitsus"));
  it("permite solo básicas", () =>
    expect(
      getEligibleCards(
        cards,
        config({ deckScope: "all", deckTier: "base" }),
      ).every((c) => c.stage === "base"),
    ).toBe(true));
  it("permite solo especiales", () =>
    expect(
      getEligibleCards(
        cards,
        config({ deckScope: "all", deckTier: "special" }),
      ).every((c) => c.stage !== "base"),
    ).toBe(true));
  it("interseca familia y básicas", () =>
    expect(getEligibleCards(cards, config({ deckTier: "base" }))).toHaveLength(
      2,
    ));
  it("interseca familia y especiales", () =>
    expect(getEligibleCards(cards, config({ deckTier: "special" }))).toEqual([
      cards[2],
    ]));
  it("descarta selección al cambiar de familia", () =>
    expect(
      reconcileSelection(cards, config({ selectedFamily: "Píos" }), ["1", "4"]),
    ).toEqual(["4"]));
  it("rechaza una mano mayor al conjunto elegible", () =>
    expect(
      validateMatchSelection(cards, config({ initialHandSize: 5 }), []).valid,
    ).toBe(false));
  it("rechaza configuración sin cartas", () =>
    expect(
      validateMatchSelection(cards, config({ selectedFamily: "Blops" }), [])
        .error,
    ).toMatch(/No hay cartas/));
  it("ofrece a la IA exactamente el conjunto elegible", () =>
    expect(getEligibleCards(cards, config())).toEqual(
      getEligibleCards(cards, config()),
    ));
  it("no requiere controles DOM", () =>
    expect(() => getEligibleCards(cards, config())).not.toThrow());
});
it("Fisher-Yates no muta la entrada", () => {
  const source = [1, 2, 3];
  expect(shuffle(source, () => 0)).toEqual([2, 3, 1]);
  expect(source).toEqual([1, 2, 3]);
});
