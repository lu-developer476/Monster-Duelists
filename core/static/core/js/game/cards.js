import { INITIAL_HAND_OPTIONS, VALID_DECK_MODES, VALID_DECK_SCOPES, VALID_DECK_TIERS } from './constants.js';

export function isValidCatalogCard(card) {
  return Boolean(card && card.id != null && typeof card.name === 'string' && card.name &&
    typeof card.family === 'string' && card.family && ['base', 'fusion', 'evolution'].includes(card.stage));
}

export function isSpecialDeckCard(card) {
  return card?.stage === 'fusion' || card?.stage === 'evolution';
}

export function normalizeMatchConfig(input = {}) {
  const initialHandSize = Number(input.initialHandSize);
  const deckMode = VALID_DECK_MODES.has(input.deckMode) ? input.deckMode : 'random';
  const deckScope = VALID_DECK_SCOPES.has(input.deckScope) ? input.deckScope : 'all';
  const deckTier = VALID_DECK_TIERS.has(input.deckTier) ? input.deckTier : 'all';
  const selectedFamily = deckScope === 'family' ? String(input.selectedFamily || '').trim() : '';
  return {
    initialHandSize: INITIAL_HAND_OPTIONS.has(initialHandSize) ? initialHandSize : 2,
    deckMode, deckScope, selectedFamily, deckTier,
  };
}

export function getEligibleCards(cards, config) {
  const normalized = normalizeMatchConfig(config);
  return (Array.isArray(cards) ? cards : []).filter((card) => {
    if (!isValidCatalogCard(card)) return false;
    if (normalized.deckScope === 'family' && card.family !== normalized.selectedFamily) return false;
    if (normalized.deckTier === 'base' && card.stage !== 'base') return false;
    if (normalized.deckTier === 'special' && !isSpecialDeckCard(card)) return false;
    return true;
  });
}

export function validateMatchSelection(cards, config, selectedIds = []) {
  const normalized = normalizeMatchConfig(config);
  const eligible = getEligibleCards(cards, normalized);
  const requested = normalized.initialHandSize;
  if (!eligible.length) return { valid: false, eligible, error: 'No hay cartas compatibles con la configuración elegida.' };
  if (eligible.length < requested) return { valid: false, eligible, error: `No hay suficientes monstruos${normalized.selectedFamily ? ` ${normalized.selectedFamily}` : ''} ${normalized.deckTier === 'base' ? 'básicos ' : normalized.deckTier === 'special' ? 'especiales ' : ''}para formar una mano de ${requested} cartas.` };
  const ids = selectedIds.map(String);
  if (new Set(ids).size !== ids.length) return { valid: false, eligible, error: 'La selección contiene cartas duplicadas.' };
  const eligibleIds = new Set(eligible.map((card) => String(card.id)));
  if (ids.some((id) => !eligibleIds.has(id))) return { valid: false, eligible, error: `La selección contiene cartas que no cumplen la configuración${normalized.selectedFamily ? ` de la familia ${normalized.selectedFamily}` : ''}.` };
  if (normalized.deckMode === 'manual' && ids.length > requested) return { valid: false, eligible, error: `Seleccionaste ${ids.length} cartas; la mano admite ${requested}.` };
  return { valid: true, eligible, error: null };
}

export function reconcileSelection(cards, config, selectedIds = []) {
  const eligibleIds = new Set(getEligibleCards(cards, config).map((card) => String(card.id)));
  return [...new Set(selectedIds.map(String))].filter((id) => eligibleIds.has(id));
}

