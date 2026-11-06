/**
 * The six other Dark Aeons' move rows (FFX only; the hidden Dark Aeons chapter, number 34). **Source: the game's own move rows**, `research/re-ffx-dark-aeons-six.md` section 5.1 ("RE six 5.1"; `[bytes]`), read from
 * `monmagic1.bin` by a script, and every command record below is **the game's row word for word**; `tests/unit/chapters/dark-aeons-six-data.test.ts` pins each one, field by field, to
 * `tests/fixtures/parity/ffx/dark_aeons_six_rows.json` (the 24 rows as decoded fields with their offsets). The 24 rows the six scripts queue are **21 distinct** ones: the two Hellfire rows (0x410C, 0x410D: Anima on the
 * field or not), the two Thor's Hammer rows (0x4111, 0x4112) and the two Aerospark rows (0x4110, 0x4116) **are identical in every mapped field** and differ only in an animation `[inferred]`, so each pair is carried once
 * (0x410C, 0x4111, 0x4110) with a test that pins the equality. Mega Graviton (0x4105) is the row Dark Anima shares with the Dark Magus Sisters: this file does not repeat it (`dark-mega-graviton`,
 * `./dark-aeons-abilities.ts`).
 *
 * | Row | Id | Used by | The row |
 * |---|---|---|---|
 * | Attack | `dark6-valefor-attack` 0x4062 | Dark Valefor, two turns in four | physical, formula 1, power 20; can crit, crit bonus from gear; shatter 10; cap 9,999 |
 * | Energy Ray | `dark6-energy-ray` 0x403D | Dark Valefor, one in four: the whole front line | magical, formula 3, power 26; cap 9,999 |
 * | Sonic Wings | `dark6-sonic-wings` 0x405D | Dark Valefor, one in four: one | physical, formula 1, power 8; Delay Attack; cap 9,999 |
 * | **Energy Blast** | `dark6-energy-blast` 0x4128 | Dark Valefor, gauge full: the whole front line | formula 15, power 4; shatter 100; cap 99,999 |
 * | Meteor Strike | `dark6-meteor-strike` 0x410E | Dark Ifrit, every ordinary turn: one | magical, formula 15, power 2; Delay Buster; cap 99,999 |
 * | Attack | `dark6-ifrit-attack` 0x410F | Dark Ifrit's counter; Dark Bahamut's every turn | physical, formula 1, power 16; crit bonus 25; shatter 100; cap 99,999 |
 * | **Hellfire** | `dark6-hellfire` 0x410C (0x410D) | Dark Ifrit, gauge full: the whole front line | formula 15, power 3; cap 99,999 |
 * | Thundaja | `dark6-thundaja` 0x4113 | Dark Ixion (first fight), every ordinary turn: one | magical, formula 3, power 200; Delay Buster; a Silence duration with no chance byte; cap 99,999 |
 * | Attack (first fight) | `dark6-ixion-attack-1` 0x4114 | Dark Ixion's counter | physical, formula 1, power 16; **accuracy formula 2, byte 254: can miss**; Armor Break, Mental Break, Sleep (99) |
 * | Aerospark | `dark6-aerospark` 0x4110 (0x4116) | Dark Ixion, first fight at a full gauge, second fight one turn in three: one | physical, formula 1, power 40; shatter 100; **cleanse** of the buffs and Auto-Life |
 * | Attack (second fight) | `dark6-ixion-attack-2` 0x4115 | Dark Ixion (second fight), two turns in three | as 0x4114 but Armor Break, Mental Break, **Confuse** |
 * | **Thor's Hammer** | `dark6-thors-hammer` 0x4111 (0x4112) | Dark Ixion (second fight), gauge full: the whole front line | formula 15, power 3; the four Breaks; cap 99,999 |
 * | Attack | `dark6-shiva-attack` 0x4119 | Dark Shiva, two turns in three | physical, formula 1, power 16; crit bonus 25; **rank 1**; **cleanse** of the buffs and Auto-Life |
 * | Heavenly Strike | `dark6-heavenly-strike` 0x4117 | Dark Shiva, one turn in three: one | physical, formula 1, power 32; shatter 100; **rank 2**; Death, Confuse, Berserk at 254 |
 * | **Diamond Dust** | `dark6-diamond-dust` 0x4118 | Dark Shiva, gauge full: the whole front line | formula 15, power 3; cap 99,999 |
 * | Impulse | `dark6-impulse` 0x411B | Dark Bahamut, every fifth allowed hit: the whole front line | formula 1, power 8; Delay Buster; Petrify, the four Breaks (254), **Slow (255)** |
 * | **Mega Flare** | `dark6-mega-flare` 0x411A | Dark Bahamut, gauge full: the whole front line | formula 15, power 2; Delay Buster; **cleanse** of the buffs (Auto-Life stays) |
 * | Attack | `dark6-anima-attack` 0x411C | Dark Anima, one turn in three: one | physical, formula 1, power 16; crit bonus 20; shatter 100; Zombie, Petrify, Poison (254) and Curse |
 * | Pain | `dark6-pain` 0x411D | Dark Anima, one turn in three: one | magical, formula 3, power 0, no damage class; **Death at 255** |
 * | **Oblivion** | `dark6-oblivion` 0x411E | Dark Anima, gauge full: the whole front line | formula 4, power 2, **16 hits on HP and MP**; Delay Buster; **cleanse** of the buffs (Auto-Life stays); cap 99,999 |
 *
 * **Rule 5 (AGENTS.md): every row has accuracy formula 0, so it never misses** (`canMiss: false`) **except Dark Ixion's two Attack rows (0x4114, 0x4115), which carry accuracy formula 2 on the byte 254 and leave `canMiss`
 * unset**: the kernel rolls `percent = 254 + user Luck (36) - (target Evasion + Luck) = 290 - (Evasion + Luck)` (RE six 6.2). The 99,999 cap, the crit bits and the shatter byte are each row's own; the rank is the record's
 * (1 and 2 for Dark Shiva's two quick rows, `attachCommandRecords` copies it onto the ability). The rows' animations, sounds and MP (the monsters pay none) are not modelled.
 */

import type { AbilityDef, FFXCommandRecord, StatusApplication, StatusId, Targeting } from '../../../battle/common/types.ts';

/** The row ids. */
export const DARK_SIX_ROWS = {
  valeforAttack: 'dark6-valefor-attack',
  energyRay: 'dark6-energy-ray',
  sonicWings: 'dark6-sonic-wings',
  energyBlast: 'dark6-energy-blast',
  meteorStrike: 'dark6-meteor-strike',
  ifritAttack: 'dark6-ifrit-attack',
  hellfire: 'dark6-hellfire',
  thundaja: 'dark6-thundaja',
  ixionAttack1: 'dark6-ixion-attack-1',
  aerospark: 'dark6-aerospark',
  ixionAttack2: 'dark6-ixion-attack-2',
  thorsHammer: 'dark6-thors-hammer',
  shivaAttack: 'dark6-shiva-attack',
  heavenlyStrike: 'dark6-heavenly-strike',
  diamondDust: 'dark6-diamond-dust',
  impulse: 'dark6-impulse',
  megaFlare: 'dark6-mega-flare',
  animaAttack: 'dark6-anima-attack',
  pain: 'dark6-pain',
  oblivion: 'dark6-oblivion',
} as const;

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> &
  Partial<Pick<AbilityDef, 'flags' | 'bonusCrit' | 'statusEffects' | 'shatterChance' | 'accuracy' | 'rank'>>;

/** The cap bit (bit 7 of the damage word), the crit bits (2 and 3) as the engine's flags. */
const CAP: AbilityDef['flags'] = ['always-break-damage-limit'];
const CRIT: AbilityDef['flags'] = ['crit-eligible', 'adds-equipment-crit'];
const CAP_CRIT: AbilityDef['flags'] = ['always-break-damage-limit', 'crit-eligible'];
const CAP_CRIT_GEAR: AbilityDef['flags'] = ['always-break-damage-limit', 'crit-eligible', 'adds-equipment-crit'];

/** The columns every row shares: a monster move, no MP, no element. `canMiss: false` (accuracy formula 0) unless the row says it rolls. */
function row(fields: Fields, rolls = false): AbilityDef {
  return {
    game: 'ffx',
    category: 'enemy',
    mpCost: 0,
    rank: 3,
    element: ['none'],
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    ...(rolls ? {} : { canMiss: false }), // accuracy formula 0 (RE six 5.1; AGENTS.md rule 5)
    messageTemplate: '{user} uses {ability}',
    ...fields,
  };
}

const apply = (status: StatusId, duration = 254, chance = 254): StatusApplication => ({ status, chance, duration });
const BREAKS: StatusId[] = ['power-break', 'magic-break', 'armor-break', 'mental-break'];

const single: Targeting = 'single-enemy'; // "enemy" is the user's opposite side: the party, for a monster
const group: Targeting = 'all-enemies';

export const valeforAttack = row({ id: DARK_SIX_ROWS.valeforAttack, name: 'Attack', power: 20, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CRIT, shatterChance: 10 });
export const energyRay = row({ id: DARK_SIX_ROWS.energyRay, name: 'Energy Ray', power: 26, formula: 'magic', damageType: 'magical', targeting: group, hits: 1 });
export const sonicWings = row({ id: DARK_SIX_ROWS.sonicWings, name: 'Sonic Wings', power: 8, formula: 'strength', damageType: 'physical', targeting: single, hits: 1 });
export const energyBlast = row({ id: DARK_SIX_ROWS.energyBlast, name: 'Energy Blast', power: 4, formula: 'special-magic', damageType: 'other', targeting: group, hits: 1, flags: CAP, shatterChance: 100 });
export const meteorStrike = row({ id: DARK_SIX_ROWS.meteorStrike, name: 'Meteor Strike', power: 2, formula: 'special-magic', damageType: 'magical', targeting: single, hits: 1, flags: CAP });
export const ifritAttack = row({ id: DARK_SIX_ROWS.ifritAttack, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CAP_CRIT, bonusCrit: 25, shatterChance: 100 });
export const hellfire = row({ id: DARK_SIX_ROWS.hellfire, name: 'Hellfire', power: 3, formula: 'special-magic', damageType: 'other', targeting: group, hits: 1, flags: CAP });
export const thundaja = row({ id: DARK_SIX_ROWS.thundaja, name: 'Thundaja', power: 200, formula: 'magic', damageType: 'magical', targeting: single, hits: 1, flags: CAP });
export const ixionAttack1 = row(
  {
    id: DARK_SIX_ROWS.ixionAttack1, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CAP_CRIT_GEAR, shatterChance: 100, accuracy: 254,
    statusEffects: [apply('armor-break'), apply('mental-break'), apply('sleep', 99)],
  },
  true,
);
export const aerospark = row({ id: DARK_SIX_ROWS.aerospark, name: 'Aerospark', power: 40, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CAP, shatterChance: 100 });
export const ixionAttack2 = row(
  {
    id: DARK_SIX_ROWS.ixionAttack2, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CAP_CRIT_GEAR, shatterChance: 100, accuracy: 254,
    statusEffects: [apply('armor-break'), apply('mental-break'), apply('confuse')],
  },
  true,
);
export const thorsHammer = row({ id: DARK_SIX_ROWS.thorsHammer, name: "Thor's Hammer", power: 3, formula: 'special-magic', damageType: 'other', targeting: group, hits: 1, flags: CAP, statusEffects: BREAKS.map((s) => apply(s)) });
export const shivaAttack = row({ id: DARK_SIX_ROWS.shivaAttack, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CAP_CRIT, bonusCrit: 25, rank: 1 });
export const heavenlyStrike = row({
  id: DARK_SIX_ROWS.heavenlyStrike, name: 'Heavenly Strike', power: 32, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CAP, shatterChance: 100, rank: 2,
  statusEffects: [apply('ko'), apply('confuse'), apply('berserk')],
});
export const diamondDust = row({ id: DARK_SIX_ROWS.diamondDust, name: 'Diamond Dust', power: 3, formula: 'special-magic', damageType: 'other', targeting: group, hits: 1, flags: CAP });
export const impulse = row({
  id: DARK_SIX_ROWS.impulse, name: 'Impulse', power: 8, formula: 'strength', damageType: 'other', targeting: group, hits: 1, flags: CAP,
  statusEffects: [apply('petrify'), ...BREAKS.map((s) => apply(s)), apply('slow', 254, 255)],
});
export const megaFlare = row({ id: DARK_SIX_ROWS.megaFlare, name: 'Mega Flare', power: 2, formula: 'special-magic', damageType: 'other', targeting: group, hits: 1, flags: CAP });
export const animaAttack = row({
  id: DARK_SIX_ROWS.animaAttack, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CAP_CRIT_GEAR, bonusCrit: 20, shatterChance: 100,
  statusEffects: [apply('zombie'), apply('petrify'), apply('poison')],
});
/** Pain: no damage class, no damage; Death at 255, which the chance-255 rule lets through any resist byte (RE six 5.2). */
export const pain = row({ id: DARK_SIX_ROWS.pain, name: 'Pain', power: 0, formula: 'magic', damageType: 'magical', targeting: single, hits: 1, flags: CAP, statusEffects: [apply('ko', 254, 255)] });
export const oblivion = row({ id: DARK_SIX_ROWS.oblivion, name: 'Oblivion', power: 2, formula: 'piercing-magic', damageType: 'other', targeting: group, hits: 16, flags: CAP });

/** The nine buffs a cleanse row removes (Shell 15, Protect 16, Reflect 17, the four Nuls 18 to 21, Regen 22, Haste 23), as the record's chance and duration pairs. */
const BUFF_CHANCES: ReadonlyArray<readonly [number, number]> = [15, 16, 17, 18, 19, 20, 21, 22, 23].map((n) => [n, 254] as const);
const BUFF_DURATIONS: ReadonlyArray<readonly [number, number]> = [3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [n, 254] as const);

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the rows of `dark_aeons_six_rows.json`. `chances` are `[status number, byte]` (0 Death, 1 Zombie,
 * 2 Petrify, 3 Poison, 4 to 7 the Breaks, 8 Confuse, 9 Berserk, 12 Sleep, 15 Shell ... 23 Haste, 24 Slow) and `durations` `[slot, byte]` (0 Sleep, 1 Silence, 3 to 11 the buffs, 12 Slow); `extra` is the extra-status word
 * (0x200 Auto-Life, 0x400 Curse). A cleanse row's bytes mean "remove this" (flag word 2 bit 5).
 */
export const COMMAND_RECORDS_DARK_SIX: Readonly<Record<string, FFXCommandRecord>> = {
  [DARK_SIX_ROWS.valeforAttack]: { id: 0x4062, type: 0, flagsMisc: 0x2, flagsDamage: 0xd, damageClass: 1, rank: 3, shatter: 10 },
  [DARK_SIX_ROWS.energyRay]: { id: 0x403d, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x2, damageClass: 1, rank: 3 },
  [DARK_SIX_ROWS.sonicWings]: { id: 0x405d, type: 0, flagsMisc: 0x2006, flagsDamage: 0x1, damageClass: 1, rank: 3 },
  [DARK_SIX_ROWS.energyBlast]: { id: 0x4128, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x80, damageClass: 1, rank: 3, shatter: 100 },
  [DARK_SIX_ROWS.meteorStrike]: { id: 0x410e, type: 0, flagsMisc: 0x4006, flagsDamage: 0x82, damageClass: 1, rank: 3 },
  [DARK_SIX_ROWS.ifritAttack]: { id: 0x410f, type: 0, flagsMisc: 0x2, flagsDamage: 0x85, damageClass: 1, rank: 3, shatter: 100 },
  [DARK_SIX_ROWS.hellfire]: { id: 0x410c, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x80, damageClass: 1, rank: 3 },
  [DARK_SIX_ROWS.thundaja]: { id: 0x4113, type: 0, flagsMisc: 0x4006, flagsDamage: 0x82, damageClass: 1, rank: 3, durations: [[1, 3]] },
  [DARK_SIX_ROWS.ixionAttack1]: { id: 0x4114, type: 0, flagsMisc: 0x52, flagsDamage: 0x8d, damageClass: 1, rank: 3, shatter: 100, chances: [[6, 254], [7, 254], [12, 254]], durations: [[0, 99]] },
  [DARK_SIX_ROWS.aerospark]: { id: 0x4110, type: 0, flagsMisc: 0x6, flagsDamage: 0xa1, damageClass: 1, rank: 3, shatter: 100, extra: 0x200, chances: BUFF_CHANCES, durations: BUFF_DURATIONS },
  [DARK_SIX_ROWS.ixionAttack2]: { id: 0x4115, type: 0, flagsMisc: 0x52, flagsDamage: 0x8d, damageClass: 1, rank: 3, shatter: 100, chances: [[6, 254], [7, 254], [8, 254]] },
  [DARK_SIX_ROWS.thorsHammer]: { id: 0x4111, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x80, damageClass: 1, rank: 3, chances: [[4, 254], [5, 254], [6, 254], [7, 254]] },
  [DARK_SIX_ROWS.shivaAttack]: { id: 0x4119, type: 0, flagsMisc: 0x2, flagsDamage: 0xa5, damageClass: 1, rank: 1, extra: 0x200, chances: BUFF_CHANCES, durations: BUFF_DURATIONS },
  [DARK_SIX_ROWS.heavenlyStrike]: { id: 0x4117, type: 0, flagsMisc: 0x6, flagsDamage: 0x81, damageClass: 1, rank: 2, shatter: 100, chances: [[0, 254], [8, 254], [9, 254]] },
  [DARK_SIX_ROWS.diamondDust]: { id: 0x4118, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x80, damageClass: 1, rank: 3 },
  [DARK_SIX_ROWS.impulse]: { id: 0x411b, type: 0, flagsMisc: 0x4006, flagsDamage: 0x80, damageClass: 1, rank: 3, chances: [[2, 254], [4, 254], [5, 254], [6, 254], [7, 254], [24, 255]], durations: [[12, 254]] },
  [DARK_SIX_ROWS.megaFlare]: { id: 0x411a, type: 0, flagsMisc: 0x40004006, flagsDamage: 0xa0, damageClass: 1, rank: 3, chances: BUFF_CHANCES, durations: BUFF_DURATIONS },
  [DARK_SIX_ROWS.animaAttack]: { id: 0x411c, type: 0, flagsMisc: 0x2, flagsDamage: 0x8d, damageClass: 1, rank: 3, shatter: 100, extra: 0x400, chances: [[1, 254], [2, 254], [3, 254]] },
  [DARK_SIX_ROWS.pain]: { id: 0x411d, type: 0, flagsMisc: 0x6, flagsDamage: 0x82, damageClass: 0, rank: 3, chances: [[0, 255]] },
  [DARK_SIX_ROWS.oblivion]: { id: 0x411e, type: 0, flagsMisc: 0x40004006, flagsDamage: 0xa0, damageClass: 3, rank: 3, chances: BUFF_CHANCES, durations: BUFF_DURATIONS },
};

export const DARK_SIX_ABILITIES: Readonly<Record<string, AbilityDef>> = Object.fromEntries(
  [
    valeforAttack, energyRay, sonicWings, energyBlast, meteorStrike, ifritAttack, hellfire, thundaja, ixionAttack1, aerospark, ixionAttack2, thorsHammer, shivaAttack, heavenlyStrike, diamondDust, impulse,
    megaFlare, animaAttack, pain, oblivion,
  ].map((a) => [a.id, a]),
);

/** Which game rows the carried ones stand for: the identical pairs (0x410D for 0x410C, 0x4112 for 0x4111, 0x4116 for 0x4110), pinned equal by the data test. */
export const DARK_SIX_TWIN_ROWS: Readonly<Record<number, number>> = { 0x410d: 0x410c, 0x4112: 0x4111, 0x4116: 0x4110 };
