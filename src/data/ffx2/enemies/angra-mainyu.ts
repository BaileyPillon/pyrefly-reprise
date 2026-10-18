/**
 * Angra Mainyu, Zarich and Tawrich: FFX-2 Chapter 5, the story mission "Showdown in the Sands" at the Al Bhed excavation camp in the Bikanel Desert; one formation, three bodies (the hidden chapter
 * "Angra Mainyu", number 26, typed word `angra`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 268 to 270. The combatant ids are `x2-`-prefixed because nothing of FFX shares them.
 *
 * Bailey adopted the chapter on 2026-10-07 (D-536) and on 2026-10-14 wrote, relayed by the driver: "Please work on finishing the unimplemented chapters STAT". It ships **hidden behind the typed word
 * `angra`** (`src/data/chapter-ffx2-angra-mainyu.ts`).
 *
 * **The numbers are the game's own rows, then the wiki.** `research/re-ffx2-angra-mainyu.md` (the RE session, 2026-10-14) reads `monster.bin` rows **268** (Angra Mainyu), **269** (Zarich) and **270**
 * (Tawrich) of the Steam HD build, the five `bika*_229` formations and the start positions; the first build was written from `research/ffx2-angra-mainyu.md` (the FF Wiki revisions 4041096, 3573851 and
 * 3573852, and Jegged's Chapter 5 page), which the rows equal in level, HP, MP, the four stats the wiki lists, the rewards, the drop and the steal. **Where the row says more or differently, the row wins**, each
 * marked `[RE row N]` below: **Accuracy 95 and Evasion 0** (the wiki lists neither), **Zarich's Defense 0 and Tawrich's Magic Defense 0** (the wiki omits them), **Gravity is nulled on all three** (the wiki says
 * "halves" for the body and Tawrich), **Reflect lands on the body** (the wiki says it is immune; the row reads 0 there and 255 on the arms), and **the arms' permanent physical and magical immunities** (group-2 slots
 * 15 and 16, laid here as `autoStatuses`, the Vegnagun Leg's nodes' precedent). The rows are laid on these enemies by `../monster-records/records-angra-mainyu.ts` (`attachMonsterRecords`, at the foot of this file).
 * `tests/unit/chapters/angra-mainyu-data.test.ts` pins this file and the records against `tests/fixtures/parity/ffx2/angra_mainyu_rows.json` (the rows as decoded fields with their record offsets).
 *
 * **Parts.** The two arms are `parts` of the formation (`EnemyGroupDef.parts`, as Vegnagun's Bulwarks): drawn and targeted on their own, never a reason for the fight to go on: **the fight ends when the body
 * falls** (`battle/ffx2/results.ts`). The body revives a fallen arm and heals a hurt one (`../../../battle/ffx2/ai/angra-mainyu.ts`). The formation's slot order is the game's: Angra Mainyu first, Tawrich
 * second, Zarich third [RE §7].
 *
 * **Art: provisional.** Three new subjects (`characters/angra-mainyu`, `angra-zarich`, `angra-tawrich`: an `idle` each, made locally, candidates installed as new files in the art mirror; no approved painting
 * is replaced). No `hurt`, `cast`, `attack`, `ko` or `overdrive` painting exists for any of them: the presenter's fallback is drawn.
 */

import type { EnemyDef, EnemyGroupDef, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { ANGRA_MAINYU_GROUP_ID, X2_ANGRA_MAINYU_ID, X2_TAWRICH_ID, X2_ZARICH_ID } from '../../angra-mainyu-ids.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import {
  ANGRA_BIO_ID,
  ANGRA_CURAGA_ID,
  ANGRA_DEMI_ID,
  ANGRA_DISPEL_ID,
  ANGRA_FLARE_ID,
  ANGRA_FULL_LIFE_ID,
  ANGRA_OSMOSE_ID,
  ANGRA_PERDITIONS_FLAME_ID,
  TAWRICH_BLOODY_BREATH_ID,
  TAWRICH_PUNCH_ID,
  ZARICH_GLIMMER_ID,
  ZARICH_SPELL_IDS,
} from './angra-mainyu-abilities.ts';

/** The three paintings (provisional; new subjects in the art mirror). */
export const ANGRA_MAINYU_SPRITE = 'angra-mainyu';
export const ZARICH_SPRITE = 'angra-zarich';
export const TAWRICH_SPRITE = 'angra-tawrich';
/** The AI script ids (`../../../battle/ffx2/ai/angra-mainyu.ts`). */
export const ANGRA_MAINYU_SCRIPT_ID = 'x2-angra-mainyu';
export const ZARICH_SCRIPT_ID = 'x2-zarich';
export const TAWRICH_SCRIPT_ID = 'x2-tawrich';

/**
 * The status list shared by the three rows, **[RE rows 268 to 270]**: group 1 Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (slots 0 to 8), Eject (10) and slots 17 and 18 (Itchy and
 * Auto-Life in the engine's table); group 2 Slow (5), Stop (6), the Defense and Magic Defense stages (9, 10) and Doom (14); and the special word 0x7c3: bit 0 (the percent formulas do nothing), bit 1 (a hit reaction
 * does not slow it), bit 6 (no ATB damage: Delay does nothing), bits 7, 8, 9 and 10 (immune to Interrupt and to Bribe, whichever bit is which; the wiki also lists Interrupt). Haste, Shell, Protect and Regen are not
 * resisted, and **Reflect lands on the body** (the arms alone carry 255 there). The monster record replaces these bytes wherever the engine has a slot for them.
 */
const SHARED_IMMUNE: StatusImmunities = {
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
  slow: 255,
  stop: 255,
  doom: 255,
  'def-up': 255,
  'def-down': 255,
  'mdef-up': 255,
  'mdef-down': 255,
  'delay-effect': 255, // special bit 6
  'action-cancel': 255, // Interrupt: special bits 7 to 10 are set [RE row 268]
};

/**
 * **THE ARMS' IMMUNITIES: ONE CONSTANT, PROVED** by the RE session's review of this chapter (the first build had it as an inference). The two arms carry a permanent automatic status each, group-2 slot 15 (Zarich) and slot 16
 * (Tawrich), amount 127 (`research/re-ffx2-angra-mainyu.md` §4.1 and §4.2). The game's stat ids 88 to 90 (`stat_invincible_physic`, `stat_invincible_magic`, `stat_invincible`; FFX2-G05 section 3.5) write the counter bytes
 * 0x4B4 + 15, + 16 and + 17, so **slot 15 is physical immunity (Zarich), slot 16 magical immunity (Tawrich) and slot 17 full invincibility**, and damage step 12 (`research/re-ffx2-damage.md` §2.1) zeroes the damage of a hit
 * that meets the matching byte, which is what `battle/ffx2/kernel/pipeline.ts` does (`isImmune`, line 173). So **Zarich is immune to physical damage and Tawrich to magical damage**, which also matches the rows' defences
 * (Zarich DEF 0 / MDEF 99, Tawrich DEF 99 / MDEF 0), the two scripts' styles (a caster, a puncher), Jegged and the FF Wiki (`research/ffx2-angra-mainyu.md` §1 and §7). **One link stays unproved: the monster set-up's copy
 * of the row into the effective byte was read, not run.** Here the two slots are the engine's own `null-physical` and `null-magic` (`../../../battle/ffx2/adapt/slots.ts`: slot 15 and 16), laid as `autoStatuses` for good, so a
 * Dark Knight's Darkness, which is neither, reaches both (Jegged). `tests/unit/chapters/angra-mainyu-engine.test.ts` pins the reading.
 */
export const COMPANION_IMMUNITY: { readonly zarich: StatusId; readonly tawrich: StatusId } = { zarich: 'null-physical', tawrich: 'null-magic' };

/**
 * **Action time, ON at 3 s: kept by precedent (D-151 Cloister, D-187 and D-197 Road, D-269 Ixion), awaiting Bailey's pick for this chapter** (those picks were his for those chapters, not for this one; the rule is
 * sourced `[verified: 2 sources]`, its length is not, `research/ffx2-trema.md` §12.4). One named constant; `false` turns it off; no boss number moves either way. `tests/unit/chapters/angra-mainyu-bench.test.ts`
 * measures the fight with and without it (the numbers are in the handoff).
 */
export const ANGRA_MAINYU_ACTION_TIME_ON: boolean = true;
/** **`[estimate]`**: the length the precedent chapters ship, awaiting Bailey's pick here. Unsourced (research `ffx2-trema.md` §12.4). */
export const ANGRA_MAINYU_ACTION_TIME_SECONDS = 3;
const actionTime = ANGRA_MAINYU_ACTION_TIME_ON ? { actionTimeSeconds: ANGRA_MAINYU_ACTION_TIME_SECONDS } : {};

/** The fight plays our own original aeon cue, the sourced mood of the game's "Aeons" (FF Wiki OST page: it plays in the Angra Mainyu fight, `[single source]`; the retail track is never used): `boss-ffx2-fallen-aeons`. */
const AEON_CUE = [{ at: 'start' as const, track: 'boss-ffx2-fallen-aeons' as const, fadeMs: 800 }];

/** The arms pay nothing [RE rows 269 and 270: EXP, AP, Gil, drop and steal all 0]. */
const NO_REWARDS: EnemyDef['rewards'] = { ap: 0, apOverkill: 0, gil: 0, exp: 0, overkillThreshold: 0, drops: [] };

/** Angra Mainyu, the body: bestiary #175, `monster.bin` row 268 (id 0x110c). */
export const x2AngraMainyu: EnemyDef = {
  id: X2_ANGRA_MAINYU_ID,
  name: 'Angra Mainyu',
  spriteKey: ANGRA_MAINYU_SPRITE, // provisional: a new subject (see the file header)
  slot: 0,
  stats: {
    hp: 333444, // [RE row 268] = wiki rev 4041096 = Jegged [verified: 3 sources]
    mp: 9999,
    maxHp: 333444,
    maxMp: 9999,
    str: 73, // STR / DEF / MAG / MDEF 73 / 124 / 97 / 114 [RE row 268] = wiki [verified: 2 sources]
    def: 124,
    mag: 97,
    mdef: 114,
    agi: 68, // AGI 68, LCK 2 [RE row 268] = wiki
    eva: 0, // [RE row 268] (the wiki lists none)
    luck: 2,
    acc: 95, // [RE row 268] (the wiki lists none); the monster record lays the same byte
  },
  hp: 333444,
  mp: 9999,
  level: 47, // [RE row 268] = wiki
  affinities: { gravity: 'immune' }, // null byte 0x10 [RE row 268]: the wiki says "halves", which the row does not
  immunities: { ...SHARED_IMMUNE },
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Angra Mainyu', spriteKey: ANGRA_MAINYU_SPRITE, hp: 333444 }],
  aiScriptId: ANGRA_MAINYU_SCRIPT_ID,
  rewards: {
    ap: 30, // EXP / AP / Gil 5,000 / 30 / 5,000, Pilfer Gil 2,000 [RE row 268] = wiki [verified: 2 sources]
    apOverkill: 30,
    gil: 5000,
    stolenGil: 2000,
    exp: 5000,
    overkillThreshold: 0,
    drops: [{ itemId: 'ribbon', count: 1 }], // Ribbon x1, common and rare, chance byte 255 [RE row 268] = wiki = Jegged [verified: 3 sources]
    steal: {
      baseChance: 50, // [model] the house default: the legacy field no source gives; the engine's steal reads `stealRate`
      stealRate: 255, // [RE row 268] steal chance byte 255 (it always succeeds on its one attempt); the monster record lays the same byte
      common: { itemId: 'x2-megalixir', count: 1 }, // Megalixir x1 (item 0x2009) [RE row 268] = wiki = Jegged [verified: 3 sources]
      rare: { itemId: 'x2-megalixir', count: 1 },
    },
  },
  // The row's list (0x412c Unnatural Selection, 0x412d Perdition's Flame, 0x412e Die, 0x406d Osmose, 0x30ba Full-Life, 0x3082 Demi, 0x3085 Bio, 0x30b5 Curaga, 0x30b8 Dispel, 0x3170 Flare) less the two that are no
  // part of the full fight: Unnatural Selection (the capped fights' eject) and Die (presentation only).
  abilityIds: [ANGRA_PERDITIONS_FLAME_ID, ANGRA_OSMOSE_ID, ANGRA_FULL_LIFE_ID, ANGRA_DEMI_ID, ANGRA_BIO_ID, ANGRA_CURAGA_ID, ANGRA_DISPEL_ID, ANGRA_FLARE_ID],
  flags: { isBoss: true },
  sensorText: 'Its flame lands ten times, on whoever it picks. Keep everyone high, and keep the arms down.',
  scanText: 'A fiend the Cactuars sealed under the sand. It wakes angry, and its arms do most of the thinking.',
};

/** Tawrich, the right arm: bestiary #176, `monster.bin` row 270 (id 0x110e); a part of the body; slot 2 of the game's formation. */
export const x2Tawrich: EnemyDef = {
  id: X2_TAWRICH_ID,
  name: 'Tawrich',
  spriteKey: TAWRICH_SPRITE,
  slot: 1,
  stats: {
    hp: 5440, // [RE row 270] = wiki rev 3573851
    mp: 9999,
    maxHp: 5440,
    maxMp: 9999,
    str: 85, // STR / DEF / MAG / MDEF 85 / 99 / 42 / 0 [RE row 270]; the wiki omits the MDEF
    def: 99,
    mag: 42,
    mdef: 0,
    agi: 113, // AGI 113, LCK 1 [RE row 270] = wiki
    eva: 0,
    luck: 1,
    acc: 95, // [RE row 270]
  },
  hp: 5440,
  mp: 9999,
  level: 38, // [RE row 270] = wiki
  affinities: { gravity: 'immune' }, // null byte 0x10 [RE row 270]: the wiki says "halves"
  immunities: { ...SHARED_IMMUNE, reflect: 255 }, // Reflect 255 on both arms [RE rows 269, 270]
  immunityFlags: ['immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  // Group-2 slot 16, amount 127 [RE row 270]: the magical-immunity counter (Null Magic). Spells pass through it; Darkness, which is neither physical nor magical, does not [Jegged, wiki]. Proved: see {@link COMPANION_IMMUNITY}.
  autoStatuses: [COMPANION_IMMUNITY.tawrich],
  forms: [{ name: 'Tawrich', spriteKey: TAWRICH_SPRITE, hp: 5440 }],
  aiScriptId: TAWRICH_SCRIPT_ID,
  rewards: NO_REWARDS,
  abilityIds: [TAWRICH_PUNCH_ID, TAWRICH_BLOODY_BREATH_ID],
  flags: { isPart: true, partOf: X2_ANGRA_MAINYU_ID },
  sensorText: 'The right arm. Spells pass through it. It punches, and it breathes ruin.',
  scanText: 'The right arm of the fiend. It handles the heavy blows, and what its breath leaves behind is worse.',
};

/** Zarich, the left arm: bestiary #177, `monster.bin` row 269 (id 0x110d); a part of the body; slot 3 of the game's formation. */
export const x2Zarich: EnemyDef = {
  id: X2_ZARICH_ID,
  name: 'Zarich',
  spriteKey: ZARICH_SPRITE,
  slot: 2,
  stats: {
    hp: 5440, // [RE row 269] = wiki rev 3573852
    mp: 9999,
    maxHp: 5440,
    maxMp: 9999,
    str: 70, // STR / DEF / MAG / MDEF 70 / 0 / 25 / 99 [RE row 269]; the wiki omits the DEF
    def: 0,
    mag: 25,
    mdef: 99,
    agi: 82, // AGI 82, LCK 1 [RE row 269] = wiki
    eva: 0,
    luck: 1,
    acc: 95, // [RE row 269]
  },
  hp: 5440,
  mp: 9999,
  level: 36, // [RE row 269] = wiki
  // Null Gravity (0x10) and half Fire, Ice, Lightning, Water and Holy (0x2f) [RE row 269] = wiki ("halves" the five; the wiki's "immune" Gravity is the row's null).
  affinities: { gravity: 'immune', fire: 'resist', ice: 'resist', lightning: 'resist', water: 'resist', holy: 'resist' },
  immunities: { ...SHARED_IMMUNE, reflect: 255 },
  immunityFlags: ['immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  // Group-2 slot 15, amount 127 [RE row 269]: the physical-immunity counter (Null Physical). Blows pass through it; Darkness does not [Jegged, wiki]. Proved: see {@link COMPANION_IMMUNITY}.
  autoStatuses: [COMPANION_IMMUNITY.zarich],
  forms: [{ name: 'Zarich', spriteKey: ZARICH_SPRITE, hp: 5440 }],
  aiScriptId: ZARICH_SCRIPT_ID,
  rewards: NO_REWARDS,
  abilityIds: [ZARICH_GLIMMER_ID, ...ZARICH_SPELL_IDS],
  flags: { isPart: true, partOf: X2_ANGRA_MAINYU_ID },
  sensorText: 'The left arm. Blows pass through it. It casts, and it saps MP and strength.',
  scanText: 'The left arm of the fiend. It does the casting, and it cuts at the party’s strength and MP.',
};

/** The formation (`bika07_229`, `bika08_229`, `bika09_229`, `bika13_229` and `bika14_229`: the same three monsters in five desert maps [RE §7]). */
export const angraMainyuGroup: EnemyGroupDef = {
  id: ANGRA_MAINYU_GROUP_ID,
  game: 'ffx2',
  enemies: [x2AngraMainyu],
  parts: [x2Tawrich, x2Zarich],
  canEscape: false,
  musicCues: AEON_CUE,
  ...actionTime, // ANGRA_MAINYU_ACTION_TIME_ON: on, 3 s, kept by precedent (D-151, D-187/D-197, D-269), awaiting Bailey's pick
};

export const angraMainyuGroups: readonly EnemyGroupDef[] = [angraMainyuGroup];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte and gil. `../monster-records/records-angra-mainyu.ts`.
for (const group of angraMainyuGroups) attachMonsterRecords(group);
