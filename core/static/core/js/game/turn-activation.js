import { appState } from "./state.js";
import {
  activeTurnUnit,
  activeTurnUnitId,
  enforceActiveTurnUnit,
  lockActiveTurnUnit,
  unitsForSide,
} from "./turns.js";

const BOARD_WIDTH = 13;
const wrappedTurns = new WeakSet();
const guardedUnits = new WeakSet();
const activeSnapshots = new WeakMap();
let selectedUnitValue = appState.selectedUnitId;
let matchValue = appState.match;
let syncScheduled = false;

const sameId = (left, right) => String(left) === String(right);

function unitLabel(unit) {
  if (!unit) return "el monstruo activo";
  const battleLabel =
    unit.battle_label || `${unit.owner === "guest" ? "IA" : "J"}?`;
  return `${battleLabel} · ${unit.card?.name || "Monstruo"}`;
}

function rememberActiveSnapshot(match, unit) {
  if (!match?.turn || !unit) return;
  activeSnapshots.set(match.turn, {
    id: unit.id,
    x: unit.x,
    y: unit.y,
  });
}

function setFeedback(message, tone = "normal") {
  appState.actionFeedback = { message, tone };
  const feedback = document.querySelector("#action-feedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.remove(
    "feedback-normal",
    "feedback-error",
    "feedback-success",
  );
  feedback.classList.add(`feedback-${tone}`);
}

function guardUnitCanAct(unit, side) {
  if (!unit || guardedUnits.has(unit)) return;
  let value = Boolean(unit.can_act);
  Object.defineProperty(unit, "can_act", {
    configurable: true,
    enumerable: true,
    get() {
      return value;
    },
    set(nextValue) {
      const requested = Boolean(nextValue);
      const match = appState.match;
      const activeId = activeTurnUnitId(match);
      if (
        requested &&
        match?.turn?.active_side === side &&
        activeId != null &&
        !sameId(unit.id, activeId)
      ) {
        value = false;
        return;
      }
      value = requested;
    },
  });
  guardedUnits.add(unit);
}

function guardAllUnits(match) {
  for (const side of ["host", "guest"]) {
    for (const unit of unitsForSide(match, side)) guardUnitCanAct(unit, side);
  }
}

function scheduleSync() {
  if (syncScheduled) return;
  syncScheduled = true;
  queueMicrotask(() => {
    syncScheduled = false;
    syncTurnActivation();
  });
}

function wrapTurn(match) {
  const turn = match?.turn;
  if (!turn || wrappedTurns.has(turn)) return;

  let activeSide = turn.active_side;
  let activeUnitIdValue = turn.active_unit_id ?? null;

  Object.defineProperties(turn, {
    active_side: {
      configurable: true,
      enumerable: true,
      get() {
        return activeSide;
      },
      set(nextSide) {
        const changed = activeSide !== nextSide;
        activeSide = nextSide;
        if (!changed) return;

        activeUnitIdValue = null;
        activeSnapshots.delete(turn);
        selectedUnitValue = null;
        guardAllUnits(matchValue);

        if (nextSide === "guest") {
          const firstGuest = unitsForSide(matchValue, "guest")[0];
          if (firstGuest) {
            lockActiveTurnUnit(matchValue, "guest", firstGuest.id);
            rememberActiveSnapshot(matchValue, firstGuest);
          }
        }
        scheduleSync();
      },
    },
    active_unit_id: {
      configurable: true,
      enumerable: true,
      get() {
        return activeUnitIdValue;
      },
      set(nextUnitId) {
        activeUnitIdValue = nextUnitId ?? null;
        scheduleSync();
      },
    },
  });

  wrappedTurns.add(turn);
}

Object.defineProperty(appState, "match", {
  configurable: true,
  enumerable: true,
  get() {
    return matchValue;
  },
  set(nextMatch) {
    matchValue = nextMatch;
    wrapTurn(matchValue);
    guardAllUnits(matchValue);
    scheduleSync();
  },
});

Object.defineProperty(appState, "selectedUnitId", {
  configurable: true,
  enumerable: true,
  get() {
    return selectedUnitValue;
  },
  set(nextUnitId) {
    if (nextUnitId == null) {
      selectedUnitValue = null;
      scheduleSync();
      return;
    }

    const match = appState.match;
    if (!match || match.turn?.active_side !== "host") {
      selectedUnitValue = nextUnitId;
      scheduleSync();
      return;
    }

    const previous = activeTurnUnit(match, "host");
    const result = lockActiveTurnUnit(match, "host", nextUnitId);
    if (!result.ok) {
      selectedUnitValue = result.active?.id ?? selectedUnitValue;
      if (result.reason === "already-locked") {
        setFeedback(
          `Este turno ya pertenece a ${unitLabel(result.active)}. Terminá el turno para elegir otro monstruo.`,
          "error",
        );
      }
      scheduleSync();
      return;
    }

    selectedUnitValue = result.unit.id;
    rememberActiveSnapshot(match, result.unit);
    if (!previous) {
      setFeedback(
        `${unitLabel(result.unit)} quedó como unidad activa. Sólo este monstruo puede gastar PA y PM durante el turno.`,
        "success",
      );
    }
    scheduleSync();
  },
});

function ensureStylesheet() {
  if (document.querySelector("link[data-turn-activation-style]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/static/core/css/turn-activation.css";
  link.dataset.turnActivationStyle = "true";
  document.head.appendChild(link);
}

function transferLockAfterTransformation(match, side) {
  const snapshot = activeSnapshots.get(match?.turn);
  if (!snapshot || activeTurnUnit(match, side)) return false;

  const replacement = unitsForSide(match, side).find(
    (unit) =>
      unit.can_act !== false && unit.x === snapshot.x && unit.y === snapshot.y,
  );
  if (!replacement) return false;

  const result = lockActiveTurnUnit(match, side, replacement.id);
  if (result.ok) rememberActiveSnapshot(match, replacement);
  return result.ok;
}

function enforceCurrentSide(match) {
  const side = match?.turn?.active_side;
  if (!side) return;

  const current = activeTurnUnit(match, side);
  if (current) {
    lockActiveTurnUnit(match, side, current.id);
    rememberActiveSnapshot(match, current);
    return;
  }

  const activeId = activeTurnUnitId(match);
  if (activeId != null) {
    transferLockAfterTransformation(match, side);
    return;
  }

  if (side === "guest") {
    const result = enforceActiveTurnUnit(match, "guest", { autoSelect: true });
    if (result.active) rememberActiveSnapshot(match, result.active);
  }
}

function boardUnitsByPosition(match) {
  const units = [
    ...unitsForSide(match, "host"),
    ...unitsForSide(match, "guest"),
  ];
  return new Map(units.map((unit) => [`${unit.x},${unit.y}`, unit]));
}

function syncBoardVisuals(match) {
  const board = document.querySelector("#tactical-board");
  if (!board) return;

  const activeId = activeTurnUnitId(match);
  const activeSide = match?.turn?.active_side;
  const units = boardUnitsByPosition(match);
  Array.from(board.children).forEach((cell, index) => {
    cell.classList.remove("turn-active-unit", "turn-inactive-unit");
    cell.removeAttribute("data-turn-unit-id");
    cell.removeAttribute("data-turn-unit-owner");

    const x = index % BOARD_WIDTH;
    const y = Math.floor(index / BOARD_WIDTH);
    const unit = units.get(`${x},${y}`);
    if (!unit) return;

    cell.dataset.turnUnitId = String(unit.id);
    cell.dataset.turnUnitOwner = unit.owner;
    if (unit.owner !== activeSide || activeId == null) return;

    if (sameId(unit.id, activeId)) {
      cell.classList.add("turn-active-unit");
      cell.title = `${unitLabel(unit)} es la única unidad que puede gastar PA y PM este turno.`;
    } else {
      cell.classList.add("turn-inactive-unit");
      cell.title = `${unitLabel(unit)} no puede actuar durante este turno.`;
    }
  });
}

function syncSummary(match) {
  const summary = document.querySelector("#match-summary");
  if (!summary || !match) return;

  const side = match.turn?.active_side;
  const active = activeTurnUnit(match, side);
  const value = active
    ? unitLabel(active)
    : side === "host"
      ? "elegí un monstruo"
      : "la IA elegirá un monstruo";

  let item = document.querySelector("#turn-active-unit-summary");
  if (!item) {
    item = document.createElement("div");
    item.id = "turn-active-unit-summary";
    item.className = "summary-field turn-active-unit-summary";
    summary.appendChild(item);
  }

  if (item.dataset.summaryValue === value) return;
  const label = document.createElement("strong");
  label.textContent = "Unidad del turno:";
  item.replaceChildren(label, document.createTextNode(` ${value}`));
  item.dataset.summaryValue = value;
}

function closeInactiveUnitDialog(match) {
  const dialog = document.querySelector("#unit-control-dialog");
  if (!dialog?.open || match?.turn?.active_side !== "host") return;

  const active = activeTurnUnit(match, "host");
  if (!active) return;
  const title =
    document.querySelector("#unit-control-title")?.textContent || "";
  if (title === unitLabel(active)) return;

  dialog.close();
  setFeedback(
    `No podés cambiar de monstruo: este turno sigue perteneciendo a ${unitLabel(active)}.`,
    "error",
  );
}

function syncTurnActivation() {
  ensureStylesheet();
  const match = appState.match;
  if (!match) return;
  wrapTurn(match);
  guardAllUnits(match);
  enforceCurrentSide(match);
  syncBoardVisuals(match);
  syncSummary(match);
  closeInactiveUnitDialog(match);
}

function bootTurnActivation() {
  ensureStylesheet();
  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ["open"],
  });
  scheduleSync();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootTurnActivation, {
    once: true,
  });
} else {
  bootTurnActivation();
}
