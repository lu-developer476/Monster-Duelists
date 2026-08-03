import { SCHEMA_VERSION, STORAGE_KEY } from './constants.js';
import { normalizeMatchConfig } from './cards.js';

export function createSavePayload({ roomCode, match, matchConfig }, now = new Date()) {
  return { schemaVersion: SCHEMA_VERSION, savedAt: now.toISOString(), matchConfig: normalizeMatchConfig(matchConfig), roomCode, match };
}

export function validateSavePayload(payload) {
  if (!payload || typeof payload !== 'object') return 'La partida guardada no es un objeto válido.';
  if (!Number.isInteger(payload.schemaVersion)) return 'La partida guardada no indica su versión.';
  if (payload.schemaVersion > SCHEMA_VERSION) return 'La partida fue creada por una versión más nueva del juego.';
  if (!payload.match || typeof payload.match !== 'object' || !payload.match.host || !payload.match.guest || !payload.match.turn) return 'La partida guardada está incompleta.';
  if (!payload.matchConfig || typeof payload.matchConfig !== 'object') return 'La partida guardada no contiene su configuración.';
  return null;
}

export function migrateSave(payload) {
  if (payload?.schemaVersion === SCHEMA_VERSION) return payload;
  if (payload?.match && payload.schemaVersion == null) {
    return { ...payload, schemaVersion: SCHEMA_VERSION, savedAt: new Date().toISOString(), matchConfig: normalizeMatchConfig(payload.matchConfig || { initialHandSize: payload.match.initial_hand_size || 2 }) };
  }
  return payload;
}

export function saveMatch(storage, state) {
  if (!state.match) return storage.removeItem(STORAGE_KEY);
  storage.setItem(STORAGE_KEY, JSON.stringify(createSavePayload(state)));
}

export function restoreMatch(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return { ok: false, reason: 'missing' };
  let payload;
  try { payload = migrateSave(JSON.parse(raw)); } catch { storage.removeItem(STORAGE_KEY); return { ok: false, reason: 'corrupt', message: 'La partida guardada estaba dañada y fue descartada.' }; }
  const error = validateSavePayload(payload);
  if (error) { storage.removeItem(STORAGE_KEY); return { ok: false, reason: 'invalid', message: error }; }
  return { ok: true, payload };
}

