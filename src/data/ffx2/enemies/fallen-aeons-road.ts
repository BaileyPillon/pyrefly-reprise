/**
 * Chapter XI — the fallen aeons on the Road to the Farplane: three formations
 * chained Shiva → the Magus Sisters → Anima.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the
 * aeons' action counter (`research/ffx2-fallen-aeons.md` §0: "None of it
 * transfers to the FFX aeons"). The combatant ids are `x2-shiva` and `x2-anima`
 * because the FFX data already uses `shiva` and `anima` (plan FA-G7); the
 * sprite keys are the installed Chapter XI paintings of the same names.
 *
 * Bailey, 2026-09-24, "I'll go with your recommendations for all":
 * - **FA1 A**, the Road gauntlet, in the sourced order `[verified: 3 sources]`.
 * - **FA2 b**: full HP and MP at a Save Sphere between links
 *   (`restoresPartyOnEntry` on links 2 and 3; F-1 is a `[conflict]`).
 * - **FA3 b**: a loss retries from the link that was lost. Links 2 and 3 carry
 *   the checkpoint flag above; the flow reads it (not wired in this track).
 * - **FA15**: `boss-ffx2-aeon` on all three links ("Aeons" plays in the aeon
 *   fights except Bahamut's, `[single source]`, plan Review R1).
 * - **FA19**: no Yojimbo link.
 *
 * Every stat is §3 with its tag, carried verbatim (rule 6).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import { STANDARD_AILMENT_IMMUNITY, STAT_MOD_IMMUNITY_5, DEF_MDEF_MOD_IMMUNITY } from './vegnagun-shared.ts';
import { sandy, cindy, mindy } from './magus-sisters.ts';

export const ROAD_SHIVA = 'ffx2-road-shiva';
export const ROAD_SISTERS = 'ffx2-road-magus-sisters';
export const ROAD_ANIMA = 'ffx2-road-anima';
/** The three links in play order. */
export const FALLEN_AEONS_CHAIN_ORDER = [ROAD_SHIVA, ROAD_SISTERS, ROAD_ANIMA] as const;

/** The §3 common list: Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, Stop, Doom, Delay, Interrupt. */
const AEON_COMMON: StatusImmunities = { ...STANDARD_AILMENT_IMMUNITY, stop: 255 };

const AEON_CUE = [{ at: 'start' as const, track: 'boss-ffx2-aeon' as const, fadeMs: 800 }];

/** Shiva, bestiary #181 (§3.1). */
export const x2Shiva: EnemyDef = {
  id: 'x2-shiva',
  name: 'Shiva',
  spriteKey: 'x2-shiva',
  slot: 0,
  stats: {
    hp: 14800, // [verified: 5 sources]
    mp: 9999,
    maxHp: 14800,
    maxMp: 9999,
    str: 69, // STR / MAG / DEF / MDEF [verified: 2 sources]
    mag: 58,
    def: 74,
    mdef: 183,
    agi: 119, // F-3 [conflict]: SinirothX 119, wiki 124; SinirothX is the ranked source
    eva: 58, // Evasion / Luck / Accuracy: SinirothX + wiki (wiki omits Accuracy)
    luck: 6,
    acc: 0,
  },
  hp: 14800,
  mp: 9999,
  level: 41, // [verified: 2 sources]
  affinities: { fire: 'weak', ice: 'absorb', gravity: 'immune' }, // all five sources
  // "Slow and the Breaks land" (SinirothX + 3 guides): no stat-modifier or Slow immunity.
  immunities: AEON_COMMON,
  // Fractional immunity: SinirothX only for Shiva — her wiki infobox lists none
  // (plan Review R1, correction 3). Tagged `[SinirothX]`.
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  forms: [{ name: 'Shiva', spriteKey: 'x2-shiva', hp: 14800 }],
  aiScriptId: 'x2-shiva',
  rewards: {
    ap: 15, // EXP / AP / Gil / Pilfer gil [verified: 3 sources]
    apOverkill: 15,
    gil: 2000,
    stolenGil: 5000,
    exp: 8000,
    overkillThreshold: 0,
    drops: [{ itemId: 'crystal-gloves', count: 1 }], // rare: Regal Crown (no rate published)
    steal: {
      baseChance: 50,
      stealRate: 128, // Snow Ring (both), steal rate 128 [SinirothX + wiki]
      common: { itemId: 'snow-ring', count: 1 },
      rare: { itemId: 'snow-ring', count: 1 },
    },
  },
  abilityIds: [
    'x2-shiva-kick', 'x2-shiva-blizzaga', 'x2-shiva-triple-attack',
    'x2-shiva-heavenly-strike', 'x2-shiva-diamond-dust',
  ],
  flags: { isBoss: true },
  sensorText: 'Fire hurts her. Ice feeds her. Every blow you land brings the storm sooner.',
  scanText: 'An aeon that once fought alongside Yuna.', // [SinirothX + wiki]
};

/** Anima, bestiary #183 (§3.3). */
export const x2Anima: EnemyDef = {
  id: 'x2-anima',
  name: 'Anima',
  spriteKey: 'x2-anima',
  slot: 0,
  stats: {
    hp: 36000, // [verified: 5 sources]
    mp: 9999,
    maxHp: 36000,
    maxMp: 9999,
    str: 32, // SinirothX + wiki
    mag: 33,
    def: 84,
    mdef: 42,
    agi: 133,
    eva: 0, // SinirothX (the wiki omits Evasion)
    luck: 5,
    acc: 0,
  },
  hp: 36000,
  mp: 9999,
  level: 43,
  // Fire, Ice, Lightning, Water halved; Holy weak [SinirothX + Split_Infinity +
  // GamerGuides]. Gravity: immune (the wiki prints Absorb) `[conflict, minor]`.
  affinities: { fire: 'resist', ice: 'resist', lightning: 'resist', water: 'resist', holy: 'weak', gravity: 'immune' },
  // "Slow, every stat modifier, Reflect" on top of the common list [SinirothX + wiki].
  immunities: { ...AEON_COMMON, slow: 255, reflect: 255, ...STAT_MOD_IMMUNITY_5, ...DEF_MDEF_MOD_IMMUNITY },
  immunityFlags: ['boss', 'immune-to-percentage-damage'], // "fract damage = Immune" (wiki infobox)
  forms: [{ name: 'Anima', spriteKey: 'x2-anima', hp: 36000 }],
  aiScriptId: 'x2-anima',
  rewards: {
    ap: 15, // [verified: 3 sources]
    apOverkill: 15,
    gil: 2000,
    stolenGil: 4000,
    exp: 6000,
    overkillThreshold: 0,
    drops: [{ itemId: 'tetra-band', count: 1 }], // SinirothX + wiki + FFExodus
    steal: {
      baseChance: 50,
      stealRate: 128, // Fury Shock, steal rate 128
      common: { itemId: 'x2-fury-shock', count: 1 },
      rare: { itemId: 'x2-fury-shock', count: 1 },
    },
    // Reward of note: the Immortal Soul Garment Grid [verified: 2 sources]. Grids are
    // not an `EnemyRewards` field; the results screen does not show it.
  },
  abilityIds: ['x2-anima-stare', 'x2-anima-pain', 'x2-anima-oblivion'],
  flags: { isBoss: true },
  sensorText: 'Holy is the one way in. Cure what Pain takes, or it keeps taking.',
};

/** Link 1: Shiva on the first platform. `Farplane - BOSS 229 Shiva 1` [SinirothX]. */
export const roadShivaGroup: EnemyGroupDef = {
  id: ROAD_SHIVA,
  game: 'ffx2',
  enemies: [x2Shiva],
  canEscape: false,
  nextGroupId: ROAD_SISTERS,
  musicCues: AEON_CUE,
};

/** Link 2: the Magus Sisters. `Farplane - BOSS 228 Mindy 1 Sandy 1 Cindy 1` [SinirothX]. */
export const roadSistersGroup: EnemyGroupDef = {
  id: ROAD_SISTERS,
  game: 'ffx2',
  enemies: [sandy, cindy, mindy],
  canEscape: false,
  nextGroupId: ROAD_ANIMA,
  musicCues: AEON_CUE,
  restoresPartyOnEntry: true, // FA2 b / FA3 b: the Save Sphere after Shiva
};

/** Link 3: Anima on the third platform. `Farplane - BOSS 227 Anima 1` [SinirothX]. */
export const roadAnimaGroup: EnemyGroupDef = {
  id: ROAD_ANIMA,
  game: 'ffx2',
  enemies: [x2Anima],
  canEscape: false,
  musicCues: AEON_CUE,
  restoresPartyOnEntry: true, // FA2 b / FA3 b: the Save Sphere after the Sisters
};

export const fallenAeonsGroups: readonly EnemyGroupDef[] = [roadShivaGroup, roadSistersGroup, roadAnimaGroup];
