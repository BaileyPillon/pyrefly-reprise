/**
 * Chapter IX party build — the Cavern of the Stolen Fayth (Lady Ginnem's
 * Yojimbo), on the first walk through the Calm Lands.
 *
 * **Game case: FFX only** [AGENTS.md rule 14] — FFX's seven guardians, CTB
 * bench and aeons.
 *
 * ## Where the numbers come from
 *
 * The research names **no preset for this build point**. It names the next
 * boss's preset as the **upper bound**: "Reuse the Mt. Gagazet preset in
 * `research/ffx-seymour-flux.md` §7.3 to §7.9 as the upper bound: it is the
 * next boss" (`research/ffx-yojimbo.md` §5.2). So this build **is**
 * `gagazetBuild`, copied, with only the changes a source makes — no stat is
 * lowered by hand, because no source says by how much (AGENTS.md hard rule 6).
 * Every stat therefore keeps the `[estimate]` label `gagazet.ts` gives it, and
 * the whole party is, if anything, **a little strong** for the Cavern: the
 * seeded bench (`tests/unit/chapters/yojimbo-bench.test.ts`) measures against
 * an upper bound, and says so.
 *
 * ## What changes, and why
 *
 * 1. **Kimahri loses Mighty Guard and White Wind.** Both are learned from Biran
 *    and Yenke Ronso **on Mt. Gagazet itself** (`ffx-seymour-flux.md` §6.1,
 *    §7.4 [verified: 2 sources]), which is after the Cavern.
 * 2. **Kimahri's Doom is a named switch, {@link CAVERN_DOOM_PREP}, and it
 *    ships `'not-learned'`** (Bailey, 2026-09-26, "I'll go with all of your
 *    recommendations", answering P-1 of
 *    `docs/plans/yojimbo-faithfulness-2026-09-26.md`; it re-opens D-056). Doom
 *    is learned by Lancet from a **Ghost in this same cavern** (`ffx-yojimbo.md`
 *    §5.3 strategy 1 [verified: 4 sources]), and learning it is optional, so a
 *    player who skipped the Ghost walks in without it: the sourced default.
 *    The fight is then the sourced race against Zanmato (§5.3 strategies 2-4).
 *    The three values and what each models are on {@link CavernDoomPrep}.
 * 3. **Two Mega-Potions and the mountain's gil come off.** `gagazet.ts`'s
 *    inventory "includes the two Mega-Potions found on the mountain" and its
 *    gil "includes the 20,000 found on the mountain" (`ffx-seymour-flux.md`
 *    §7.8 [estimate]; the pickups themselves are listed at the end of §7.7.2
 *    [single source: wiki Mt. Gagazet page]); the
 *    Cavern comes before the mountain, so both are subtracted.
 * 4. **No Talk.** The Talk trigger is Seymour Flux's own line
 *    (`ffx-seymour-flux.md` §4.7); it has
 *    no effect here, so the row is not offered.
 * 5. **Opening line-up Lulu, Kimahri, Yuna** — `[estimate]`, INFERRED, then
 *    Bailey's pick D-066, unchanged by the 2026-09-26 pick: the formation
 *    forces no party (`ffx-yojimbo.md` §2.5 `[decompiled]`).
 *    Magic (Magic Defense 0 against Defense 80, §2.1), Kimahri, and the summoner
 *    whose aeons can stand in front of Zanmato (§5.3). Lulu leads because the
 *    fight is hers in the story (§5.2), which the research itself calls a
 *    presentation choice.
 * 6. **No Candle of Life.** The item is sourced, but no source says the party
 *    holds one here (§10 item 4), so no Doom reaches this fight by item either.
 *
 * Aeons are unchanged: Valefor, Ifrit, Ixion, Shiva and Bahamut, with no
 * Anima, Magus Sisters or Yojimbo (§5.2 [verified: 2 sources]).
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { gagazetBuild } from './gagazet.ts';

/** Learned on Mt. Gagazet, which comes after the Cavern [ffx-seymour-flux §6.1]. */
const LEARNED_ON_GAGAZET: readonly string[] = ['mighty-guard', 'white-wind'];

/** Seymour Flux's Trigger Command [ffx-seymour-flux §4.7]; nothing to say here. */
const FLUX_ONLY: readonly string[] = ['talk'];

/** The two Mega-Potions found on the mountain [ffx-seymour-flux §7.7.2, §7.8]. */
const MEGA_POTIONS_FOUND_ON_GAGAZET = 2;
/** The 20,000 gil found on the mountain [ffx-seymour-flux §7.7.2, §7.8]. */
const GIL_FOUND_ON_GAGAZET = 20_000;

/**
 * What Kimahri walks into the Cavern with (P-1 of
 * `docs/plans/yojimbo-faithfulness-2026-09-26.md`). Measured on the intended
 * line, first try, 200 seeds, by the audit: `'preloaded'` 200/200 (five
 * Yojimbo turns), `'not-learned'` 161/200, `'learned-spent'` 159/200.
 *
 * - `'not-learned'` (**shipped**, Bailey 2026-09-26): he skipped the Ghost, so
 *   Doom is not on his Ronso Rage list. Learning a Rage is optional, which
 *   makes this the game's default state [ffx-yojimbo §5.3, verified: 4
 *   sources]. No Lancet fill happened, so his gauge is the research's own
 *   labelled estimate for a Kimahri without a fresh Rage, **45**
 *   (`ffx-seymour-flux.md` C-16, "drop Kimahri to ~45%" [estimate]); no
 *   source gives a Cavern-time value.
 * - `'preloaded'` (D-056, shipped until 2026-09-26, kept as a value): he lanced
 *   the Ghost and walked in without spending the Rage. The Lancet rule fills
 *   his gauge, so 100 [ffx-seymour-flux §7.9.2, single source, a rule]; that
 *   the player did the prep is our estimate (B8).
 * - `'learned-spent'` (kept as a value): learned, then spent on the way in.
 *   Gauge 0 is our estimate (the audit's P-1 table).
 */
export type CavernDoomPrep = 'not-learned' | 'preloaded' | 'learned-spent';

/** Bailey's pick, 2026-09-26 (P-1): Kimahri arrives without Doom. */
export const CAVERN_DOOM_PREP: CavernDoomPrep = 'not-learned';

/** Kimahri's gauge per value; see {@link CavernDoomPrep} for each source status. */
const KIMAHRI_GAUGE: Record<CavernDoomPrep, number> = {
  'not-learned': 45, // [estimate] ffx-seymour-flux C-16
  preloaded: 100, // [single source, a rule] ffx-seymour-flux §7.9.2
  'learned-spent': 0, // [estimate] the audit's P-1 table
};

function atTheCavern(member: FFXMemberBuild, prep: CavernDoomPrep): FFXMemberBuild {
  const m = structuredClone(member);
  m.learnedAbilityIds = m.learnedAbilityIds.filter(
    (id) => !LEARNED_ON_GAGAZET.includes(id) && !FLUX_ONLY.includes(id),
  );
  if (m.id === 'kimahri' && m.overdrive) {
    const rages = m.overdrive.unlockedOverdriveIds.filter((id) => !LEARNED_ON_GAGAZET.includes(id) && id !== 'doom');
    m.overdrive.unlockedOverdriveIds = prep === 'not-learned' ? rages : [...rages, 'doom'];
    m.overdrive.gauge = KIMAHRI_GAUGE[prep];
  }
  return m;
}

/** The Cavern party for one value of {@link CavernDoomPrep}. The chapter uses {@link CAVERN_DOOM_PREP}. */
export function buildCavernParty(prep: CavernDoomPrep): FFXPartyBuild {
  return {
    ...structuredClone(gagazetBuild),
    members: gagazetBuild.members.map((m) => atTheCavern(m, prep)),
    // [estimate], INFERRED, then Bailey's D-066 — see the file header, item 5.
    activeSlots: ['lulu', 'kimahri', 'yuna'],
    reserve: ['tidus', 'auron', 'wakka', 'rikku'],
    inventory: gagazetBuild.inventory
      .map((e) => (e.itemId === 'mega-potion' ? { ...e, count: e.count - MEGA_POTIONS_FOUND_ON_GAGAZET } : { ...e }))
      .filter((e) => e.count > 0),
    gil: gagazetBuild.gil - GIL_FOUND_ON_GAGAZET,
  };
}

export const yojimboCavernBuild: FFXPartyBuild = buildCavernParty(CAVERN_DOOM_PREP);

export default yojimboCavernBuild;
