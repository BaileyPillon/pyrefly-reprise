/**
 * Lulu's Fury: how far the stick has to travel per cast [ffx-combat-core §5.7].
 *
 * The spell is chosen from a menu **before** the input, so it rides on
 * `OverdriveCommand.id` as a specific `<spell>-fury` id; `FuryResult` carries
 * only what the player's performance produced and deliberately never carries
 * the spell [docs/CONTRACT-CHANGES.md, decision 9].
 */

import type { AbilityDef } from '../common/types.ts';

/** Rotation-cost tier of a Fury spell. */
export type FuryTier = 'tier1' | 'tier2' | 'tier3' | 'flare' | 'ultima';

/**
 * The published anchors: casts obtained after **15 rotations** at Magic
 * 0 / 128 / 255 [ffx-combat-core §5.7]. The number of casts **rises** with
 * Magic, so the rotation requirement shrinks — the opposite of what the wiki's
 * prose reads like.
 *
 * Stored as the cast counts rather than as pre-divided degrees on purpose:
 * `5400 / 16` is `337.5`, and rounding that to 338 silently costs the 16th
 * cast at Magic 255. Keep the division exact.
 */
const FURY_ANCHOR_CASTS: Readonly<Record<FuryTier, readonly [number, number, number]>> = {
  tier1: [7, 12, 16],
  tier2: [6, 10, 16],
  tier3: [6, 10, 12],
  flare: [4, 6, 7],
  ultima: [4, 4, 4],
};

const FURY_TIERS: Readonly<Record<string, FuryTier>> = {
  'fire-fury': 'tier1',
  'blizzard-fury': 'tier1',
  'thunder-fury': 'tier1',
  'water-fury': 'tier1',
  'fira-fury': 'tier2',
  'blizzara-fury': 'tier2',
  'thundara-fury': 'tier2',
  'watera-fury': 'tier2',
  'drain-fury': 'tier2',
  'osmose-fury': 'tier2',
  'firaga-fury': 'tier3',
  'blizzaga-fury': 'tier3',
  'thundaga-fury': 'tier3',
  'waterga-fury': 'tier3',
  'bio-fury': 'tier3',
  'death-fury': 'tier3',
  'demi-fury': 'tier3',
  'flare-fury': 'flare',
  'ultima-fury': 'ultima',
};

/**
 * Which rotation tier a Fury belongs to.
 *
 * The spell is chosen from a menu *before* the stick input, so it rides on
 * `OverdriveCommand.id` as a specific `<spell>-fury` id — `FuryResult` has no
 * field for it and deliberately never will [CONTRACT-CHANGES decision 9]. A
 * data file may override with `extra.furyTier`.
 */
export function furyTierOf(def: AbilityDef): FuryTier {
  const authored = def.extra?.['furyTier'];
  if (typeof authored === 'string' && authored in FURY_ANCHOR_CASTS) return authored as FuryTier;
  return FURY_TIERS[def.id] ?? 'tier1';
}

/** One full rotation of the stick. */
export const DEGREES_PER_ROTATION = 360;

/** The published anchor budget: 15 rotations. */
export const FURY_ANCHOR_BUDGET = 15 * DEGREES_PER_ROTATION;

/** Fury never exceeds 16 casts, whatever the input. */
export const FURY_MAX_CASTS = 16;

/**
 * Degrees of rotation one cast costs, piecewise-linear in Magic between the
 * three published anchors [ffx-combat-core §5.7]. Exact at Magic 0, 128 and
 * 255 for every tier.
 */
export function degreesPerCast(def: AbilityDef, magic: number): number {
  const [c0, c128, c255] = FURY_ANCHOR_CASTS[furyTierOf(def)];
  const a0 = FURY_ANCHOR_BUDGET / c0;
  const a128 = FURY_ANCHOR_BUDGET / c128;
  const a255 = FURY_ANCHOR_BUDGET / c255;
  const mag = Math.max(0, Math.min(255, magic));
  const value = mag <= 128 ? a0 + ((a128 - a0) * mag) / 128 : a128 + ((a255 - a128) * (mag - 128)) / 127;
  return Math.max(1, value);
}

/**
 * `casts = min(16, floor(sweptDegrees / degreesPerCast))`.
 *
 * The epsilon is load-bearing: `degreesPerCast` is an exact division of the
 * 5 400-degree budget, so at an anchor the quotient is a whole number that
 * binary floating point renders as `6.999999999999999`. Without the nudge the
 * published anchors come out one cast short.
 */
export function furyCastsFor(def: AbilityDef, magic: number, sweptDegrees: number): number {
  const quotient = Math.max(0, sweptDegrees) / degreesPerCast(def, magic);
  return Math.min(FURY_MAX_CASTS, Math.floor(quotient + 1e-9));
}

/**
 * True for a menu-only marker that must never reach the damage chain — the
 * generic `'fury'` id, which carries `formula: 'none'` and `hits: 0` and would
 * silently resolve as a no-op Overdrive that looks like a UI bug
 * [CONTRACT-CHANGES decision 9].
 */
export function isMenuMarker(def: AbilityDef): boolean {
  return def.extra?.['isGenericMenuMarker'] === true;
}

/**
 * The `<spell>-fury` ids a marker offers, given who is casting.
 *
 * §5.7's input begins "after choosing a **learned** Blk Magic spell", so the
 * submenu is exactly the intersection of the marker's own `resolvesToOneOf`
 * list with the caster's `learnedAbilityIds` — `firaga-fury` is offered iff she
 * knows Firaga. The base id is the fury id with its `-fury` suffix removed,
 * which is how every one of the 19 records is named
 * (`data/ffx/abilities/overdrive-lulu-1.ts`, `-2.ts`).
 *
 * This is what stops the preset's bare `'fury'` marker from being Lulu's whole
 * Overdrive menu: the marker is refused by `execute.ts` on purpose, so before
 * this expansion existed her gauge could be filled and never spent.
 */
export function furySpellIdsFor(marker: AbilityDef, learnedAbilityIds: readonly string[]): string[] {
  const choices = marker.extra?.['resolvesToOneOf'];
  if (!Array.isArray(choices)) return [];
  const learned = new Set(learnedAbilityIds);
  return choices.filter((id): id is string => typeof id === 'string' && learned.has(id.replace(/-fury$/, '')));
}
