/**
 * Yojimbo and Daigoro in the Cavern of the Stolen Fayth: the optional FFX-2 mission "Tourist Trap" (our hidden chapter, branch `ch-tourist-trap`). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Bailey, 2026-10-13/14 (chat, via the driver), verbatim: "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." and "full speed
 * ahead while I sleep". The chapter ships hidden behind a typed word (`app/screens/frontend/daigoroDoor.ts`); listing it on the board waits for his word.
 *
 * **One formation, `Cavern of Stolen Fayth - BOSS 229 Yojimbo 1 Daigoro 1`** (SinirothX, via `research/ffx2-fallen-aeons.md` §0.3): Yojimbo, possessed by Shuyin's despair, and Daigoro as a
 * separate body that **cannot be targeted** (`research/ffx-yojimbo.md` §8.2 `[verified: 2 sources]`). Daigoro is a *part* of the group (`parts`): the engine never counts a part toward victory, the
 * targeting code skips `untargetable`, and his script waits forever (`../../../battle/ffx2/ai/tourist-trap.ts`), so he takes no turn and shows no bar. His attack is Yojimbo's move "Daigoro".
 *
 * Numbers (all from `research/ffx-yojimbo.md` §8.2 unless said; `[single source: wiki]` where nothing else prints them; the game's own monster row is pending from the RE session,
 * `research/re-ffx2-yojimbo-valefor.md`, and replaces these field by field through `../monster-records/`): Level 36 (wiki); HP 22,000 and MP 9,999 `[verified: 2 sources]`; STR 44, MAG 61, DEF 50,
 * MDEF 106, AGI 120, LUCK 7 (wiki); EXP 2,000, AP 15, Gil 1,500, Pilfer Gil 2,000 `[verified: 2 sources]`; drop Recovery Bracer; steal Power Wrist, rate 128 (wiki). Evasion is not in the research:
 * 0 `[estimate]`; Accuracy 95 like every monster row in the W3 table `[estimate]`.
 *
 * **Pace.** The research prints no charge or rest for any move; the engine default stands, and the formation carries **action time ON at 3 s**: the same `[estimate]` Bailey picked for the other
 * possessed-aeon fights (the Road, Chapter XI; Ixion at Djose, Chapter XVI, D-269; Cloister 100, Chapter XIII). The rule is sourced `[verified: 2 sources]`, its length is not
 * (`src/battle/ffx2/action-time.ts`). `TOURIST_TRAP_ACTION_TIME_ON = false` turns it off; no boss number moves either way.
 *
 * The painting is PROVISIONAL and borrowed: Lady Ginnem's Yojimbo and Daigoro of the FFX Chapter IX (`characters/yojimbo-cavern`, `characters/daigoro`): same aeon, same dog. Nothing is replaced.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import { DEF_MDEF_MOD_IMMUNITY, STANDARD_AILMENT_IMMUNITY, STAT_MOD_IMMUNITY_5 } from './vegnagun-shared.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import { YOJIMBO_ACTION_IDS, YOJIMBO_SCRIPTS } from './tourist-trap-abilities.ts';

/** The formation and its two bodies. */
export const CAVERN_YOJIMBO_GROUP = 'ffx2-cavern-yojimbo';
export const X2_YOJIMBO_ID = 'x2-yojimbo';
export const X2_DAIGORO_ID = 'x2-daigoro';
/** The AI scripts (`../../../battle/ffx2/ai/tourist-trap.ts`). */
export const X2_YOJIMBO_SCRIPT = YOJIMBO_SCRIPTS.yojimbo;
export const X2_DAIGORO_SCRIPT = YOJIMBO_SCRIPTS.daigoro;
/** The paintings: Chapter IX's (FFX), reused unchanged, PROVISIONAL here. */
export const X2_YOJIMBO_SPRITE = 'yojimbo-cavern';
export const X2_DAIGORO_SPRITE = 'daigoro';
/** Both bodies, Yojimbo first. */
export const TOURIST_TRAP_BODY_IDS: readonly string[] = [X2_YOJIMBO_ID, X2_DAIGORO_ID];

/** Level 36 `[single source: wiki]`; HP 22,000, MP 9,999 `[verified: 2 sources]`; Agility 120 `[single source: wiki]`. */
export const YOJIMBO_LEVEL = 36;
export const YOJIMBO_HP = 22000;
export const YOJIMBO_MP = 9999;
export const YOJIMBO_AGI = 120;

/**
 * **Action time, ON at 3 s** (see the header). `[estimate]`: unsourced length, Bailey's pick for the other possessed aeons. `false` turns it off.
 */
export const TOURIST_TRAP_ACTION_TIME_ON: boolean = true;
export const TOURIST_TRAP_ACTION_TIME_SECONDS = 3;
const actionTime = TOURIST_TRAP_ACTION_TIME_ON ? { actionTimeSeconds: TOURIST_TRAP_ACTION_TIME_SECONDS } : {};

/**
 * The wiki's immunity list `[single source]`: Gravity (an element, below), Silence, Sleep, Darkness, Poison, Confuse, Berserk, Curse, Petrify, Slow, Delay, Stop, Eject, Interrupt, every stat
 * modifier, Death, Doom, Bribe, fractional damage (the flag below) and Reflect. "Multi-attack" has no status slot here; "zantetsu = 120" is moot (no Zantetsu status, the Leblanc precedent).
 * The game's resist bytes replace these when the RE row lands.
 */
const YOJIMBO_IMMUNE: StatusImmunities = {
  ...STANDARD_AILMENT_IMMUNITY, // Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, Doom, Delay, Interrupt
  ...STAT_MOD_IMMUNITY_5,
  ...DEF_MDEF_MOD_IMMUNITY, // "every stat modifier": no Break lands
  stop: 255,
  slow: 255,
  reflect: 255,
};

/** Music: "Aeons" plays in the fight `[single source: wiki Cavern page]`; our original FFX-2 aeon cue (the Road's and Ixion's: the game plays the same track at each) is that slot. */
const AEON_CUE = [{ at: 'start' as const, track: 'boss-ffx2-fallen-aeons' as const, fadeMs: 800 }];

/** Yojimbo, possessed (bestiary #185). */
export const x2Yojimbo: EnemyDef = {
  id: X2_YOJIMBO_ID,
  name: 'Yojimbo',
  spriteKey: X2_YOJIMBO_SPRITE,
  slot: 0,
  stats: {
    hp: YOJIMBO_HP,
    mp: YOJIMBO_MP,
    maxHp: YOJIMBO_HP,
    maxMp: YOJIMBO_MP,
    str: 44, // STR / MAG / DEF / MDEF / AGI / LUCK 44 / 61 / 50 / 106 / 120 / 7 [single source: wiki]
    mag: 61,
    def: 50,
    mdef: 106,
    agi: YOJIMBO_AGI,
    eva: 0, // not in the research [estimate]
    luck: 7,
    acc: 95, // every monster row says 95 (W3 table) [estimate]; the RE row replaces it
  },
  hp: YOJIMBO_HP,
  mp: YOJIMBO_MP,
  level: YOJIMBO_LEVEL,
  affinities: { gravity: 'immune' }, // the one element the wiki names; every other element neutral [estimate]
  immunities: { ...YOJIMBO_IMMUNE },
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'], // "fractional damage", Delay and Bribe are on the wiki's list
  forms: [{ name: 'Yojimbo', spriteKey: X2_YOJIMBO_SPRITE, hp: YOJIMBO_HP }],
  aiScriptId: X2_YOJIMBO_SCRIPT,
  rewards: {
    ap: 15, // EXP / AP / Gil / Pilfer Gil 2,000 / 15 / 1,500 / 2,000 [verified: 2 sources]
    apOverkill: 15,
    gil: 1500,
    exp: 2000,
    stolenGil: 2000,
    overkillThreshold: 0, // not in the research
    drops: [{ itemId: 'recovery-bracer', count: 1 }], // drop and rare drop: Recovery Bracer [verified: 2 sources]
    steal: {
      baseChance: 50, // no source gives it: the house default [estimate], as Ixion's
      stealRate: 128, // steal rate 128 [single source: wiki]; the RE row's byte replaces it
      common: { itemId: 'power-wrist', count: 1 }, // Power Wrist, common and rare [verified: 2 sources]
      rare: { itemId: 'power-wrist', count: 1 },
    },
    // Mission reward: the Tetra Master Garment Grid and the Star Bracer [single source: wiki]. Grids are not an `EnemyRewards` field; the results screen does not show it (the Ixion precedent).
  },
  abilityIds: [...YOJIMBO_ACTION_IDS],
  flags: { isBoss: true },
  sensorText: 'He keeps a count of his own moves. When it fills, he cuts the whole party down to a breath, so heal first.',
};

/**
 * Daigoro, the dog: a separate body that cannot be targeted `[verified: 2 sources]`. The research has **no stats for the FFX-2 body** (the FFX row `m266` is FFX's and is not reused), and he
 * is never read: untargetable, no turn, no bar. HP 1 only so the engine counts him alive (an HP of 0 would draw him as a fallen enemy); every other number is a placeholder.
 */
export const x2Daigoro: EnemyDef = {
  id: X2_DAIGORO_ID,
  name: 'Daigoro',
  spriteKey: X2_DAIGORO_SPRITE,
  slot: 1,
  stats: { hp: 1, mp: 0, maxHp: 1, maxMp: 0, str: 0, mag: 0, def: 0, mdef: 0, agi: 0, eva: 0, luck: 0, acc: 0 },
  hp: 1,
  mp: 0,
  affinities: {},
  immunities: {},
  immunityFlags: ['immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Daigoro', spriteKey: X2_DAIGORO_SPRITE, hp: 1 }],
  aiScriptId: X2_DAIGORO_SCRIPT,
  rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] },
  abilityIds: [],
  flags: { untargetable: true, hideHpBar: true, partOf: X2_YOJIMBO_ID },
};

/** The one formation. Not chained: the mission is one fight. */
export const cavernYojimboGroup: EnemyGroupDef = {
  id: CAVERN_YOJIMBO_GROUP,
  game: 'ffx2',
  enemies: [x2Yojimbo],
  parts: [x2Daigoro],
  bossId: X2_YOJIMBO_ID,
  canEscape: false,
  musicCues: AEON_CUE,
  ...actionTime, // TOURIST_TRAP_ACTION_TIME_ON: on, 3 s
};

export const touristTrapGroups: readonly EnemyGroupDef[] = [cavernYojimboGroup];

// The game's own monster rows on these enemies, when the RE session's rows are pinned (`../monster-records/`).
for (const group of touristTrapGroups) attachMonsterRecords(group);
