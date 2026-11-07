/**
 * The actions of the League fighters (Warrior, Veteran, Slasher, Mage, Master) and of Elma in the hidden chapter "The Youth League Tournament" (`monster.bin` rows 210, 211, 193, 214, 215 and 279). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: **the game's own rows** (`research/re-ffx2-youth-league-tournament.md` section 6), which `../command-records/youth-league.ts` lays on these abilities by id, so the charge, the recovery, the target flags, the damage
 * type, the hit rule, the statuses and every other field the engine reads are the rows' own; the fields here are the ability's own reading, kept consistent with them and pinned against them by
 * `tests/unit/chapters/youth-league-data.test.ts` (against `tests/fixtures/parity/ffx2/youth_league_rows.json`, which a script decoded from the kernel tables). Every id here is `x2-`-prefixed so nothing of the FFX data is touched.
 *
 * - **League types** (`m210`, `m211`, `m193`, `m214`, `m215`): Attack (0x4000), **Critical Attack** (0x4015: always a critical, always hits), Hi-Potion (0x2001, thrown at a friend under a quarter), **Flash Bomb**
 *   (0x40fd: Darkness at 50 on the party), **Demi** (0x3082: a quarter of each girl's current HP), **Confuse** (0x4070) and the four -ra spells (0x41ed to 0x41f0), each listed twice: aimed at one girl, or at the whole party
 *   (the Mage and the Master flip a coin, `m214.src` and `m215.src`).
 * - **Elma** (`m279`): her own Attack (0x40e3, the race against 130), **Not-So-Mighty Guard** (0x4086: Shell, Protect and Regen on her whole side), Osmose (0x406d), Sleep (0x406e), **Hush Grenade** (0x40fe: Silence at 50
 *   on the party) and **Dispel** (0x30b8, a party row aimed at one girl); the four -ra spells, Confuse and Flash Bomb are the League's rows (the same ids on the same row).
 *
 * **Hit rule** (hard rule 5): `canMiss` follows the row's accuracy formula (`flagsMisc` bits 3 to 5): `true` where it is not 0 (the League's Attack, Elma's Attack), `false` everywhere else, set explicitly because an unset
 * field silently rolls. **Multi-target halving:** the FFX-2 engine halves only the *party's* Black and White Magic cast on all (`src/battle/ffx2/execute.ts`), so none of these takes any.
 * Confidence: [verified: the game's own table, decoded by a script and pinned by `tests/unit/chapters/youth-league-data.test.ts`]; where a field is `[I]` it says so below.
 * **Not built here:** the "battle too long" ladder and the Self-Destruct Flare of the League rows (they apply to the Chapter 2 soldiers' scenes and Kilika's, none of the seven; RE section 7), and Elma's Chapter 2 moves
 * (Thunder, Haste, Slow, Time Up Meteor: row 185 is the other path's fight, pick YL1).
 */

import type { AbilityDef, ElementId } from '../../../battle/common/types.ts';
import { base, DISPEL_STRIPS, YL_ABILITY } from './youth-league-abilities-base.ts';
import { yaibalAbilities, lucilAbilities } from './youth-league-abilities-named.ts';

export { YL_ABILITY } from './youth-league-abilities-base.ts';

/** One -ra spell, aimed at one girl or at the whole party: the same row (12 MP, a 70-charge cast, power 12, reflectable), so the two differ in their target only. */
function ra(id: string, name: string, element: ElementId, party: boolean): AbilityDef {
  return {
    ...base,
    id,
    name,
    mpCost: 12, // [rows 0x41ed to 0x41f0]
    power: 12, // formula 2, power 12, shatter 20; always hits (accuracy formula 0), reflectable
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: party ? 'all-enemies' : 'single-enemy',
    flags: ['reflectable'],
    messageTemplate: party ? `{user} casts ${name} on all` : `{user} casts ${name}`,
  };
}

/** The abilities of the League fighters and of Elma (Yaibal's and Lucil's are in `./youth-league-abilities-named.ts`). */
export const leagueAbilities: AbilityDef[] = [
  // ---- the League ----------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: YL_ABILITY.attack,
    name: 'Attack',
    power: 16, // row 0x4000: formula 0, power 16, crit byte 5, shatter 10, accuracy formula 2 (the race with the monster's ACC)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: '{user} attacks {target}',
  },
  {
    ...base,
    id: YL_ABILITY.criticalAttack,
    name: 'Critical Attack',
    power: 16, // row 0x4015: formula 0, power 16, crit byte 255 (always a critical), shatter 100; accuracy formula 0 (always hits)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: '{user} strikes {target}',
  },
  {
    ...base,
    id: YL_ABILITY.flashBomb,
    name: 'Flash Bomb',
    power: 1, // row 0x40fd: formula 8, power 1, the party, Darkness at 50; always hits
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    statusEffects: [{ status: 'darkness', chance: 50, duration: 0 }],
    extra: { flat: 50 },
    messageTemplate: '{user} throws a Flash Bomb',
  },
  {
    ...base,
    id: YL_ABILITY.hiPotion,
    name: 'Hi-Potion',
    power: 20, // item row 0x2001: formula 5, power 20 = a fixed 1,000 on a friend under a quarter of its HP
    formula: 'fixed-no-variance',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-ally',
    flags: ['heals', 'never-break-damage-limit'],
    messageTemplate: '{user} uses a Hi-Potion on {target}',
  },
  {
    ...base,
    id: YL_ABILITY.demi,
    name: 'Demi',
    mpCost: 10, // [row 0x3082]
    power: 4, // formula 4: 25 percent of each girl's CURRENT HP, Gravity element, the whole party
    formula: 'percent-current',
    damageType: 'magical',
    element: ['gravity'],
    targeting: 'all-enemies',
    messageTemplate: '{user} casts Demi',
  },
  {
    ...base,
    id: YL_ABILITY.confuse,
    name: 'Confuse',
    mpCost: 12, // [row 0x4070]
    power: 0, // one girl, Confusion at 75; reflectable
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    statusEffects: [{ status: 'confuse', chance: 75, duration: 0 }],
    flags: ['reflectable'],
    messageTemplate: '{user} casts Confuse on {target}',
  },
  ra(YL_ABILITY.fira, 'Fira', 'fire', false),
  ra(YL_ABILITY.blizzara, 'Blizzara', 'ice', false),
  ra(YL_ABILITY.thundara, 'Thundara', 'lightning', false),
  ra(YL_ABILITY.watera, 'Watera', 'water', false),
  ra(YL_ABILITY.firaParty, 'Fira', 'fire', true),
  ra(YL_ABILITY.blizzaraParty, 'Blizzara', 'ice', true),
  ra(YL_ABILITY.thundaraParty, 'Thundara', 'lightning', true),
  ra(YL_ABILITY.wateraParty, 'Watera', 'water', true),

  // ---- Elma ----------------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: YL_ABILITY.elmaAttack,
    name: 'Attack',
    power: 16, // row 0x40e3: formula 0, power 16, no crit; accuracy formula 1 (the race against 130)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'Elma attacks {target}',
  },
  {
    ...base,
    id: YL_ABILITY.guard,
    name: 'Not-So-Mighty Guard',
    mpCost: 10, // [row 0x4086]
    power: 0, // her whole side: Shell, Protect (counters 126) and Regen (counter 50) at 254
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    statusEffects: [
      { status: 'shell', chance: 254, duration: 126 },
      { status: 'protect', chance: 254, duration: 126 },
      { status: 'regen', chance: 254, duration: 50 },
    ],
    messageTemplate: 'Elma casts Not-So-Mighty Guard',
  },
  {
    ...base,
    id: YL_ABILITY.osmose,
    name: 'Osmose',
    power: 8, // row 0x406d: the MP class, formula 4, power 3, taken by the user; always hits
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['drains-mp'],
    extra: { mpOnly: true },
    messageTemplate: 'Elma casts Osmose on {target}',
  },
  {
    ...base,
    id: YL_ABILITY.sleep,
    name: 'Sleep',
    mpCost: 8, // [row 0x406e]
    power: 0, // one girl, Sleep at 75; reflectable
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    statusEffects: [{ status: 'sleep', chance: 75, duration: 0 }],
    flags: ['reflectable'],
    messageTemplate: 'Elma casts Sleep on {target}',
  },
  {
    ...base,
    id: YL_ABILITY.hushGrenade,
    name: 'Hush Grenade',
    power: 1, // row 0x40fe: formula 8, power 1, the party, Silence at 50; always hits
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    statusEffects: [{ status: 'silence', chance: 50, duration: 0 }],
    extra: { flat: 50 },
    messageTemplate: 'Elma throws a Hush Grenade',
  },
  {
    ...base,
    id: YL_ABILITY.dispel,
    name: 'Dispel',
    mpCost: 12, // [row 0x30b8]
    power: 0, // a party row aimed at ONE girl (`m279.src`: `searchr_nop` then `setdircom`): Shell, Protect, Reflect, Regen, Haste and the "always" statuses off her at chance 254
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    removesStatuses: [...DISPEL_STRIPS],
    flags: ['removes-statuses'],
    messageTemplate: 'Elma casts Dispel on {target}',
  },
];

/** Every ability of the chapter (Yaibal's three and Lucil's ten are in `./youth-league-abilities-named.ts`). */
export const x2YouthLeagueAbilities: AbilityDef[] = [...yaibalAbilities, ...lucilAbilities, ...leagueAbilities];
