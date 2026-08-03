const sameId = (left, right) => String(left) === String(right);

export function unitsForSide(match, side) {
  const units = match?.[side]?.units;
  return Array.isArray(units) ? units : [];
}

export function activeTurnUnitId(match) {
  return match?.turn?.active_unit_id ?? null;
}

export function activeTurnUnit(match, side = match?.turn?.active_side) {
  const activeId = activeTurnUnitId(match);
  if (activeId == null || !side) return null;
  return unitsForSide(match, side).find((unit) => sameId(unit.id, activeId)) || null;
}

export function clearActiveTurnUnit(match) {
  if (match?.turn) match.turn.active_unit_id = null;
}

export function canUnitActThisTurn(match, side, unitId) {
  if (!match?.turn || match.turn.active_side !== side) return false;
  const activeId = activeTurnUnitId(match);
  return activeId == null || sameId(activeId, unitId);
}

export function lockActiveTurnUnit(match, side, unitId) {
  if (!match?.turn || match.turn.active_side !== side) {
    return { ok: false, reason: "wrong-side", active: null, unit: null };
  }

  const units = unitsForSide(match, side);
  const unit = units.find((candidate) => sameId(candidate.id, unitId)) || null;
  if (!unit) return { ok: false, reason: "missing-unit", active: null, unit: null };

  const current = activeTurnUnit(match, side);
  if (current && !sameId(current.id, unit.id)) {
    return { ok: false, reason: "already-locked", active: current, unit };
  }

  match.turn.active_unit_id = unit.id;
  for (const candidate of units) {
    if (!sameId(candidate.id, unit.id)) candidate.can_act = false;
  }

  return { ok: true, reason: null, active: unit, unit };
}

export function enforceActiveTurnUnit(
  match,
  side,
  { autoSelect = false, preferredUnitId = null } = {},
) {
  if (!match?.turn || match.turn.active_side !== side) {
    return { ok: false, reason: "wrong-side", active: null };
  }

  const current = activeTurnUnit(match, side);
  if (current) {
    lockActiveTurnUnit(match, side, current.id);
    return { ok: true, reason: null, active: current };
  }

  if (activeTurnUnitId(match) != null) clearActiveTurnUnit(match);
  if (!autoSelect) return { ok: true, reason: null, active: null };

  const units = unitsForSide(match, side).filter(
    (unit) => Number(unit.hp_current ?? unit.card?.hp ?? 1) > 0,
  );
  const preferred = units.find((unit) => sameId(unit.id, preferredUnitId));
  const candidate = preferred || units.find((unit) => unit.can_act !== false) || units[0];
  if (!candidate) return { ok: true, reason: "no-units", active: null };

  const result = lockActiveTurnUnit(match, side, candidate.id);
  return { ok: result.ok, reason: result.reason, active: result.active };
}
