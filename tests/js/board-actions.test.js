import { describe, expect, it } from "vitest";

import { getBoardActionAvailability } from "../../core/static/core/js/game/board-actions.js";

function state(overrides = {}) {
  return {
    aiPlayback: false,
    match: {
      paused: false,
      winner: null,
      turn: { active_side: "host" },
    },
    ...overrides,
  };
}

describe("board action availability", () => {
  it("enables all four controls during the player turn", () => {
    expect(getBoardActionAvailability(state())).toEqual({
      endTurn: true,
      pause: true,
      restart: true,
      abandon: true,
    });
  });

  it("keeps pause, restart and abandon available during IA playback", () => {
    expect(getBoardActionAvailability(state({ aiPlayback: true }))).toEqual({
      endTurn: false,
      pause: true,
      restart: true,
      abandon: true,
    });
  });

  it("only blocks end turn while the match is paused", () => {
    const paused = state();
    paused.match.paused = true;

    expect(getBoardActionAvailability(paused)).toEqual({
      endTurn: false,
      pause: true,
      restart: true,
      abandon: true,
    });
  });

  it("keeps recovery actions available after the match ends", () => {
    const finished = state();
    finished.match.winner = "host";

    expect(getBoardActionAvailability(finished)).toEqual({
      endTurn: false,
      pause: false,
      restart: true,
      abandon: true,
    });
  });

  it("disables every control when there is no match", () => {
    expect(
      getBoardActionAvailability({ match: null, aiPlayback: false }),
    ).toEqual({
      endTurn: false,
      pause: false,
      restart: false,
      abandon: false,
    });
  });
});
