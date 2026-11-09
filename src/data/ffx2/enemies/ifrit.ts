/**
 * Ifrit at Kilika Temple: FFX-2 Chapter 3, the story mission "Pest Control", one link (the hidden chapter "Ifrit at Kilika Temple", number 46).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the fallen aeons' action counter (`research/ffx2-fallen-aeons.md` §0: "None of it transfers to the FFX aeons"). The combatant id is `x2-ifrit` because the
 * FFX data already uses `ifrit` (Yuna's aeon, Belgemine's, the Dark Ifrit; the Chapter XI `x2-shiva`, Chapter XVI `x2-ixion` and `x2-valefor` precedent).
 *
 * Authority (relayed by the release driver, verbatim): "implement all unimplemented chapters please" (2026-11-06) and "yes on all these too" (every researched boss he never picked); 2026-11-07 "ok keep going we have full usage here".
 * The chapter ships **hidden behind the typed word `ifrit`** (`../../../app/screens/frontend/ifritDoor.ts`).
 *
 * **The numbers are the game's own row** (`research/re-ffx2-ifrit-kilika.md` §0, `monster.bin` **row 165** of the Steam HD build, read by the research lane and again by the reader that wrote
 * `tests/fixtures/parity/ffx2/ifrit_kilika_rows.json`): the Kilika Temple trial, formation 483 `klyt11_229`, Lv 23, HP 8,820, MP 9,999. It equals `research/ffx2-fallen-aeons.md` §7.1 (SinirothX's *Enemy Encyclopedia* + the FF
 * Wiki, `[verified: 2 sources]`; HP, EXP, AP, gil and items also FFExodus, GamerGuides, Split_Infinity) in every field the two share (level, HP, the eight stats, EXP, AP, Gil, Pilfer Gil, the drop, the steal). **Where the row says
 * more, the row wins**, each marked `[RE row 165]` below: **MP 9,999** and **Accuracy 95** (§7.1 gives neither), the **status list** (Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, Itchy,
 * Auto-Life, Stop, Doom), the **steal chance byte 128**, the Zantetsu byte 80, the **special word 0x3c3**, and the **automatic status "uses no MP"**. The row is laid on this enemy by `../monster-records/records-ifrit.ts`
 * (`attachMonsterRecords`, called at the foot of this file). `tests/unit/chapters/ifrit-kilika-data.test.ts` pins this file and the record against the fixture.
 *
 * **Art (release 79, `docs/handoff/r79-art-install.md`).** `spriteKey: 'x2-ifrit'` is the possessed-aeon restyle of the FFX aeon's approved set (`public/art/characters/x2-ifrit/{idle,attack,cast,hurt,ko,overdrive}`: the approved
 * paintings' own pixels through the possession grade, as `x2-ixion`, `x2-shiva` and `x2-anima` are). The FFX `ifrit` set is untouched.
 *
 * **Action time.** No flat window: the per-command span (`ACTION_TIME_PER_COMMAND`, `action-span.ts`, on since r56) supersedes the formation's old flat 3 s, as for the chapters made after it. His body (motion set 0x10a5) has no frame
 * table in the repo yet, so the engine keeps today's hit-reaction window on him (the Bevelle guardians' and the Farplane Cup's bodies are in the same position).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import { IFRIT_ATTACK_ID, IFRIT_ANNOUNCEMENT_IDS, IFRIT_FIRAGA_ID, IFRIT_HELLFIRE_ID, IFRIT_METEOR_STRIKE_ID, IFRIT_TIME_UP_METEOR_ID } from './ifrit-abilities.ts';

/** The formation (`Kilika Temple - Fayth - BOSS 229 Ifrit 1`, Chapter 3 `[SinirothX]`; the game's `klyt11_229`, formation 483 [RE row 165]). The chapter's own id is `ffx2-ifrit-kilika`, the order `ffx2-valefor-besaid` uses. */
export const KILIKA_IFRIT = 'ffx2-kilika-ifrit';
export const IFRIT_ID = 'x2-ifrit';
/** Ifrit's painting: the possessed restyle of the FFX aeon's approved set (see the file header). */
export const IFRIT_SPRITE = 'x2-ifrit';
/** The AI script id (`../../../battle/ffx2/ai/ifrit.ts`). */
export const IFRIT_SCRIPT_ID = 'x2-ifrit';

/**
 * The status list, **[RE row 165]**: group 1 Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (slots 0 to 8), Eject (10) and slots 17 and 18 (Itchy and Auto-Life in the engine's table); group 2 Stop (6)
 * and Doom (14); and the special word's bits: **bit 6 (no ATB damage: Delay does nothing) and bits 7, 8 and 9 set, so he is immune to Interrupt and to Bribe, whichever bit is which** (the same word as Valefor's). **Slow and
 * every Break land** (all seven stat-stage bytes and Slow read 0; also §7.1 "Breaks and Slow land"). Zantetsu (byte 80) is not modelled (no `zantetsu` status; the Ixion and Valefor precedent). The monster record replaces these
 * bytes wherever the engine has a slot for them.
 */
const IFRIT_IMMUNE: StatusImmunities = {
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
  'action-cancel': 255, // Interrupt: special bits 7, 8 and 9 are set [as Valefor's row]
};

/** The fight plays our own original aeon cue, the sourced mood of the game's "Aeons" (research §6.3, `[single source]`; the retail track is never used): `boss-ffx2-fallen-aeons`, the one Chapter XI, Ixion and Valefor play. */
const AEON_CUE = [{ at: 'start' as const, track: 'boss-ffx2-fallen-aeons' as const, fadeMs: 800 }];

/** Ifrit, story version, bestiary #179 (research §7.1) = `monster.bin` row 165 (the game's own table). */
export const x2Ifrit: EnemyDef = {
  id: IFRIT_ID,
  name: 'Ifrit',
  spriteKey: IFRIT_SPRITE, // the possessed restyle (see the file header)
  slot: 0,
  stats: {
    hp: 8820, // [RE row 165] = §7.1 [verified: 5 sources: SinirothX, wiki, FFExodus, GamerGuides, Split_Infinity]
    mp: 9999, // [RE row 165] (§7.1 gives none); Firaga's 24 is free for him ("uses no MP"), and 9,999 pays it 416 times
    maxHp: 8820,
    maxMp: 9999,
    str: 82, // STR / MAG / DEF / MDEF 82 / 22 / 98 / 49 [RE row 165] = §7.1 [verified: 2 sources: SinirothX, wiki]
    mag: 22,
    def: 98,
    mdef: 49,
    agi: 114, // Agility / Evasion / Luck 114 / 14 / 2 [RE row 165] = §7.1 [verified: 2 sources]
    eva: 14,
    luck: 2,
    acc: 95, // [RE row 165] (§7.1 gives none); the monster record lays the same byte (`../monster-records/index.ts`)
  },
  hp: 8820,
  mp: 9999,
  level: 23, // [RE row 165] = §7.1 [verified: 2 sources]
  // Absorbs Fire, weak to Ice, Gravity nulled; Lightning, Water and Holy neutral [RE row 165: absorb byte 0x01, weak byte 0x02, null byte 0x10] = §7.1 "Fire absorb, Ice weak" [verified: 2 sources]; Gravity is the row's alone.
  affinities: { fire: 'absorb', ice: 'weak', gravity: 'immune' },
  immunities: IFRIT_IMMUNE,
  // The special word 0x3c3 [RE row 165]: bit 0 immune to the percent-HP formulas ("fractional damage"), bit 6 no ATB damage (Delay), bits 7, 8 and 9 set: immune to Interrupt and to Bribe, whichever bit is which.
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Ifrit', spriteKey: IFRIT_SPRITE, hp: 8820 }],
  aiScriptId: IFRIT_SCRIPT_ID,
  rewards: {
    ap: 15, // EXP / AP / Gil 1,800 / 15 / 1,300 [RE row 165] = §7.1 [verified: 2 sources + three guides]
    apOverkill: 15,
    gil: 1300,
    stolenGil: 1800, // Pilfer Gil [RE row 165] = §7.1 [verified: 2 sources]
    exp: 1800,
    overkillThreshold: 0,
    drops: [{ itemId: 'angel-earrings', count: 1 }], // drop: Angel Earrings, common and rare, chance byte 255 [RE row 165, accessory 0x9045] = §7.1 [verified: 2 sources]
    steal: {
      baseChance: 50, // [model] the house default: the legacy field no source gives; the engine's steal reads `stealRate`
      stealRate: 128, // [RE row 165] steal chance byte 128 (50.2 %); the monster record lays the same byte
      common: { itemId: 'fiery-gleam', count: 1 }, // Fiery Gleam x1 [RE row 165, accessory 0x9020] = §7.1 [verified: 2 sources]
      rare: { itemId: 'fiery-gleam', count: 1 }, // rare x1 [RE row 165]
    },
    // Mission reward: none in the research. Bribe: the row has no Bribe slot and bits 7, 8 and 9 of its special word are set: no `bribe`, and the flag above.
  },
  abilityIds: [IFRIT_ATTACK_ID, IFRIT_FIRAGA_ID, IFRIT_METEOR_STRIKE_ID, IFRIT_HELLFIRE_ID, ...IFRIT_ANNOUNCEMENT_IDS, IFRIT_TIME_UP_METEOR_ID],
  flags: { isBoss: true },
  sensorText: 'Every blow warms him. At thirty, sixty and ninety, a meteor for whoever stands back. At a hundred, Hellfire.',
  scanText: 'An aeon of the Kilika fayth, held by Shuyin’s pyreflies. Fire heals him; Ice does not.',
};

/** The one link. */
export const kilikaIfritGroup: EnemyGroupDef = {
  id: KILIKA_IFRIT,
  game: 'ffx2',
  enemies: [x2Ifrit],
  canEscape: false,
  musicCues: AEON_CUE,
};

export const ifritGroups: readonly EnemyGroupDef[] = [kilikaIfritGroup];

// The game's own monster row on this enemy (re-parity W3): ACC, the resist bytes, the steal byte and gil, the plain Attack. `../monster-records/records-ifrit.ts`.
for (const group of ifritGroups) attachMonsterRecords(group);
