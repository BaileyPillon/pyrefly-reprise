/**
 * The party for the hidden **Dark Aeons** chapter (FFX only; `../../chapter-dark-aeons.ts`): the endgame party that meets the six other Dark Aeons, **derived from the Mirror Aeons preset** (`./mirror-aeons.ts`, whose every
 * number is an `[estimate]` and says so) with a different line-up and Yuna's Anima added to her summon list. **Every number in this file is an `[estimate]` or the Mirror preset's** (AGENTS.md rule 6): no source gives a typical
 * endgame party, and the guides' only statements are "fully levelled, best gear, stats near the cap". **No boss number is touched**: this file and the order of the links are the chapter's difficulty levers
 * (`docs/plans/ch-dark-aeons-review.md` section 7), and the bench turns the party's levers before anything else.
 *
 * | Choice | Value | Source |
 * |---|---|---|
 * | Line-up (pick DA4) | **Tidus, Yuna and Auron** on the field; Lulu, Wakka, Kimahri and Rikku on the bench | `RE six 1.2, 6.1`: Dark Anima is immune to every magical command and absorbs four elements, and Dark Valefor halves all five, so the Mirror preset's third seat (Lulu, chosen for Dark Mindy's Evasion) is dead weight on two of the seven links. Yuna stays (an aeon sent in as fodder is the game's own answer to every Overdrive); Tidus brings Quick Hit and Haste; Auron the heaviest physical blows. Wakka (Attack Reels is twelve hits in one hit event) and Lulu are the bench's first swaps |
 * | Stats, gear, bag, gil | the Mirror preset's, unchanged | `./mirror-aeons.ts` (HP 9,999, MP 999, every other stat 255, Luck 60, Auto-Haste, Auto-Phoenix, Auto-Protect and Ribbon, Break Damage Limit on every weapon, First Strike on Tidus and Yuna, 17 Phoenix Downs, 1,500,000 gil) |
 * | **Evasion** (pick DA5) | `DARK_AEONS_PARTY_EVASION` = 255, the preset's cap, **a new named lever** | Dark Ixion's two Attack rows never hit a person whose Evasion plus Luck reaches 290 (RE six 6.2; GameFAQs gives the same 290), and 255 + 60 is 315, so the preset never takes his blade; the bench measures it and reports it |
 * | The aeons | the Mirror preset's nine **and Anima** (stats from `aeonStatsFromYuna` at 600 battles: 27,862 HP), gauge `ANIMA_START_GAUGE` | `research/ffx-combat-core.md` section 6.4; the game bars nothing and Yuna owns Anima by the Gagazet road (the Mirror preset left her out, as Dream's End does: here she is a story aeon the player has) `[estimate]` |
 * | Yojimbo, the Sisters | as the Mirror preset (compatibility 128, hire answer 2, motivation 50, gauges 0 and 100) | `./mirror-aeons.ts` |
 */

import type { AeonBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { AEONS } from '../aeons/index.ts';
import { aeonStatsFromYuna } from './endgame-aeons.ts';
import { ENDGAME_BATTLES, ENDGAME_YUNA, mirrorAeonsBuild } from './mirror-aeons.ts';

/** The party's Evasion, the preset's cap: a lever of the bench (Dark Ixion's blade needs Evasion + Luck under 290 to land). `[estimate]` */
export const DARK_AEONS_PARTY_EVASION = 255;
/** Yuna's Anima starts with the Overdrive gauge the Ifrit and Shiva rows of Dream's End have (55). `[estimate]` */
export const ANIMA_START_GAUGE = 55;

/** Anima's row from the formula on this Yuna, HP and MP full (the same function the Mirror preset's other nine rows use). */
function animaRow(): AeonBuild {
  const def = AEONS['anima'];
  if (def === undefined) throw new Error("dark-aeons build: no aeon 'anima' in the catalogue");
  const s = aeonStatsFromYuna('anima', ENDGAME_YUNA, ENDGAME_BATTLES);
  const attacks = Array.isArray(def.attackAbilityId) ? def.attackAbilityId : [];
  return {
    id: 'anima',
    name: def.name,
    spriteKey: def.spriteKey,
    stats: { ...s, maxHp: s.hp, maxMp: s.mp },
    hp: s.hp,
    mp: s.mp,
    overdriveGauge: ANIMA_START_GAUGE,
    abilityIds: [...attacks, ...(def.specialAbilityId !== null ? [def.specialAbilityId] : []), 'shield', 'boost'],
    overdriveIds: [...def.overdriveAbilityIds],
  };
}

export const darkAeonsBuild: FFXPartyBuild = {
  ...mirrorAeonsBuild,
  members: mirrorAeonsBuild.members.map((m) => ({ ...m, stats: { ...m.stats, eva: DARK_AEONS_PARTY_EVASION } })),
  activeSlots: ['tidus', 'yuna', 'auron'],
  reserve: ['lulu', 'wakka', 'kimahri', 'rikku'],
  aeons: [...mirrorAeonsBuild.aeons.filter((a) => a.id !== 'anima'), animaRow()],
};

export default darkAeonsBuild;
