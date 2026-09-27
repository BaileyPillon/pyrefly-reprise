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
 * "Leaves the whole party at 1 HP and 0 MP" for a "set to" row with no status rider, read from
 * `extra.setHpTo` / `extra.setMpTo`; `null` for any other row.
 */
export function setToLead(def: AbilityDef, where: string): string | null {
  if (def.statusEffects.length > 0) return null;
  const hp = def.extra?.['setHpTo'];
  const mp = def.extra?.['setMpTo'];
  const pools: string[] = [];
  if (typeof hp === 'number') pools.push(`${Math.max(1, hp)} HP`);
  if (typeof mp === 'number') pools.push(`${Math.max(0, mp)} MP`);
  return pools.length > 0 ? `Leaves ${where} at ${pools.join(' and ')}` : null;
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
