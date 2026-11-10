/**
 * Floral Fallal — Yuna's special dressphere: every command of its three parts, from the game's own rows [research/re-ffx2-special-dresspheres.md §4; verified: the game's tables].
 *
 * Generated from the kernel tables (the part, the MP, the status chances and the targets are read off each row); the numbers the damage kernels run on are the rows themselves
 * (`../command-records/special.ts`, attached by id), so the fields below are the menu's: the name, the MP, who it can target, the statuses it carries, the flags. Parts, in order: the main body,
 * then floral-fallal-right-pistil and floral-fallal-left-pistil.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { special } from './special-build.ts';

export const floralFallalAbilities: AbilityDef[] = [
  special("x2-floral-fallal-attack", "Attack", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', [], 'attack'), // main
  special("x2-floral-fallal-libra", "Libra", 0, [], [], 'single-enemy', [], 'skill'), // main
  special("x2-floral-fallal-heat-whirl", "Heat Whirl", 0, [], [], 'random-enemy', ['fire'], 'skill'), // main
  special("x2-floral-fallal-ice-whirl", "Ice Whirl", 0, [], [], 'random-enemy', ['ice'], 'skill'), // main
  special("x2-floral-fallal-electric-whirl", "Electric Whirl", 0, [], [], 'random-enemy', ['lightning'], 'skill'), // main
  special("x2-floral-fallal-aqua-whirl", "Aqua Whirl", 0, [], [], 'random-enemy', ['water'], 'skill'), // main
  special("x2-floral-fallal-barrier", "Barrier", 36, [{ status: 'null-magic', chance: 254, duration: 20 }], [], 'self', [], 'skill'), // main
  special("x2-floral-fallal-shield", "Shield", 36, [{ status: 'null-physical', chance: 254, duration: 20 }], [], 'self', [], 'skill'), // main
  special("x2-floral-fallal-flare-whirl", "Flare Whirl", 64, [], [], 'random-enemy', [], 'skill'), // main
  special("x2-floral-fallal-great-whirl", "Great Whirl", 0, [], [], 'random-enemy', [], 'skill'), // main
  special("x2-floral-fallal-all-life", "All-Life", 70, [{ status: 'ko', chance: 254, duration: 255 }], ['heals', 'can-target-dead', 'misses-if-target-alive', 'removes-statuses'], 'all-allies', [], 'skill'), // main
  special("x2-floral-fallal-white-pollen", "White Pollen", 0, [], ['heals'], 'all-allies', [], 'skill'), // floral-fallal-right-pistil
  special("x2-floral-fallal-white-honey", "White Honey", 0, [{ status: 'regen', chance: 254, duration: 100 }], [], 'all-allies', [], 'skill'), // floral-fallal-right-pistil
  special("x2-floral-fallal-hard-leaves", "Hard Leaves", 0, [{ status: 'shell', chance: 254, duration: 100 }], [], 'all-allies', [], 'skill'), // floral-fallal-right-pistil
  special("x2-floral-fallal-tough-nuts", "Tough Nuts", 0, [{ status: 'protect', chance: 254, duration: 100 }], [], 'all-allies', [], 'skill'), // floral-fallal-right-pistil
  special("x2-floral-fallal-mirror-petals", "Mirror Petals", 0, [{ status: 'reflect', chance: 254, duration: 100 }], [], 'all-allies', [], 'skill'), // floral-fallal-right-pistil
  special("x2-floral-fallal-floral-rush", "Floral Rush", 0, [{ status: 'haste', chance: 254, duration: 50 }], [], 'all-allies', [], 'skill'), // floral-fallal-right-pistil
  special("x2-floral-fallal-floral-bomb", "Floral Bomb", 0, [{ status: 'str-down', chance: 254, duration: 255, stacks: 1 }], ['crit-eligible'], 'all-enemies', [], 'skill'), // floral-fallal-right-pistil
  special("x2-floral-fallal-fallal-bomb", "Fallal Bomb", 0, [{ status: 'def-down', chance: 254, duration: 255, stacks: 1 }], ['crit-eligible'], 'all-enemies', [], 'skill'), // floral-fallal-right-pistil
  special("x2-floral-fallal-floral-magisol", "Floral Magisol", 0, [{ status: 'mag-down', chance: 254, duration: 255, stacks: 1 }], ['crit-eligible'], 'all-enemies', [], 'skill'), // floral-fallal-right-pistil
  special("x2-floral-fallal-fallal-magisol", "Fallal Magisol", 0, [{ status: 'mdef-down', chance: 254, duration: 255, stacks: 1 }], ['crit-eligible'], 'all-enemies', [], 'skill'), // floral-fallal-right-pistil
  special("x2-floral-fallal-right-stigma", "Right Stigma", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', [], 'attack'), // floral-fallal-right-pistil
  special("x2-floral-fallal-dream-pollen", "Dream Pollen", 0, [{ status: 'sleep', chance: 100, duration: 255 }], [], 'all-enemies', [], 'skill'), // floral-fallal-left-pistil
  special("x2-floral-fallal-mad-seeds", "Mad Seeds", 0, [{ status: 'berserk', chance: 100, duration: 255 }], [], 'all-enemies', [], 'skill'), // floral-fallal-left-pistil
  special("x2-floral-fallal-sticky-honey", "Sticky Honey", 0, [{ status: 'slow', chance: 100, duration: 100 }], [], 'all-enemies', [], 'skill'), // floral-fallal-left-pistil
  special("x2-floral-fallal-halfdeath-petals", "Halfdeath Petals", 0, [], [], 'all-enemies', ['gravity'], 'skill'), // floral-fallal-left-pistil
  special("x2-floral-fallal-poison-leaves", "Poison Leaves", 0, [{ status: 'poison', chance: 100, duration: 255 }], [], 'all-enemies', [], 'skill'), // floral-fallal-left-pistil
  special("x2-floral-fallal-death-petals", "Death Petals", 0, [{ status: 'ko', chance: 254, duration: 255 }], [], 'single-enemy', [], 'skill'), // floral-fallal-left-pistil
  special("x2-floral-fallal-silent-white", "Silent White", 0, [{ status: 'silence', chance: 100, duration: 255 }, { status: 'darkness', chance: 100, duration: 255 }], ['crit-eligible'], 'all-enemies', [], 'skill'), // floral-fallal-left-pistil
  special("x2-floral-fallal-congealed-honey", "Congealed Honey", 0, [{ status: 'stop', chance: 100, duration: 100 }], ['crit-eligible'], 'all-enemies', [], 'skill'), // floral-fallal-left-pistil
  special("x2-floral-fallal-panic-floralysis", "Panic Floralysis", 0, [{ status: 'confuse', chance: 100, duration: 255 }], ['crit-eligible'], 'all-enemies', [], 'skill'), // floral-fallal-left-pistil
  special("x2-floral-fallal-ash-floralysis", "Ash Floralysis", 0, [{ status: 'petrify', chance: 80, duration: 255 }], ['crit-eligible'], 'all-enemies', [], 'skill'), // floral-fallal-left-pistil
  special("x2-floral-fallal-left-stigma", "Left Stigma", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', [], 'attack'), // floral-fallal-left-pistil
];
