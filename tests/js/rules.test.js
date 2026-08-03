import { describe, expect, it } from "vitest";

import {
  canUnitMoveThisTurn,
  claimTurnMovement,
  resetTurnMovement,
} from "../../core/static/core/js/game/rules.js";

describe("single monster movement per turn", () => {
  it("allows any unit before movement is claimed", () => {
    const turn = { active_side: "host", moved_unit_id: null };

    expect(canUnitMoveThisTurn(turn, "unit-1")).toBe(true);
    expect(canUnitMoveThisTurn(turn, "unit-2")).toBe(true);
  });

  it("locks movement to the first unit that moves", () => {
    const turn = { active_side: "host", moved_unit_id: null };

    expect(claimTurnMovement(turn, "unit-1")).toBe(true);
    expect(turn.moved_unit_id).toBe("unit-1");
    expect(canUnitMoveThisTurn(turn, "unit-1")).toBe(true);
    expect(canUnitMoveThisTurn(turn, "unit-2")).toBe(false);
    expect(claimTurnMovement(turn, "unit-2")).toBe(false);
  });

  it("allows the same unit to spend PM more than once", () => {
    const turn = { moved_unit_id: "unit-1" };

    expect(claimTurnMovement(turn, "unit-1")).toBe(true);
    expect(canUnitMoveThisTurn(turn, "unit-1")).toBe(true);
  });

  it("releases the movement lock when the side turn ends", () => {
    const turn = { moved_unit_id: "unit-1" };

    resetTurnMovement(turn);

    expect(turn.moved_unit_id).toBeNull();
    expect(canUnitMoveThisTurn(turn, "unit-2")).toBe(true);
  });
});
