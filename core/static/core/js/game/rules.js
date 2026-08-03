export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function absorbDamage({ hp, shell }, damage) {
  const amount = Math.max(0, Number(damage) || 0);
  const shellDamage = Math.min(Math.max(0, shell), amount);
  const hpDamage = Math.min(Math.max(0, hp), amount - shellDamage);
  return { hp: Math.max(0, hp - hpDamage), shell: Math.max(0, shell - shellDamage), hpDamage, shellDamage };
}

