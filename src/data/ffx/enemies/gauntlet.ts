/**
 * The Monster Arena creations of the hidden Gauntlet chapter (FFX only; chapter 54): **Cactuar King, Don Tonberry, Jormungand, Earth Eater, Greater Sphere, Catastrophe, Th'uban, Neslug and the Ultima Buster**, with
 * the Ultima Buster's **Head** and its two **Arms**. **Source: the game's own monster files** (`research/re-ffx-monster-arena-creations.md`, "RE n"; `[bytes]`): the records, immunities, flag bytes, Zanmato and Doom bytes
 * and loot records are `./gauntlet-records.ts` (read its header for every number); the moves are `./gauntlet-abilities.ts`. `tests/unit/chapters/gauntlet-data.test.ts` pins these definitions to
 * `tests/fixtures/parity/ffx/gauntlet_rows.json`.
 *
 * **What is not here, on purpose:** the formations (the group stage's), the scripts (`battle/ffx/ai/gauntlet-*.ts`, the rules stages'), the start-up statuses (Earth Eater's Reflect) and writes (the Ultima Buster's
 * defence gate), and the paintings (`../gauntlet-ids.ts#GAUNTLET_SPRITE`: stand-ins from the art mirror until the art lane's land, `GAUNTLET_SPRITE_WANTED`). No Scan or Sensor text: every body is immune to both (the extra word's Scan bit, the flag byte's Sensor bit), so the panel
 * prints "Immune to sensors." as Shinryu's does. Escape and Flee off (`boss`, preflight GA13) is the bodies' flag; the parts carry none.
 */

import type { EnemyDef, EnemyRewards, ImmunityFlag, StatBlock } from '../../../battle/common/types.ts';
import { GAUNTLET_CREATURES, GAUNTLET_FILE, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPT, GAUNTLET_SPRITE, type GauntletCombatantId, type GauntletCreatureId } from '../gauntlet-ids.ts';
import {
  GAUNTLET_ARMORED, GAUNTLET_CACTUAR_ELEMENTS, GAUNTLET_DOOM_TURNS, GAUNTLET_ITEM_ID, GAUNTLET_LOOT, GAUNTLET_OVERKILL, GAUNTLET_RECORDS, GAUNTLET_STEAL, GAUNTLET_ZANMATO_BYTE, type Record10,
  gauntletDrops, gauntletImmunities,
} from './gauntlet-records.ts';

export { GAUNTLET_ABILITIES, COMMAND_RECORDS_GAUNTLET } from './gauntlet-abilities.ts';

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

/** Flag byte +0x28 (0x1E: percentage damage, Life, Sensor, Scan again) and +0x29 (0x05: CTB damage, Bribe), plus Armored (+0x28 bit 0x01) where the record has it. */
function flagsOf(id: GauntletCombatantId): ImmunityFlag[] {
  return [...(GAUNTLET_ARMORED.includes(id) ? (['armored'] as const) : []), 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'];
}

function rewardsOf(id: GauntletCombatantId): EnemyRewards {
  const loot = GAUNTLET_LOOT[id];
  const steal = GAUNTLET_STEAL[id];
  const item = (n: number): string => GAUNTLET_ITEM_ID[n] as string;
  return {
    ap: loot.ap,
    apOverkill: loot.apOverkill,
    gil: loot.gil,
    overkillThreshold: GAUNTLET_OVERKILL[id],
    drops: gauntletDrops(id),
    loot: { ...loot, chance: [...loot.chance] as [number, number] },
    ...(steal === null ? {} : { steal: { baseChance: 100, common: { itemId: item(steal.items[0]), count: steal.qty[0] }, rare: { itemId: item(steal.items[1]), count: steal.qty[1] } } }), // the record's chance byte 255, clamped to the contract's 0-100 [estimate]
  };
}

interface Opts {
  name: string;
  slot: number;
  abilityIds: readonly string[];
  /** A part of the Ultima Buster's: the body it belongs to. */
  partOf?: GauntletCreatureId;
}

function build(id: GauntletCombatantId, o: Opts): EnemyDef {
  const stats = statsOf(GAUNTLET_RECORDS[id]);
  const sprite = GAUNTLET_SPRITE[id];
  return {
    id,
    name: o.name,
    spriteKey: sprite,
    slot: o.slot,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: id === 'cactuar-king' ? { ...GAUNTLET_CACTUAR_ELEMENTS } : {}, // every other record's element row is all zeros (RE n 1)
    immunities: gauntletImmunities(id),
    immunityFlags: [...flagsOf(id), ...(o.partOf === undefined ? (['boss'] as const) : [])],
    forms: [{ name: o.name, spriteKey: sprite, hp: stats.hp }],
    aiScriptId: GAUNTLET_SCRIPT[id],
    rewards: rewardsOf(id),
    abilityIds: [...o.abilityIds],
    flags: o.partOf === undefined ? { isBoss: true } : { isPart: true, partOf: o.partOf },
    threatenChance: 0, // the record's byte 0, which the engine reads as "never lands" (as Shinryu's and Penance's chapters read it)
    zanmatoLevel: GAUNTLET_ZANMATO_BYTE[id] + 1,
    doomTurns: GAUNTLET_DOOM_TURNS[id],
  };
}

/** Cactuar King (m314, act 1): 100,000 HP, Evasion 240, immune to five elements; the first Needles are most of its turns, then it runs away. */
export const cactuarKing = (): EnemyDef => build('cactuar-king', { name: 'Cactuar King', slot: 0, abilityIds: [ROW.needles10000, ROW.needles99999, ROW.runAway] });
/** Don Tonberry (m317, act 2): the record's command list is empty; its four rows are named by the script (RE n 3.9). */
export const donTonberry = (): EnemyDef => build('don-tonberry', { name: 'Don Tonberry', slot: 0, abilityIds: [ROW.tonberryAttack, ROW.voodoo, ROW.karma, ROW.waddle] });
/** Jormungand (m311, act 3): the one that cannot resist Slow, with Breaks at 90 (RE n 1). */
export const jormungand = (): EnemyDef => build('jormungand', { name: 'Jormungand', slot: 0, abilityIds: [ROW.jormungandAttack, ROW.coldStare, ROW.vorpal] });
/** Earth Eater (m279, act 4): Armored; starts with Reflect (the rules stage writes it); the Flare it casts at itself is the player's row. */
export const earthEater = (): EnemyDef => build('earth-eater', { name: 'Earth Eater', slot: 0, abilityIds: [ROW.attack, ROW.megatonPunch, ROW.getsUp, 'flare'] });
/** Greater Sphere (m281, act 5): Spherimorph's mechanic at 1,500,000 HP; the -aga spells, Flare and Ultima are the player's rows. */
export const greaterSphere = (): EnemyDef => build('greater-sphere', { name: 'Greater Sphere', slot: 0, abilityIds: [ROW.attack, ROW.hydraulicPress, 'firaga', 'blizzaga', 'thundaga', 'waterga', 'flare', 'ultima', ROW.elementalShift] });
/** Catastrophe (m277, act 6): Armored in its first form; Demi is the player's row. Its second form (AGI 60, Luck 30, not Armored) is a rules write (RE n 3.3). */
export const catastrophe = (): EnemyDef => build('catastrophe', { name: 'Catastrophe', slot: 0, abilityIds: [ROW.toxicCloud, ROW.toxicSpray, ROW.hundredThorns, 'demi', ROW.transform] });
/** Th'uban (m282, act 7): Reflect 255; the buffs and Curaga are the player's rows; Regen is the script's buff step (RE n 3.6) though the record's command list does not name it. */
export const thuban = (): EnemyDef => build('thuban', { name: "Th'uban", slot: 0, abilityIds: [ROW.attack, ROW.rainbow, ROW.convergence, ROW.condemn, 'haste', 'reflect', 'protect', 'shell', 'regen', 'curaga'] });
/** Neslug (m105, act 8): Silence lands; Doom is immune (the word 0x4301); the shell rows are forced actions. */
export const neslug = (): EnemyDef => build('neslug', { name: 'Neslug', slot: 0, abilityIds: [ROW.neslugAttack, ROW.megaton, ROW.slime, ROW.brokenShell, ROW.hidesInShell, ROW.emergesFromShell, 'curaga'] });
/** The Ultima Buster (m280, act 9): 5,000,000 HP; with the Head (slot 1) and two Arms (slots 2 and 3) as parts. */
export const ultimaBuster = (): EnemyDef => build('ultima-buster', { name: 'Ultima Buster', slot: 0, abilityIds: [ROW.attack, ROW.ultima, ROW.contamination] });
/** The Head (m272): 80,000 HP, Armored, no drops; it has turns (AGI 80) and passes the order to the body through Special 1. */
export const ultimaBusterHead = (): EnemyDef => build('ultima-buster-head', { name: 'Ultima Buster Head', slot: 1, partOf: 'ultima-buster', abilityIds: [ROW.special1] });
/** An Arm (m273, twice): 80,000 HP, Armored, no turns, no drops; while one lives the body is physical-proof (the rules stage). */
export const ultimaBusterArmLeft = (): EnemyDef => build('ultima-buster-arm-left', { name: 'Ultima Buster Arm', slot: 2, partOf: 'ultima-buster', abilityIds: [] });
export const ultimaBusterArmRight = (): EnemyDef => build('ultima-buster-arm-right', { name: 'Ultima Buster Arm', slot: 3, partOf: 'ultima-buster', abilityIds: [] });

/** The nine bodies in act order. */
export const GAUNTLET_BODIES: readonly EnemyDef[] = [cactuarKing(), donTonberry(), jormungand(), earthEater(), greaterSphere(), catastrophe(), thuban(), neslug(), ultimaBuster()];
/** The Ultima Buster's parts: the Head and the two Arms. */
export const GAUNTLET_PARTS: readonly EnemyDef[] = [ultimaBusterHead(), ultimaBusterArmLeft(), ultimaBusterArmRight()];

/** The body of a creature by id (a fresh copy). */
export function gauntletBody(id: GauntletCreatureId): EnemyDef {
  const body = GAUNTLET_BODIES[GAUNTLET_CREATURES.indexOf(id)];
  if (body === undefined) throw new Error(`gauntlet: no creature '${id}'`);
  return JSON.parse(JSON.stringify(body)) as EnemyDef;
}

/** The monster file number of each combatant, re-exported for the tests that read both. */
export { GAUNTLET_FILE };
