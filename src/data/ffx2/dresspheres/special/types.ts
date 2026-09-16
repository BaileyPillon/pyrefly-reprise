/**
 * Special dressphere (SDSP) definition shape [ffx2-combat-core §3.15,
 * CONTRACT-CHANGES.md §4]. The FFX-2 engine owns the swap itself (the three
 * parts become separate combatants; `activeIds` is swapped) — this file only
 * supplies the numbers: each part's growth curve and the main part's
 * node-count stat scaling.
 */

import type { CharacterId, SpecialDresspherePartId, SpecialDressphereId } from '../../ids.ts';
import type { StatGrowthCoefficients, ExactLevelRow } from '../growth.ts';
import type { DressphereAbilityEntry } from '../types.ts';

export interface SpecialPartGrowth {
  growth: StatGrowthCoefficients;
  /** At the reference 6-node grid; see `nodeScale`. */
  exactLevels?: ExactLevelRow;
}

export interface SpecialDressphereDef {
  id: SpecialDressphereId;
  name: string;
  owner: CharacterId;
  partIds: { main: SpecialDresspherePartId; podA: SpecialDresspherePartId; podB: SpecialDresspherePartId };
  parts: { main: SpecialPartGrowth; podA: SpecialPartGrowth; podB: SpecialPartGrowth };
  abilities: { main: DressphereAbilityEntry[]; podA: DressphereAbilityEntry[]; podB: DressphereAbilityEntry[] };
  citation: string;
}

/**
 * Node-count scaling for the main part's HP/MP/Str/Mag/Def/MDef
 * [ffx2-combat-core §3.15 "Node-count scaling — model", explicitly `[estimate]`
 * since no source publishes a formula]. Agi/Acc/Eva/Luck are unaffected. The
 * published growth curves (and this project's `exactLevels` tables) are
 * anchored at the maximum 6-node grid, so `nodeScale(6) === 1.0`.
 */
export function nodeScale(nodes: number): number {
  const clamped = Math.min(6, Math.max(2, nodes));
  return 0.7 + 0.05 * clamped;
}
