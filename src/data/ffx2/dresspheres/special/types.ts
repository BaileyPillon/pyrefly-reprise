/**
 * Special dressphere (SDSP) definition shape [ffx2-combat-core §3.15, CONTRACT-CHANGES.md §4]. The FFX-2 engine owns the swap itself (the three parts become separate combatants; `activeIds` is
 * swapped, `battle/ffx2/special/`) — this file only supplies the ids and the three parts' ladders of commands. The stats are the game's own growth rows
 * (`battle/ffx2/special/stats.ts`, `research/re-ffx2-special-dresspheres.md` section 5), not data here.
 */

import type { CharacterId, SpecialDresspherePartId, SpecialDressphereId } from '../../ids.ts';
import type { DressphereAbilityEntry } from '../types.ts';

export interface SpecialDressphereDef {
  id: SpecialDressphereId;
  name: string;
  owner: CharacterId;
  partIds: { main: SpecialDresspherePartId; podA: SpecialDresspherePartId; podB: SpecialDresspherePartId };
  abilities: { main: DressphereAbilityEntry[]; podA: DressphereAbilityEntry[]; podB: DressphereAbilityEntry[] };
  citation: string;
}
