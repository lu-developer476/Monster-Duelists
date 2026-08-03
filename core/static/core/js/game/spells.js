const slug = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Compatibility boundary for historical cards. Combat consumes these explicit fields.
export function normalizeSpell(spell = {}, cardSlug = "card", index = 0) {
  const text = `${spell.name || ""} ${spell.effect || ""} ${spell.description || ""}`;
  const inferredType = /fusi[oó]n/i.test(spell.name || "")
    ? "fusion"
    : /evoluci[oó]n/i.test(spell.name || "")
      ? "evolution"
      : /invoc/i.test(text)
        ? "summon"
        : "damage";
  const type = spell.type || inferredType;
  return {
    ...spell,
    id: spell.id || `${cardSlug}-${slug(spell.name) || `spell-${index + 1}`}`,
    type,
    target: spell.target || (Number(spell.range) === 0 ? "self" : "enemy"),
    damage: spell.damage || {
      min: Number(spell.damage_min) || 0,
      max: Number(spell.damage_max) || 0,
    },
    non_damage: spell.non_damage ?? type === "fusion",
  };
}

export function normalizeSpells(card = {}) {
  const cardSlug = card.slug || slug(card.name) || "card";
  return (Array.isArray(card.spells) ? card.spells : []).map((spell, index) =>
    normalizeSpell(spell, cardSlug, index),
  );
}
