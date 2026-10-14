/**
 * Valefor's actions at Besaid Temple (FFX-2 Chapter 3, the mission "Protect Besaid Temple!"; the hidden chapter "Valefor at Besaid", number 24).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: `research/ffx2-fallen-aeons.md` §7.1 (SinirothX's *Enemy Encyclopedia* block + the FF Wiki prose,
 * `[verified: 2 sources]`); DC = damage constant. The FFX Valefor (Yuna's aeon, and the possessed one of the Yunalesca and Braska fights, `src/data/ffx/**`) is a
 * different monster of a different game and **no number of its is used**; every id here is `x2-valefor-`-prefixed so the two games never meet in one lookup.
 *
 * What the research says, move by move (the four rows below):
 *
 * - **Normal Attack**, DC 16.
 * - **Sonic Wings**: MP damage on **the character furthest away**, DC 2. "Furthest" is a positional rule; this engine has no positions, so the AI picks the back of the
 *   formation (`../../../battle/ffx2/ai/valefor.ts#furthestGirl`, Ormi's owner-approved stand-in D-018/q3). Here the row is only the damage: MP, not HP (`extra.mpOnly`: the
 *   key the engine's command adapter reads; `damagesPool` is the data-only note Lacrimosa and the Gunner's rows carry too).
 * - **Energy Ray**: magic, DC 20, **everyone in a 160 degree arc in front of her**. The girls stand in front of her in the fixed formation and the engine tracks no later movement,
 *   so the row is `all-enemies` (the whole living party) and says so in the guide (preflight §4).
 * - **Energy Blast**: magic, DC 25, all targets, her Overdrive at counter 100.
 *
 * **Not in the research, so not claimed** (each is a `[model]` in the preflight `docs/plans/ch-besaid-valefor-review.md` §2, replaced by the game's own row when the RE
 * note `research/re-ffx2-yojimbo-valefor.md` is pinned): no MP cost on any move (the research gives none), no critical flag on the Attack, no element on the magic (the
 * research lists none), no damage-limit break flag, and Sonic Wings' damage type: read as the Attack family (physical, rolls to hit, Protect helps).
 *
 * **Hit rule** (hard rule 5): both magic rows are `canMiss: false`, and so is the Overdrive; only the Attack and Sonic Wings roll.
 * **Multi-target halving**: the FFX-2 engine halves only the *party's* Black and White Magic cast on all (`src/battle/ffx2/execute.ts`), so Energy Ray and Energy Blast take none.
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

/** The damage constants, research §7.1 `[verified: 2 sources]`. */
export const VALEFOR_DC = { attack: 16, sonicWings: 2, energyRay: 20, energyBlast: 25 } as const;

/** Valefor, research §7.1. */
export const x2ValeforAbilities: AbilityDef[] = [
  {
    ...base,
    id: VALEFOR_ATTACK_ID,
    name: 'Attack', // Normal Attack
    category: 'attack',
    power: VALEFOR_DC.attack, // DC 16, physical [SinirothX + wiki]
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
    power: VALEFOR_DC.sonicWings, // DC 2, MP damage on the character furthest away [SinirothX + wiki prose]
    formula: 'strength',
    damageType: 'physical', // [model] the Attack family: not in the research (preflight §2.5)
    element: ['none'],
    targeting: 'single-enemy',
    extra: { damagesPool: 'mp', mpOnly: true }, // MP, not HP: `mpOnly` is the key `battle/ffx2/adapt/command.ts` reads
    messageTemplate: 'Valefor uses Sonic Wings on {target}',
  },
  {
    ...base,
    id: VALEFOR_ENERGY_RAY_ID,
    name: 'Energy Ray',
    power: VALEFOR_DC.energyRay, // DC 20, magic [SinirothX + wiki]; everyone in a 160 degree arc in front of her: the whole living party here (preflight §4)
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false, // hard rule 5: magic always hits
    messageTemplate: 'Valefor fires Energy Ray',
  },
  {
    ...base,
    id: VALEFOR_ENERGY_BLAST_ID,
    name: 'Energy Blast',
    power: VALEFOR_DC.energyBlast, // DC 25, magic, all targets [SinirothX + wiki]; her Overdrive at counter 100
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false, // hard rule 5: every Overdrive always hits
    messageTemplate: 'Valefor unleashes Energy Blast',
  },
];
