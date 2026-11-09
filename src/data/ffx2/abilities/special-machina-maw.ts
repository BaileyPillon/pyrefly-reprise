/**
 * Machina Maw — Rikku's special dressphere: every command of its three parts, from the game's own rows [research/re-ffx2-special-dresspheres.md §4; verified: the game's tables].
 *
 * Generated from the kernel tables (the part, the MP, the status chances and the targets are read off each row); the numbers the damage kernels run on are the rows themselves
 * (`../command-records/special.ts`, attached by id), so the fields below are the menu's: the name, the MP, who it can target, the statuses it carries, the flags. Parts, in order: the main body,
 * then machina-maw-smasher-r and machina-maw-crusher-l.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { special } from './special-build.ts';

export const machinaMawAbilities: AbilityDef[] = [
  special("x2-machina-maw-attack", "Attack", 0, [], ['crit-eligible'], 'single-enemy', [], 'attack'), // main
  special("x2-machina-maw-revival", "Revival", 0, [{ status: 'ko', chance: 254, duration: 255 }], ['heals', 'can-target-dead', 'misses-if-target-alive', 'removes-statuses'], 'single-ally', [], 'skill'), // main
  special("x2-machina-maw-death-missile", "Death Missile", 12, [{ status: 'ko', chance: 80, duration: 255 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // main
  special("x2-machina-maw-bio-missile", "Bio Missile", 12, [{ status: 'poison', chance: 90, duration: 255 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // main
  special("x2-machina-maw-break-missile", "Break Missile", 12, [{ status: 'petrify', chance: 80, duration: 255 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // main
  special("x2-machina-maw-berserk-missile", "Berserk Missile", 12, [{ status: 'berserk', chance: 90, duration: 255 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // main
  special("x2-machina-maw-stop-missile", "Stop Missile", 12, [{ status: 'stop', chance: 100, duration: 100 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // main
  special("x2-machina-maw-confuse-missile", "Confuse Missile", 12, [{ status: 'confuse', chance: 90, duration: 255 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // main
  special("x2-machina-maw-shockwave", "Shockwave", 36, [], ['crit-eligible'], 'all-enemies', [], 'skill'), // main
  special("x2-machina-maw-shockstorm", "Shockstorm", 36, [], ['crit-eligible'], 'all-enemies', [], 'skill'), // main
  special("x2-machina-maw-vajra", "Vajra", 0, [], ['crit-eligible'], 'all-enemies', [], 'skill'), // main
  special("x2-machina-maw-howitzer", "Howitzer", 12, [], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-sleep-shell", "Sleep Shell", 12, [{ status: 'sleep', chance: 100, duration: 255 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-slow-shell", "Slow Shell", 12, [{ status: 'slow', chance: 100, duration: 100 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-anti-power-shell", "Anti-Power Shell", 12, [{ status: 'str-down', chance: 254, duration: 255, stacks: 3 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-anti-armor-shell", "Anti-Armor Shell", 12, [{ status: 'def-down', chance: 254, duration: 255, stacks: 3 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-scan", "Scan", 0, [], [], 'single-enemy', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-shellter", "Shellter", 10, [{ status: 'shell', chance: 254, duration: 100 }], [], 'all-allies', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-protector", "Protector", 10, [{ status: 'protect', chance: 254, duration: 100 }], [], 'all-allies', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-hp-repair", "HP Repair", 0, [], ['heals'], 'single-ally', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-mp-repair-smasher", "MP Repair", 0, [], ['heals'], 'single-ally', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-homing-ray-smasher", "Homing Ray", 0, [], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-smasher-r
  special("x2-machina-maw-howitzer-crusher", "Howitzer", 12, [], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-crusher-l
  special("x2-machina-maw-blind-shell", "Blind Shell", 12, [{ status: 'darkness', chance: 254, duration: 255 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-crusher-l
  special("x2-machina-maw-silence-shell", "Silence Shell", 12, [{ status: 'silence', chance: 254, duration: 255 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-crusher-l
  special("x2-machina-maw-anti-magic-shell", "Anti-Magic Shell", 12, [{ status: 'mag-down', chance: 254, duration: 255, stacks: 3 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-crusher-l
  special("x2-machina-maw-anti-mental-shell", "Anti-Mental Shell", 12, [{ status: 'mdef-down', chance: 254, duration: 255, stacks: 3 }], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-crusher-l
  special("x2-machina-maw-booster", "Booster", 30, [{ status: 'haste', chance: 254, duration: 50 }], [], 'all-allies', [], 'skill'), // machina-maw-crusher-l
  special("x2-machina-maw-offense", "Offense", 10, [{ status: 'str-up', chance: 254, duration: 255, stacks: 3 }], [], 'single-ally', [], 'skill'), // machina-maw-crusher-l
  special("x2-machina-maw-defense", "Defense", 10, [{ status: 'def-up', chance: 254, duration: 255, stacks: 3 }], [], 'single-ally', [], 'skill'), // machina-maw-crusher-l
  special("x2-machina-maw-hp-repair-crusher", "HP Repair", 0, [], ['heals'], 'single-ally', [], 'skill'), // machina-maw-crusher-l
  special("x2-machina-maw-mp-repair", "MP Repair", 0, [], ['heals'], 'single-ally', [], 'skill'), // machina-maw-crusher-l
  special("x2-machina-maw-homing-ray-crusher", "Homing Ray", 0, [], ['crit-eligible'], 'single-enemy', [], 'skill'), // machina-maw-crusher-l
];
