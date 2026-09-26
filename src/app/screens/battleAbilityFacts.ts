/**
 * The ability rows a chapter's presenter reads its presentation facts from
 * (`PresenterDeps.abilityFacts`): today, whether an enemy's action is a
 * physical blow, so it can draw its attack painting (`EnemyActionPose.ts`).
 *
 * Game-aware (AGENTS.md rule 14): an FFX chapter reads FFX's rows, an FFX-2
 * chapter FFX-2's, in the same order each engine resolves them. FFX: the
 * engine's core actions with the data table registered over them
 * (`BattleScreenContent.ts`, `FFXContentRegistry.addAbilities` overwrites by
 * id). FFX-2: the data table first, then the engine's fallback table
 * (`battle/ffx2/abilities.ts` `chainRegistries`).
 */

import type { AbilityDef, AbilityId, GameId } from '../../battle/common/types.ts';
import { CORE_ABILITIES as FFX_CORE } from '../../battle/ffx/index.ts';
import { defaultAbilities as ffx2Fallback } from '../../battle/ffx2/index.ts';
import { ALL_ABILITIES as FFX_ABILITIES } from '../../data/ffx/index.ts';
import { ABILITIES as FFX2_ABILITIES } from '../../data/ffx2/index.ts';
import type { AbilityFacts } from '../../engine/BattlePresenterPorts.ts';

let ffx: Map<AbilityId, AbilityDef> | null = null;

function ffxRows(): Map<AbilityId, AbilityDef> {
  if (!ffx) {
    ffx = new Map<AbilityId, AbilityDef>();
    for (const a of FFX_CORE) ffx.set(a.id, a);
    for (const a of FFX_ABILITIES) if (a.game === 'ffx') ffx.set(a.id, a);
  }
  return ffx;
}

function facts(def: AbilityDef | undefined): AbilityFacts | undefined {
  return def ? { damageType: def.damageType, formula: def.formula } : undefined;
}

/** The lookup a chapter of `game` hands its presenter. */
export function abilityFactsFor(game: GameId): (id: AbilityId) => AbilityFacts | undefined {
  if (game === 'ffx') return (id) => facts(ffxRows().get(id));
  const rows = FFX2_ABILITIES as Readonly<Record<AbilityId, AbilityDef | undefined>>;
  return (id) => facts(rows[id] ?? ffx2Fallback.get(id));
}
