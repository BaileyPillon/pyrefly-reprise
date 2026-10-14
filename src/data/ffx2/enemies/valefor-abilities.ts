/**
 * Valefor's actions at Besaid Temple (FFX-2 Chapter 3, the mission "Protect Besaid Temple!"; the hidden chapter "Valefor at Besaid", number 24).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Sources: the research's damage constants (`research/ffx2-fallen-aeons.md` §7.1, SinirothX's *Enemy Encyclopedia* + the FF Wiki, `[verified: 2 sources]`;
 * DC = damage constant) and the RE session's review of 2026-10-14 ("RE review 2026-10-14, m164, row 164, pos_bsyt05_229": her own script, and the three move rows, `research/re-ffx2-ai-valefor.md`), which
 * **wins where it says more**. The FFX Valefor (Yuna's aeon, and the possessed one of the Yunalesca and Braska fights, `src/data/ffx/**`) is a different monster of a different game and **no number of its is
 * used**; every id here is `x2-valefor-`-prefixed so the two games never meet in one lookup.
 *
 * The four rows below, move by move (the engine resolves each from these fields; **the game's own command rows are laid on the three special moves by `../command-records/valefor.ts` / the monster
 * record's `commands`, so the charge, the recovery and every flag are the rows' own once that map is attached**, `../monster-records/records-valefor.ts`):
 *
 * - **Normal Attack**, DC 16, physical: it runs on the game's plain Attack row 0x41da (the monster record's `plainAttack`).
 * - **Sonic Wings**: MP damage only (formula 0, power 2), on the girl at the greatest ground distance (`../../../battle/ffx2/ai/valefor.ts#furthestGirl`: Yuna at the start). **Physical** (Protect applies),
 *   **never misses** (accuracy formula 0, no Darkness bit: `canMiss: false`, hard rule 5), no critical. Charge 100 (2.80 s), recovery 80 (2.24 s) `[RE review]`.
 * - **Energy Ray**: magical (**Shell applies**), DC 20, on every girl (the whole party in our fixed formation, the arc being 160 degrees in front of her), never misses. Charge 120 (3.37 s), recovery 100 (2.80 s).
 * - **Energy Blast**: her Overdrive at gauge 100, DC 25, on every girl; **its row has damage flags 0: it is not magical, so neither Shell nor Protect reduces it** (`damageType: 'other'`); never misses.
 *   Charge 120 (3.37 s), recovery 100 (2.80 s).
 *
 * **Hit rule** (hard rule 5): the Ray, the Blast and Sonic Wings are `canMiss: false`; only the plain Attack rolls (accuracy formula 2 on the row's byte 95).
 * **Multi-target halving**: the FFX-2 engine halves only the *party's* Black and White Magic cast on all (`src/battle/ffx2/execute.ts`), so Energy Ray and Energy Blast take none.
 * No move costs MP. Which of this is `[script]` and which was the first build's `[model]` is in `docs/plans/ch-besaid-valefor-review.md` and the handoff.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
};

/** The ability ids (the AI and the tests name these, never a literal). */
export const VALEFOR_ATTACK_ID = 'x2-valefor-attack';
export const VALEFOR_SONIC_WINGS_ID = 'x2-valefor-sonic-wings';
export const VALEFOR_ENERGY_RAY_ID = 'x2-valefor-energy-ray';
export const VALEFOR_ENERGY_BLAST_ID = 'x2-valefor-energy-blast';

/** The damage constants, research §7.1 `[verified: 2 sources]`; the rows' own powers are 16, 2, 20 and 25 `[RE review]`. */
export const VALEFOR_DC = { attack: 16, sonicWings: 2, energyRay: 20, energyBlast: 25 } as const;

/** Valefor, research §7.1 and the RE review. */
export const x2ValeforAbilities: AbilityDef[] = [
  {
    ...base,
    id: VALEFOR_ATTACK_ID,
    name: 'Attack', // Normal Attack
    category: 'attack',
    power: VALEFOR_DC.attack, // DC 16, physical [SinirothX + wiki]; the game's plain Attack row 0x41da
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: 'Valefor attacks {target}',
  },
  {
    ...base,
    id: VALEFOR_SONIC_WINGS_ID,
    name: 'Sonic Wings',
    power: VALEFOR_DC.sonicWings, // DC 2, MP damage on the farthest girl [SinirothX + wiki]; formula 0, power 2 [RE review]
    formula: 'strength',
    damageType: 'physical', // [RE review] physical: Protect applies
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: false, // [RE review] accuracy formula 0, no Darkness bit: it never misses (hard rule 5)
    extra: { damagesPool: 'mp', mpOnly: true }, // MP, not HP: `mpOnly` is the key `battle/ffx2/adapt/command.ts` reads; no critical
    messageTemplate: 'Valefor uses Sonic Wings on {target}',
  },
  {
    ...base,
    id: VALEFOR_ENERGY_RAY_ID,
    name: 'Energy Ray',
    power: VALEFOR_DC.energyRay, // DC 20, magic [SinirothX + wiki]; everyone in front of her: every living girl here (the arc covers all three in the fixed formation)
    formula: 'magic',
    damageType: 'magical', // [RE review] magical: Shell applies
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false, // hard rule 5: magic always hits
    messageTemplate: 'Valefor fires Energy Ray',
  },
  {
    ...base,
    id: VALEFOR_ENERGY_BLAST_ID,
    name: 'Energy Blast',
    power: VALEFOR_DC.energyBlast, // DC 25, all targets [SinirothX + wiki]; her Overdrive at gauge 100
    formula: 'magic',
    damageType: 'other', // [RE review] the row's damage flags are 0: not magical, so neither Shell nor Protect reduces it
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false, // hard rule 5: every Overdrive always hits
    messageTemplate: 'Valefor unleashes Energy Blast',
  },
];
