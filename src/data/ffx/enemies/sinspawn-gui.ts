/**
 * Enemy groups — **Sinspawn Gui**, the two fights on the Ridge of Mushroom Rock Road (the hidden Sinspawn Gui chapter, FFX only).
 *
 * Source: `research/re-ffx-ai-gui.md` (the game's own monster rows, command tables, battle scripts and field events, FFX Steam HD build 25501027, read and run by the
 * reverse-engineering lane; "RE §n" below) and `research/ffx-sinspawn-gui.md` (the written sources; the game's data wins where they disagree, GameFAQs over the rest, Bailey's tie-break).
 * One enemy of four parts, fought twice: **the body** (monster 117, actor 20), **the head** (160, actor 21) and **two arms** (161, actors 22 and 23). Only the body ends the battle
 * (`MustBeKilledForBattleEnd` is 0 on the others), so the head and the arms are parts (`flags.isPart`). The scripts (`ai/sinspawn-gui.ts`) are the game's: the Attack, Attack, Demi rhythm,
 * the head's three-turn cycle and its cancel, the arms' shield against physical commands and their regrowth.
 *
 * **Fight 1** (`kino02_00`): the player's own three, Switch allowed; body 12,000 HP, Strength 29, Magic Defense 30; head 4,000; item and gear drops zeroed by the script.
 * **Fight 2** (`kino03_10`, after Sin's attack): Yuna, Seymour and Auron, Switch off; the script writes the body to **6,000 HP, Strength 15, Magic Defense 0 (1 in play)**, the head to
 * **1,000**, the body's AP to **0 / 0**, and leaves the drops (RE §2.3). The two bodies are two ids (`sinspawn-gui`, `sinspawn-gui-2`) so the story can tell the first fall from the last.
 *
 * In-play stats: the battle clamps STR, DEF, MAG, MDF, AGI, LCK and ACC to 1..255 when it starts, so the record's zeros read 1 here (RE §3.1); HP, MP and the overkill threshold are not clamped.
 * Neutral to every element on every part (RE §3.1, `[verified: 4 sources]`; Jegged's "weak to fire" is outvoted by the game's table). Threaten cannot land on any part (the record byte is a success
 * percentage and it is 0: `threatenChance: 0`, the contract's "immune"); Power Break and Provoke land on the body only; Armor Break lands on the arms only (RE §3.2).
 *
 * **Not modelled, said plainly** (rule 6): the equipment piece the fight-2 body drops (RE §3.3: a weapon with Piercing or Sleepstrike, or Sleepproof armour; the gear-drop table is the
 * rewards note's and the results screen has no row for it); the four "Distiller" immunities the HD records add to the head and arms (no status of ours); the body's Tough and Heavy flags
 * (no field of ours reads them); a Slice resistance (a Zanmato byte, moot without Yojimbo).
 */

import type { EnemyDef, EnemyGroupDef, EnemyRewards, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { POSSESSED_PLAIN_ATTACK } from '../command-records/enemies.ts';
import {
  GUI_ARM_IDS, GUI_ARM_LEFT_ID, GUI_ARM_RIGHT_ID, GUI_ARM_SCRIPT, GUI_BODY_2_ID, GUI_BODY_SCRIPT, GUI_GROUP_1_ID, GUI_GROUP_2_ID, GUI_HEAD_ID, GUI_HEAD_SCRIPT, GUI_ID,
} from '../sinspawn-gui-ids.ts';
import { buildSeymourGuest } from '../builds/seymour-guest.ts';
import { GUI_SPECIAL_1_ID, GUI_VENOM_ID } from './sinspawn-gui-abilities.ts';

/** Ids the engine, the scene, the tactic, the guide and the tests all key on (`../sinspawn-gui-ids.ts`). */
export { GUI_ARM_IDS, GUI_ARM_LEFT_ID, GUI_ARM_RIGHT_ID, GUI_BODY_2_ID, GUI_GROUP_1_ID, GUI_GROUP_2_ID, GUI_HEAD_ID, GUI_ID };

const stats = (s: Omit<StatBlock, 'maxHp' | 'maxMp'>): StatBlock => ({ ...s, maxHp: s.hp, maxMp: s.mp });

/** Immune (255) on every part: RE §3.2. Power Break and Provoke are the body's to take; Armor Break the arms'. */
const ALL_PARTS_IMMUNE: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'confuse', 'berserk', 'sleep', 'silence', 'darkness', 'slow',
  'magic-break', 'mental-break', 'nulblaze', 'nulfrost', 'nulshock', 'nultide', 'eject', 'auto-life', 'doom',
];
const immune = (...statuses: readonly StatusId[]): StatusImmunities => Object.fromEntries(statuses.map((s) => [s, 255])) as StatusImmunities;

const BODY_IMMUNITIES = immune(...ALL_PARTS_IMMUNE, 'armor-break');
const HEAD_IMMUNITIES = immune(...ALL_PARTS_IMMUNE, 'armor-break', 'power-break', 'provoke');
const ARM_IMMUNITIES = immune(...ALL_PARTS_IMMUNE, 'power-break', 'provoke'); // Armor Break lands

/** Every part carries the Potion steal and the Bribe row (all Bribe-immune): RE §3.3. */
const POTION = { itemId: 'potion', count: 1 } as const;
const STEAL = { baseChance: 100, common: POTION, rare: POTION } as const; // the record's byte 255, clamped to the contract's 0-100
const BRIBE = { item: POTION, immune: true } as const;

function rewards(ap: number, apOverkill: number, gil: number, overkillThreshold: number, drops: EnemyRewards['drops'] = []): EnemyRewards {
  return { ap, apOverkill, gil, overkillThreshold, drops: drops.map((d) => ({ ...d })), steal: { ...STEAL }, bribe: { ...BRIBE } };
}

const SCAN_BODY = 'Its arms turn aside every physical blow. Magic and Overdrives go straight through; strike the head when it shakes, or Venom follows.';
const SCAN_HEAD = 'Out of reach of blades. Whatever strikes it while it shakes stops the Venom.';
const SCAN_ARM = 'Armoured: only piercing blows and magic land in full. The arms never act, and they grow back.';

/** The body. `fight` is 1 or 2 (RE §2.3): the second is the weaker rematch. */
function body(fight: 1 | 2): EnemyDef {
  const second = fight === 2;
  const hp = second ? 6_000 : 12_000;
  return {
    id: second ? GUI_BODY_2_ID : GUI_ID,
    name: 'Sinspawn Gui',
    spriteKey: GUI_ID, // the same painting both times: the rematch is the same body (a dimmer one is a later art pass)
    slot: 0,
    stats: stats({ hp, mp: 30, str: second ? 15 : 29, def: 1, mag: 20, mdef: second ? 1 : 30, agi: 10, luck: 15, eva: 0, acc: 100 }), // RE §3.1 and §2.3; DEF 0 and MDF 0 read 1 in play
    hp,
    mp: 30,
    affinities: {},
    immunities: { ...BODY_IMMUNITIES },
    immunityFlags: ['boss', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe'], // record flags 0x04 and 0x07 (RE §3.1); boss: the party cannot escape (RE §2.2)
    forms: [{ name: 'Sinspawn Gui', spriteKey: GUI_ID, hp }],
    aiScriptId: GUI_BODY_SCRIPT,
    // Fight 1 pays 400 / 600 AP; fight 2's script writes 0 / 0. Fight 1's init zeroes the drop chances; fight 2 keeps 3 Lv. 1 Key Spheres (6 on an Overkill, the engine doubles it) (RE §3.3).
    rewards: second ? rewards(0, 0, 1_000, 800, [{ itemId: 'lv-1-key-sphere', count: 3 }]) : rewards(400, 600, 1_000, 800),
    abilityIds: ['thunder', 'demi', GUI_VENOM_ID], // Attack is its plain attack (below)
    flags: { isBoss: true },
    sensorText: 'Its arms are its guard.',
    scanText: SCAN_BODY,
    threatenChance: 0, // RE §3.2: the byte is a success percentage and it is 0
    zanmatoLevel: 4, // the Zanmato byte 3
    plainAttack: { ...POSSESSED_PLAIN_ATTACK, record: { ...POSSESSED_PLAIN_ATTACK.record } }, // monster command 0x6000 (RE §4): accuracy 90, formula 1, power 16
  };
}

/** The head: out of melee reach (`BattleDistance` 1), no turn of its own but the cycle, a part. */
function head(fight: 1 | 2): EnemyDef {
  const hp = fight === 2 ? 1_000 : 4_000;
  return {
    id: GUI_HEAD_ID,
    name: 'Gui Head',
    spriteKey: GUI_HEAD_ID,
    slot: 1,
    stats: stats({ hp, mp: 200, str: 1, def: 1, mag: 1, mdef: 1, agi: 15, luck: 1, eva: 0, acc: 1 }),
    hp,
    mp: 200,
    affinities: {},
    immunities: { ...HEAD_IMMUNITIES },
    immunityFlags: ['immune-to-delay', 'immune-to-bribe'],
    forms: [{ name: 'Gui Head', spriteKey: GUI_HEAD_ID, hp }],
    aiScriptId: GUI_HEAD_SCRIPT,
    rewards: rewards(48, 72, 200, 800), // its drop chances are zeroed by its own init (RE §3.3)
    abilityIds: [GUI_SPECIAL_1_ID],
    flags: { isPart: true, partOf: GUI_ID, battleDistance: 1 },
    sensorText: 'Strike it while it shakes.',
    scanText: SCAN_HEAD,
    threatenChance: 0,
    zanmatoLevel: 4,
  };
}

/** An arm: 800 HP, Armored by record, never acts, grows back. Two of them (actors 22 and 23). */
function arm(id: string, slot: number): EnemyDef {
  return {
    id,
    name: 'Gui Arm',
    spriteKey: id,
    slot,
    stats: stats({ hp: 800, mp: 1, str: 1, def: 1, mag: 1, mdef: 1, agi: 1, luck: 1, eva: 0, acc: 1 }),
    hp: 800,
    mp: 1,
    affinities: {},
    immunities: { ...ARM_IMMUNITIES },
    immunityFlags: ['armored', 'immune-to-delay', 'immune-to-bribe'], // record flag 0x01 Armored (RE §3.1)
    forms: [{ name: 'Gui Arm', spriteKey: id, hp: 800 }],
    aiScriptId: GUI_ARM_SCRIPT,
    rewards: rewards(37, 55, 300, 500), // paid again for every regrowth kill (RE §3.3); its drop chances are zeroed
    abilityIds: [],
    flags: { isPart: true, partOf: GUI_ID },
    sensorText: 'They armour the body.',
    scanText: SCAN_ARM,
    threatenChance: 0,
    zanmatoLevel: 4,
  };
}

/** Fight 1: the player's own three; the chain goes on to fight 2. */
export const sinspawnGuiGroup1: EnemyGroupDef = {
  id: GUI_GROUP_1_ID,
  game: 'ffx',
  canEscape: false, // Escape and Flee are disabled by the formation script (RE §2.2)
  enemies: [body(1)],
  parts: [head(1), arm(GUI_ARM_LEFT_ID, 2), arm(GUI_ARM_RIGHT_ID, 3)],
  nextGroupId: GUI_GROUP_2_ID,
  bossId: GUI_ID,
  headline: 'Sinspawn Gui',
  // "Peril" is the game's cue here; our nearest existing cue is the dread theme (no new audio, `docs/audio/THEMES.md`).
  musicCues: [{ at: 'start', track: 'boss-dread', fadeMs: 1200 }],
};

/** Fight 2: Yuna, Seymour and Auron, Switch off; the weaker body; the spoils of both fights are paid together. */
export const sinspawnGuiGroup2: EnemyGroupDef = {
  id: GUI_GROUP_2_ID,
  game: 'ffx',
  canEscape: false,
  enemies: [body(2)],
  parts: [head(2), arm(GUI_ARM_LEFT_ID, 2), arm(GUI_ARM_RIGHT_ID, 3)],
  bossId: GUI_BODY_2_ID,
  headline: 'Sinspawn Gui',
  lineUp: { joins: [buildSeymourGuest()], activeSlots: ['yuna', 'seymour', 'auron'], noSwitch: true }, // slots 1, 2, 3 (RE §2.1)
  poolsChainSpoils: true, // fight 1's AP and gil are paid with fight 2's (GameFAQs, `[single source]`)
  checkpointOnEntry: true, // a defeat retries here, with the HP and MP the party carried in
  hopelessRetry: { standing: 2, answer: 'restore' }, // two of the three on their feet, or the retry opens with everyone up and full
  // "Challenge" is the game's cue here; our nearest existing cue is Seymour's own theme.
  musicCues: [{ at: 'start', track: 'boss-seymour', fadeMs: 1200 }],
};

export const SINSPAWN_GUI_GROUPS: readonly EnemyGroupDef[] = [sinspawnGuiGroup1, sinspawnGuiGroup2];

export const sinspawnGuiGroup = sinspawnGuiGroup1; // the chapter's opening formation
export default sinspawnGuiGroup;
