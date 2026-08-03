import { appState } from "./state.js";

const ACTION_BUTTONS = {
  endTurn: "#end-turn-btn",
  pause: "#pause-match-btn",
  restart: "#restart-match-btn",
  abandon: "#abandon-match-btn",
};

export function getBoardActionAvailability(state = appState) {
  const match = state.match;
  const hasMatch = Boolean(match);
  const finished = Boolean(match?.winner);
  const isHostTurn = match?.turn?.active_side === "host";

  return {
    endTurn:
      hasMatch &&
      !finished &&
      !state.aiPlayback &&
      !match.paused &&
      isHostTurn,
    pause: hasMatch && !finished,
    restart: hasMatch,
    abandon: hasMatch,
  };
}

export function syncBoardActionAvailability(root = document) {
  const availability = getBoardActionAvailability(appState);

  Object.entries(ACTION_BUTTONS).forEach(([action, selector]) => {
    const button = root.querySelector(selector);
    if (!button || button.getAttribute("aria-busy") === "true") return;

    const shouldDisable = !availability[action];
    if (button.disabled !== shouldDisable) button.disabled = shouldDisable;
    button.setAttribute("aria-disabled", String(shouldDisable));
  });
}

function bootBoardActions() {
  syncBoardActionAvailability();

  const observer = new MutationObserver(() => {
    queueMicrotask(() => syncBoardActionAvailability());
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled", "aria-busy"],
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncBoardActionAvailability();
  });
}

if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootBoardActions, {
      once: true,
    });
  } else {
    bootBoardActions();
  }
}
