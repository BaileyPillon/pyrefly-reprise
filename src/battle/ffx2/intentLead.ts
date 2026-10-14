/**
 * The lead phrase of an FFX-2 intent sentence for a `formula: 'none'` row that inflicts no status
 * and heals nothing. **FFX-2 only** (AGENTS.md rule 14): `src/battle/ffx/intent.ts` keeps its own.
 *
 * PR-0188 gave these rows an "inert" branch ("Deals no damage"), but `formula: 'none'` does not mean
 * harmless on this side: some rows carry their effect in `AbilityDef.extra` instead of the formula.
 * The iter2-b6 check (B6CHK-01, B6CHK-02) found two sentences made false by that branch:
 *
 * - Delta Attack (`extra.setHpTo: 1, setMpTo: 0`, `aeon-effects.ts`) read "Deals no damage." while
 *   it leaves the whole party at 1 HP and 0 MP. It now says exactly that, from the two keys.
 * - A Dispel (`removesStatuses` of Auto-Life and the buffs) read "Cures ...", the opposite of losing
 *   a buff. A removal now reads "Removes ... from <target>", true of a Remedy and a Dispel alike.
 *
 * A row whose `extra` names another damage route (`formulaOverride`, the MP-fraction keys,
 * `mpOnly`, `percent`, `hitsBothPools`) is not inert: {@link inertLead} returns `null` and the caller
 * keeps the damage sentence it wrote before PR-0188 (Mirror of Equity is the one such row today).
 */

import type { AbilityDef } from '../common/types.ts';

/** `extra` keys that make a `formula: 'none'` row deal HP or MP damage by another route. */
const DAMAGE_KEYS = [
  'setHpTo',
  'setMpTo',
  'formulaOverride',
  'mpFractionOfCurrent',
  'mpFractionOfMax',
  'mpOnly',
  'percent',
  'hitsBothPools',
] as const;

/** True when the row's harm lives in `extra` rather than in its formula. */
export function hasExtraDamage(def: AbilityDef): boolean {
  const extra = def.extra as Record<string, unknown> | undefined;
  if (!extra) return false;
  return DAMAGE_KEYS.some((k) => extra[k] !== undefined && extra[k] !== false);
}

/**
 * "Leaves the whole party at 1 HP and 1 MP" for a "set to" row with no status rider, read from
 * `extra.setHpTo` / `extra.setMpTo`; `null` for any other row.
 *
 * When the ability carries the game's own command row (`ffx2Record`), the row's damage class decides which pools the
 * sentence may name (1 HP, 2 MP), because the engine follows the row and not the ability's `extra`: Delta Attack
 * (row 0x40a9, class 1) sets HP only and its `setMpTo: 0` is the wiki's alone, so the sentence says "at 1 HP"
 * (`fallen-aeons-engine.test.ts` pins that her MP is kept). Zanmato (row 0x40a4, class 3) names both.
 */
export function setToLead(def: AbilityDef, where: string): string | null {
  if (def.statusEffects.length > 0) return null;
  const hp = def.extra?.['setHpTo'];
  const mp = def.extra?.['setMpTo'];
  const classes = def.ffx2Record?.damageClass;
  const pools: string[] = [];
  if (typeof hp === 'number' && (classes === undefined || (classes & 1) !== 0)) pools.push(`${Math.max(1, hp)} HP`);
  if (typeof mp === 'number' && (classes === undefined || (classes & 2) !== 0)) pools.push(`${Math.max(0, mp)} MP`);
  return pools.length > 0 ? `Leaves ${where} at ${pools.join(' and ')}` : null;
}

/**
 * "Empties one girl's MP" for a row that sets MP to 0 and nothing else (Looming Glacier: "MP to 0 and Stop", row 0x4102,
 * class 2), so a status rider can read "Empties one girl's MP and inflicts Stop". `null` for any other row, and for a row
 * whose game row has no MP class.
 */
export function emptiesMpLead(def: AbilityDef, where: string): string | null {
  if (def.extra?.['setMpTo'] !== 0 || typeof def.extra?.['setHpTo'] === 'number') return null;
  const classes = def.ffx2Record?.damageClass;
  if (classes !== undefined && (classes & 2) === 0) return null;
  return `Empties ${where}'s MP`;
}

/** True when the row's damage lands on MP: `extra.mpOnly`, or the pool the row names (`extra.damagesPool: 'mp'`). */
export function damagesMp(def: AbilityDef): boolean {
  return def.extra?.['mpOnly'] === true || def.extra?.['damagesPool'] === 'mp';
}

/**
 * The "Physical" / "Magical" word of a damage sentence: the ability's own `damageType`, except for a row that damages
 * MP whose game row has neither damage-type bit set. Leblanc's Osmose (row 0x406d, `flagsDamage` 0) is neither physical
 * nor magical, so its sentence names no kind. Scoped to MP rows on purpose: other rows whose `damageType` and game row
 * disagree keep the words they have.
 */
export function kindWord(def: AbilityDef): string {
  if (damagesMp(def) && def.ffx2Record !== undefined && (def.ffx2Record.flagsDamage & 3) === 0) return '';
  if (def.damageType === 'physical') return 'Physical';
  return def.damageType === 'magical' ? 'Magical' : '';
}

/**
 * The lead for a row that deals no damage: its removals if it has any, else "Deals no damage".
 * `null` when the row is not inert (it inflicts, heals, or deals damage through `extra`).
 */
export function inertLead(def: AbilityDef, where: string, statusWord: (id: string) => string): string | null {
  if (def.formula !== 'none' || def.statusEffects.length > 0) return null;
  if (def.flags.includes('heals') || hasExtraDamage(def)) return null;
  if (def.removesStatuses.length === 0) return 'Deals no damage';
  return `Removes ${def.removesStatuses.map(statusWord).join(', ')} from ${where}`;
}
