/**
 * The actions of the three duelists of the hidden chapter "The Farplane Cup": Auron, Tidus and Seymour, `monster.bin` rows 311, 317 and 319 (the Fiend Arena's block of rows 308 to 327). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: **the game's own rows** (`research/re-ffx2-farplane-cup.md` §6 and §7), which `../command-records/farplane-cup.ts` lays on these abilities by id, so the charge, the recovery, the target flags, the damage type, the hit
 * rule, the statuses and every other field the engine reads are the rows' own; the fields here are the ability's own reading, kept consistent with them and pinned against them by
 * `tests/unit/chapters/farplane-cup-data.test.ts` (against `tests/fixtures/parity/ffx2/farplane_cup_rows.json`, which a script decoded from the kernel tables). Every id here is `x2-`-prefixed so nothing of the FFX data is touched.
 * The FFX characters' Overdrives are ordinary enemy rows here ([RE §summary 4]): no new engine kind.
 *
 * - **Auron** (`m311`): Attack (0x41da), **Shooting Star** (0x4208: no HP damage, Eject at 254 on one girl, accuracy formula 3), **Dragon Fang** (0x4207: power 14 on the whole party), **Full Break** (0x4206: power 20 and
 *   Strength, Magic, Defense and Magic Defense down two stages), **Shin Zantetsu** (0x3078, a party row: Death at 80 on the whole party), Mega-Potion (0x2003, his side) and X-Potion (0x2002, himself).
 * - **Tidus** (`m317`): Attack (0x41da), **Blitz Ace** (0x4205: nine hits of power 10), **Spiral Cut** (0x4203: power 32), **Delay Buster** (0x3070, a party row), **Hastega** (0x3177, a party row), Mega-Potion, Hero Drink
 *   (0x203f, himself) and Dispel Tonic (0x2038, never used: the branch that throws it needs Reflect, which his record forbids).
 * - **Seymour** (`m319`): Attack (0x4000), Demi (0x3082), Curaga (0x30b5), Dispel (0x30b8), **Critical Attack** (0x4015), Drain Attack (0x4010), **Black Sky** (0x3088: ten hits), Absorb (0x4040), **Meteor** (0x4221: twelve
 *   hits), Shell, Protect, Break (0x3084: Petrify at 80), Magic Up (0x41dd), Strength Up (0x41db), Confuse (0x3083), Slowga (0x421e) and Ultima (0x41fb).
 *
 * **Hit rule** (hard rule 5): `canMiss` follows the row's accuracy formula (`flagsMisc` bits 3 to 5): `true` where it is not 0 (the three Attacks, Full Break, Delay Buster, Shin Zantetsu, Drain Attack and Shooting
 * Star's formula 3), `false` everywhere else, set explicitly because an unset field silently rolls. **Multi-target halving:** the FFX-2 engine halves only the *party's* Black and White Magic cast on all
 * (`src/battle/ffx2/execute.ts`), so none of these takes any.
 * Confidence: [verified: the game's own table, decoded by a script and pinned by `tests/unit/chapters/farplane-cup-data.test.ts`]; where a field is `[I]` it says so below.
 * **Not built here:** the cup's other fighters (Brother, Buddy, Kimahri, Lulu, Baralai, Nooj, Gippal and the rest of rows 308 to 327; `docs/plans/ch-duelist-review.md` DU7), and Seymour's Death, Excalibur and Cry in the Night
 * (on his list, queued by no poll).
 */


import type { AbilityDef } from '../../../battle/common/types.ts';
import { base, CUP_ABILITY, DISPEL_STRIPS, FULL_BREAK_STAGES } from './farplane-cup-abilities-base.ts';
import { seymourAbilities } from './farplane-cup-abilities-seymour.ts';

export { CUP_ABILITY } from './farplane-cup-abilities-base.ts';

/** The abilities of the three duelists (Seymour's eighteen are in `./farplane-cup-abilities-seymour.ts`). */
export const x2FarplaneCupAbilities: AbilityDef[] = [
  // ---- Auron ----------------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: CUP_ABILITY.auronAttack,
    name: 'Attack',
    power: 16, // row 0x41da: formula 0, power 16, crit byte 5, shatter 10, accuracy formula 2 (the race with his ACC)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'Auron attacks {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.shootingStar,
    name: 'Shooting Star',
    mpCost: 12, // [row 0x4208] (RE §7); Auron's Spellspring makes every cost 0
    power: 18, // no HP damage (class 0): accuracy formula 3 with power 18 against the Eject byte, Eject 254 [row 0x4208]; not reflectable
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true, // formula 3 is a race against the resist byte, not an always-hit row
    statusEffects: [{ status: 'eject', chance: 254, duration: 0 }],
    messageTemplate: 'Auron uses Shooting Star on {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.dragonFang,
    name: 'Dragon Fang',
    mpCost: 10, // [row 0x4207]
    power: 14, // formula 0, power 14, the whole party, crit 10, shatter 100; always hits
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'all-enemies',
    messageTemplate: 'Auron uses Dragon Fang',
  },
  {
    ...base,
    id: CUP_ABILITY.fullBreak,
    name: 'Full Break',
    mpCost: 4, // [row 0x4206]
    power: 20, // formula 0, power 20, one girl, crit 10, shatter 100; Strength, Magic, Defense and Magic Defense down 2 stages each at chance 100
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true, // accuracy formula 2 (the race with ACC)
    statusEffects: FULL_BREAK_STAGES,
    messageTemplate: 'Auron uses Full Break on {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.shinZantetsu,
    name: 'Shin Zantetsu',
    mpCost: 32, // [row 0x3078] (RE §7)
    power: 0, // a party row: Death at 80 on the whole party, accuracy formula 2 (the race with ACC)
    formula: 'none',
    damageType: 'physical',
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: true,
    statusEffects: [{ status: 'ko', chance: 80, duration: 0 }],
    messageTemplate: 'Auron uses Shin Zantetsu',
  },
  {
    ...base,
    id: CUP_ABILITY.auronMegaPotion,
    name: 'Mega-Potion',
    power: 40, // item row 0x2003: formula 5, power 40 = a fixed 2,000 to his whole side (the cup has only him)
    formula: 'fixed-no-variance',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    flags: ['heals', 'never-break-damage-limit'],
    messageTemplate: 'Auron uses a Mega-Potion',
  },
  {
    ...base,
    id: CUP_ABILITY.auronXPotion,
    name: 'X-Potion',
    power: 16, // item row 0x2002: formula 7, power 16 = 100 percent of max HP, but its damage flags carry the 9,999 cap bit: at most 9,999 [RE §7]
    formula: 'percent-total',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    flags: ['heals', 'never-break-damage-limit'],
    messageTemplate: 'Auron uses an X-Potion',
  },

  // ---- Tidus ----------------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: CUP_ABILITY.tidusAttack,
    name: 'Attack',
    power: 16, // row 0x41da, as Auron's
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: '{user} attacks {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.blitzAce,
    name: 'Blitz Ace',
    mpCost: 40, // [row 0x4205]
    power: 10, // formula 0, power 10, NINE hits on one girl, crit 10, shatter 100; always hits
    hits: 9,
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: '{user} uses Blitz Ace on {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.spiralCut,
    name: 'Spiral Cut',
    mpCost: 10, // [row 0x4203]
    power: 32, // formula 0, power 32, one girl, crit 15, shatter 70; always hits
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: '{user} uses Spiral Cut on {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.delayBuster,
    name: 'Delay Buster',
    mpCost: 16, // [row 0x3070] (RE §7)
    power: 18, // a party row: formula 0, power 18, one girl, shatter 100; accuracy formula 2; Delay (the row's delay bits)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    flags: ['weak-delay'],
    messageTemplate: '{user} uses Delay Buster on {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.hastega,
    name: 'Hastega',
    mpCost: 32, // [row 0x3177] (RE §7)
    power: 0, // his side: Haste 254, counter 40; magical, reflectable
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-allies',
    flags: ['reflectable'],
    statusEffects: [{ status: 'haste', chance: 254, duration: 0 }],
    messageTemplate: '{user} casts Hastega',
  },
  {
    ...base,
    id: CUP_ABILITY.tidusMegaPotion,
    name: 'Mega-Potion',
    power: 40, // item row 0x2003, as Auron's
    formula: 'fixed-no-variance',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    flags: ['heals', 'never-break-damage-limit'],
    messageTemplate: '{user} uses a Mega-Potion',
  },
  {
    ...base,
    id: CUP_ABILITY.heroDrink,
    name: 'Hero Drink',
    power: 0, // item row 0x203f: himself, the "invincible" status 254 for a counter of 20 [row; RE §7 "slot 17 status 254, counter 20"]
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    statusEffects: [{ status: 'invincible', chance: 254, duration: 0 }],
    messageTemplate: '{user} uses a Hero Drink',
  },
  {
    ...base,
    id: CUP_ABILITY.dispelTonic,
    name: 'Dispel Tonic',
    power: 0, // item row 0x2038: strips what Dispel strips from one target. The script throws it only at a Reflected duelist, which Tidus's record (Reflect resist 255) never lets him be.
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    removesStatuses: [...DISPEL_STRIPS],
    flags: ['removes-statuses'],
    messageTemplate: '{user} uses a Dispel Tonic',
  },

  ...seymourAbilities,
];
