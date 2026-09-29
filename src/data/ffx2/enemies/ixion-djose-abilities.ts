/**
 * Ixion's actions at Djose Temple (the FFX-2 Chapter 3 finale; our unlisted chapter "Ixion at Djose").
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: `research/ffx2-ixion-djose.md` §4.1; the tags are
 * that file's, carried verbatim (rule 6). DC = damage constant `[SinirothX]`. The FFX Ixion (Yuna's aeon,
 * `src/data/ffx/**`, shipped by D-089) shares the name, Aerospark and Thor's Hammer and **nothing else**
 * (research §0, §10 IX-2); every id here is `x2-ixion-`-prefixed so the two games never meet in one lookup.
 *
 * **Accuracy.** Ixion's Accuracy is 0 on the record (§3.1, a real FFX-2 value, as for the Road's aeons), so
 * no row carries an `accuracy` byte and the engine's enemy baseline applies. Physical attacks roll; magic,
 * the fractional Aerospark, Recharge and the Overdrive never miss (hard rule 5: `canMiss: false`). Whether a
 * fractional move can miss is not in the sources: `[estimate]`, the Chapter XI precedent.
 *
 * **Multi-target halving (IX-11).** The research derives from two observations that Ixion's all-party
 * Thundara and Thor's Hammer are **not** halved for hitting everyone (§4.1). The FFX-2 engine already halves
 * only the *party's* Black and White Magic cast on all (`src/battle/ffx2/execute.ts`, combat-core §2.1 step
 * 15), so these rows take no halving with no change here; `tests/unit/chapters/ixion-engine.test.ts` pins the
 * derived bands (Thundara 150-169, Thor's Hammer 935-1,057 against MDef 35).
 */

import type { AbilityDef, ElementId } from '../../../battle/common/types.ts';

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
};

/**
 * **IX-2 `[conflict]`, research Q1 (Bailey's call, still open): Thor's Hammer's element.** SinirothX's data
 * lists Lightning; Split_Infinity (GameFAQs' own boss guide: "not lightning based"), the wiki ("cannot be
 * absorbed") and GamerGuides say non-elemental. The research's lean, taken here as **our estimate**: (a)
 * non-elemental, so Lightning Eater (Thunder Spawn) and NulShock do not help against it. The other reading is
 * this one constant away: `'lightning'` makes Ixion's Overdrive absorbable by the Thunder Spawn grid.
 */
export const IXION_THORS_HAMMER_ELEMENT: ElementId = 'none';

/** Recharge's flat restore, HP and MP each `[verified: 5 sources]` (§4.1). */
export const IXION_RECHARGE_AMOUNT = 200;

/** Ixion, research §4.1. AI §4.2 `[SinirothX]`, prose matching on the wiki. */
export const x2IxionAbilities: AbilityDef[] = [
  {
    ...base,
    id: 'x2-ixion-attack',
    name: 'Attack', // Normal Attack; guide nicknames "Smash" (Split_Infinity), "Horn Slash" (zero_six)
    category: 'attack',
    power: 16, // DC 16, physical [SinirothX]; 181-205 against Def 40 [derived], about 200 seen (Split_Infinity)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['crit-eligible', 'always-break-damage-limit'], // "can break the damage limit" [SinirothX]
    messageTemplate: 'Ixion attacks {target}',
  },
  {
    ...base,
    id: 'x2-ixion-thundara',
    name: 'Thundara',
    mpCost: 12, // [SinirothX]
    // DC 12, magic [SinirothX]. **All targets** [verified: 4 sources — SinirothX's AI ("Thundara on all
    // characters"), Split_Infinity, zero_six, wiki]; SinirothX's attack list alone says "one character".
    // 150-169 against MDef 35, unhalved [derived]; Split_Infinity saw "150" on everyone.
    power: 12,
    formula: 'magic',
    damageType: 'magical',
    element: ['lightning'],
    targeting: 'all-enemies',
    canMiss: false,
    messageTemplate: 'Ixion casts Thundara',
  },
  {
    ...base,
    id: 'x2-ixion-aerospark',
    name: 'Aerospark',
    // One target, **5/8 of current HP** [verified: 3 sources, Kolar once — SinirothX, wiki, Split_Infinity
    // (62.5 %), GamerGuides]: 10/16 through the engine's shared fractional path. No element listed.
    // "Cannot be reduced in any way" (Split_Infinity): `damageType: 'other'` takes no Protect or Shell,
    // research §8.4, our estimate. It never kills on its own [derived]. "Can break the damage limit"
    // [SinirothX].
    power: 10,
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['always-break-damage-limit'],
    canMiss: false,
    messageTemplate: 'Ixion uses Aerospark',
  },
  {
    ...base,
    id: 'x2-ixion-recharge',
    name: 'Recharge',
    // **+200 HP and +200 MP to himself** [verified: 5 sources — SinirothX, wiki, Split_Infinity, bremen,
    // zero_six]. IX-3: SinirothX calls it "constant", Split_Infinity a Lightning spell on itself; the result
    // is the same (he absorbs Lightning either way), so it is built as a flat 200 / 200, as the research says.
    // `fixed` is power x 50 = 200; `noVariance` keeps it exact (the Chapter XV key, `formulas.ts`);
    // `restoresMp` is the Ether's key (`resolve.ts`). **It is the tell**: Thor's Hammer is his next action
    // [verified: 3 sources]. The game shows no counter; the "Recharge" line is the only warning.
    power: IXION_RECHARGE_AMOUNT / 50,
    formula: 'fixed',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    flags: ['heals'],
    canMiss: false,
    extra: { noVariance: true, restoresMp: IXION_RECHARGE_AMOUNT },
    messageTemplate: 'Ixion uses Recharge',
  },
  {
    ...base,
    id: 'x2-ixion-thors-hammer',
    name: "Thor's Hammer",
    // Ixion's Overdrive, **all targets**, DC 30 magic [SinirothX]. 935-1,057 against MDef 35, unhalved
    // [derived]; bremen saw "around 1000", Split_Infinity (with Shell) about 700. Element: IX-2, above.
    power: 30,
    formula: 'magic',
    damageType: 'magical',
    element: [IXION_THORS_HAMMER_ELEMENT],
    targeting: 'all-enemies',
    canMiss: false, // hard rule 5: every Overdrive always hits
    messageTemplate: "Ixion unleashes Thor's Hammer",
  },
];
