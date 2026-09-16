/**
 * Dressphere definitions — what each sphere can *do*, as opposed to what its
 * stats are (`dressphere-stats.ts`) [ffx2-combat-core §3].
 *
 * Only the three facts the engine actually branches on are modelled here:
 *
 * - **`hasAttack`** — Songstress, White Mage and Black Mage have **no Attack
 *   command at all** (§3.4–3.6). The command menu must not offer one.
 * - **`longRange`** — Gunner, Lady Luck, Alchemist, Trainer and Gun Mage fire
 *   from the starting position with no run-in, so they never break a chain by
 *   approach time (§1.7). Everyone else spends ~2 s closing, which is usually
 *   exactly long enough to drop the chain.
 * - **`attackHits`** — the Thief's Attack strikes **twice** and therefore
 *   self-chains (§3.2).
 *
 * `abilityIds` is deliberately empty: the skillsets are the FFX-2 data agent's
 * table, and the command menu prefers the girl's own `abilitiesLearned` anyway.
 * Inject a `DressphereRegistry` to supply them.
 */

import type { DressphereDef, DressphereRegistry } from './internal.ts';
import { dressphereStats } from './dressphere-stats.ts';

/** `[id, display name, hasAttack, longRange, attackHits]`. */
const TABLE: ReadonlyArray<readonly [string, string, boolean, boolean, number]> = [
  ['gunner', 'Gunner', true, true, 1],
  ['thief', 'Thief', true, false, 2],
  ['warrior', 'Warrior', true, false, 1],
  ['songstress', 'Songstress', false, false, 1],
  ['white-mage', 'White Mage', false, false, 1],
  ['black-mage', 'Black Mage', false, false, 1],
  ['gun-mage', 'Gun Mage', true, true, 1],
  ['dark-knight', 'Dark Knight', true, false, 1],
  ['samurai', 'Samurai', true, false, 1],
  ['berserker', 'Berserker', true, false, 1],
  ['alchemist', 'Alchemist', true, true, 1],
  ['lady-luck', 'Lady Luck', true, true, 1],
  ['trainer', 'Trainer', true, true, 1],
  ['mascot', 'Mascot', true, false, 1],
  ['psychic', 'Psychic', true, false, 1],
  ['festivalist', 'Festivalist', true, false, 1],
  // Special dresspheres. Every part has Ribbon plus Auto-Life, cannot be
  // Ejected, and loses every accessory while transformed. §3.15
  ['floral-fallal', 'Floral Fallal', true, true, 1],
  ['machina-maw', 'Machina Maw', true, false, 1],
  ['full-throttle', 'Full Throttle', true, false, 1],
];

const BY_ID = new Map<string, DressphereDef>(
  TABLE.map(([id, name, hasAttack, longRange, attackHits]) => [
    id,
    { id, name, abilityIds: [], hasAttack, longRange, attackHits },
  ]),
);

/** Fallback registry. A caller-supplied `DressphereRegistry` replaces it. */
export const defaultDresspheres: DressphereRegistry = {
  get: (id) => BY_ID.get(id),
  stats: dressphereStats,
};

/** True for the five long-range dresspheres. §1.7 */
export function isLongRange(dressphereId: string): boolean {
  return BY_ID.get(dressphereId)?.longRange ?? false;
}

/** Hits the basic Attack lands in this dressphere. Thief is the only 2. §3.2 */
export function attackHits(dressphereId: string): number {
  return BY_ID.get(dressphereId)?.attackHits ?? 1;
}

/** Songstress, White Mage and Black Mage have no Attack command. §3.4–3.6 */
export function hasAttackCommand(dressphereId: string): boolean {
  return BY_ID.get(dressphereId)?.hasAttack ?? true;
}
