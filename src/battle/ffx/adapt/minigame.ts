/**
 * The Overdrive minigames in the engine: which of the game's controllers an ability runs, and what the overlay is told (re-parity RC9,
 * lane FFX-A; **FFX only**: FFX-2 has no Swordplay, Bushido or Fury). The rules are the game's (`../kernel/minigame-*.ts`, proven against
 * the machine code); this module turns an {@link AbilityDef} into the kernels' inputs and the kernels' numbers into the overlay's params.
 *
 * An Overdrive is found by the id of its menu command record (`FFX-G01` section 4.1): Spiral Cut 0x3060, Slice and Dice 0x3061, Energy Rain
 * 0x3062, Blitz Ace 0x3063, Shooting Star 0x3064, Dragon Fang 0x3065, Banishing Blade 0x3066, Tornado 0x3067, and Lulu's 19 Fury spells
 * 0x3078 to 0x308A. An ability without a record (one of ours, a test's) is found by its id.
 */

import type { AbilityDef } from '../../common/types.ts';
import { BUSHIDO_CATEGORIES, bushidoMove } from '../kernel/minigame-bushido.ts';
import { FURY_LIMIT_SECONDS, furyThresholds, furyVariantOfCommand } from '../kernel/minigame-fury-tables.ts';
import { SWORDPLAY_CATEGORIES, swordplayGeometry } from '../kernel/minigame-swordplay.ts';

/** The Overdrive family byte of each Swordplay and Bushido move, by the id of its menu command record (`FFX-G01` section 4.1). */
const CATEGORY_OF_COMMAND: Readonly<Record<number, number>> = {
  0x3060: 0x20, // Spiral Cut
  0x3061: 0x30, // Slice and Dice
  0x3062: 0x40, // Energy Rain
  0x3063: 0x50, // Blitz Ace
  0x3064: 0x22, // Shooting Star
  0x3065: 0x32, // Dragon Fang
  0x3066: 0x42, // Banishing Blade
  0x3067: 0x52, // Tornado
};

/** The same, by ability id, for an ability that carries no command record. */
const CATEGORY_OF_ID: Readonly<Record<string, number>> = {
  'spiral-cut': 0x20,
  'slice-and-dice': 0x30,
  'energy-rain': 0x40,
  'blitz-ace': 0x50,
  'shooting-star': 0x22,
  'dragon-fang': 0x32,
  'banishing-blade': 0x42,
  tornado: 0x52,
};

/** The Overdrive family byte of a Swordplay or Bushido move, or `undefined` for any other ability. */
function categoryOf(def: AbilityDef): number | undefined {
  const byRecord = def.record ? CATEGORY_OF_COMMAND[def.record.id] : undefined;
  return byRecord ?? CATEGORY_OF_ID[def.id];
}

/** The Swordplay category (0x20 to 0x50) of an ability, or `undefined`. */
export function swordplayCategoryOf(def: AbilityDef): number | undefined {
  const c = categoryOf(def);
  return c !== undefined && SWORDPLAY_CATEGORIES.includes(c) ? c : undefined;
}

/** The Bushido category (0x22 to 0x52) of an ability, or `undefined`. */
export function bushidoCategoryOf(def: AbilityDef): number | undefined {
  const c = categoryOf(def);
  return c !== undefined && BUSHIDO_CATEGORIES.includes(c) ? c : undefined;
}

/** The Fury spells in the order of their command records (id 0x3078 + n), for an ability that carries no record. */
const FURY_IDS: readonly string[] = [
  'blizzard-fury', 'fire-fury', 'thunder-fury', 'water-fury',
  'fira-fury', 'blizzara-fury', 'thundara-fury', 'watera-fury',
  'firaga-fury', 'blizzaga-fury', 'thundaga-fury', 'waterga-fury', 'bio-fury', 'demi-fury', 'death-fury',
  'drain-fury', 'osmose-fury',
  'flare-fury',
  'ultima-fury',
];

/** A Fury spell's variant (its command id minus 0x3078, 0 to 18), or `undefined` for an ability that is not one of the 19. */
export function furyVariantOf(def: AbilityDef): number | undefined {
  const byRecord = def.record ? furyVariantOfCommand(def.record.id) : undefined;
  if (byRecord !== undefined) return byRecord;
  const byId = FURY_IDS.indexOf(def.id);
  return byId >= 0 ? byId : undefined;
}

/**
 * The time limit of the move an ability runs, in milliseconds, or `undefined` for an ability that is not a Swordplay, Bushido or Fury
 * (the game's limits: Spiral Cut, Slice and Dice, Energy Rain 3 s; Blitz Ace 2 s; Shooting Star, Dragon Fang, Banishing Blade 4 s;
 * Tornado 3 s; every Fury 4 s).
 */
export function minigameLimitMs(def: AbilityDef): number | undefined {
  const sword = swordplayCategoryOf(def);
  if (sword !== undefined) return swordplayGeometry(sword).limit * 1000;
  const bushido = bushidoCategoryOf(def);
  if (bushido !== undefined) return bushidoMove(bushido).limit * 1000;
  if (furyVariantOf(def) !== undefined) return FURY_LIMIT_SECONDS * 1000;
  return undefined;
}

/**
 * What the Swordplay overlay is told: the move's category and its bar, window and marker speed in the game's units (one frame is 1/30 s), and
 * the window and one sweep in terms a picture can use (the window as a percent of the bar, one crossing in milliseconds).
 */
export function swordplayParams(def: AbilityDef): Record<string, unknown> {
  const category = swordplayCategoryOf(def);
  if (category === undefined) return {};
  const g = swordplayGeometry(category);
  return {
    category,
    x0: g.x0,
    bar: g.bar,
    windowLo: g.lo,
    windowHi: g.hi,
    speed: g.speed,
    zonePercent: ((g.hi - g.lo) / g.bar) * 100,
    travelMs: (g.bar / g.speed) * (1000 / 30),
  };
}

/** What a Fury overlay is told: the spell's variant, Lulu's Magic and the 16 cumulative thresholds the game builds from them. */
export function furyParams(def: AbilityDef, magic: number): Record<string, unknown> {
  const variant = furyVariantOf(def);
  if (variant === undefined) return {};
  return { variant, magic, thresholds: furyThresholds(variant, magic) };
}
