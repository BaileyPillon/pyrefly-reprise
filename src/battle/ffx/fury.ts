/**
 * Lulu's Fury: how many casts a number of rotations buys [FFX-G01 section 6.4; re-parity RC9, lane FFX-A].
 *
 * The spell is chosen from a menu **before** the input, so it rides on
 * `OverdriveCommand.id` as a specific `<spell>-fury` id; `FuryResult` carries
 * only what the player's performance produced and deliberately never carries
 * the spell [docs/CONTRACT-CHANGES.md, decision 9].
 *
 * **The casts are the game's table, not an interpolation** (FFX only). The game keeps 17 digit rows of "rotations a cast costs" and picks one by
 * the spell and by Lulu's current Magic (`./kernel/minigame-fury-tables.ts`, VA 0x00A5CC70): at most six Magic brackets for a group of spells,
 * a free first cast, and a different cost for each later cast. `casts = 1 + the thresholds the counter has reached` (16 at the most). Before
 * RC9 this file interpolated the casts after 15 rotations at Magic 0, 128 and 255 (an estimate that agreed with the game at those three
 * anchors and in 74,235 of 199,424 (spell, Magic, rotations) cells); the anchors are still true, the cells between are the game's now.
 */

import type { AbilityDef } from '../common/types.ts';
import { furyVariantOf } from './adapt/minigame.ts';
import { FURY_MAX_CASTS, furyCasts } from './kernel/minigame-fury-tables.ts';

export { FURY_MAX_CASTS };

/** One full rotation of the stick, in the degrees the contract's `FuryResult.sweptDegrees` counts. */
export const DEGREES_PER_ROTATION = 360;

/**
 * The casts `sweptDegrees` of rotation buys `def` at this Magic: the table's casts for the whole rotations made, at least 1. A spell that is not
 * one of the 19 (a test's) is taken as Fire Fury.
 */
export function furyCastsFor(def: AbilityDef, magic: number, sweptDegrees: number): number {
  const rotations = Math.floor(Math.max(0, sweptDegrees) / DEGREES_PER_ROTATION + 1e-9);
  return furyCasts(furyVariantOf(def) ?? 1, magic, rotations);
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
