/**
 * Enemy groups — **Isaaru's contest of aeons**, the last chamber of the Via
 * Purifico beneath Bevelle (Chapter XIV): three formations fought back to back
 * with no healing between them, **Yuna alone** against Isaaru's **Grothia**
 * (his Ifrit), then **Pterya** (his Valefor), then **Spathi** (his Bahamut).
 *
 * Source: `research/ffx-isaaru-bevelle.md`. Isaaru is `m248`, Grothia `m284`
 * "Ifrit#2", Pterya `m254` "Valefor", Spathi `m287` "Bahamut"; the formations
 * are `bosses.isaaru_grothia` / `_pterya` / `_spathi`, each `[isaaru, <aeon>]`
 * with `forced_party "y"` and `forced_condition "normal"` [§1.1, §1.2
 * decompiled]. Rows live in `./isaaru-abilities.ts`; the three scripts, the two
 * gauges and the count live in `src/battle/ffx/ai/isaaru.ts` and
 * `./isaaru-rules.ts`; the duel's rules (the mirror lock, "only aeons", the
 * loss) are `src/battle/ffx/aeon-duel.ts`, read off the flags below.
 *
 * **Game case: FFX only** [AGENTS.md rule 14] (research §0.3).
 *
 * ## Bailey's picks this file carries (2026-09-25, "I'll go with all your recommendations")
 *
 * - **B8 = a** (O-4, our estimate): Isaaru is on the field, takes no turn and
 *   can never be targeted. He is never a victory condition (the Cid precedent).
 * - **B10** (I-3): Threaten fails on all three (`threatenChance: 0`, which is
 *   IMMUNE in this contract): the wiki and Jegged against the byte, the Natus
 *   N-3 rule.
 * - **B11 = a**: lost when Yuna falls or no aeon is left (`aeonsOnly`).
 * - **B12 = a**: a retry starts at Grothia. No link sets
 *   `restoresPartyOnEntry`, so the chain has no checkpoint (the Save Sphere
 *   is before the red hallway, §6.2).
 * - **B13 = a** (I-1): 0 AP and 0 gil on every aeon (the decompile and
 *   GameFAQs agree), and **5,000 AP for winning** on the last link
 *   (`victoryBonusAp`, [single source: GameFAQs], labelled).
 *
 * ## Ids (plan I-G6)
 *
 * The enemy aeons never use the roster ids `ifrit`, `valefor` or `bahamut`:
 * combatants are keyed by id (`setup.ts`), so a clash would overwrite Yuna's
 * own aeon. Only the **sprite keys** point at the aeon paintings (research
 * §10.2 `[estimate]`: no source describes a visual difference). How they are
 * marked on stage (B18) is presentation, not this file.
 *
 * ## Recorded, not built
 *
 * - **Slice** immunity has no `ImmunityFlag` (a Zanmato byte); moot, Yuna owns
 *   no Yojimbo here. Pterya's Zanmato byte (3; the wiki says 4) likewise.
 * - **Rewards I-2**: GameFAQs' "Equipment Drop Rate 25 %" looks like a
 *   template default; the decompile's drop chance is 0. No drops.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  GROTHIA_ATTACK,
  GROTHIA_ATTACK_YUNA,
  GROTHIA_FIRA,
  GROTHIA_HELLFIRE,
  PTERYA_ATTACK,
  PTERYA_ATTACK_YUNA,
  PTERYA_ENERGY_RAY,
  PTERYA_SONIC_WINGS,
  SPATHI_COUNTDOWN,
  SPATHI_MEGA_FLARE,
} from './isaaru-abilities.ts';

/** Ids the engine, the tests and a future tactic key on (mirrored in `ai/isaaru-rules.ts`). */
export const ISAARU_ID = 'isaaru';
export const GROTHIA_ID = 'grothia';
export const PTERYA_ID = 'pterya';
export const SPATHI_ID = 'spathi';

/** Formation ids, in chain order. */
export const ISAARU_GROTHIA_GROUP_ID = 'isaaru-grothia';
export const ISAARU_PTERYA_GROUP_ID = 'isaaru-pterya';
export const ISAARU_SPATHI_GROUP_ID = 'isaaru-spathi';

/** AI script ids, registered in `src/battle/ffx/ai/isaaru.ts`. */
export const ISAARU_BYSTANDER_SCRIPT = 'isaaru-bystander';
export const GROTHIA_SCRIPT = 'grothia';
export const PTERYA_SCRIPT = 'pterya';
export const SPATHI_SCRIPT = 'spathi';

/** research §11 I-1: 5,000 AP to Yuna for winning the duel [single source: GameFAQs]. B13 = a. */
export const ISAARU_DUEL_AP = 5_000;

/**
 * Isaaru — `m248` [§2.1, `[decompiled]` + wiki *Isaaru (Final Fantasy X boss)*
 * revid 3963146, HP verified: 2 sources]. **No actions** (`monster_actions`
 * `m248` is empty). The wiki prints 1 for his zero stats.
 */
const isaaru: EnemyDef = {
  id: ISAARU_ID,
  name: 'Isaaru',
  spriteKey: 'isaaru', // no art yet (O-1 picked, not painted); the stage falls back without it
  slot: 0, // M1 — the formation is [isaaru, <aeon>] [§1.1 decompiled]
  stats: {
    hp: 10, // §2.1 [verified: 2 sources]
    mp: 1, // §2.1 [decompiled] + wiki
    str: 1, // §2.1 [decompiled]
    def: 0,
    mag: 0,
    mdef: 0,
    agi: 0, // §2.1 — unread: he owns no CTB turn (B8)
    luck: 15, // §2.1 [decompiled] + wiki
    eva: 0,
    acc: 0,
    maxHp: 10,
    maxMp: 1,
  },
  hp: 10,
  mp: 1,
  affinities: {},
  // §2.1 [decompiled] + wiki — Sleep, Silence and Dark at 20; the rest 0.
  immunities: { sleep: 20, silence: 20, darkness: 20 } satisfies StatusImmunities,
  // §2.1 — Sensor, Scan and Bribe immune [decompiled + wiki].
  immunityFlags: ['immune-to-sensor', 'immune-to-scan', 'immune-to-bribe'],
  forms: [{ name: 'Isaaru', spriteKey: 'isaaru', hp: 10 }],
  aiScriptId: ISAARU_BYSTANDER_SCRIPT,
  rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 10, drops: [] }, // §2.1 [decompiled] + wiki
  abilityIds: [],
  // B8 = a (O-4, our estimate): on the field, never targetable, never a victory condition.
  flags: { untargetable: true, hideHpBar: true },
  poisonTickPercent: 25, // §2.1 the wiki's "poison% 25" (tick 2 of 10 HP) — moot
  doomTurns: 3, // §2.1 [single source: wiki infobox] — moot, he never acts
  threatenChance: 0, // §2.1 byte 0 vs wiki Immune (I-8) — moot
};

/** §2.4 [decompiled] + wiki [verified: 2 sources]: the same resistances on all three aeons. */
const AEON_IMMUNITIES: StatusImmunities = {
  ko: 255, // Death
  zombie: 255,
  petrify: 255,
  poison: 255,
  'power-break': 255,
  'magic-break': 255,
  'armor-break': 255,
  'mental-break': 255,
  confuse: 255,
  berserk: 255,
  provoke: 255,
  sleep: 255,
  silence: 255,
  darkness: 255,
  slow: 255,
  scan: 255,
  eject: 255,
  'auto-life': 255,
  // Doom, Shell, Protect, Reflect, the Nul spells, Regen, Haste and Curse are
  // byte 0 and omitted (landable) [§2.4].
};

/**
 * §2.4 flags [decompiled] + wiki ("Demi", "Delay", "Bribe", "Sensor", "Scan"
 * Immune) [verified: 2 sources]: Demi does nothing, Delay (Sonic Wings,
 * Impulse) does nothing, Bribe fails, Scan and Sensor fail. `boss` blocks Flee.
 */
const AEON_FLAGS: EnemyDef['immunityFlags'] = [
  'boss',
  'immune-to-percentage-damage',
  'immune-to-delay',
  'immune-to-bribe',
  'immune-to-scan',
  'immune-to-sensor',
];

/** §2.2: 0 gil / 0 AP on every aeon [decompiled + GameFAQs; I-1, B13 = a]; Overkill 2,550 [verified: 3 sources]. */
const NO_REWARDS: EnemyDef['rewards'] = { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 2_550, drops: [] };

/**
 * Grothia — `m284` "Ifrit#2", bestiary #108 [§2.2, `[decompiled]` + wiki
 * revid 3979432; HP verified: 4 sources]. **Absorbs Fire**, neutral to
 * everything else [§2.3, verified: 3 sources] (Jegged's "ice is most
 * effective" is wrong, I-7: Ice is neutral).
 */
const grothia: EnemyDef = {
  id: GROTHIA_ID,
  name: 'Grothia',
  spriteKey: 'ifrit', // his Ifrit: the aeon painting on the enemy side (research §10.2; D-089 art, never altered)
  slot: 1, // M2 [§1.1 decompiled]
  stats: {
    hp: 8_000, // §2.2 [verified: 4 sources]
    mp: 600, // §2.2 [decompiled] + wiki
    str: 23, // §2.2
    def: 10, // §2.2
    mag: 21, // §2.2
    mdef: 0, // §2.2 [decompiled]; the wiki prints 1
    agi: 18, // §2.2 — base CTB 11 ticks [derived]
    luck: 15, // §2.2
    eva: 0,
    acc: 0, // §2.2; the wiki prints 1. Never read: every row carries its own accuracy
    maxHp: 8_000,
    maxMp: 600,
  },
  hp: 8_000,
  mp: 600,
  affinities: { fire: 'absorb' }, // §2.3 [verified: 3 sources]
  immunities: AEON_IMMUNITIES,
  immunityFlags: AEON_FLAGS,
  forms: [{ name: 'Grothia', spriteKey: 'ifrit', hp: 8_000 }],
  aiScriptId: GROTHIA_SCRIPT,
  rewards: NO_REWARDS,
  abilityIds: [GROTHIA_ATTACK, GROTHIA_ATTACK_YUNA, GROTHIA_FIRA, GROTHIA_HELLFIRE],
  flags: { isBoss: true },
  doomTurns: 5, // §2.2 [decompiled] + wiki + GameFAQs
  threatenChance: 0, // I-3 / B10 — 0 means IMMUNE in this contract
};

/**
 * Pterya — `m254` "Valefor", bestiary #109 [§2.2, `[decompiled]` + wiki
 * revid 3979322; HP verified: 4 sources]. Neutral to every element [§2.3].
 */
const pterya: EnemyDef = {
  id: PTERYA_ID,
  name: 'Pterya',
  spriteKey: 'valefor', // his Valefor (research §10.2)
  slot: 1, // M2 [§1.1 decompiled]
  stats: {
    hp: 12_000, // §2.2 [verified: 4 sources]
    mp: 1_000, // §2.2 [decompiled] + wiki
    str: 20, // §2.2
    def: 10, // §2.2
    mag: 18, // §2.2
    mdef: 10, // §2.2
    agi: 21, // §2.2 — base CTB 10 ticks [derived]
    luck: 15, // §2.2
    eva: 0,
    acc: 0,
    maxHp: 12_000,
    maxMp: 1_000,
  },
  hp: 12_000,
  mp: 1_000,
  affinities: {}, // §2.3 [verified: 3 sources]
  immunities: AEON_IMMUNITIES,
  immunityFlags: AEON_FLAGS,
  forms: [{ name: 'Pterya', spriteKey: 'valefor', hp: 12_000 }],
  aiScriptId: PTERYA_SCRIPT,
  rewards: NO_REWARDS,
  abilityIds: [PTERYA_ATTACK, PTERYA_ATTACK_YUNA, PTERYA_SONIC_WINGS, PTERYA_ENERGY_RAY],
  flags: { isBoss: true },
  doomTurns: 5, // §2.2
  threatenChance: 0, // I-3 / B10
};

/**
 * Spathi — `m287` "Bahamut", bestiary #110 [§2.2, `[decompiled]` + wiki
 * revid 4005169; HP verified: 4 sources]. Neutral to every element [§2.3].
 */
const spathi: EnemyDef = {
  id: SPATHI_ID,
  name: 'Spathi',
  spriteKey: 'bahamut', // his Bahamut (research §10.2)
  slot: 1, // M2 [§1.1 decompiled]
  stats: {
    hp: 20_000, // §2.2 [verified: 4 sources]
    mp: 1_500, // §2.2 [decompiled] + wiki
    str: 31, // §2.2
    def: 0, // §2.2 [decompiled]; the wiki prints 1
    mag: 38, // §2.2
    mdef: 0, // §2.2 [decompiled]; the wiki prints 1
    agi: 20, // §2.2 — base CTB 10 ticks [derived]
    luck: 15, // §2.2
    eva: 0,
    acc: 0,
    maxHp: 20_000,
    maxMp: 1_500,
  },
  hp: 20_000,
  mp: 1_500,
  affinities: {}, // §2.3 [verified: 3 sources]
  immunities: AEON_IMMUNITIES,
  immunityFlags: AEON_FLAGS,
  forms: [{ name: 'Spathi', spriteKey: 'bahamut', hp: 20_000 }],
  aiScriptId: SPATHI_SCRIPT,
  rewards: NO_REWARDS,
  // The two counter rows (4:127, 4:173) are not shipped: I-4, B9.
  abilityIds: [SPATHI_COUNTDOWN, SPATHI_MEGA_FLARE],
  flags: { isBoss: true },
  doomTurns: 5, // §2.2
  threatenChance: 0, // I-3 / B10
};

/**
 * Link 1: `[isaaru, grothia]`. **Ifrit is locked** [§1.3]. Grothia starts
 * with a full gauge, so his first turn against an aeon is Hellfire (§4.1).
 */
export const isaaruGrothiaGroup: EnemyGroupDef = {
  id: ISAARU_GROTHIA_GROUP_ID,
  game: 'ffx',
  // No source mentions escape (O-3); the fight is a boss battle (B6/B7's menu has no Flee).
  canEscape: false,
  enemies: [isaaru, grothia],
  nextGroupId: ISAARU_PTERYA_GROUP_ID,
  aeonsOnly: true,
  lockedAeons: [{ aeonId: 'ifrit', mirrorOf: GROTHIA_ID }],
  // No `musicCues`: the cue (B21, O-6) is not composed; the chapter record's stand-in applies.
};

/** Link 2: `[isaaru, pterya]`. **Valefor is locked** [§1.3]. */
export const isaaruPteryaGroup: EnemyGroupDef = {
  id: ISAARU_PTERYA_GROUP_ID,
  game: 'ffx',
  canEscape: false,
  enemies: [isaaru, pterya],
  nextGroupId: ISAARU_SPATHI_GROUP_ID,
  aeonsOnly: true,
  lockedAeons: [{ aeonId: 'valefor', mirrorOf: PTERYA_ID }],
};

/** Link 3: `[isaaru, spathi]`. **Bahamut is locked** [§1.3]. The chain ends here (§4.4). */
export const isaaruSpathiGroup: EnemyGroupDef = {
  id: ISAARU_SPATHI_GROUP_ID,
  game: 'ffx',
  canEscape: false,
  enemies: [isaaru, spathi],
  aeonsOnly: true,
  lockedAeons: [{ aeonId: 'bahamut', mirrorOf: SPATHI_ID }],
  victoryBonusAp: ISAARU_DUEL_AP, // B13 = a, [single source: GameFAQs]
};

/** The three links, in order, for the data index and the tests. */
export const ISAARU_GROUPS: readonly EnemyGroupDef[] = [isaaruGrothiaGroup, isaaruPteryaGroup, isaaruSpathiGroup];

export default isaaruGrothiaGroup;
