/**
 * Full Throttle — Paine's special dressphere: every command of its three parts, from the game's own rows [research/re-ffx2-special-dresspheres.md §4; verified: the game's tables].
 *
 * Generated from the kernel tables (the part, the MP, the status chances and the targets are read off each row); the numbers the damage kernels run on are the rows themselves
 * (`../command-records/special.ts`, attached by id), so the fields below are the menu's: the name, the MP, who it can target, the statuses it carries, the flags. Parts, in order: the main body,
 * then full-throttle-right and full-throttle-left.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { special } from './special-build.ts';

export const fullThrottleAbilities: AbilityDef[] = [
  special("x2-full-throttle-attack", "Attack", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', [], 'attack'), // main
  special("x2-full-throttle-fright", "Fright", 0, [{ status: 'confuse', chance: 254, duration: 255 }], [], 'single-enemy', [], 'skill'), // main
  special("x2-full-throttle-aestus", "Aestus", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', ['fire'], 'skill'), // main
  special("x2-full-throttle-winterkill", "Winterkill", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', ['ice'], 'skill'), // main
  special("x2-full-throttle-whelmen", "Whelmen", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', ['water'], 'skill'), // main
  special("x2-full-throttle-levin", "Levin", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', ['lightning'], 'skill'), // main
  special("x2-full-throttle-wisenen", "Wisenen", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', ['gravity'], 'skill'), // main
  special("x2-full-throttle-fiers", "Fiers", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', [], 'skill'), // main
  special("x2-full-throttle-deeth", "Deeth", 0, [{ status: 'ko', chance: 90, duration: 255 }], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', [], 'skill'), // main
  special("x2-full-throttle-assoil", "Assoil", 0, [], ['crit-eligible', 'affected-by-darkness'], 'single-enemy', ['holy'], 'skill'), // main
  special("x2-full-throttle-sword-dance", "Sword Dance", 0, [], [], 'all-enemies', [], 'skill'), // main
  special("x2-full-throttle-venom-wing", "Venom Wing", 12, [{ status: 'poison', chance: 254, duration: 255 }], [], 'single-enemy', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-blind-wing", "Blind Wing", 12, [{ status: 'darkness', chance: 254, duration: 255 }], [], 'single-enemy', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-mute-wing", "Mute Wing", 12, [{ status: 'silence', chance: 254, duration: 255 }], [], 'single-enemy', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-rock-wing", "Rock Wing", 12, [{ status: 'petrify', chance: 100, duration: 255 }], [], 'single-enemy', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-lazy-wing", "Lazy Wing", 12, [{ status: 'sleep', chance: 254, duration: 255 }], [], 'single-enemy', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-violent-wing", "Violent Wing", 12, [{ status: 'berserk', chance: 254, duration: 255 }], [], 'single-enemy', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-still-wing", "Still Wing", 12, [{ status: 'stop', chance: 100, duration: 100 }], [], 'single-enemy', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-crazy-wing", "Crazy Wing", 12, [{ status: 'confuse', chance: 254, duration: 255 }], [], 'single-enemy', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-stamina-dextral", "Stamina", 0, [], ['heals'], 'single-ally', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-mettle-dextral", "Mettle", 0, [], ['heals'], 'single-ally', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-reboot-dextral", "Reboot", 0, [{ status: 'ko', chance: 254, duration: 255 }], ['heals', 'can-target-dead', 'misses-if-target-alive', 'removes-statuses'], 'single-ally', [], 'skill'), // full-throttle-right
  special("x2-full-throttle-steel-feather", "Steel Feather", 12, [{ status: 'str-up', chance: 254, duration: 255, stacks: 2 }], [], 'all-allies', [], 'skill'), // full-throttle-left
  special("x2-full-throttle-diamond-feather", "Diamond Feather", 12, [{ status: 'def-up', chance: 254, duration: 255, stacks: 2 }], [], 'all-allies', [], 'skill'), // full-throttle-left
  special("x2-full-throttle-white-feather", "White Feather", 16, [{ status: 'str-down', chance: 254, duration: 255, stacks: 2 }], [], 'all-enemies', [], 'skill'), // full-throttle-left
  special("x2-full-throttle-buckle-feather", "Buckle Feather", 16, [{ status: 'def-down', chance: 254, duration: 255, stacks: 2 }], [], 'all-enemies', [], 'skill'), // full-throttle-left
  special("x2-full-throttle-cloudy-feather", "Cloudy Feather", 16, [{ status: 'mag-down', chance: 254, duration: 255, stacks: 2 }], [], 'all-enemies', [], 'skill'), // full-throttle-left
  special("x2-full-throttle-pointed-feather", "Pointed Feather", 16, [{ status: 'mdef-down', chance: 254, duration: 255, stacks: 2 }], [], 'all-enemies', [], 'skill'), // full-throttle-left
  special("x2-full-throttle-pumice-feather", "Pumice Feather", 38, [{ status: 'haste', chance: 254, duration: 50 }], [], 'all-allies', [], 'skill'), // full-throttle-left
  special("x2-full-throttle-maats-feather", "Ma'at's Feather", 0, [], [], 'single-enemy', [], 'skill'), // full-throttle-left
  special("x2-full-throttle-stamina", "Stamina", 0, [], ['heals'], 'single-ally', [], 'skill'), // full-throttle-left
  special("x2-full-throttle-mettle-sinistral", "Mettle", 0, [], ['heals'], 'single-ally', [], 'skill'), // full-throttle-left
  special("x2-full-throttle-reboot", "Reboot", 0, [{ status: 'ko', chance: 254, duration: 255 }], ['heals', 'can-target-dead', 'misses-if-target-alive', 'removes-statuses'], 'single-ally', [], 'skill'), // full-throttle-left
];
