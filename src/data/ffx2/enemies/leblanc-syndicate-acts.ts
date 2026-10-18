/**
 * The Leblanc Syndicate, Acts I and II — the Chateau entrance and Logos' room.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source:
 * `research/ffx2-leblanc-syndicate.md` §2, §4.6. Act III, the shared
 * conventions and the gap-G1 Accuracy reading are in `leblanc-syndicate.ts`;
 * read that header first.
 *
 * Split out of `leblanc-syndicate.ts` only to keep both files under the
 * 400-line house limit [AGENTS.md rule 7]. The assembled **three-act** chain
 * is exported from here rather than from `leblanc-syndicate.ts` so the two
 * modules stay a one-way dependency and no import cycle exists.
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import {
  LEBLANC_ACT_I,
  LEBLANC_ACT_II,
  LEBLANC_ACT_III,
  leblancLastRoomGroup,
  logosAct3,
  ormiAct3,
  statsOf,
} from './leblanc-syndicate.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';

// ---------------------------------------------------------------------------
// Acts I and II. §2
// ---------------------------------------------------------------------------
//
// **Re-parity AI lane C (2026-10-10): these records are the game's own rows** (`monster.bin` rows 243, 244 and 249;
// `research/re-ffx2-ai-leblanc-den-ixion.md` section 2, rows R1, K1 and K2). The Act I and Act II records used to carry
// only the published Lv / HP / Def / MDef / Eva [§2] and borrow their Act III character's Str, Mag, Agi and MP; the rows
// publish all of them, and Acts I and II Ormi and Act II Logos are quicker and (Ormi Act I) stronger than their Act III
// selves: Agility 63 and 90 where Act III has 42 and 49. Each room also has its own scripts (`../../../battle/ffx2/ai/`):
// Ormi's Acts I and II have no Concussive Blast, and Logos' Act II has no Hail of Bullets, so their lists do not carry them.

type EarlierOver = {
  id: string; name: string; level: number; hp: number; mp: number; str: number; def: number; mag: number; mdef: number;
  agi: number; eva?: number; exp: number; gil: number; ap: number; drop: string; slot: number; aiScriptId: string; abilityIds: string[];
};

function earlierRecord(base: EnemyDef, over: EarlierOver): EnemyDef {
  // Stolen gil is published for the Act III records only [§3]; the earlier
  // records do not inherit it (their steal tables are the authored carry above).
  const { stolenGil: _act3Only, ...rewards } = base.rewards;
  return {
    ...base,
    id: over.id,
    name: over.name,
    slot: over.slot,
    level: over.level,
    hp: over.hp,
    mp: over.mp,
    stats: statsOf({
      ...base.stats,
      hp: over.hp,
      mp: over.mp,
      str: over.str,
      def: over.def,
      mag: over.mag,
      mdef: over.mdef,
      agi: over.agi,
      eva: over.eva ?? base.stats.eva,
    }),
    forms: [{ name: over.name, spriteKey: base.spriteKey, hp: over.hp }],
    aiScriptId: over.aiScriptId,
    abilityIds: over.abilityIds,
    // The rewards are the game's rows (`monster.bin` 243, 244 and 249; `../monster-records/kill-rewards.ts`, re-parity RC9 lane X2-C): the AP and the common drop differ from Act III's.
    rewards: { ...rewards, exp: over.exp, gil: over.gil, ap: over.ap, apOverkill: over.ap, drops: [{ itemId: over.drop, count: 1 }] },
  };
}

/** Ormi #220 — Act I. Lv 19, 1,640 HP, **Def 120**, **MDef 4** [§2]. */
const ormiEntrance = earlierRecord(ormiAct3, {
  id: 'ormi-entrance', name: 'Ormi', level: 19, hp: 1640, mp: 40, str: 80, def: 120, mag: 20, mdef: 4, agi: 63,
  exp: 220, gil: 220, ap: 1, drop: 'black-choker', slot: 0, // row 243: 220 EXP, 1 AP, 220 gil, a Black Choker (the wiki's 240 / 230 and the Twist Headband were Act III's; FFX2-G03 E8)
  aiScriptId: 'ffx2-leblanc-ormi-act1', abilityIds: ['x2-ormi-shield-bash', 'x2-ormi-supercollider', 'x2-ormi-huggles'],
});

/** Ormi #221 — Act II. Lv 19, 1,840 HP, **Def 121**, **MDef 8** [§2]. */
const ormiLogosRoom = earlierRecord(ormiAct3, {
  id: 'ormi-logos-room', name: 'Ormi', level: 19, hp: 1840, mp: 42, str: 64, def: 121, mag: 24, mdef: 8, agi: 63,
  exp: 240, gil: 230, ap: 1, drop: 'defense-veil', slot: 1, // row 244: 240 EXP, 1 AP, 230 gil, a Defense Veil (FFX2-G03 E9)
  aiScriptId: 'ffx2-leblanc-ormi-act2', abilityIds: ['x2-ormi-shield-bash', 'x2-ormi-supercollider', 'x2-ormi-huggles'],
});

/** Logos #227 — Act II. Lv 20, 1,432 HP, **Def 4**, **Eva 38** [§2]. */
const logosRoom = earlierRecord(logosAct3, {
  id: 'logos-room', name: 'Logos', level: 20, hp: 1432, mp: 64, str: 16, def: 4, mag: 26, mdef: 14, agi: 90, eva: 38,
  exp: 240, gil: 230, ap: 1, drop: 'favorite-outfit', slot: 0, // row 249: 240 EXP, 1 AP, 230 gil, a Favorite Outfit (FFX2-G03 E9)
  aiScriptId: 'ffx2-leblanc-logos-act2', abilityIds: ['x2-logos-double-shot', 'x2-logos-russian-roulette'],
});

/**
 * Dr. Goon and Fem-Goon — Act I only. §4.6's table [single source] for HP, MP, EXP, gil, steal, drop and ability list.
 *
 * **Re-parity AI lane C (2026-10-10): the level and the stat bytes are the game's rows** (`monster.bin` rows 135 and 138,
 * `research/re-ffx2-ai-leblanc-den-ixion.md` section 2, rows K1 and K2): Dr. Goon is Lv 14 (Str 35, Def 6, MDef 6, Agi 56),
 * Fem-Goon Lv 16 with 270 MP (Str 26, Def 5, Mag 8, MDef 10, Luck 4, Agi 62). The earlier build authored them far tougher
 * (Lv 17, Def 30 and 20) because §4.6 published no such columns; the rows settle that. Both are immune only to **Curse**
 * and both can be bribed [§4.6]; the steal byte is 255 (always) and Accuracy 95 (`../monster-records/`).
 *
 * The Dr. Goon's **rare steal is a Grenade** — base 200, 187-211 to every enemy
 * (§18 C18.1: the old "base 300" was the Lady Luck reel Primo Grenade). Steal
 * two in Act I and each Act III throw takes about a seventh of Leblanc's
 * 1,380 HP, before chain. A genuinely canonical, genuinely teachable item loop [§4.6].
 */
const drGoon: EnemyDef = {
  id: 'dr-goon',
  name: 'Dr. Goon',
  spriteKey: 'ffx2-dr-goon',
  slot: 1,
  // hp/mp [§4.6]; the rest is the game's row 135 (acc is set to 95 by the monster row, `attachMonsterRecords`).
  stats: statsOf({ hp: 232, mp: 41, str: 35, def: 6, mag: 10, mdef: 6, agi: 56, luck: 3, eva: 0, acc: 0 }),
  hp: 232,
  mp: 41,
  level: 14, // the game's row 135 (re-parity AI lane C, K1); §4.6 published no Level column
  affinities: {},
  immunities: { curse: 255 },
  immunityFlags: [],
  forms: [{ name: 'Dr. Goon', spriteKey: 'ffx2-dr-goon', hp: 232 }],
  aiScriptId: 'ffx2-leblanc-dr-goon',
  rewards: {
    ap: 1,
    apOverkill: 1,
    gil: 50,
    overkillThreshold: 0,
    exp: 10,
    drops: [{ itemId: 'x2-potion', count: 1 }],
    steal: {
      baseChance: 75,
      common: { itemId: 'x2-budget-grenade', count: 1 },
      rare: { itemId: 'x2-grenade', count: 1 },
    },
  },
  abilityIds: ['x2-goon-strike'],
  flags: {},
  sensorText: 'Carries grenades. Steal them.',
  scanText: 'Syndicate rank and file, and he is carrying the good explosives.',
  thinkingPeriod: 0,
};

const femGoon: EnemyDef = {
  id: 'fem-goon',
  name: 'Fem-Goon',
  spriteKey: 'ffx2-fem-goon',
  slot: 2,
  // hp/mp [§4.6]; the rest is the game's row 138 (acc is set to 95 by the monster row, `attachMonsterRecords`).
  stats: statsOf({ hp: 167, mp: 270, str: 26, def: 5, mag: 8, mdef: 10, agi: 62, luck: 4, eva: 0, acc: 0 }),
  hp: 167,
  mp: 270,
  level: 16, // the game's row 138 (re-parity AI lane C, K2); §4.6 published no Level column
  affinities: {},
  immunities: { curse: 255 },
  immunityFlags: [],
  forms: [{ name: 'Fem-Goon', spriteKey: 'ffx2-fem-goon', hp: 167 }],
  aiScriptId: 'ffx2-leblanc-fem-goon',
  rewards: {
    ap: 1,
    apOverkill: 1,
    gil: 70,
    overkillThreshold: 0,
    exp: 10,
    drops: [{ itemId: 'x2-potion', count: 1 }],
    steal: {
      baseChance: 75,
      common: { itemId: 'x2-potion', count: 1 },
      rare: { itemId: 'x2-potion', count: 2 },
    },
  },
  abilityIds: [
    'x2-fem-goon-fire', 'x2-fem-goon-blizzard', 'x2-fem-goon-thunder', 'x2-fem-goon-water',
    'x2-fem-goon-fira', 'x2-fem-goon-blizzara', 'x2-fem-goon-thundara', 'x2-fem-goon-watera',
    'x2-leblanc-fan-slap',
  ],
  flags: {},
  sensorText: 'Casts the whole elemental ladder at the whole party.',
  scanText: 'Syndicate rank and file, and the only one in the room who can cast.',
  thinkingPeriod: 0,
};

/**
 * Act I — the Chateau entrance. 2,039 HP.
 *
 * Teaches the thing the whole chapter is about, in the cheapest possible form:
 * **physicals bounce off Def 120 and magic erases him** [§2].
 */
export const leblancEntranceGroup: EnemyGroupDef = {
  id: LEBLANC_ACT_I,
  game: 'ffx2',
  canEscape: false,
  enemies: [ormiEntrance, drGoon, femGoon],
  nextGroupId: LEBLANC_ACT_II,
  musicCues: [],
};

/**
 * Act II — Logos' room. 3,272 HP.
 *
 * **Two opposite defensive shapes on screen at once** [§2] — Def 121 beside
 * Def 4 — and Russian Roulette's introduction of Death / Petrify / Eject.
 */
export const leblancLogosRoomGroup: EnemyGroupDef = {
  id: LEBLANC_ACT_II,
  game: 'ffx2',
  canEscape: false,
  enemies: [logosRoom, ormiLogosRoom],
  nextGroupId: LEBLANC_ACT_III,
  // PR-0107: Acts I to III are three separate battles in the Chateau (§2, puzzles and scenes between
  // them), so this one opens on randomised bars (ffx2-combat-core §1.6, `[single source]`); HP, MP
  // and items still carry. FFX-2 only.
  opensAsSeparateBattle: true,
  musicCues: [],
};

/** The whole mission, in order: Act I -> Act II -> Act III. */
export const leblancSyndicateGroups: readonly EnemyGroupDef[] = [
  leblancEntranceGroup,
  leblancLogosRoomGroup,
  leblancLastRoomGroup,
];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte. `../monster-records/index.ts`.
for (const group of [leblancEntranceGroup, leblancLogosRoomGroup]) attachMonsterRecords(group);

export default leblancSyndicateGroups;
