/**
 * Encounter tactics: the line each boss was designed to be beaten with.
 *
 * `intendedStrategy` asks here first. A tactic sees the live state and the rows
 * the engine offered — it never invents a command, only chooses among legal
 * ones — and returns `null` to fall through to the generic rules.
 *
 * Every rule cites the research that makes it the intended play rather than a
 * heuristic that happens to win. Where the obvious play is the losing one —
 * Yunalesca's Zombie inversion above all — the tactic says so, because an
 * auto-battler that "fixes" it would be encoding the failure mode the encounter
 * exists to teach.
 *
 * **One file per chapter**, so several agents can work in parallel:
 * `./seymour-flux.ts`, `./yunalesca.ts`, `./braskas-final-aeon.ts`,
 * `./ffx2-bahamut.ts`, `./ffx2-vegnagun-shuyin.ts`, `./ffx2-leblanc.ts`, with the reading helpers
 * they share in `./common.ts`. `src/engine/BattlePresenterTactics.ts` is now a
 * re-export of this module, so every existing import keeps working.
 *
 * A chapter with no line yet exports `null` rather than a tactic that returns
 * `null` every turn, and {@link TACTICS} drops those. The two are **not** the
 * same: `intendedStrategy` reads a registered tactic's `null` as "swing" and
 * skips its own revive/heal ladder, which is exactly what an encounter tactic
 * exists to do — so registering an empty one would quietly change how four
 * chapters play.
 */

import type { BattleEngine, CombatantId } from '../../battle/common/types.ts';
import type { Tactic } from './common.ts';
import { SEYMOUR_FLUX_ID, seymourFlux } from './seymour-flux.ts';
import { YUNALESCA_ID, yunalesca } from './yunalesca.ts';
import {
  BRASKAS_FINAL_AEON_CHAIN_IDS,
  BRASKAS_FINAL_AEON_ID,
  braskasFinalAeon,
} from './braskas-final-aeon.ts';
import { FFX2_BAHAMUT_ID, ffx2Bahamut } from './ffx2-bahamut.ts';
import { FFX2_VEGNAGUN_CHAIN_IDS, ffx2VegnagunShuyin } from './ffx2-vegnagun-shuyin.ts';
import { LEBLANC_BOSS_IDS, ffx2Leblanc } from './ffx2-leblanc.ts';
import { SEYMOUR_MACALANIA_ID, seymourAnimaMacalania } from './seymour-anima-macalania.ts';
import { EVRAE_ID, evrae } from './evrae.ts';

export type { Tactic } from './common.ts';
export {
  activeParty,
  aim,
  cheerUp,
  has,
  hasAeonLeft,
  holdOverdrive,
  hpFraction,
  revive,
  row,
  stacksOf,
} from './common.ts';
export { yunalesca, YUNALESCA_ID } from './yunalesca.ts';
export { seymourFlux, SEYMOUR_FLUX_ID } from './seymour-flux.ts';
export {
  braskasFinalAeon,
  BRASKAS_FINAL_AEON_ID,
  BRASKAS_FINAL_AEON_CHAIN_IDS,
} from './braskas-final-aeon.ts';
export { ffx2Bahamut, FFX2_BAHAMUT_ID } from './ffx2-bahamut.ts';
export { ffx2VegnagunShuyin, FFX2_SHUYIN_ID, FFX2_VEGNAGUN_CHAIN_IDS } from './ffx2-vegnagun-shuyin.ts';
export { ffx2Leblanc, LEBLANC_BOSS_IDS } from './ffx2-leblanc.ts';
export { seymourAnimaMacalania, SEYMOUR_MACALANIA_ID } from './seymour-anima-macalania.ts';
export { evrae, EVRAE_ID } from './evrae.ts';

/**
 * Every chapter's slot, in encounter order. `null` = no line written yet.
 *
 * Chapter 7 (`seymour-anima-macalania`) is registered under all four of its
 * combatant ids, the same four its guide lists as `bossIds`
 * [docs/handoff/chapter-macalania-guide.md §5].
 */
const REGISTRY: ReadonlyArray<{ bossId: CombatantId; tactic: Tactic | null }> = [
  { bossId: SEYMOUR_FLUX_ID, tactic: seymourFlux },
  { bossId: YUNALESCA_ID, tactic: yunalesca },
  { bossId: BRASKAS_FINAL_AEON_ID, tactic: braskasFinalAeon },
  // Chapter 3 is a seven-battle chain and fields a **different** boss in every
  // link, so one registration would have left the possessed-aeon gauntlet and
  // Yu Yevon to the generic ladder — which loses Yu Yevon outright by swinging
  // into his 9,999 Curaga counter [ffx-bfa-yu-yevon §3.4.1]. Same tactic, one
  // entry per boss the chain can field.
  ...BRASKAS_FINAL_AEON_CHAIN_IDS.map((bossId) => ({ bossId, tactic: braskasFinalAeon })),
  { bossId: FFX2_BAHAMUT_ID, tactic: ffx2Bahamut },
  // Chapter 5 is five chained battles with a different boss id in each
  // [ffx2-vegnagun-shuyin §2], and `tacticFor` keys on the boss that is on
  // the field — so the one tactic is registered under all five ids, or four
  // of its five links would quietly fall back to the generic strategy.
  ...FFX2_VEGNAGUN_CHAIN_IDS.map((bossId) => ({ bossId, tactic: ffx2VegnagunShuyin })),
  // Chapter 6 is a three-act chain that fields eight distinct enemy ids
  // across its own bestiary records (`leblanc-syndicate.ts`,
  // `leblanc-syndicate-acts.ts`) — same reasoning as Chapter 5 above.
  ...LEBLANC_BOSS_IDS.map((bossId) => ({ bossId, tactic: ffx2Leblanc })),
  // Chapter 7 is one battle in three acts. Seymour is in the record the
  // whole fight (untargetable in act two), so his id alone would find it; the
  // other three are listed so the tactic and guide claim the same ids.
  ...[SEYMOUR_MACALANIA_ID, 'anima-macalania', 'guado-guardian-a', 'guado-guardian-b'].map(
    (bossId) => ({ bossId, tactic: seymourAnimaMacalania }),
  ),
  // Chapter 8 is one battle against one fighter. Cid is on the enemy side as
  // a non-combatant turn-taker and is never a target, so Evrae's id alone
  // finds it — the same single id the guide lists as `bossIds`
  // [docs/handoff/chapter-evrae-engine.md].
  { bossId: EVRAE_ID, tactic: evrae },
];

/** Keyed by a boss combatant id that only that encounter fields. */
export const TACTICS: ReadonlyArray<{ bossId: CombatantId; tactic: Tactic }> = REGISTRY.filter(
  (entry): entry is { bossId: CombatantId; tactic: Tactic } => entry.tactic !== null,
);

/** The tactic for whatever encounter is on the field, if it has one. */
export function tacticFor(engine: BattleEngine): Tactic | null {
  const combatants = engine.state().combatants;
  return TACTICS.find((t) => combatants[t.bossId] !== undefined)?.tactic ?? null;
}
