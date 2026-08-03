import { describe, expect, it } from "vitest";
import {
  activeTurnUnit,
  canUnitActThisTurn,
  clearActiveTurnUnit,
  enforceActiveTurnUnit,
  lockActiveTurnUnit,
} from "../../core/static/core/js/game/turns.js";

const unit = (id, overrides = {}) => ({
  id,
  owner: "host",
  hp_current: 100,
  pa_current: 6,
  move_points: 3,
  can_act: true,
  card: { name: `Monstruo ${id}`, hp: 100 },
  ...overrides,
});

const matchWithUnits = () => ({
  turn: { number: 1, active_side: "host", active_unit_id: null },
  host: { units: [unit("a"), unit("b"), unit("c")] },
  guest: { units: [unit("g", { owner: "guest" })] },
});

describe("un monstruo activo por turno", () => {
  it("bloquea el turno al primer monstruo seleccionado", () => {
    const match = matchWithUnits();
    const result = lockActiveTurnUnit(match, "host", "b");

    expect(result.ok).toBe(true);
    expect(match.turn.active_unit_id).toBe("b");
    expect(activeTurnUnit(match, "host")?.id).toBe("b");
  });

  it("rechaza cambiar de monstruo durante el mismo turno", () => {
    const match = matchWithUnits();
    lockActiveTurnUnit(match, "host", "a");

    const result = lockActiveTurnUnit(match, "host", "b");

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("already-locked");
    expect(match.turn.active_unit_id).toBe("a");
  });

  it("solo permite actuar a la unidad activa", () => {
    const match = matchWithUnits();
    lockActiveTurnUnit(match, "host", "c");

    expect(canUnitActThisTurn(match, "host", "c")).toBe(true);
    expect(canUnitActThisTurn(match, "host", "a")).toBe(false);
    expect(match.host.units.find((candidate) => candidate.id === "a")?.can_act).toBe(
      false,
    );
  });

  it("no consume los PA ni PM de los monstruos inactivos", () => {
    const match = matchWithUnits();
    const inactive = match.host.units[1];
    lockActiveTurnUnit(match, "host", "a");

    expect(inactive.pa_current).toBe(6);
    expect(inactive.move_points).toBe(3);
  });

  it("libera la elección al comenzar otro turno", () => {
    const match = matchWithUnits();
    lockActiveTurnUnit(match, "host", "a");
    clearActiveTurnUnit(match);

    expect(match.turn.active_unit_id).toBeNull();
    expect(canUnitActThisTurn(match, "host", "b")).toBe(true);
  });

  it("selecciona una sola unidad para la IA", () => {
    const match = matchWithUnits();
    match.turn.active_side = "guest";

    const result = enforceActiveTurnUnit(match, "guest", { autoSelect: true });

    expect(result.active?.id).toBe("g");
    expect(match.turn.active_unit_id).toBe("g");
  });

  it("transfiere el bloqueo a una transformación cuando la anterior desaparece", () => {
    const match = matchWithUnits();
    lockActiveTurnUnit(match, "host", "a");
    match.host.units = [
      unit("evolved", { can_act: true }),
      unit("b", { can_act: false }),
    ];

    const result = enforceActiveTurnUnit(match, "host", {
      autoSelect: true,
      preferredUnitId: "evolved",
    });

    expect(result.active?.id).toBe("evolved");
    expect(match.turn.active_unit_id).toBe("evolved");
  });
});
