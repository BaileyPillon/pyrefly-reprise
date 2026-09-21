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

// ---------------------------------------------------------------------------
// Acts I and II. §2
// ---------------------------------------------------------------------------
//
// **AUTHORED, and it is the one place this track had to author beyond the
// owner's named approvals.** The Act I and Act II records publish only
// Lv / HP / Def / MDef / Eva [§2]; Str, Mag, Agi, Luck and Accuracy are not
// published for #220, #221 or #227. Rather than invent five numbers per enemy,
// each earlier record **carries its own character's published Act III values**
// for the unpublished fields, and ships the published ones as published. It is
// the same person a few minutes earlier in the same mission, so it is the
// smallest invention available — but it is an invention, it is labelled here
// and in the handoff, and it is recorded as a question for the owner.

function earlierRecord(
  base: EnemyDef,
  over: { id: string; name: string; level: number; hp: number; mp: number; def: number; mdef: number; eva?: number; exp: number; gil: number; slot: number },
): EnemyDef {
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
      def: over.def,
      mdef: over.mdef,
      eva: over.eva ?? base.stats.eva,
    }),
    forms: [{ name: over.name, spriteKey: base.spriteKey, hp: over.hp }],
    rewards: { ...base.rewards, exp: over.exp, gil: over.gil },
  };
}

/** Ormi #220 — Act I. Lv 19, 1,640 HP, **Def 120**, **MDef 4** [§2]. */
const ormiEntrance = earlierRecord(ormiAct3, {
  id: 'ormi-entrance', name: 'Ormi', level: 19, hp: 1640, mp: 45, def: 120, mdef: 4,
  exp: 240, gil: 230, slot: 0, // §13 G9 — the wiki's per-enemy EXP/gil, not zero_six's doubled pair
});

/** Ormi #221 — Act II. Lv 19, 1,840 HP, **Def 121**, **MDef 8** [§2]. */
const ormiLogosRoom = earlierRecord(ormiAct3, {
  id: 'ormi-logos-room', name: 'Ormi', level: 19, hp: 1840, mp: 45, def: 121, mdef: 8,
  exp: 240, gil: 230, slot: 1,
});

/** Logos #227 — Act II. Lv 20, 1,432 HP, **Def 4**, **Eva 38** [§2]. */
const logosRoom = earlierRecord(logosAct3, {
  id: 'logos-room', name: 'Logos', level: 20, hp: 1432, mp: 70, def: 4, mdef: 18, eva: 38,
  exp: 240, gil: 230, slot: 0,
});

/**
 * Dr. Goon and Fem-Goon — Act I only. §4.6 [single source].
 *
 * Only HP / MP / EXP / gil / abilities are published; the rest of the stat
 * block is **AUTHORED** the same way the earlier Syndicate records are, from
 * the Act I Ormi they stand beside, scaled to nothing. Both are immune only to
 * **Curse** and both can be bribed.
 *
 * **Accuracy.** Dr. Goon's `accuracy` *is* published, at **3** [§5.1] — and
 * that is precisely the value G1 says the hit model cannot digest: a literal 3
 * routes past `ENEMY_BASE_ACCURACY` (which only fires at 0) and gives him a
 * 0 % hit rate, so the Act I goon would never once connect. The record
 * therefore ships `acc: 0` to take the documented fallback, which is an
 * **AUTHORED routing decision, not the published number**, and it is a question
 * for the owner in the handoff.
 *
 * The Dr. Goon's **rare steal is a Grenade** — base 300 to every enemy. Steal
 * two in Act I and Act III opens with roughly a quarter of Leblanc's HP per
 * throw. A genuinely canonical, genuinely teachable item loop [§4.6].
 */
const drGoon: EnemyDef = {
  id: 'dr-goon',
  name: 'Dr. Goon',
  spriteKey: 'ffx2-dr-goon',
  slot: 1,
  stats: statsOf({ hp: 232, mp: 41, str: 20, def: 30, mag: 10, mdef: 10, agi: 40, luck: 3, eva: 0, acc: 0 }),
  hp: 232,
  mp: 41,
  level: 17,
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
  stats: statsOf({ hp: 167, mp: 172, str: 12, def: 20, mag: 30, mdef: 20, agi: 45, luck: 3, eva: 0, acc: 0 }),
  hp: 167,
  mp: 172,
  level: 17,
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
  musicCues: [],
};

/** The whole mission, in order: Act I -> Act II -> Act III. */
export const leblancSyndicateGroups: readonly EnemyGroupDef[] = [
  leblancEntranceGroup,
  leblancLogosRoomGroup,
  leblancLastRoomGroup,
];

export default leblancSyndicateGroups;
