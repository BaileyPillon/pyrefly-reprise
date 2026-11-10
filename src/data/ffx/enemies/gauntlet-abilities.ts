/**
 * The move rows of the hidden Gauntlet chapter's nine creations, the Ultima Buster's Head and its Arms (FFX only; chapter 54). **Source: the game's own move rows**, `research/re-ffx-monster-arena-creations.md`
 * section 2 ("RE n 2"; `[bytes]`): monster-magic-1 rows 0x4033 to 0x40FF and monster-magic-2 rows 0x6000 to 0x6036, as `tests/fixtures/parity/ffx/gauntlet_rows.json` decodes them (generated from the research
 * lane's record dump by `tools/gauntlet-rows-gen.mjs`; every row the dump lists was compared with the kernel fixtures `command_records.json` and `command_status.json`, 41 rows, 0 differences, and the five rows it does
 * not list were taken from those fixtures). Every command record below is **the game's row word for word**; `tests/unit/chapters/gauntlet-data.test.ts` pins each ability and each record to the fixture, field by field.
 *
 * | Row | Id | Used by (RE n 3) | The row |
 * |---|---|---|---|
 * | Attack | `gauntlet-attack` 0x40F0 | Earth Eater, Greater Sphere, Th'uban, the Ultima Buster | physical, formula 1, power 16; can crit, crit byte 10; shatter 100; cap 99,999 (the same row as Shinryu's) |
 * | Ultima | `gauntlet-ultima` 0x40F3 | the Ultima Buster, on the front line | magical, formula 3, power 70; **pierces Armored**; cap 99,999 |
 * | Contamination | `gauntlet-contamination` 0x40FE | the Ultima Buster (the Head's third turn) | special, formula 3, power 75; Zombie and Poison 255, the four Breaks, Confuse, Slow 254 |
 * | Special 1 | `gauntlet-special-1` 0x6001 | the Head's whole turn | no formula; the relay (the same row as Sinspawn Gui's head's) |
 * | Attack | `gauntlet-neslug-attack` 0x6000 | Neslug | physical, formula 1, power 16; **accuracy formula 2, byte 90: it can miss** (the possessed aeons' plain Attack) |
 * | Megaton, Slime | 0x60BE, 0x60BF | Neslug | physical formula 1 power 32 + Confuse 254 / special formula 3 power 60, front line, Poison, Silence, Slow 254, Armor and Mental Break 255 |
 * | Broken shell., Hides in shell., Emerges from shell. | 0x60C0 to 0x60C2 | Neslug's forced state rows | no formula, no damage |
 * | Toxic Cloud, Toxic Spray, Hundred Thorns | 0x40F7 to 0x40F9 | Catastrophe | magical f3 p43 front line + Poison, Confuse / physical-class f3 p52 + the four Breaks / physical f1 p16, crit byte 30 |
 * | Transform | `gauntlet-transform` 0x6007 | Catastrophe's form change | no formula, no damage |
 * | Megaton Punch | `gauntlet-megaton-punch` 0x40F5 | Earth Eater | special, formula 1, power 32; **Death 100** |
 * | Gets up. | `gauntlet-gets-up` 0x6018 | Earth Eater's rise | a cleanse of Power Break and Darkness from itself |
 * | Hydraulic Press | `gauntlet-hydraulic-press` 0x40FD | Greater Sphere | physical, formula 8, power 15: **15/16 of the target's maximum HP** |
 * | Elemental Shift | `gauntlet-elemental-shift` 0x6036 | Greater Sphere's state row | no formula, no damage (the same row as Spherimorph's) |
 * | Rainbow, Convergence, Condemn | 0x40FA to 0x40FC | Th'uban | special f1 p14 front line + Confuse 25, Sleep, Silence, Darkness 50 / magical f4 p63, **MDEF ignored** / physical f1 p12, **strips Shell, Protect, Reflect, the Nuls, Regen and Haste** |
 * | Attack, Cold Stare, Space,Time Vorpal | 0x40BA to 0x40BB, 0x40E2 | Jormungand | physical f1 p16, **accuracy formula 2, byte 150** / special f3 p20 + Petrify 254 / magical f3 p40, front line |
 * | 10000 Needles, 99999 Needles, Run Away | 0x40BC, 0x40F2, 0x4033 | Cactuar King | special f6 p200 = **10,000 flat** / special **f23 p51 = 509,949, capped to 99,999** / the departure |
 * | Attack, Voodoo, Karma, Waddle | 0x4062, 0x40EA, 0x40FF, 0x4081 | Don Tonberry | physical f1 p20 (Dark Valefor's row) / special f3 p255 / special **f22 p100 = kill count x 100** / the walk-in |
 *
 * **Formula 22 (Karma) is the `FormulaKey` `'kill-count'`** (added in stage 2, `docs/CONTRACT-CHANGES.md`): the hit adapter feeds the kernel the target's party number and its kill count (`FFXMemberBuild.kills`, `battle/ffx/adapt/kill-count.ts`); a target without a kill count takes the fallback, 0. The record's formula byte (22) and power (100) are pinned from the fixture.
 *
 * **Targets the fixture does not give** (the four Don Tonberry rows and the relay come from the kernel fixtures, which carry no target byte): the script's own use decides (RE n 3): Attack, Voodoo and Karma
 * aim at one party member, Waddle at itself, Special 1 at the body. Marked `[inferred]` on each row.
 *
 * **Rule 5 (AGENTS.md): a row with accuracy formula 0 never misses** (`canMiss: false`); the three physical Attacks with accuracy formula 2 (0x40BA, 0x6000) leave `canMiss` unset and carry their byte in `accuracy`.
 * The cap bit (99,999), the crit bits and the shatter byte are each row's own; the rank is the record's (3 on all). Delay Buster (record bit 0x4000), the cleanse rows' removals and the Curse extra bit live in the
 * record, as in the Dark Aeons' rows. The rows' animations, sounds and MP (the monsters pay none) are not modelled.
 */

import type { AbilityDef, ActionFlag, DamageType, FFXCommandRecord, FormulaKey, StatusApplication, StatusId, Targeting } from '../../../battle/common/types.ts';
import { GAUNTLET_ROWS as ROW } from '../gauntlet-ids.ts';

const CAP: ActionFlag = 'always-break-damage-limit';
const CRIT: ActionFlag = 'crit-eligible';
const GEAR: ActionFlag = 'adds-equipment-crit';

/** The status numbers of the command record (`FFXCommandRecord.chances`) as our ids. */
const STATUS_OF: Readonly<Record<number, StatusId>> = {
  0: 'ko', 1: 'zombie', 2: 'petrify', 3: 'poison', 4: 'power-break', 5: 'magic-break', 6: 'armor-break', 7: 'mental-break', 8: 'confuse', 12: 'sleep', 13: 'silence', 14: 'darkness', 24: 'slow',
};
const apply = (n: number, chance: number, duration = 254): StatusApplication => ({ status: STATUS_OF[n] as StatusId, chance, duration });
const BREAKS = [4, 5, 6, 7];

interface Spec {
  id: string;
  name: string;
  power: number;
  formula: FormulaKey;
  damageType: DamageType;
  targeting: Targeting;
  hits: number;
  flags?: ActionFlag[];
  bonusCrit?: number;
  shatterChance?: number;
  /** The accuracy byte of a row with accuracy formula 2: such a row can miss, so `canMiss` stays unset. */
  accuracy?: number;
  statusEffects?: StatusApplication[];
}

/** The columns every row shares: a monster move of rank 3, no MP, no element. `canMiss: false` (accuracy formula 0) unless the row carries an accuracy byte. */
function row(s: Spec): AbilityDef {
  const { accuracy, ...rest } = s;
  return {
    game: 'ffx', category: 'enemy', mpCost: 0, rank: 3, element: ['none'], statusEffects: [], removesStatuses: [], flags: [], messageTemplate: '{user} uses {ability}',
    ...(accuracy === undefined ? { canMiss: false } : { accuracy }), // accuracy formula 0 (RE n 2; AGENTS.md rule 5)
    ...rest,
  };
}
/** A state row: no formula, no damage, aimed at its own user. */
const state = (id: string, name: string, hits = 0): AbilityDef => row({ id, name, power: 0, formula: 'none', damageType: 'other', targeting: 'self', hits });

const single: Targeting = 'single-enemy'; // "enemy" is the user's opposite side: the party, for a creature
const front: Targeting = 'all-enemies';

export const gauntletAttack = row({ id: ROW.attack, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: [CAP, CRIT, GEAR], bonusCrit: 10, shatterChance: 100 });
export const gauntletUltima = row({ id: ROW.ultima, name: 'Ultima', power: 70, formula: 'magic', damageType: 'magical', targeting: front, hits: 1, flags: [CAP], shatterChance: 100 }); // pierces Armored by the record's bit 0x10000, not by an ability flag
export const gauntletContamination = row({
  id: ROW.contamination, name: 'Contamination', power: 75, formula: 'magic', damageType: 'other', targeting: single, hits: 1, flags: [CAP], shatterChance: 100,
  statusEffects: [apply(1, 255), apply(3, 255), ...BREAKS.map((n) => apply(n, 254)), apply(8, 254), apply(24, 254)],
});
export const gauntletSpecial1 = state(ROW.special1, 'Special 1'); // [inferred] aimed at the body (RE n 3.1)
export const gauntletNeslugAttack = row({ id: ROW.neslugAttack, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: ['affected-by-darkness'], accuracy: 90 });
export const gauntletMegaton = row({ id: ROW.megaton, name: 'Megaton', power: 32, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: [CAP], shatterChance: 100, statusEffects: [apply(8, 254)] });
export const gauntletSlime = row({
  id: ROW.slime, name: 'Slime', power: 60, formula: 'magic', damageType: 'other', targeting: front, hits: 1, flags: [CAP], shatterChance: 100,
  statusEffects: [apply(3, 254), apply(6, 255), apply(7, 255), apply(13, 254), apply(24, 254)],
});
export const gauntletBrokenShell = state(ROW.brokenShell, 'Broken shell.');
export const gauntletHidesInShell = state(ROW.hidesInShell, 'Hides in shell.');
export const gauntletEmergesFromShell = state(ROW.emergesFromShell, 'Emerges from shell.');
export const gauntletToxicCloud = row({ id: ROW.toxicCloud, name: 'Toxic Cloud', power: 43, formula: 'magic', damageType: 'magical', targeting: front, hits: 1, flags: [CAP], shatterChance: 100, statusEffects: [apply(3, 254), apply(8, 254)] });
export const gauntletToxicSpray = row({ id: ROW.toxicSpray, name: 'Toxic Spray', power: 52, formula: 'magic', damageType: 'physical', targeting: single, hits: 1, flags: [CAP], shatterChance: 100, statusEffects: BREAKS.map((n) => apply(n, 254)) });
export const gauntletHundredThorns = row({ id: ROW.hundredThorns, name: 'Hundred Thorns', power: 16, formula: 'strength', damageType: 'physical', targeting: front, hits: 1, flags: [CAP, CRIT], bonusCrit: 30, shatterChance: 100 });
export const gauntletTransform = state(ROW.transform, 'Transform');
export const gauntletMegatonPunch = row({ id: ROW.megatonPunch, name: 'Megaton Punch', power: 32, formula: 'strength', damageType: 'other', targeting: single, hits: 1, flags: [CAP], shatterChance: 100, statusEffects: [apply(0, 100)] });
export const gauntletGetsUp = state(ROW.getsUp, 'Gets up.'); // a cleanse of Power Break and Darkness from itself (record chances 255)
export const gauntletHydraulicPress = row({ id: ROW.hydraulicPress, name: 'Hydraulic Press', power: 15, formula: 'percent-total', damageType: 'physical', targeting: front, hits: 1, flags: [CAP], shatterChance: 100 });
export const gauntletElementalShift = state(ROW.elementalShift, 'Elemental Shift');
export const gauntletRainbow = row({
  id: ROW.rainbow, name: 'Rainbow', power: 14, formula: 'strength', damageType: 'other', targeting: front, hits: 1, flags: [CAP], shatterChance: 100,
  statusEffects: [apply(8, 25), apply(12, 50, 3), apply(13, 50, 3), apply(14, 50, 3)],
});
export const gauntletConvergence = row({ id: ROW.convergence, name: 'Convergence', power: 63, formula: 'piercing-magic', damageType: 'magical', targeting: single, hits: 1, flags: [CAP], shatterChance: 100 });
export const gauntletCondemn = row({ id: ROW.condemn, name: 'Condemn', power: 12, formula: 'strength', damageType: 'physical', targeting: front, hits: 1, flags: [CAP, CRIT], bonusCrit: 25, shatterChance: 100 }); // a cleanse row: the buffs it strips are the record's chances
export const gauntletJormungandAttack = row({ id: ROW.jormungandAttack, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: [CAP, CRIT, GEAR, 'affected-by-darkness'], shatterChance: 100, accuracy: 150 });
export const gauntletColdStare = row({ id: ROW.coldStare, name: 'Cold Stare', power: 20, formula: 'magic', damageType: 'other', targeting: single, hits: 1, flags: [CAP], statusEffects: [apply(2, 254)] });
export const gauntletVorpal = row({ id: ROW.vorpal, name: 'Space,Time Vorpal', power: 40, formula: 'magic', damageType: 'magical', targeting: front, hits: 1, shatterChance: 100 });
export const gauntletNeedles10000 = row({ id: ROW.needles10000, name: '10000 Needles', power: 200, formula: 'fixed-no-variance', damageType: 'other', targeting: single, hits: 1, flags: [CAP], shatterChance: 100 });
export const gauntletNeedles99999 = row({ id: ROW.needles99999, name: '99999 Needles', power: 51, formula: 'deal-9999', damageType: 'other', targeting: single, hits: 1, flags: [CAP], shatterChance: 100 });
export const gauntletRunAway = state(ROW.runAway, 'Run Away', 1);
export const gauntletTonberryAttack = row({ id: ROW.tonberryAttack, name: 'Attack', power: 20, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: [CRIT, GEAR], shatterChance: 10 }); // targeting [inferred]
export const gauntletVoodoo = row({ id: ROW.voodoo, name: 'Voodoo', power: 255, formula: 'magic', damageType: 'other', targeting: single, hits: 1, flags: [CAP] }); // targeting [inferred]
/** Formula 22 (the target's kill count x power; `'kill-count'`, 0x16 in the kernel's numbering, fed by `battle/ffx/adapt/kill-count.ts`). Targeting [inferred]: the last attacker. */
export const gauntletKarma = row({ id: ROW.karma, name: 'Karma', power: 100, formula: 'kill-count', damageType: 'other', targeting: single, hits: 1, flags: [CAP] });
export const gauntletWaddle = state(ROW.waddle, 'Waddle', 1); // [inferred] aimed at itself

/** Every row, for the data index (`./hidden-ffx.ts`). */
export const GAUNTLET_ABILITIES: Readonly<Record<string, AbilityDef>> = Object.fromEntries(
  [
    gauntletAttack, gauntletUltima, gauntletContamination, gauntletSpecial1, gauntletNeslugAttack, gauntletMegaton, gauntletSlime, gauntletBrokenShell, gauntletHidesInShell, gauntletEmergesFromShell,
    gauntletToxicCloud, gauntletToxicSpray, gauntletHundredThorns, gauntletTransform, gauntletMegatonPunch, gauntletGetsUp, gauntletHydraulicPress, gauntletElementalShift, gauntletRainbow,
    gauntletConvergence, gauntletCondemn, gauntletJormungandAttack, gauntletColdStare, gauntletVorpal, gauntletNeedles10000, gauntletNeedles99999, gauntletRunAway, gauntletTonberryAttack, gauntletVoodoo,
    gauntletKarma, gauntletWaddle,
  ].map((a) => [a.id, a]),
);

/** The nine buffs a cleanse row removes (Shell 15, Protect 16, Reflect 17, the four Nuls 18 to 21, Regen 22, Haste 23), as the record's chance and duration pairs. */
const BUFF_CHANCES: ReadonlyArray<readonly [number, number]> = [15, 16, 17, 18, 19, 20, 21, 22, 23].map((n) => [n, 255] as const);
const BUFF_DURATIONS: ReadonlyArray<readonly [number, number]> = [3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [n, 254] as const);

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the rows of `gauntlet_rows.json`. `chances` are `[status number, byte]` (0 Death, 1 Zombie,
 * 2 Petrify, 3 Poison, 4 to 7 the Breaks, 8 Confuse, 12 Sleep, 13 Silence, 14 Darkness, 15 Shell ... 23 Haste, 24 Slow) and `durations` `[slot, byte]` (0 Sleep, 1 Silence, 2 Darkness, 3 to 11 the buffs, 12 Slow);
 * `extra` is the extra-status word (0x200 Auto-Life, 0x400 Curse). A cleanse row's bytes mean "remove this" (flag word bit 0x20 of the damage word).
 */
export const COMMAND_RECORDS_GAUNTLET: Readonly<Record<string, FFXCommandRecord>> = {
  [ROW.attack]: { id: 0x40f0, type: 0, flagsMisc: 0x2, flagsDamage: 0x8d, damageClass: 1, rank: 3, shatter: 100 },
  [ROW.ultima]: { id: 0x40f3, type: 0, flagsMisc: 0x15230006, flagsDamage: 0x82, damageClass: 1, rank: 3, shatter: 100 },
  [ROW.contamination]: { id: 0x40fe, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, rank: 3, shatter: 100, chances: [[1, 255], [3, 255], [4, 254], [5, 254], [6, 254], [7, 254], [8, 254], [24, 254]], durations: [[12, 254]] },
  [ROW.special1]: { id: 0x6001, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [ROW.neslugAttack]: { id: 0x6000, type: 0, flagsMisc: 0x52, flagsDamage: 0x1, damageClass: 1, rank: 3 },
  [ROW.megaton]: { id: 0x60be, type: 0, flagsMisc: 0x6, flagsDamage: 0x81, damageClass: 1, rank: 3, shatter: 100, chances: [[8, 254]] },
  [ROW.slime]: { id: 0x60bf, type: 0, flagsMisc: 0x4006, flagsDamage: 0x80, damageClass: 1, rank: 3, shatter: 100, extra: 0x400, chances: [[3, 254], [6, 255], [7, 255], [13, 254], [24, 254]] },
  [ROW.brokenShell]: { id: 0x60c0, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [ROW.hidesInShell]: { id: 0x60c1, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [ROW.emergesFromShell]: { id: 0x60c2, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [ROW.toxicCloud]: { id: 0x40f7, type: 0, flagsMisc: 0x6, flagsDamage: 0x82, damageClass: 1, rank: 3, shatter: 100, extra: 0x400, chances: [[3, 254], [8, 254]] },
  [ROW.toxicSpray]: { id: 0x40f8, type: 0, flagsMisc: 0x6, flagsDamage: 0x81, damageClass: 1, rank: 3, shatter: 100, chances: [[4, 254], [5, 254], [6, 254], [7, 254]] },
  [ROW.hundredThorns]: { id: 0x40f9, type: 0, flagsMisc: 0x6, flagsDamage: 0x85, damageClass: 1, rank: 3, shatter: 100 },
  [ROW.transform]: { id: 0x6007, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3, durations: [[1, 1]] },
  [ROW.megatonPunch]: { id: 0x40f5, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, rank: 3, shatter: 100, chances: [[0, 100]] },
  [ROW.getsUp]: { id: 0x6018, type: 0, flagsMisc: 0x2, flagsDamage: 0x20, damageClass: 0, rank: 3, chances: [[4, 255], [14, 255]], durations: [[2, 254]] },
  [ROW.hydraulicPress]: { id: 0x40fd, type: 0, flagsMisc: 0x6, flagsDamage: 0x81, damageClass: 1, rank: 3, shatter: 100 },
  [ROW.elementalShift]: { id: 0x6036, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [ROW.rainbow]: { id: 0x40fa, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, rank: 3, shatter: 100, extra: 0x400, chances: [[8, 25], [12, 50], [13, 50], [14, 50]], durations: [[0, 3], [1, 3], [2, 3]] },
  [ROW.convergence]: { id: 0x40fb, type: 0, flagsMisc: 0x6, flagsDamage: 0x82, damageClass: 1, rank: 3, shatter: 100 },
  [ROW.condemn]: { id: 0x40fc, type: 0, flagsMisc: 0x4006, flagsDamage: 0xa5, damageClass: 1, rank: 3, shatter: 100, extra: 0x200, chances: BUFF_CHANCES, durations: BUFF_DURATIONS },
  [ROW.jormungandAttack]: { id: 0x40ba, type: 0, flagsMisc: 0x52, flagsDamage: 0x8d, damageClass: 1, rank: 3, shatter: 100 },
  [ROW.coldStare]: { id: 0x40bb, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, rank: 3, chances: [[2, 254]] },
  [ROW.vorpal]: { id: 0x40e2, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1, rank: 3, shatter: 100 },
  [ROW.needles10000]: { id: 0x40bc, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, rank: 3, shatter: 100 },
  [ROW.needles99999]: { id: 0x40f2, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, rank: 3, shatter: 100 },
  [ROW.runAway]: { id: 0x4033, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [ROW.tonberryAttack]: { id: 0x4062, type: 0, flagsMisc: 0x2, flagsDamage: 0xd, damageClass: 1, rank: 3, shatter: 10 },
  [ROW.voodoo]: { id: 0x40ea, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, rank: 3 },
  [ROW.karma]: { id: 0x40ff, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, rank: 3 },
  [ROW.waddle]: { id: 0x4081, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 },
};
