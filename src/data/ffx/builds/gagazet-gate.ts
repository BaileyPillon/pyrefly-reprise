/**
 * The hidden Biran and Yenke chapter's party: **Kimahri alone** at the gate of Mt. Gagazet (FFX only; `research/ffx-biran-yenke.md` §5).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: FFX's Kimahri, his Lancet and his Ronso Rage.
 *
 * ## Where the numbers come from
 *
 * The formation forces the party: `k`, Kimahri alone (`[decompiled]`, research §0.4). No source gives his stats at the gate, so this is **Chapter I's Kimahri**
 * (`./gagazet.ts`, `research/ffx-seymour-flux.md` §7.3 `[estimate]`: the "average non-grinding player" at the Prominence, a few screens further up the same mountain), cloned, with
 * only the changes a source makes. No stat is moved by hand (AGENTS.md hard rule 6), so every stat keeps the `[estimate]` label `gagazet.ts` gives it. The same method as
 * Chapter IX's `yojimbo-cavern.ts`.
 *
 * ## What changes, and why
 *
 * 1. **Mighty Guard and White Wind are not known yet**: this duel is where he learns them (research §4.5; `ffx-seymour-flux.md` §6.1 `[verified: 2 sources]`). Chapter I's preset
 *    assumes he arrives at the Prominence having learned them here; this chapter is that lesson. **His Ronso Rage list is Jump alone** (`[estimate]`: Chapter I's list less the
 *    two learned here; which Rages an average player has picked up on the way is not sourced, `ffx-seymour-flux.md` §7.4).
 * 2. **No Talk.** The Talk trigger is Seymour Flux's own line (`ffx-seymour-flux.md` §4.7); it has nothing to say here.
 * 3. **His Overdrive gauge starts at 45 %** (`[estimate]`): `ffx-seymour-flux.md` C-16's figure for a Kimahri who has not learned anything on the mountain yet (Chapter I's 100 % is
 *    the gauge a Rage learned here fills, research §4.5).
 * 4. **The mountain's pickups come off the bag and the purse**: the two Mega-Potions and the 20,000 gil found on the climb (`ffx-seymour-flux.md` §7.7.2, §7.8) lie past the gate.
 * 5. **No aeons**: Yuna is not in the battle (the forced party); there is nobody to summon them.
 *
 * His stats decide the two Ronso's (the battle writes theirs from his: research §2.2, `battle/ffx/ai/biran-yenke-stats.ts`), so the fight scales with him as the game's does.
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { gagazetBuild } from './gagazet.ts';

/** Learned on this very mountain, from Biran and Yenke (research §4.5). */
export const LEARNED_FROM_THE_RONSO: readonly string[] = ['mighty-guard', 'white-wind'];
/** Seymour Flux's Trigger Command [ffx-seymour-flux §4.7]. */
const FLUX_ONLY: readonly string[] = ['talk'];
/** Kimahri's Overdrive gauge at the gate, `[estimate]` (`research/ffx-seymour-flux.md` C-16). */
export const KIMAHRI_GATE_GAUGE = 45;
/** The two Mega-Potions and the 20,000 gil found on the climb [ffx-seymour-flux §7.7.2, §7.8]: past the gate. */
const MEGA_POTIONS_FOUND_ON_GAGAZET = 2;
const GIL_FOUND_ON_GAGAZET = 20_000;

/** Kimahri at the gate: Chapter I's, less what this duel teaches and the Flux's Talk; full HP and MP (the save sphere at the foot of the mountain). */
function kimahri(): FFXMemberBuild {
  const m = gagazetBuild.members.find((x) => x.id === 'kimahri');
  if (!m) throw new Error('gagazet-gate: no Kimahri in the Mt. Gagazet preset');
  const out = structuredClone(m);
  out.learnedAbilityIds = out.learnedAbilityIds.filter((id) => !LEARNED_FROM_THE_RONSO.includes(id) && !FLUX_ONLY.includes(id));
  out.hp = out.stats.maxHp;
  out.mp = out.stats.maxMp;
  out.overdrive = {
    ...out.overdrive,
    gauge: KIMAHRI_GATE_GAUGE,
    unlockedOverdriveIds: out.overdrive.unlockedOverdriveIds.filter((id) => !LEARNED_FROM_THE_RONSO.includes(id)),
  };
  return out;
}

export const gagazetGateBuild: FFXPartyBuild = {
  game: 'ffx',
  members: [kimahri()],
  activeSlots: ['kimahri'], // forced party "k" [research §0.4, decompiled]
  reserve: [],
  aeons: [],
  inventory: gagazetBuild.inventory
    .map((e) => (e.itemId === 'mega-potion' ? { ...e, count: e.count - MEGA_POTIONS_FOUND_ON_GAGAZET } : { ...e }))
    .filter((e) => e.count > 0),
  gil: Math.max(0, (gagazetBuild.gil ?? 0) - GIL_FOUND_ON_GAGAZET),
  sphereInventory: {}, // [estimate] — as Chapter I
};

export default gagazetGateBuild;
