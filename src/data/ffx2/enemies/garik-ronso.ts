/**
 * Garik Ronso and the Ronso Youths: the fight at the top of Mt. Gagazet, FFX-2 Chapter 3, the mission "Battle Blockade" (formations 1622 `mtgz10_228` and 1621 `mtgz10_229`), as the hidden chapter of that name (number 47).
 * **FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 181 (Ronso Youth) and 182 (Garik Ronso); the FFX Ronso (Kimahri, Biran, Yenke) and the Cup Garik (row 324, Lv 67, the Fiend Arena's) are other
 * monsters and no number of them is used (`research/re-ffx2-garik-ronso.md`).
 *
 * Authority (relayed by the release driver, verbatim): "implement all unimplemented chapters please" (2026-11-06), "yes on all these too" (every researched boss he never picked), 2026-11-07 "ok keep going we have full usage
 * here" and, 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick here is the paper preflight's own recommendation (`docs/plans/ch-lionheart-review.md`;
 * `docs/handoff/ch-garik-ronso.md` lists each with its alternative, "driver's call, his to overturn"). It ships **hidden behind a typed word** (`src/app/screens/frontend/braveheartDoor.ts`).
 *
 * **Two formations, one setting.** The game keeps one saved score (Ronso trust, from how the player answered the Ronso on the mountain) and launches the summit fight as one of two scenes: **hostile** (`mtgz10_228`, the usual
 * result: two Youths and Garik, 15,000 HP in all, Garik hunting Black Mages with Bane Lance and guarding his side every seventh turn) or **friendly** (`mtgz10_229`: one Youth and Garik, 10,940 HP, Garik only buffing himself on a
 * fixed beat). The setting that picks one is `../../garik-ronso-trust.ts`; **low trust, the hostile fight, is the default**. The two have their own enemy ids and script ids (the script reads no scene flag).
 *
 * Confidence: the rows are [single source], the game's own kernel tables (`research/re-ffx2-garik-ronso.md` §0); the polls' timings are [derived] from the note's §2; the staging, the Ronso's heights and the party's levels are an [estimate].
 *
 * **The numbers are the game's own rows** (`research/re-ffx2-garik-ronso.md` section 0), each tagged `[RE §n]` below; `attachMonsterRecords` lays the rows on each enemy at the foot of this file (ACC 95, the resist bytes, the
 * special word, the steal byte). `tests/unit/chapters/garik-ronso-data.test.ts` pins this file and the records against `tests/fixtures/parity/ffx2/garik_ronso_rows.json`. The rows' "thinking byte" (0 for Garik, 30 for the
 * Youth) is not modelled: the engine's thinking base is 0 in play (`research/re-ffx2-atb-status.md` section 3.4). **Escape is off** on both formations (the fight is the mission's).
 *
 * **Art (stand-ins, flagged; `docs/handoff/ch-garik-ronso.md` has the art list with exact sprite keys):** the Ronso brothers' paintings of the FFX Biran and Yenke chapter stand for the Youths, Kimahri's party set for Garik. The
 * sizes are the scene's (`src/scenes/gagazet-summit.ts`).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  GARIK_FRIENDLY_GROUP_ID,
  GARIK_FRIENDLY_SCRIPT_ID,
  GARIK_HOSTILE_GROUP_ID,
  GARIK_HOSTILE_SCRIPT_ID,
  GARIK_SPRITE,
  X2_GARIK_BOUT_ID,
  X2_GARIK_ID,
  X2_YOUTH_A_ID,
  X2_YOUTH_B_ID,
  X2_YOUTH_BOUT_ID,
  YOUTH_A_SPRITE,
  YOUTH_B_SPRITE,
  YOUTH_FRIENDLY_SCRIPT_ID,
  YOUTH_HOSTILE_SCRIPT_ID,
} from '../../garik-ronso-ids.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import {
  GARIK_ATTACK_ID,
  GARIK_BANE_LANCE_ID,
  GARIK_BLIND_ID,
  GARIK_MIGHTY_GUARD_ID,
  GARIK_PROTECT_ID,
  GARIK_SHELL_ID,
  RONSO_ANNOUNCEMENT_IDS,
  RONSO_TIME_UP_METEOR_ID,
  YOUTH_ATTACK_ID,
  YOUTH_MP_BLOWOUT_ID,
} from './garik-ronso-abilities.ts';

/**
 * Garik's ailments [RE §0]: Death, Petrify, Sleep, Silence, Berserk, Curse, Eject, Itchy and Auto-Life (group 1) at 255; Darkness and Poison at **20** (they can land); Slow, Stop and Doom (group 2) at 255; **Confusion is not
 * listed: it lands**, and so does every stat stage. The special word 0x3c3 (bits 0, 1, 6, 7, 8, 9): the percent formulas do nothing, a hit does not slow him, no ATB damage, no Interrupt, the Bribe bit with no bribe items.
 * The monster record replaces these bytes wherever the engine has a slot.
 */
const GARIK_IMMUNE: StatusImmunities = {
  ko: 255,
  petrify: 255,
  sleep: 255,
  silence: 255,
  darkness: 20,
  poison: 20,
  berserk: 255,
  curse: 255,
  eject: 255,
  itchy: 255,
  'auto-life': 255,
  slow: 255,
  stop: 255,
  doom: 255,
  'delay-effect': 255, // special bit 6 (no ATB damage); the Youths have no such bit and can be delayed
  'action-cancel': 255, // special bit 9
};

/** The Youth's ailments [RE §0]: Death, Petrify, Sleep, Silence, Curse, Itchy and Auto-Life at 255, Darkness at 20, Doom at 255 (group 2). **Poison, Confusion, Berserk, Eject, Slow and Stop land.** Special word 0x181 (bits 0, 7, 8). */
const YOUTH_IMMUNE: StatusImmunities = {
  ko: 255,
  petrify: 255,
  sleep: 255,
  silence: 255,
  darkness: 20,
  curse: 255,
  itchy: 255,
  'auto-life': 255,
  doom: 255,
};

/** The fight plays our own original aeon cue (the preflight's GA8, a flagged stand-in: rule 13, Bailey's ears judge music), the one the Fallen Aeons, Ixion and Valefor play. */
const FIGHT_CUE = [{ at: 'start' as const, track: 'boss-ffx2-fallen-aeons' as const, fadeMs: 800 }];

const GARIK_TEXT = {
  sensor: 'He seals a Black Mage first with a curse, blinds the rest, and every seventh turn guards his whole side.',
  scan: 'Garik Ronso, who closed the teleporters and waits at the summit with his lance across the path.',
};
const GARIK_BOUT_TEXT = {
  sensor: 'A bout, not a battle: Protect on his first turn, Shell on his fifth, otherwise only blows.',
  scan: 'Garik Ronso, testing the Gullwings at the top of the mountain. He trusts them, and holds back.',
};
const YOUTH_TEXT = {
  sensor: 'One turn in eight it drinks a girl’s MP; the rest of the time it swings.',
  scan: 'A Ronso Youth, standing with Garik. Brave, and not yet hard to knock over.',
};
const YOUTH_BOUT_TEXT = {
  sensor: 'It only swings.',
  scan: 'A Ronso Youth, standing with Garik in a sparring bout.',
};

/** The announcements and Time Up Meteor are the "battle too long" block, the same on every body (both scripts). The block is inert in play (`ai/garik-ronso.ts`): the rows are the game's and are carried, no script queues them. */
const TOO_LONG_ABILITIES = [...RONSO_ANNOUNCEMENT_IDS, RONSO_TIME_UP_METEOR_ID];

/** Garik Ronso, `monster.bin` row 182 (id 0x10b6), Lv 33, formation slot 3 (hostile) or 2 (friendly). */
function garik(id: string, scriptId: string, slot: number, text: { sensor: string; scan: string }): EnemyDef {
  return {
    id,
    name: 'Garik Ronso',
    spriteKey: GARIK_SPRITE, // a stand-in: Kimahri's party set, mirrored by the presenter (the art list in the handoff)
    slot,
    stats: {
      hp: 6880, // [RE §0 row 182]
      mp: 444,
      maxHp: 6880,
      maxMp: 444,
      str: 43, // STR / DEF / MAG / MDEF 43 / 34 / 56 / 3 [RE §0]
      def: 34,
      mag: 56,
      mdef: 3,
      agi: 102, // AGI 102, ACC 95, EVA 0, LCK 2 [RE §0]
      eva: 0,
      luck: 2,
      acc: 95,
    },
    hp: 6880,
    mp: 444,
    level: 33,
    affinities: { gravity: 'immune' }, // null byte 0x10 [RE §0]; absorbs and weak to nothing
    immunities: GARIK_IMMUNE,
    immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'], // special bits 0, 6 and 8
    forms: [{ name: 'Garik Ronso', spriteKey: GARIK_SPRITE, hp: 6880 }],
    aiScriptId: scriptId,
    rewards: {
      ap: 3, // EXP / Gil / AP 380 / 90 / 3, Pilfer Gil 130 [RE §0]
      apOverkill: 3,
      gil: 90,
      stolenGil: 130,
      exp: 380,
      overkillThreshold: 0,
      drops: [{ itemId: 'shining-bracer', count: 1 }], // Shining Bracer x1, drop byte 128 [RE §0, accessory 0x905d]
      steal: {
        baseChance: 50, // [model] the legacy field's house default (30 of the 37 other rows carry 50); inert: the engine's steal reads `stealRate`
        stealRate: 64, // [RE §0] steal byte 64 (25.1 %); the monster record lays the same byte
        common: { itemId: 'icy-gleam', count: 1 }, // Icy Gleam x1 [RE §0, accessory 0x9024]
        rare: { itemId: 'icy-gleam', count: 1 },
      },
    },
    abilityIds: [GARIK_ATTACK_ID, GARIK_BANE_LANCE_ID, GARIK_MIGHTY_GUARD_ID, GARIK_BLIND_ID, GARIK_SHELL_ID, GARIK_PROTECT_ID, ...TOO_LONG_ABILITIES],
    flags: { isBoss: true },
    sensorText: text.sensor,
    scanText: text.scan,
  };
}

/** A Ronso Youth, `monster.bin` row 181 (id 0x10b5), Lv 24. */
function youth(id: string, name: string, spriteKey: string, scriptId: string, slot: number, text: { sensor: string; scan: string }): EnemyDef {
  return {
    id,
    name,
    spriteKey,
    slot,
    stats: {
      hp: 4060, // [RE §0 row 181]
      mp: 170,
      maxHp: 4060,
      maxMp: 170,
      str: 51, // STR / DEF / MAG / MDEF 51 / 23 / 48 / 3 [RE §0]
      def: 23,
      mag: 48,
      mdef: 3,
      agi: 78, // AGI 78, ACC 95, EVA 0, LCK 2 [RE §0]
      eva: 0,
      luck: 2,
      acc: 95,
    },
    hp: 4060,
    mp: 170,
    level: 24,
    affinities: { gravity: 'immune' }, // null byte 0x10 [RE §0]
    immunities: YOUTH_IMMUNE,
    immunityFlags: ['immune-to-percentage-damage', 'immune-to-bribe'], // special bits 0 and 8 (and 7): the Youths can be delayed
    forms: [{ name, spriteKey, hp: 4060 }],
    aiScriptId: scriptId,
    rewards: {
      ap: 2, // EXP / Gil / AP 220 / 20 / 2, Pilfer Gil 80 [RE §0]
      apOverkill: 2,
      gil: 20,
      stolenGil: 80,
      exp: 220,
      overkillThreshold: 0,
      drops: [{ itemId: 'x2-remedy', count: 1 }], // Remedy x1 (common) or x2 (rare), drop byte 255 [RE §0, item 0x200f]
      steal: {
        baseChance: 50, // [model] the legacy field's house default (30 of the 37 other rows carry 50); inert: the engine's steal reads `stealRate`
        stealRate: 64, // [RE §0] steal byte 64; the monster record lays the same byte
        common: { itemId: 'mythril-bangle', count: 1 }, // Mythril Bangle x1 [RE §0, accessory 0x9002]
        rare: { itemId: 'mythril-bangle', count: 1 },
      },
    },
    abilityIds: [YOUTH_ATTACK_ID, YOUTH_MP_BLOWOUT_ID, ...TOO_LONG_ABILITIES],
    flags: {},
    sensorText: text.sensor,
    scanText: text.scan,
  };
}

// ---- The hostile fight (formation 1622, `mtgz10_228`) ----------------------------------------------------------------------------
export const x2RonsoYouthA: EnemyDef = youth(X2_YOUTH_A_ID, 'Ronso Youth A', YOUTH_A_SPRITE, YOUTH_HOSTILE_SCRIPT_ID, 0, YOUTH_TEXT);
export const x2RonsoYouthB: EnemyDef = youth(X2_YOUTH_B_ID, 'Ronso Youth B', YOUTH_B_SPRITE, YOUTH_HOSTILE_SCRIPT_ID, 1, YOUTH_TEXT);
export const x2GarikRonso: EnemyDef = garik(X2_GARIK_ID, GARIK_HOSTILE_SCRIPT_ID, 2, GARIK_TEXT);

// ---- The friendly bout (formation 1621, `mtgz10_229`) ----------------------------------------------------------------------------
export const x2RonsoYouthBout: EnemyDef = youth(X2_YOUTH_BOUT_ID, 'Ronso Youth', YOUTH_B_SPRITE, YOUTH_FRIENDLY_SCRIPT_ID, 0, YOUTH_BOUT_TEXT);
export const x2GarikRonsoBout: EnemyDef = garik(X2_GARIK_BOUT_ID, GARIK_FRIENDLY_SCRIPT_ID, 1, GARIK_BOUT_TEXT);

/** The hostile fight: two Youths and Garik, 15,000 HP in all; EXP 820, Gil 130, AP 7 [RE §0, formation 1622]. The boss strip names Garik, not the first Youth. */
export const garikHostileGroup: EnemyGroupDef = {
  id: GARIK_HOSTILE_GROUP_ID,
  game: 'ffx2',
  enemies: [x2RonsoYouthA, x2RonsoYouthB, x2GarikRonso],
  bossId: X2_GARIK_ID,
  canEscape: false,
  musicCues: FIGHT_CUE,
};

/** The friendly bout: one Youth and Garik, 10,940 HP in all; EXP 600, Gil 110, AP 5 [RE §0, formation 1621]. */
export const garikFriendlyGroup: EnemyGroupDef = {
  id: GARIK_FRIENDLY_GROUP_ID,
  game: 'ffx2',
  enemies: [x2RonsoYouthBout, x2GarikRonsoBout],
  bossId: X2_GARIK_BOUT_ID,
  canEscape: false,
  musicCues: FIGHT_CUE,
};

export const garikRonsoGroups: readonly EnemyGroupDef[] = [garikHostileGroup, garikFriendlyGroup];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte. `../monster-records/records-garik-ronso.ts`.
for (const group of garikRonsoGroups) attachMonsterRecords(group);
