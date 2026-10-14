/**
 * Valefor at Besaid Temple: FFX-2 Chapter 3, the story mission "Protect Besaid Temple!", one link (the hidden chapter "Valefor at Besaid", number 24).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the fallen aeons' action counter (`research/ffx2-fallen-aeons.md` §0: "None of it transfers to the FFX
 * aeons"). The combatant id is `x2-valefor` because the FFX data already uses `valefor` and `possessed-valefor` (the Chapter XI `x2-shiva` and Chapter XVI `x2-ixion` precedent).
 *
 * Bailey, 2026-10-13 (chat, relayed by the driver): "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple."
 * and "full speed ahead while I sleep". The chapter ships **hidden behind the typed word `besaid`** (`src/data/chapter-ffx2-valefor-besaid.ts`).
 *
 * **The numbers are the game's own row, then the research.** `research/re-ffx2-yojimbo-valefor.md` (the RE session, 2026-10-14) reads `monster.bin` **row 164** of the Steam HD build: the
 * Besaid Temple Valefor, formation 0393 `bsyt05_229`, Lv 22, HP 8,430, MP 9,999. It equals `research/ffx2-fallen-aeons.md` §7.1 (SinirothX's *Enemy Encyclopedia* + the FF Wiki, `[verified: 2
 * sources]`; HP, EXP, AP, gil and items also FFExodus, GamerGuides, Split_Infinity) in every field the two share (level, HP, the eight stats, EXP, AP, Gil, Pilfer Gil, the drop, the steal and its
 * quantities). **Where the row says more, the row wins**, each marked `[RE row 164]` below: **MP 9,999** (§7.1 gives none), **Accuracy 95** (§7.1 gives none), the **status list** (Death, Petrify, Sleep,
 * Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Stop, Doom; the special word's bits 0 and 6), the **steal chance byte 128**, the Zantetsu byte 80, and **Gravity is nulled**, which §7.1's
 * "neutral" omits. The row is laid on this enemy by `../monster-records/records-valefor.ts` (`attachMonsterRecords`, called at the foot of this file). **The second Valefor, row 363 (Lv 48, HP 38,000),
 * sits in no formation and is NOT used here.** Columns the note marks "unmapped (raw N)" are wired to nothing except where the RE review of 2026-10-14 says the engine's table is right: group-1 slots 17 and 18 (Itchy and Auto-Life) are in the record, and the special word's bits 7, 8 and 9 make her immune to Interrupt and Bribe.
 * `tests/unit/chapters/besaid-valefor-data.test.ts` pins this file and the record against `tests/fixtures/parity/ffx2/besaid_valefor_rows.json` (the row's 200 raw bytes, decoded by the test).
 *
 * **Art: provisional.** `spriteKey: 'valefor'` is the FFX aeon's approved painting set (`public/art/characters/valefor/{idle,attack,cast,hurt}`), reused as is. There is no `ko`
 * or `overdrive` painting for her and no possessed look (`x2-` treatments exist only for Shiva, Anima and Ixion); a possessed painting would be a new art step held for Bailey.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import { VALEFOR_ATTACK_ID, VALEFOR_ENERGY_BLAST_ID, VALEFOR_ENERGY_RAY_ID, VALEFOR_SONIC_WINGS_ID } from './valefor-abilities.ts';

/** The formation (`Besaid Temple - Fayth - BOSS 229 Valefor 1`, Chapter 3 `[SinirothX]`; the game's `bsyt05_229`, formation 0393 [RE row 164]). The chapter's own id is `ffx2-valefor-besaid`, the order `ffx2-ixion-djose` uses. */
export const BESAID_VALEFOR = 'ffx2-besaid-valefor';
export const VALEFOR_ID = 'x2-valefor';
/** Valefor's painting: the FFX aeon's approved set, provisional here (see the file header). */
export const VALEFOR_SPRITE = 'valefor';
/** The AI script id (`../../../battle/ffx2/ai/valefor.ts`). */
export const VALEFOR_SCRIPT_ID = 'x2-valefor';

/**
 * The status list, **[RE row 164]**: group 1 Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (slots 0 to 8), Eject (10) and slots 17 and 18 (Itchy and Auto-Life in the engine's table;
 * the RE review of 2026-10-14 confirmed the table, 369 of the 370 monster rows carry 255 there); group 2 Stop (6) and Doom (14); and the special word's bits: **bit 6 (no ATB damage: Delay does nothing,
 * `research/re-ffx2-damage.md` §2.4) and bits 7, 8 and 9 set, so she is immune to Interrupt and to Bribe, whichever bit is which** (the RE review). **Slow and every Break land** (all seven stat-stage bytes and Slow
 * read 0; also §7.1 "Breaks and Slow land"). Zantetsu (byte 80) is not modelled (no `zantetsu` status; the Ixion precedent). The monster record replaces these bytes wherever the engine has a slot for them.
 */
const VALEFOR_IMMUNE: StatusImmunities = {
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
  'delay-effect': 255, // special bit 6
  'action-cancel': 255, // Interrupt: special bits 7, 8 and 9 are set [RE review]
};

/**
 * **Action time, ON at 3 s**, as the sibling fallen-aeon chapters ship it (Chapters XI, XIII, XVI: Bailey's pick D-269; the rule is sourced `[verified: 2 sources]`, its length is not,
 * `research/ffx2-trema.md` §12.4). One named constant; `false` turns it off; no boss number moves either way. `tests/unit/chapters/besaid-valefor-bench.test.ts` measures both.
 */
export const VALEFOR_ACTION_TIME_ON: boolean = true;
/** **`[estimate]`**: the length the sibling chapters ship. Unsourced (research `ffx2-trema.md` §12.4). */
export const VALEFOR_ACTION_TIME_SECONDS = 3;
const actionTime = VALEFOR_ACTION_TIME_ON ? { actionTimeSeconds: VALEFOR_ACTION_TIME_SECONDS } : {};

/** The fight plays our own original aeon cue, the sourced mood of the game's "Aeons" (research §6.3, `[single source]`; the retail track is never used): `boss-ffx2-fallen-aeons`, the one Chapter XI and Ixion play. */
const AEON_CUE = [{ at: 'start' as const, track: 'boss-ffx2-fallen-aeons' as const, fadeMs: 800 }];

/** Valefor, story version, bestiary #178 (research §7.1) = `monster.bin` row 164 (the game's own table). */
export const x2Valefor: EnemyDef = {
  id: VALEFOR_ID,
  name: 'Valefor',
  spriteKey: VALEFOR_SPRITE, // provisional: the FFX aeon's approved painting (see the file header)
  slot: 0,
  stats: {
    hp: 8430, // [RE row 164] = §7.1 [verified: 5 sources: SinirothX, wiki, FFExodus, GamerGuides, Split_Infinity]
    mp: 9999, // [RE row 164] (§7.1 gives none); no move of hers costs MP
    maxHp: 8430,
    maxMp: 9999,
    str: 97, // STR / MAG / DEF / MDEF 97 / 11 / 76 / 20 [RE row 164] = §7.1 [verified: 2 sources: SinirothX, wiki]
    mag: 11,
    def: 76,
    mdef: 20,
    agi: 125, // Agility / Evasion / Luck 125 / 25 / 3 [RE row 164] = §7.1 [verified: 2 sources]
    eva: 25,
    luck: 3,
    acc: 95, // [RE row 164] (§7.1 gives none); the monster record lays the same byte (`../monster-records/index.ts`)
  },
  hp: 8430,
  mp: 9999,
  level: 22, // [RE row 164] = §7.1 [verified: 2 sources]
  // Neutral to Fire, Ice, Lightning, Water and Holy [RE row 164: no absorb, half or weak byte] = §7.1 [verified: 2 sources]; **Gravity is nulled** [RE row 164: null byte 0x10, bit 4], which §7.1 omits.
  affinities: { gravity: 'immune' },
  immunities: VALEFOR_IMMUNE,
  // The special word 0x3c3 [RE row 164]: bit 0 immune to the percent-HP formulas ("fractional damage"), bit 6 no ATB damage (Delay), bits 7, 8 and 9 set: immune to Interrupt and to Bribe, whichever bit is which [RE review].
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Valefor', spriteKey: VALEFOR_SPRITE, hp: 8430 }],
  aiScriptId: VALEFOR_SCRIPT_ID,
  rewards: {
    ap: 15, // EXP / AP / Gil 1,500 / 15 / 1,200 [RE row 164] = §7.1 [verified: 2 sources + three guides]
    apOverkill: 15,
    gil: 1200,
    stolenGil: 1500, // Pilfer Gil [RE row 164] = §7.1 [verified: 2 sources]
    exp: 1500,
    overkillThreshold: 0,
    drops: [{ itemId: 'moon-bracer', count: 1 }], // drop: Moon Bracer, common and rare, chance byte 255 [RE row 164] = §7.1 [verified: 2 sources]
    steal: {
      baseChance: 50, // [model] the house default: the legacy field no source gives; the engine's steal reads `stealRate`
      stealRate: 128, // [RE row 164] steal chance byte 128 (50.2 %); the monster record lays the same byte
      common: { itemId: 'x2-healing-spring', count: 4 }, // Healing Spring x4 [RE row 164, item 0x2034] = §7.1 [verified: 2 sources]
      rare: { itemId: 'x2-healing-spring', count: 6 }, // rare x6 [RE row 164] = §7.1 [verified: 2 sources]
    },
    // Mission reward: none in the research. Bribe: the row has no Bribe slot and bits 7, 8 and 9 of its special word are set (immune to Bribe whichever bit is which, the RE review): no `bribe`, and the flag above.
  },
  abilityIds: [VALEFOR_ATTACK_ID, VALEFOR_SONIC_WINGS_ID, VALEFOR_ENERGY_RAY_ID, VALEFOR_ENERGY_BLAST_ID],
  flags: { isBoss: true },
  sensorText: 'The pyreflies answer every blow. Two rays, then a blast.',
  scanText: 'An aeon of the Besaid fayth, held by Shuyin’s pyreflies.',
};

/** The one link. */
export const besaidValeforGroup: EnemyGroupDef = {
  id: BESAID_VALEFOR,
  game: 'ffx2',
  enemies: [x2Valefor],
  canEscape: false,
  musicCues: AEON_CUE,
  ...actionTime, // VALEFOR_ACTION_TIME_ON: on, 3 s, as the sibling aeon chapters
};

export const valeforGroups: readonly EnemyGroupDef[] = [besaidValeforGroup];

// The game's own monster row on this enemy (re-parity W3): ACC, the resist bytes, the steal byte and gil, the plain Attack. `../monster-records/records-valefor.ts`.
for (const group of valeforGroups) attachMonsterRecords(group);
