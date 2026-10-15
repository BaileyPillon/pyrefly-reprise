/**
 * Angra Mainyu and his two arms, Tawrich and Zarich: FFX-2 Chapter 5, the Al Bhed excavation camp in the Bikanel Desert, one link (the hidden chapter "Angra Mainyu", number 26).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 status set. Source: `research/ffx2-angra-mainyu.md` ("§n"). **No row of these three monsters was read** (§0.2): the numbers are
 * the written sources' (read through the web search tool's summaries, `[search: N sources]`), with every conflict resolved as §11.1 says, and the arms' unread fields are §2.4's stated `[estimate]`.
 *
 * | | Angra Mainyu | Tawrich (right arm) | Zarich (left arm) | Source |
 * |---|---|---|---|---|
 * | Level | 47 | 38 | 36 | §2.1 `[search: 2 sources]`, §2.2 `[search: 2 sources]`, §2.3 `[search: single source]` |
 * | HP | 333,444 | 5,440 | 5,440 | §2.1 `[search: 5 sources]`; the arms' `[conflict]` A-3 (5,540), resolved to the FF Wiki's |
 * | MP | 9,999 | 9,999 | 9,999 | `[search]`; Angra's `[conflict]` A-2 (6,666), resolved to 9,999 |
 * | Str / Def / Mag / MDef | 73 / 97 / 124 / 114 | 85 / 99 / 42 / 1 | 42 / 70 / 85 / 99 | Angra `[search: 2 sources]` (Str `[conflict]` A-1, inert); the arms §2.4 (Zarich's Def sourced, the rest `[estimate]`) |
 * | Agi / Eva / Acc / Luck | 68 / 0 / 2 / 0 | 113 / 0 / 99 / 0 | 82 / 0 / 99 / 0 | Angra `[search: 2 sources]`; Zarich's Agi and Acc `[search: single source]`; the rest §2.4 `[estimate]` |
 * | Auto-status | none | **Null Magic**, permanent | **Null Physical**, permanent | §2.2, §2.3 `[search: 3 sources]` |
 * | EXP / AP / Gil / Pilfer | 5,000 / 30 / 5,000 / 2,000 | none | none | §2.1 `[search: 2 sources]`; the arms grant nothing `[search: 2 sources]` |
 * | Steal / Drop | Megalixir / **Ribbon** | none | none | §2.1 `[search: 2 sources]`, the Ribbon `[search: 3 sources]` |
 *
 * **Elements:** Angra Mainyu is immune to Gravity and neutral to the rest (§2.1 `[search: 3 sources]`); the arms' elements are in no summary (`[gap]`): neutral here. **Statuses:** Angra Mainyu's Darkness
 * immunity is sourced (§2.1, `[single source]`); the rest of his list and both arms' are not (`[gap]`), so all three take **the common FFX-2 boss list** of this repository's read rows (Valefor's row 164 and its
 * kin: immune to Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Stop and Doom; Slow and the Breaks land) `[estimate]`, listed in §11.2 to verify.
 *
 * **The arms are parts** (`EnemyGroupDef.parts`): the battle ends when the body falls, whoever stands (`battle/ffx2/results.ts`; §4.3), and a fallen arm is revived by the body's Full-Life (§4.1).
 * Their immunities are the engine's group-2 statuses `null-magic` and `null-physical` as **permanent auto-statuses** (the Vegnagun Nodes' precedent), which Dispel never removes and the Dark Knight's Darkness
 * (damage flags 0) passes (§4.4).
 *
 * **Art (provisional):** the body is drawn from Chapter XI's approved `x2-anima` painting (`ANGRA_STAND_IN_ART`); the arms have no painting and stand on his as figure-less parts
 * (`scenes/experiment-grounds.ts`, the D-044 mechanism). No painting of the three exists and no source describes them (§9).
 */

import type { EnemyDef, EnemyGroupDef, StatBlock, StatusImmunities } from '../../../battle/common/types.ts';
import {
  ANGRA_ABILITY,
  ANGRA_ID,
  ANGRA_MAINYU_GROUP_ID,
  ANGRA_SCRIPT,
  ANGRA_STAND_IN_ART,
  TAWRICH_ABILITY,
  TAWRICH_ID,
  TAWRICH_SCRIPT,
  ZARICH_ABILITY,
  ZARICH_ID,
  ZARICH_SCRIPT,
} from '../../angra-mainyu-ids.ts';

export { ANGRA_ID, ANGRA_MAINYU_GROUP_ID, TAWRICH_ID, ZARICH_ID };

/** The bodies' and the arms' HP (§2.1, §2.2, §2.3; the arms' `[conflict]` A-3 resolved to 5,440). */
export const ANGRA_HP = 333_444;
export const ARM_HP = 5_440;

/**
 * **Action time, ON at 3 s**: kept by precedent (D-846: the new FFX-2 chapters keep the three seconds Bailey picked chapter by chapter, Trema D-151, Chapter XI D-187 and D-197, Djose D-269), awaiting his
 * pick for this chapter. Its length is `[estimate]` (unsourced, `research/ffx2-trema.md` §12.4). One named constant; `false` turns it off.
 */
export const ANGRA_ACTION_TIME_ON: boolean = true;
export const ANGRA_ACTION_TIME_SECONDS = 3;
const actionTime = ANGRA_ACTION_TIME_ON ? { actionTimeSeconds: ANGRA_ACTION_TIME_SECONDS } : {};

/** The common FFX-2 boss list (`[estimate]`, see the header); Darkness is Angra Mainyu's sourced immunity. */
const BOSS_IMMUNE: StatusImmunities = {
  ko: 255,
  petrify: 255,
  sleep: 255,
  silence: 255,
  darkness: 255,
  poison: 255,
  confuse: 255,
  berserk: 255,
  curse: 255,
  eject: 255,
  stop: 255,
  doom: 255,
};

function block(hp: number, s: Omit<StatBlock, 'hp' | 'mp' | 'maxHp' | 'maxMp'>): StatBlock {
  return { hp, mp: 9_999, maxHp: hp, maxMp: 9_999, ...s };
}

/** The game's "Aeons" plays through the fight (§8, `[single source]`); ours in that role is `boss-ffx2-fallen-aeons`, the cue Chapter XI, Ixion, the Tourist Trap and Valefor play. */
const AEON_CUE = [{ at: 'start' as const, track: 'boss-ffx2-fallen-aeons' as const, fadeMs: 800 }];

/** Angra Mainyu, the body: the boss (§2.1). */
export const x2AngraMainyu: EnemyDef = {
  id: ANGRA_ID,
  name: 'Angra Mainyu',
  spriteKey: ANGRA_STAND_IN_ART, // provisional: Chapter XI's approved x2-anima painting (see the header)
  slot: 0,
  stats: block(ANGRA_HP, { str: 73, def: 97, mag: 124, mdef: 114, agi: 68, eva: 0, acc: 2, luck: 0 }), // [search: 2 sources]; Str [conflict] A-1, inert
  hp: ANGRA_HP,
  mp: 9_999,
  level: 47,
  affinities: { gravity: 'immune' }, // [search: 3 sources]
  immunities: BOSS_IMMUNE,
  immunityFlags: ['boss'],
  forms: [{ name: 'Angra Mainyu', spriteKey: ANGRA_STAND_IN_ART, hp: ANGRA_HP }],
  aiScriptId: ANGRA_SCRIPT,
  rewards: {
    exp: 5_000, // [search: 2 sources]
    ap: 30,
    apOverkill: 30,
    gil: 5_000,
    stolenGil: 2_000, // Pilfer Gil [search: 2 sources]
    overkillThreshold: 0,
    drops: [{ itemId: 'ribbon', count: 1 }], // [search: 3 sources]; FFX-2 pays every drop on a win (`../items/held.ts` holds the row)
    // Megalixir, rare none [search: 2 sources]. An empty rare slot means every steal takes the common one (`battle/ffx2/steal.ts`), so the same Megalixir in both slots plays the same; the chance is the house default [estimate].
    steal: { baseChance: 50, common: { itemId: 'x2-megalixir', count: 1 }, rare: { itemId: 'x2-megalixir', count: 1 } },
  },
  abilityIds: Object.values(ANGRA_ABILITY),
  flags: { isBoss: true },
  sensorText: 'Keep both arms down and the Flame never comes.',
  scanText: 'Angra Mainyu. While both arms stand it can loose Perdition\'s Flame; it raises a fallen arm while it has the MP.',
};

/** One arm: a part of the body, revived by its Full-Life, worth nothing (§2.2, §2.3). */
function arm(id: string, name: string, slot: number, level: number, stats: Omit<StatBlock, 'hp' | 'mp' | 'maxHp' | 'maxMp'>, autoStatus: 'null-magic' | 'null-physical', script: string, abilityIds: readonly string[], text: { sensor: string; scan: string }): EnemyDef {
  return {
    id,
    name,
    spriteKey: ANGRA_STAND_IN_ART, // figure-less on the stage (the scene anchors it on the body's painting); the key only names the set it belongs to
    slot,
    stats: block(ARM_HP, stats),
    hp: ARM_HP,
    mp: 9_999,
    level,
    affinities: {}, // [gap]: neutral
    immunities: BOSS_IMMUNE, // [estimate], see the header
    immunityFlags: ['boss'],
    autoStatuses: [autoStatus], // permanent [search: 3 sources]
    forms: [{ name, spriteKey: ANGRA_STAND_IN_ART, hp: ARM_HP }],
    aiScriptId: script,
    rewards: { exp: 0, ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] }, // nothing: the body revives it [search: 2 sources]
    abilityIds: [...abilityIds],
    flags: { isPart: true, partOf: ANGRA_ID },
    sensorText: text.sensor,
    scanText: text.scan,
  };
}

/** Tawrich, the right arm: Null Magic, Punch and Bloody Breath (§2.2, §3.2). */
export const x2Tawrich: EnemyDef = arm(
  TAWRICH_ID,
  'Tawrich',
  1,
  38,
  { str: 85, def: 99, mag: 42, mdef: 1, agi: 113, eva: 0, acc: 99, luck: 0 }, // §2.4 [estimate]
  'null-magic',
  TAWRICH_SCRIPT,
  Object.values(TAWRICH_ABILITY),
  { sensor: 'Magic cannot touch it. Blows and Darkness can.', scan: 'Tawrich, the right arm. Immune to magic. Its breath brings confusion, silence, darkness and poison.' },
);

/** Zarich, the left arm: Null Physical, the elemental spells and Glimmer of Despair (§2.3, §3.3). */
export const x2Zarich: EnemyDef = arm(
  ZARICH_ID,
  'Zarich',
  2,
  36,
  { str: 42, def: 70, mag: 85, mdef: 99, agi: 82, eva: 0, acc: 99, luck: 0 }, // Def, Agi and Acc [search: single source]; the rest §2.4 [estimate]
  'null-physical',
  ZARICH_SCRIPT,
  [...ZARICH_ABILITY.ara, ...ZARICH_ABILITY.aga, ZARICH_ABILITY.glimmer],
  { sensor: 'Blows cannot touch it. Spells and Darkness can.', scan: 'Zarich, the left arm. Immune to physical blows. Casts the elements, and drains hope and MP.' },
);

/** The camp's one fight: the body and its two arms as parts. */
export const angraMainyuGroup: EnemyGroupDef = {
  id: ANGRA_MAINYU_GROUP_ID,
  game: 'ffx2',
  enemies: [x2AngraMainyu],
  parts: [x2Tawrich, x2Zarich],
  canEscape: false,
  headline: 'Angra Mainyu',
  bossId: ANGRA_ID,
  musicCues: AEON_CUE,
  ...actionTime, // ANGRA_ACTION_TIME_ON: on, 3 s, kept by precedent (D-846), awaiting Bailey's pick
};

export const angraMainyuGroups: readonly EnemyGroupDef[] = [angraMainyuGroup];

export default angraMainyuGroup;
