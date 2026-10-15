/**
 * The party of the hidden Biran and Yenke chapter: **Kimahri alone** at the Mountain Gate of Mt. Gagazet (FFX only; `docs/plans/ch-biran-yenke-review.md`).
 *
 * ## Where Kimahri's numbers come from: the Seymour Flux chapter's preset, said plainly
 *
 * The research gives no preset for this build point. The duel is on the **same mountain, minutes before** Chapter I's Prominence (`research/ffx-seymour-flux.md` section 7.1: Kelk grants passage, Kimahri defeats
 * Biran and Yenke, then the trail, Wantz's shop, Braska's Sphere, the summit), so this build **is Chapter I's `gagazetBuild`, Kimahri alone, with only what a source takes off** (the way `yojimbo-cavern.ts` derives
 * the Cavern's party from it, and for the same reasons). Every number keeps the `[estimate]` label `gagazet.ts` gives it; his STR 26, MAG 22, AGI 18 and HP 2,310 are what the brothers' stats are derived from
 * (`battle/ffx/ai/biran-yenke-stats.ts`: Biran 3,208 HP and Yenke 2,406 HP for this Kimahri; RE section 3).
 *
 * ## What comes off, and why
 *
 * 1. **The Rages this duel teaches** (`mighty-guard`, `white-wind`, `self-destruct`): Chapter I's preset is the Kimahri who has already learned them from the brothers ("minutes later": `ffx-seymour-flux.md`
 *    section 6.1, section 7.4, `[verified: 2 sources]`), so he cannot start with them here: the half-HP gate on Mighty Guard and White Wind (RE section 7) and the whole point of the chapter would be moot. He
 *    keeps **Jump** (the starting Rage). **This is the one place the build departs from "the preset's Rages"**, flagged to the driver; `KIMAHRI_KEEPS_THE_PRESETS_RAGES` is the one switch that puts them back.
 * 2. **Talk**: the Trigger Command is Seymour Flux's own line (`ffx-seymour-flux.md` section 4.7); it has nothing to say here.
 * 3. **The mountain's pickups**: two Mega-Potions and 20,000 gil, found on the trail after the duel (`ffx-seymour-flux.md` section 7.7.2, section 7.8), as the Cavern build subtracts them.
 * 4. **His gauge is 45**, "a Kimahri without a fresh Rage" (`ffx-seymour-flux.md` C-16, `[estimate]`: the preset's 100 is the fill of learning Mighty Guard from Biran, a rule, which has not happened yet). The same
 *    number the Cavern build uses.
 *
 * **Alone, nothing else:** `activeSlots: ['kimahri']` (the precedent is Chapter XIV's Yuna alone), no bench (so no Switch row), no aeons (Yuna is not there), the formation disables Escape and Flee
 * (`enemies/biran-yenke.ts`; RE section 4). Kimahri's equipment, grid and the bag are Chapter I's.
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { gagazetBuild } from './gagazet.ts';

/** What this duel teaches (`ffx-seymour-flux.md` 6.1; `re-ffx-biran-yenke.md` section 7): Kimahri cannot start with it. */
const TAUGHT_BY_THE_BROTHERS: readonly string[] = ['mighty-guard', 'white-wind', 'self-destruct'];

/** Seymour Flux's Trigger Command (`ffx-seymour-flux.md` 4.7). */
const FLUX_ONLY: readonly string[] = ['talk'];

/** Found on the trail, after the duel (`ffx-seymour-flux.md` 7.7.2, 7.8). */
const MEGA_POTIONS_FOUND_ON_THE_TRAIL = 2;
const GIL_FOUND_ON_THE_TRAIL = 20_000;

/** The gauge of a Kimahri with no fresh Rage: `ffx-seymour-flux.md` C-16, `[estimate]` (the Cavern build's `'not-learned'`). */
export const KIMAHRI_GAUGE_AT_THE_GATE = 45;

/**
 * `false` (shipped): Kimahri starts without the Rages the brothers teach, so the chapter's point stands. `true`: he starts exactly as Chapter I's preset has him (Jump, Mighty Guard, White Wind in his list,
 * gauge 100), which makes the half-HP gate on those two Rages moot. The driver's brief read "start Kimahri with the Rages the chosen preset already has"; the preset's Rages include two this fight teaches.
 */
export const KIMAHRI_KEEPS_THE_PRESETS_RAGES = false;

/** Kimahri at the gate: Chapter I's Kimahri with the duel's lessons, Talk and (the gauge) taken off. */
function kimahriAtTheGate(preset: FFXMemberBuild, keepsPresetRages: boolean): FFXMemberBuild {
  const k = structuredClone(preset);
  if (keepsPresetRages) return k;
  k.learnedAbilityIds = k.learnedAbilityIds.filter((id) => !TAUGHT_BY_THE_BROTHERS.includes(id) && !FLUX_ONLY.includes(id));
  if (k.overdrive) {
    k.overdrive.unlockedOverdriveIds = k.overdrive.unlockedOverdriveIds.filter((id) => !TAUGHT_BY_THE_BROTHERS.includes(id));
    k.overdrive.gauge = KIMAHRI_GAUGE_AT_THE_GATE;
  }
  return k;
}

/** The trial's party: Kimahri alone. */
export function buildKimahriTrialParty(keepsPresetRages: boolean = KIMAHRI_KEEPS_THE_PRESETS_RAGES): FFXPartyBuild {
  const kimahri = gagazetBuild.members.find((m) => m.id === 'kimahri');
  if (kimahri === undefined) throw new Error("kimahri-trial: Chapter I's preset has no Kimahri");
  return {
    ...structuredClone(gagazetBuild),
    members: [kimahriAtTheGate(kimahri, keepsPresetRages)],
    activeSlots: ['kimahri'],
    reserve: [],
    aeons: [], // Yuna is not in the fight, so no aeon can be summoned
    inventory: gagazetBuild.inventory
      .map((e) => (e.itemId === 'mega-potion' ? { ...e, count: e.count - MEGA_POTIONS_FOUND_ON_THE_TRAIL } : { ...e }))
      .filter((e) => e.count > 0),
    gil: gagazetBuild.gil - GIL_FOUND_ON_THE_TRAIL,
  };
}

export const kimahriTrialBuild: FFXPartyBuild = buildKimahriTrialParty();

export default kimahriTrialBuild;
