/**
 * The fallback ability registry the FFX-2 engine falls back to.
 *
 * The table itself lives in `abilities-core.ts` (shared actions + Bahamut) and
 * `abilities-vegnagun.ts` (the Vegnagun chain + Shuyin); this file only wires
 * them into a registry. See either for the damage-constant conventions and the
 * research citations.
 *
 * **It is scaffolding.** `src/data/ffx2/abilities` is the real table; injecting
 * an `AbilityRegistry` into the engine takes precedence for every id it knows.
 */

import type { AbilityDef, AbilityId } from '../common/types.ts';
import type { AbilityRegistry } from './internal.ts';
import { CORE_ABILITIES } from './abilities-core.ts';
import { VEGNAGUN_ABILITIES } from './abilities-vegnagun.ts';
import { SHUYIN_ABILITIES } from './abilities-shuyin.ts';

const LIST: AbilityDef[] = [...CORE_ABILITIES, ...VEGNAGUN_ABILITIES, ...SHUYIN_ABILITIES];

const BY_ID = new Map<AbilityId, AbilityDef>(LIST.map((a) => [a.id, a]));

/** Fallback registry. A caller-supplied `AbilityRegistry` takes precedence. */
export const defaultAbilities: AbilityRegistry = {
  get: (id) => BY_ID.get(id),
};

/** Every id this fallback table knows, for tests and the debug API. */
export const FALLBACK_ABILITY_IDS: readonly AbilityId[] = LIST.map((a) => a.id);

/** Chain two registries: `primary` first, then `fallback`. */
export function chainRegistries(
  primary: AbilityRegistry | undefined,
  fallback: AbilityRegistry,
): AbilityRegistry {
  if (!primary) return fallback;
  return { get: (id) => primary.get(id) ?? fallback.get(id) };
}

export { def, BUFF_WIPE } from './abilities-core.ts';
