/**
 * The moves of the hidden chapter **The Luca Opener** (Logos, Ormi and Leblanc on the docks of Luca, the first fights of FFX-2's Chapter 1). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Sources: the game's own rows, `research/re-ffx2-luca-opener.md` §3 and §4 `[verified: the game's own table]` (`monmagic.bin` 0x4000, 0x40e4, 0x40e7, 0x40f1, 0x41da and 0x41eb), pinned field by field by
 * `tests/unit/chapters/luca-opener-data.test.ts` against `tests/fixtures/parity/ffx2/luca_opener_rows.json`. **The command rows are laid on these abilities by id** (`../command-records/luca-opener.ts`), so the
 * charge, the recovery and every flag the engine reads are the rows' own. Every id carries `x2-luca-` so none can meet the Chateau Leblanc set's moves (`x2-ormi-shield-bash`, `x2-logos-double-shot`, ...), which are
 * rows of other monsters (241 to 253) that happen to share a name or a number (Logos' pistol is 0x40e7 in both, Thunder 0x41eb here and the Fem-Goon's) and which this chapter never touches.
 *
 * The Die row (0x405f, "speak and fall", on Ormi's and Logos' lists) is **not built**: it is the row the game queues as a death reaction (a spoken line while the body falls), has no damage and no target but the
 * speaker, and its only status entry (group 2, slot 23) is unmapped (research U4). The fall itself is the engine's KO.
 *
 * **Hit rule** (hard rule 5): Pirouette Pitch (accuracy formula 0), the Potion and Thunder are `canMiss: false`; the two Attacks and the pistol roll (accuracy formula 2 on the row's byte 95, and formula 1 on 140 for the pistol).
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
export const LUCA_ORMI_ATTACK_ID = 'x2-luca-ormi-attack';
export const LUCA_ORMI_PITCH_ID = 'x2-luca-ormi-pirouette-pitch';
export const LUCA_LOGOS_PISTOL_ID = 'x2-luca-logos-pistol';
export const LUCA_LOGOS_POTION_ID = 'x2-luca-logos-potion';
export const LUCA_LEBLANC_ATTACK_ID = 'x2-luca-leblanc-attack';
export const LUCA_LEBLANC_THUNDER_ID = 'x2-luca-leblanc-thunder';

/** The damage constants of the rows [RE section 4]: 16 for both Attacks, 26 for the shield throw, 8 a hit for the pistol, 20 for the Potion (a fixed 20 HP), 7 for Thunder. */
export const LUCA_DC = { attack: 16, pitch: 26, pistol: 8, potion: 20, thunder: 7 } as const;

/** Thunder's MP cost, the row's own (`monmagic.bin` 0x41eb): 4. She has 101. */
export const LUCA_THUNDER_MP = 4;

export const lucaOpenerAbilities: AbilityDef[] = [
  {
    ...base,
    id: LUCA_ORMI_ATTACK_ID,
    name: 'Attack',
    category: 'attack',
    power: LUCA_DC.attack, // row 0x41da, DC 16, physical; accuracy formula 2 on the monster's 95 [RE section 4]. Runs on the monster record's plain Attack
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['crit-eligible', 'affected-by-darkness'],
    messageTemplate: 'Ormi attacks {target}',
  },
  {
    ...base,
    id: LUCA_ORMI_PITCH_ID,
    name: 'Pirouette Pitch',
    power: LUCA_DC.pitch, // row 0x40e4, power 26, physical, never rolls; cast 180, crit 40, shatter 100: the weak shield throw [RE section 4]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: false,
    messageTemplate: 'Ormi throws his shield at {target}',
  },
  {
    ...base,
    id: LUCA_LOGOS_PISTOL_ID,
    name: '1H Pistol',
    power: LUCA_DC.pistol, // row 0x40e7, power 8 x 2 hits, physical, accuracy formula 1 on byte 140; ATB 40 [RE section 4]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 2,
    flags: ['crit-eligible', 'affected-by-darkness', 'long-range'],
    messageTemplate: 'Logos shoots {target}',
  },
  {
    ...base,
    id: LUCA_LOGOS_POTION_ID,
    name: 'Potion',
    power: LUCA_DC.potion, // row 0x40f1: damage formula 15 (the power itself), power 20 = a fixed 20 HP, on one friend [RE section 4]
    formula: 'fixed-no-variance',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-ally',
    flags: ['heals', 'never-break-damage-limit'],
    canMiss: false,
    messageTemplate: 'Logos throws a Potion to {target}',
  },
  {
    ...base,
    id: LUCA_LEBLANC_ATTACK_ID,
    name: 'Attack',
    category: 'attack',
    power: LUCA_DC.attack, // row 0x4000, DC 16, physical; accuracy formula 2 on the monster's 95 [RE section 4]. Runs on the monster record's plain Attack
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['crit-eligible', 'affected-by-darkness'],
    messageTemplate: 'Leblanc attacks {target}',
  },
  {
    ...base,
    id: LUCA_LEBLANC_THUNDER_ID,
    name: 'Thunder',
    mpCost: LUCA_THUNDER_MP, // the row's own cost
    power: LUCA_DC.thunder, // row 0x41eb: magic, Thunder, power 7, cast 70, reflectable; the script aims it at one girl [RE section 4]
    formula: 'magic',
    damageType: 'magical',
    element: ['lightning'],
    targeting: 'single-enemy',
    flags: ['reflectable'],
    canMiss: false, // hard rule 5: magic always hits
    messageTemplate: 'Leblanc casts Thunder on {target}',
  },
];

export default lucaOpenerAbilities;
