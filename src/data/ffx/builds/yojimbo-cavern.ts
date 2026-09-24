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
 * 2. **Kimahri has Doom, with a full gauge** — assumption **B8** (our
 *    estimate that the player took it). Doom is learned by Lancet from a
 *    **Ghost in this same cavern** (`ffx-yojimbo.md` §5.3 strategy 1
 *    [verified: 4 sources]), and learning a new Rage by Lancet fills his gauge
 *    (`ffx-seymour-flux.md` §7.9.2 [single source, a rule], the same rule
 *    `gagazet.ts` applies).
 * 3. **Two Mega-Potions and the mountain's gil come off.** `gagazet.ts`'s
 *    inventory "includes the two Mega-Potions found on the mountain" and its
 *    gil "includes the 20,000 found on the mountain" (§7.8 [estimate]); the
 *    Cavern comes before the mountain, so both are subtracted.
 * 4. **No Talk.** The Talk trigger is Seymour Flux's own line (§4.7); it has
 *    no effect here, so the row is not offered.
 * 5. **Opening line-up Lulu, Kimahri, Yuna** — `[estimate]`, INFERRED, not
 *    Bailey's call yet: the formation forces no party (§2.5 `[decompiled]`).
 *    Magic (Magic Defense 0 against Defense 80, §2.1), Doom, and the summoner
 *    whose aeons can stand in front of Zanmato (§5.3). Lulu leads because the
 *    fight is hers in the story (§5.2), which the research itself calls a
 *    presentation choice.
 * 6. **No Candle of Life.** The item is sourced, but no source says the party
 *    holds one here (§10 item 4); Kimahri's Doom is the sourced route.
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

/** §7.8: the two Mega-Potions found on the mountain. */
const MEGA_POTIONS_FOUND_ON_GAGAZET = 2;
/** §7.8: the 20,000 gil found on the mountain. */
const GIL_FOUND_ON_GAGAZET = 20_000;

function atTheCavern(member: FFXMemberBuild): FFXMemberBuild {
  const m = structuredClone(member);
  m.learnedAbilityIds = m.learnedAbilityIds.filter(
    (id) => !LEARNED_ON_GAGAZET.includes(id) && !FLUX_ONLY.includes(id),
  );
  if (m.id === 'kimahri' && m.overdrive) {
    // B8 (our estimate): Doom taken from the Cavern's Ghost by Lancet; the
    // Lancet rule fills the gauge [ffx-seymour-flux §7.9.2].
    const rages = m.overdrive.unlockedOverdriveIds.filter((id) => !LEARNED_ON_GAGAZET.includes(id));
    m.overdrive.unlockedOverdriveIds = rages.includes('doom') ? rages : [...rages, 'doom'];
    m.overdrive.gauge = 100;
  }
  return m;
}

export const yojimboCavernBuild: FFXPartyBuild = {
  ...structuredClone(gagazetBuild),
  members: gagazetBuild.members.map(atTheCavern),
  // [estimate], INFERRED — see the file header, item 5.
  activeSlots: ['lulu', 'kimahri', 'yuna'],
  reserve: ['tidus', 'auron', 'wakka', 'rikku'],
  inventory: gagazetBuild.inventory
    .map((e) => (e.itemId === 'mega-potion' ? { ...e, count: e.count - MEGA_POTIONS_FOUND_ON_GAGAZET } : { ...e }))
    .filter((e) => e.count > 0),
  gil: gagazetBuild.gil - GIL_FOUND_ON_GAGAZET,
};

export default yojimboCavernBuild;
