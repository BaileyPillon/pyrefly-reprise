/**
 * The Last Summoning's party (hidden FFX chapter 28): **Dream's End's Tidus, Yuna and Auron** (`./dreams-end.ts`, byte for byte: the same members, equipment, items and gil, under the fayth's permanent Auto-Life that
 * the chain's formations grant) **holding the full roster** of eight aeons: Valefor, Ifrit, Ixion, Shiva and Bahamut as Dream's End has them, and Anima, Yojimbo and the three Magus Sisters from
 * `./last-summoning-roster.ts` (inside Sin's stat block, N = 360). Game case: FFX only.
 *
 * It is a **copy**: Chapter III's build is never touched and nothing here can mutate it (`cloneData`). The two optional states the engine asks of a build that owns Yojimbo or the Sisters are given where
 * they are named (`FFXPartyBuild.yojimbo`: compatibility 128 and the neutral hire answer; `FFXPartyBuild.sisters`: every motivation 50), each a labelled estimate.
 *
 * **The chain carries the party forward as every chain does** (`BattleScreenSetup.carryPartyForward`): HP, MP, statuses, gauges, the items and the gil Pay spends, Yojimbo's compatibility; an aeon that fell keeps its
 * recovery count. What Yu Yevon takes is not a change of this build: the aeon stays in the list (its stats are what the possessed copy copies) and the link's formation locks it
 * (`EnemyGroupDef.lockedAeons`, `../enemies/last-summoning-chain.ts`).
 */

import type { FFXPartyBuild } from '../../../battle/common/types.ts';
import { cloneData } from '../../../battle/common/clone.ts';
import { dreamsEndBuild } from './dreams-end.ts';
import { SISTERS_START, YOJIMBO_START, optionalAeons } from './last-summoning-roster.ts';

/** A fresh copy of the chapter's party each call (a test may edit it; the registry's is {@link lastSummoningBuild}). */
export function buildLastSummoningParty(): FFXPartyBuild {
  const base = cloneData(dreamsEndBuild);
  return {
    ...base,
    aeons: [...base.aeons, ...optionalAeons()],
    yojimbo: { ...YOJIMBO_START },
    sisters: { motivation: { ...SISTERS_START.motivation } },
  };
}

/** The party of the chapter's record (`../../chapter-last-summoning.ts`). */
export const lastSummoningBuild: FFXPartyBuild = buildLastSummoningParty();

export default lastSummoningBuild;
