/**
 * Belgemine's aeons' new move rows (FFX only; the hidden Belgemine's Challenge chapter, number 45). **Source: the game's own move rows**, `research/re-ffx-belgemine-aeon-duels.md` section 4 ("RE 4"; `[bytes]`), and every
 * command record below is **the game's row word for word** from the two kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`, the Steam HD build's monster-magic-1 table).
 * `tests/unit/chapters/belgemine-data.test.ts` pins each one to the fixtures.
 *
 * **Fourteen rows the scripts use are not here, because an earlier chapter already carries the same kernel row** (`./belgemine-ids.ts` `BELG_ROWS`): Chapter XIV's aeons share the monster files `m254`, `m284` and `m287` with Belgemine's
 * (RE 2 item 3), so Summon (0x408B, 0x408C, 0x408F), Attack (0x4000, 0x407F), Sonic Wings (0x405D), Energy Ray (0x403D), Hellfire (0x405E) and Mega Flare (0x405F) are `isaaru-abilities.ts`'s; the Cavern's Yojimbo is the same file
 * `m288`, so his Summon (0x4090), Kozuka (0x4082), Wakizashi (0x4083), Zanmato (0x4085) and the dog's bite (0x40B1) are `yojimbo-abilities.ts`'s. The player's own spells (Blizzara, Blizzaga, Fira, Firaga, Thundara, Thundaga, Watera, Waterga,
 * Flare, Ultima, Holy, Drain, Osmose, Demi, Dispel, Shell, Protect, Cura, Regen) are the engine's player-side rows, used by their ids, as the Keeper and the possessed Sisters use them.
 *
 * | Row | Id | Used by (RE 3) | The row |
 * |---|---|---|---|
 * | Summon (Shiva, Ixion, Anima, the Sisters) | `belg-summon-*` 0x408D, 0x408E, 0x4091, 0x4092 | each aeon's first turn | no damage, one hit record, aimed at Belgemine (an ally) |
 * | Energy Blast | `belg-energy-blast` 0x40A6 | Valefor, gauge full | magic 40, type Other, the whole front line |
 * | Meteor Strike | `belg-meteor-strike` 0x4089 | Ifrit, after a physical hit | magic 28, magical, one; pierces Armored |
 * | Aerospark | `belg-aerospark` 0x4064 | Ixion | strength 22, physical, one; **removes** Shell, Protect, Reflect, the four Nuls, Regen and Haste |
 * | Thor's Hammer | `belg-thors-hammer` 0x4065 | Ixion, gauge full | magic 40, type Other, Thunder, the whole front line |
 * | Heavenly Strike | `belg-heavenly-strike` 0x40AC | Shiva | strength 30, physical, one; weak Delay (no Threaten: that is Calm Lands' row 0x4095) |
 * | Diamond Dust | `belg-diamond-dust` 0x4096 | Shiva, gauge full | magic 40, type Other, Ice, the whole front line |
 * | Impulse | `belg-impulse` 0x40AD | Bahamut, every fifth counter | strength 25, type Other, the whole front line; weak Delay; pierces Armored |
 * | Daigoro (the order) | `belg-daigoro-order` 0x4086 | Yojimbo | no damage; orders the dog, whose bite falls on the game's pick |
 * | Attack (Anima's) | `belg-anima-attack` 0x40AE | Anima | strength 16, physical, accuracy formula 2 on 95, crit bonus 20 |
 * | Pain | `belg-pain` 0x40AF | Anima | magic 20, magical, one; **Death at 100** |
 * | Oblivion | `belg-oblivion` 0x40B0 | Anima, gauge full | magic 6 x **16 hits**, type Other, the whole front line; weak Delay |
 * | Razzia, Camisade | `belg-razzia` 0x40DA, `belg-camisade` 0x40DB | Sandy, Cindy | strength 21, physical, one; pierces Armored; can crit |
 * | Passado | `belg-passado` 0x40DC | Mindy | strength 2 x **15 hits**, physical, one; pierces Armored |
 * | Delta Attack | `belg-delta-attack` 0x40DD | Cindy, all three gauges full | strength 10 x **6 hits**, type Other, the whole front line |
 * | Mighty Guard | `belg-mighty-guard` 0x40DE | Cindy, every seventh turn | no damage; **Shell and Protect (6 turns) and the four Nuls (1 charge) at 255** on the three Sisters |
 * | White Wind | `belg-white-wind` 0x405A | Cindy, all three below half HP | percent-current 8 (half of each one's current HP), heals; **removes** the statuses Zombie to Slow |
 *
 * **Rule 5 (AGENTS.md): every row here has accuracy formula 0, so it never misses (`canMiss: false`), except Anima's Attack**, which carries accuracy formula 2 on the byte 95 and rolls against the target's Evasion.
 * Magic and every Overdrive always hit. The records carry the delay, armour and crit bits; the engine reads the record (`attachCommandRecords`).
 */

import type { AbilityDef, FFXCommandRecord, StatusApplication, StatusId } from '../../../battle/common/types.ts';
import { BELG_ROWS, BELG_IDS } from '../belgemine-ids.ts';
import { DAIGORO_ATTACK } from './yojimbo-abilities.ts';

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> &
  Partial<Pick<AbilityDef, 'flags' | 'bonusCrit' | 'statusEffects' | 'removesStatuses' | 'extra' | 'accuracy' | 'element'>>;

/** The columns every row shares: a monster move of rank 3, no MP, no element; it never misses (accuracy formula 0) unless the row says it rolls. */
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
    ...(rolls ? {} : { canMiss: false }), // accuracy formula 0 (AGENTS.md rule 5)
    messageTemplate: '{user} uses {ability}',
    ...fields,
  };
}

const apply = (status: StatusId, chance: number, duration = 254): StatusApplication => ({ status, chance, duration });
const single = 'single-enemy' as const; // "enemy" is the user's opposite side: the party, for a monster
const group = 'all-enemies' as const;
const CRIT: AbilityDef['flags'] = ['crit-eligible', 'adds-equipment-crit'];
/** The nine buffs a cleanse row of the monster tables removes (Shell 15, Protect 16, Reflect 17, the four Nuls 18 to 21, Regen 22, Haste 23). */
const BUFFS: StatusId[] = ['shell', 'protect', 'reflect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste'];
/** What White Wind removes (Zombie 1, Petrify 2, Poison 3, Confuse 8, Berserk 9, Provoke 10, Threaten 11, Sleep 12, Silence 13, Darkness 14, Slow 24). */
const AILMENTS: StatusId[] = ['zombie', 'petrify', 'poison', 'confuse', 'berserk', 'provoke', 'threaten', 'sleep', 'silence', 'darkness', 'slow'];

/** A first-turn Summon: no damage, one hit record, aimed at Belgemine (an ally), so the hit lands on her and not on the aeon. */
function summonRow(id: string): AbilityDef {
  return row({ id, name: 'Summon', power: 0, formula: 'none', damageType: 'other', targeting: 'single-ally', hits: 1 });
}

export const summonShiva = summonRow(BELG_ROWS.summonShiva);
export const summonIxion = summonRow(BELG_ROWS.summonIxion);
export const summonAnima = summonRow(BELG_ROWS.summonAnima);
export const summonSisters = summonRow(BELG_ROWS.summonSisters);

export const energyBlast = row({ id: BELG_ROWS.energyBlast, name: 'Energy Blast', power: 40, formula: 'magic', damageType: 'other', targeting: group, hits: 1 });
export const meteorStrike = row({ id: BELG_ROWS.meteorStrike, name: 'Meteor Strike', power: 28, formula: 'magic', damageType: 'magical', targeting: single, hits: 1, flags: ['ignores-armored'] });
export const aerospark = row({
  id: BELG_ROWS.aerospark, name: 'Aerospark', power: 22, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: ['removes-statuses'], removesStatuses: BUFFS,
});
export const thorsHammer = row({ id: BELG_ROWS.thorsHammer, name: "Thor's Hammer", power: 40, formula: 'magic', damageType: 'other', element: ['lightning'], targeting: group, hits: 1 });
export const heavenlyStrike = row({ id: BELG_ROWS.heavenlyStrike, name: 'Heavenly Strike', power: 30, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: ['weak-delay'] });
export const diamondDust = row({ id: BELG_ROWS.diamondDust, name: 'Diamond Dust', power: 40, formula: 'magic', damageType: 'other', element: ['ice'], targeting: group, hits: 1 });
export const impulse = row({ id: BELG_ROWS.impulse, name: 'Impulse', power: 25, formula: 'strength', damageType: 'other', targeting: group, hits: 1, flags: ['weak-delay', 'ignores-armored'] });

/**
 * 0x4086: no damage, one hit record, an order to the dog. The dog (`belg-daigoro`) bites with the Cavern's row (0x40B1, `DAIGORO_ATTACK`) on **the game's own pick** over the living front line (`extra.orderedAim`,
 * `battle/ffx/orders.ts`), with its own Strength 25. Aimed at the dog, as the Dark Yojimbo's is.
 */
export const daigoroOrder = row({
  id: BELG_ROWS.daigoroOrder, name: 'Daigoro', power: 0, formula: 'none', damageType: 'other', targeting: 'self', hits: 1,
  extra: { ordersActor: BELG_IDS.dog, orderedAbility: DAIGORO_ATTACK, orderedAim: 'game-picker' },
});

/** 0x40AE: Anima's Attack: accuracy formula 2 on 95 (it rolls against Evasion), crit bonus 20, the weapon's crit bonus added. */
export const animaAttack = row(
  { id: BELG_ROWS.animaAttack, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CRIT, bonusCrit: 20, accuracy: 95 },
  true,
);
/** 0x40AF: magic 20 and Death at 100, one target. */
export const pain = row({ id: BELG_ROWS.pain, name: 'Pain', power: 20, formula: 'magic', damageType: 'magical', targeting: single, hits: 1, statusEffects: [apply('ko', 100)] });
/** 0x40B0: magic 6, **16 hits**, type Other, the whole front line, weak Delay. */
export const oblivion = row({ id: BELG_ROWS.oblivion, name: 'Oblivion', power: 6, formula: 'magic', damageType: 'other', targeting: group, hits: 16, flags: ['weak-delay'] });

const SISTER_BLOW: AbilityDef['flags'] = [...CRIT, 'ignores-armored'];
export const razzia = row({ id: BELG_ROWS.razzia, name: 'Razzia', power: 21, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: SISTER_BLOW });
export const camisade = row({ id: BELG_ROWS.camisade, name: 'Camisade', power: 21, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: SISTER_BLOW });
export const passado = row({ id: BELG_ROWS.passado, name: 'Passado', power: 2, formula: 'strength', damageType: 'physical', targeting: single, hits: 15, flags: SISTER_BLOW });
/** 0x40DD: strength 10, **6 hits**, neither physical nor magical (the damage word is the crit bits alone), the whole front line. */
export const deltaAttack = row({ id: BELG_ROWS.deltaAttack, name: 'Delta Attack', power: 10, formula: 'strength', damageType: 'other', targeting: group, hits: 6, flags: CRIT });
/**
 * 0x40DE: no damage; Shell and Protect (6 turns) and the four Nuls (1 charge) at 255 on the three Sisters: `all-allies` with `groupTarget`, so the script names who it reaches. **`formula: 'none'`, as the party's Shell is**
 * (the record carries formula byte 3, Magic, power 0: a `'magic'` row would emit a damage event of 0 on each Sister).
 */
export const mightyGuard = row({
  id: BELG_ROWS.mightyGuard, name: 'Mighty Guard', power: 0, formula: 'none', damageType: 'other', targeting: 'all-allies', hits: 1,
  statusEffects: [apply('shell', 255, 6), apply('protect', 255, 6), apply('nultide', 255, 1), apply('nulblaze', 255, 1), apply('nulshock', 255, 1), apply('nulfrost', 255, 1)],
  extra: { groupTarget: true },
});
/** 0x405A: percent-current 8, heals (half of each one's current HP), and removes the eleven ailments Zombie to Slow at 255; the three Sisters. */
export const whiteWind = row({
  id: BELG_ROWS.whiteWind, name: 'White Wind', power: 8, formula: 'percent-current', damageType: 'other', targeting: 'all-allies', hits: 1, flags: ['heals', 'removes-statuses'], removesStatuses: AILMENTS,
  extra: { groupTarget: true },
});

/** Every new row, keyed by id, for the data index (`./hidden-ffx.ts`). */
export const BELGEMINE_ABILITIES: Readonly<Record<string, AbilityDef>> = Object.fromEntries(
  [
    summonShiva, summonIxion, summonAnima, summonSisters, energyBlast, meteorStrike, aerospark, thorsHammer, heavenlyStrike, diamondDust, impulse, daigoroOrder, animaAttack, pain, oblivion, razzia, camisade, passado,
    deltaAttack, mightyGuard, whiteWind,
  ].map((a) => [a.id, a]),
);

/** The buffs a cleanse record removes, as the record's chance and duration pairs (status numbers 15 to 23; temporal slots 3 to 11; byte 254). */
const BUFF_CHANCES: ReadonlyArray<readonly [number, number]> = [15, 16, 17, 18, 19, 20, 21, 22, 23].map((n) => [n, 254] as const);
const BUFF_DURATIONS: ReadonlyArray<readonly [number, number]> = [3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => [n, 254] as const);
const SUMMON_RECORD = { type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 } as const;

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. `chances` are `[status number, byte]`
 * (0 Death, 1 Zombie, 2 Petrify, 3 Poison, 8 Confuse, 9 Berserk, 10 Provoke, 11 Threaten, 12 Sleep, 13 Silence, 14 Darkness, 15 Shell, 16 Protect, 18 to 21 the Nuls, 22 Regen, 23 Haste, 24 Slow) and `durations` `[temporal slot, byte]`
 * (3 Shell, 4 Protect, 6 to 9 the Nuls). A cleanse row's bytes mean "remove this" (damage-flag bit 5).
 */
export const COMMAND_RECORDS_BELGEMINE: Readonly<Record<string, FFXCommandRecord>> = {
  [BELG_ROWS.summonShiva]: { id: 0x408d, ...SUMMON_RECORD },
  [BELG_ROWS.summonIxion]: { id: 0x408e, ...SUMMON_RECORD },
  [BELG_ROWS.summonAnima]: { id: 0x4091, ...SUMMON_RECORD },
  [BELG_ROWS.summonSisters]: { id: 0x4092, ...SUMMON_RECORD },
  [BELG_ROWS.energyBlast]: { id: 0x40a6, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x0, damageClass: 1, rank: 3 },
  [BELG_ROWS.meteorStrike]: { id: 0x4089, type: 0, flagsMisc: 0x10006, flagsDamage: 0x2, damageClass: 1, rank: 3 },
  [BELG_ROWS.aerospark]: { id: 0x4064, type: 0, flagsMisc: 0x6, flagsDamage: 0x21, damageClass: 1, rank: 3, chances: BUFF_CHANCES, durations: BUFF_DURATIONS },
  [BELG_ROWS.thorsHammer]: { id: 0x4065, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x0, damageClass: 1, rank: 3 },
  [BELG_ROWS.heavenlyStrike]: { id: 0x40ac, type: 0, flagsMisc: 0x2006, flagsDamage: 0x1, damageClass: 1, rank: 3 },
  [BELG_ROWS.diamondDust]: { id: 0x4096, type: 0, flagsMisc: 0x40000006, flagsDamage: 0x0, damageClass: 1, rank: 3 },
  [BELG_ROWS.impulse]: { id: 0x40ad, type: 0, flagsMisc: 0x12006, flagsDamage: 0x0, damageClass: 1, rank: 3 },
  [BELG_ROWS.daigoroOrder]: { id: 0x4086, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [BELG_ROWS.animaAttack]: { id: 0x40ae, type: 0, flagsMisc: 0x12, flagsDamage: 0xd, damageClass: 1, rank: 3 },
  [BELG_ROWS.pain]: { id: 0x40af, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1, rank: 3, chances: [[0, 100]] },
  [BELG_ROWS.oblivion]: { id: 0x40b0, type: 0, flagsMisc: 0x40002006, flagsDamage: 0x0, damageClass: 1, rank: 3 },
  [BELG_ROWS.razzia]: { id: 0x40da, type: 0, flagsMisc: 0x10006, flagsDamage: 0xd, damageClass: 1, rank: 3 },
  [BELG_ROWS.camisade]: { id: 0x40db, type: 0, flagsMisc: 0x10006, flagsDamage: 0xd, damageClass: 1, rank: 3 },
  [BELG_ROWS.passado]: { id: 0x40dc, type: 0, flagsMisc: 0x10006, flagsDamage: 0xd, damageClass: 1, rank: 3 },
  [BELG_ROWS.deltaAttack]: { id: 0x40dd, type: 0, flagsMisc: 0x40000006, flagsDamage: 0xc, damageClass: 1, rank: 3 },
  [BELG_ROWS.mightyGuard]: {
    id: 0x40de, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0, rank: 3,
    chances: [[15, 255], [16, 255], [18, 255], [19, 255], [20, 255], [21, 255]], durations: [[3, 6], [4, 6], [6, 1], [7, 1], [8, 1], [9, 1]],
  },
  [BELG_ROWS.whiteWind]: {
    id: 0x405a, type: 0, flagsMisc: 0x6, flagsDamage: 0x30, damageClass: 1, rank: 3,
    chances: [[1, 255], [2, 255], [3, 255], [8, 255], [9, 255], [10, 255], [11, 255], [12, 255], [13, 255], [14, 255], [24, 255]],
  },
};
