/**
 * Chapter XIV party build — **Yuna alone** at the end of the Via Purifico
 * maze, before Isaaru's contest of aeons.
 *
 * **Game case: FFX only** [AGENTS.md rule 14] — Yuna, her five aeons and the
 * FFX bag.
 *
 * ## Where the numbers come from
 *
 * No source gives Yuna's stats, her aeons' or the battle count here
 * (`research/ffx-isaaru-bevelle.md` §6.2, O-1, O-2). The build point is the
 * Save Sphere before the red hallway [§6.2, single source: GameFAQs]: **full
 * HP and MP**, with whatever gauges the maze left. **Bailey, 2026-09-25 ("I'll
 * go with all your recommendations"), on `docs/plans/chapter-isaaru-review.md`
 * §5:**
 *
 * - **Forced line-up: Yuna alone** (`forced_party "y"`, §1.2 [verified: 3
 *   sources]); no bench, so no Switch. Lulu, Kimahri and Auron are in the
 *   scene, not the battle.
 * - **B2 = a, the aeons are Chapter X's shipped set** (`./highbridge.ts`:
 *   Valefor, Ifrit, Ixion and Shiva from Chapter VII's `./macalania.ts`,
 *   Bahamut from Chapter I's `./gagazet.ts`): the same aeons the next chapter
 *   fields. Their rows are `[derived]` there; every cell stays as labelled
 *   there. Five aeons, no Anima, Yojimbo or Magus Sisters [§1.3, verified: 3
 *   sources].
 * - **B3 = b, the aeon gauges:** Chapter VII's carried values (Valefor 90,
 *   Ifrit 60, Ixion 60, Shiva 0) and **Bahamut at {@link BAHAMUT_GAUGE}, an
 *   `[estimate]` partial** (named minutes ago at Bevelle Temple; the Pterya link
 *   is where the sources say he fills). The bench reports how often the
 *   sourced line ends with him full, the value Chapter X ships (B3 there).
 * - **B4 = a, Yuna is Chapter X's Yuna** (`highbridge.ts`: the Gagazet cells
 *   on Chapter VII's kit, no Reflect), every cell `[estimate]` as there.
 * - **B5 = a, her Grand Summon gauge is full** (Jegged: "fully charge" it
 *   before the hallway [single source]), which opens the sourced Grand Summon
 *   line.
 * - **B7 = a, Chapter X's bag** (Chapter VIII's, carried): attack items are
 *   greyed by the duel's "only aeons" rule (B6 = a), not removed.
 *
 * Chapters are standalone, so this preset and `highbridge.ts` **agree** rather
 * than carry (B3): same aeon rows, same Yuna, same bag.
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { highbridgeBuild } from './highbridge.ts';

/** B3 = b: Bahamut's gauge on arrival, `[estimate]` (named at Bevelle Temple, filled later by Pterya). */
export const BAHAMUT_GAUGE = 50;

/** B5 = a: Yuna's Grand Summon gauge arrives full [single source: Jegged]. */
export const YUNA_GAUGE = 100;

function yuna(): FFXMemberBuild {
  const m = highbridgeBuild.members.find((x) => x.id === 'yuna');
  if (!m) throw new Error('via-purifico: no Yuna in the Highbridge preset');
  const out = structuredClone(m);
  out.hp = out.stats.maxHp; // the Save Sphere [§6.2]
  out.mp = out.stats.maxMp;
  out.overdrive = { ...out.overdrive, gauge: YUNA_GAUGE };
  return out;
}

function aeons(): FFXPartyBuild['aeons'] {
  return highbridgeBuild.aeons.map((a) => {
    const row = structuredClone(a);
    row.hp = row.stats.maxHp; // the Save Sphere [§6.2]
    row.mp = row.stats.maxMp;
    if (row.id === 'bahamut') row.overdriveGauge = BAHAMUT_GAUGE;
    return row;
  });
}

export const viaPurificoBuild: FFXPartyBuild = {
  game: 'ffx',
  members: [yuna()],
  activeSlots: ['yuna'], // forced_party "y" [§1.2, verified: 3 sources]
  reserve: [],
  aeons: aeons(),
  // B7 = a: Chapter X's bag and gil (Chapter VIII's, carried).
  inventory: highbridgeBuild.inventory.map((e) => ({ ...e })),
  gil: highbridgeBuild.gil,
  sphereInventory: {}, // [estimate] — as Chapter X
};

export default viaPurificoBuild;
