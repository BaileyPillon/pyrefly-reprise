/**
 * Yojimbo and Daigoro in the Cavern of the Stolen Fayth: the optional FFX-2 mission "Tourist Trap" (our hidden chapter, branch `ch-tourist-trap`). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Bailey, 2026-10-13/14 (chat, via the driver), verbatim: "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." and "full speed
 * ahead while I sleep". The chapter ships hidden behind a typed word (`app/screens/frontend/daigoroDoor.ts`); listing it on the board waits for his word.
 *
 * **One formation, `Cavern of Stolen Fayth - BOSS 229 Yojimbo 1 Daigoro 1`** (SinirothX, via `research/ffx2-fallen-aeons.md` §0.3): game formation 1847, slot 1 Yojimbo, slot 2 Daigoro.
 *
 * **The numbers are the GAME'S OWN ROWS** (`research/re-ffx2-yojimbo-valefor.md`, the RE session, 2026-10-14; `battle/kernel/monster.bin` of the Steam HD build): **Yojimbo is row 170, Daigoro is row 174**
 * (`./records-tourist-trap.ts` lays the rows' resist bytes, accuracy, steal byte and special word; `tests/unit/chapters/tourist-trap-engine.test.ts` pins them against
 * `tests/fixtures/parity/ffx2/tourist_trap_rows.json`). Every number the wiki gave equals the row (`research/ffx-yojimbo.md` §8.2: Level 36, HP 22,000, MP 9,999, STR/MAG/DEF/MDEF/AGI/LUCK
 * 44/61/50/106/120/7, EXP 2,000, AP 15, Gil 1,500, Pilfer Gil 2,000, drop Recovery Bracer, steal Power Wrist at byte 128, Zantetsu 120); the row adds Accuracy 95 and Evasion 0 (read, no longer
 * estimated). **Where the row disagrees with the research this build started on** (listed in `docs/handoff/ch-tourist-trap.md`): (1) the wiki's Reflect immunity is NOT in row 170 (its Reflect byte is
 * 0): removed; (2) Bribe immunity is unproven either way: neither is assumed (no flag, and the special word wired without bit 9); (3) Daigoro is a record of his own (row 174), not a placeholder;
 * (4) Yojimbo's own move list (row 170: Kozuka, Wakizashi twice, Zanmato, Die) has NO Daigoro move, and the dog's list is empty, so the Daigoro strike comes from the sourced table (wiki and
 * SinirothX) and the dog's own script (row 174's AI, not decompiled yet); here it is Yojimbo's selection, the dog standing beside him; (5) "Multi-attack" has no column in the row.
 *
 * **Daigoro** is a separate battler (his own `EnemyDef` with row 174's stats) that **cannot be targeted**: the FFX-2 wiki's Cavern page says so (`research/ffx-yojimbo.md` §8.2 and Y-10,
 * `[single source: wiki]`; the row says nothing either way). He is a *part* of the group (`parts`): the engine never counts a part toward victory, the targeting code skips `untargetable`, and his
 * script waits forever (`../../../battle/ffx2/ai/tourist-trap.ts`), so he makes one silent poll at the start, takes no action of his own and shows no bar.
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

/** Row 170: Level 36, HP 22,000, MP 9,999, Agility 120 `[game rows]` (the wiki gives the same). */
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
 * Row 170's resist bytes (`[game rows]`, laid on by `./records-tourist-trap.ts` as well): group 1 at 255 for Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse and Eject;
 * group 2 at 255 for Slow, Stop, the seven stat stages and Doom (so no Break lands). Delay and Interrupt (the row's special word, bits 6 and 9) have no status slot here and stay as authored:
 * `STANDARD_AILMENT_IMMUNITY` carries them. **Reflect is NOT immune** (row 170 group 2 index 2 reads 0; the wiki's list said otherwise): not listed.
 */
const YOJIMBO_IMMUNE: StatusImmunities = {
  ...STANDARD_AILMENT_IMMUNITY, // Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, Doom, Delay, Interrupt
  ...STAT_MOD_IMMUNITY_5,
  ...DEF_MDEF_MOD_IMMUNITY, // all seven stat stages: no Break lands
  stop: 255,
  slow: 255,
};

/** Music: "Aeons" plays in the fight `[single source: wiki Cavern page]`; our original FFX-2 aeon cue (the Road's and Ixion's: the game plays the same track at each) is that slot. */
const AEON_CUE = [{ at: 'start' as const, track: 'boss-ffx2-fallen-aeons' as const, fadeMs: 800 }];

/** Yojimbo, possessed (bestiary #185; `monster.bin` row 170). */
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
    str: 44, // STR / DEF / MAG / MDEF / AGI / ACC / EVA / LCK 44 / 50 / 61 / 106 / 120 / 95 / 0 / 7 [game rows: row 170; the wiki's six agree]
    mag: 61,
    def: 50,
    mdef: 106,
    agi: YOJIMBO_AGI,
    eva: 0, // row 170
    luck: 7,
    acc: 95, // row 170
  },
  hp: YOJIMBO_HP,
  mp: YOJIMBO_MP,
  level: YOJIMBO_LEVEL,
  affinities: { gravity: 'immune' }, // row 170 element bytes: null Gravity (bit 4), nothing else
  immunities: { ...YOJIMBO_IMMUNE },
  // The special word 0x3c3 (row 170): bit 0 no percentage-HP formulas, bit 6 no ATB damage (Delay). Bit 9 (magic cancel, or Bribe: open in the RE note) is not read as Bribe: no 'immune-to-bribe'.
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'],
  forms: [{ name: 'Yojimbo', spriteKey: X2_YOJIMBO_SPRITE, hp: YOJIMBO_HP }],
  aiScriptId: X2_YOJIMBO_SCRIPT,
  rewards: {
    ap: 15, // EXP / AP / Gil / Pilfer Gil 2,000 / 15 / 1,500 / 2,000 [game rows: row 170]
    apOverkill: 15,
    gil: 1500,
    exp: 2000,
    stolenGil: 2000,
    overkillThreshold: 0, // not in the research
    drops: [{ itemId: 'recovery-bracer', count: 1 }], // drop and rare drop: Recovery Bracer x1 both, drop byte 255 [row 170]
    steal: {
      baseChance: 50, // the byte below as a percent (128 of 255 = 50.2): `stealRate` is the one the engine rolls against
      stealRate: 128, // steal chance byte 128 [row 170]
      common: { itemId: 'power-wrist', count: 1 }, // Power Wrist x1, common and rare [row 170]
      rare: { itemId: 'power-wrist', count: 1 },
    },
    // Mission reward: the Tetra Master Garment Grid and the Star Bracer [single source: wiki]. Grids are not an `EnemyRewards` field; the results screen does not show it (the Ixion precedent).
  },
  abilityIds: [...YOJIMBO_ACTION_IDS],
  flags: { isBoss: true },
  sensorText: 'He keeps a count of his own moves. When it fills, he cuts the whole party down to a breath, so heal first.',
};

/**
 * Daigoro, the dog: a separate battler with a record of his own (`monster.bin` row 174, formation 1847 slot 2): Level 30, HP 1, MP 1, STR 42, DEF 50, MAG 61, MDEF 106, AGI 120, ACC 95,
 * EVA 0, LCK 7, special word 0, no rewards, no ability list, Curse resist 255 (`./records-tourist-trap.ts` lays the resist byte). **He cannot be targeted** (the FFX-2 wiki, `[single source]`).
 * He takes no action here (one silent poll at the start, then his script waits forever; the real one, `m174`, is not decompiled), so none of these numbers is ever read in battle beyond HP 1 keeping him alive.
 */
export const x2Daigoro: EnemyDef = {
  id: X2_DAIGORO_ID,
  name: 'Daigoro',
  spriteKey: X2_DAIGORO_SPRITE,
  slot: 1,
  stats: { hp: 1, mp: 1, maxHp: 1, maxMp: 1, str: 42, mag: 61, def: 50, mdef: 106, agi: 120, eva: 0, luck: 7, acc: 95 }, // row 174
  hp: 1,
  mp: 1,
  level: 30, // row 174
  affinities: {}, // row 174: no element byte set
  immunities: {},
  immunityFlags: [], // row 174: special word 0
  forms: [{ name: 'Daigoro', spriteKey: X2_DAIGORO_SPRITE, hp: 1 }],
  aiScriptId: X2_DAIGORO_SCRIPT,
  rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [] }, // row 174: no rewards
  abilityIds: [], // row 174: no ability list
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

// The game's own monster rows on these enemies (rows 170 and 174, `./records-tourist-trap.ts` through `../monster-records/`): ACC, the resist bytes, the steal byte, the special word.
for (const group of touristTrapGroups) attachMonsterRecords(group);
