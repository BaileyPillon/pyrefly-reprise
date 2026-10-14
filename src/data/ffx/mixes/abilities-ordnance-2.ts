/**
 * Rikku's Mix — the 21 results the data layer lacked (re-parity RC7, lane FFX-H; **FFX only**).
 *
 * The game's combination table makes 64 results; the data layer carried 43 (`research/ffx-combat-core.md` §5.9 gave one example pair per
 * result and only the damage shape of the ice, thunder and water families). The other 21 are listed by the private note FFX-G05 section 7:
 * Pineapple, Blaster Mine, Hazardous Shell, Calamity Bomb, Heat Blaster, Brimstone and the three elemental families that mirror the fire line
 * (Snow Flurry, Icefall, Winter Storm, Black Ice, Krysta; Thunderbolt, Rolling Thunder, Lightning Bolt, Electroshock, Thunderblast; Waterfall,
 * Flash Flood, Tidal Wave, Aqua Toxin, Dark Rain). Every number below is the game's own command record, read from the Steam HD build's table
 * (build 25501027, command rows 0x308d to 0x30a8; numbers only, `tests/fixtures/parity/ffx/command_records.json` and `command_status.json`,
 * `research/re-ffx-commands.md`): the formula (fixed), the power and the hit count, the element, the rank (6) and the status bytes of the rider. The
 * Overdrive cost is 100 for every Mix result (FFX-G05 section 4.1); the target rule (the opposing side, a group chosen at random) is the record's, run
 * by the game's auto-target in `../../../battle/ffx/mix.ts`.
 *
 * **Presentation**: no new art. Each of these takes the effect of the nearest existing family (`extra.fxFamily`, `extra.vfxKey`): Pineapple the
 * Potato Masher's, the three grenades with riders the Chaos Grenade's, and every elemental result the fire line's member of the same shape (8 x 5 and
 * 14 x 6 the Firestorm's, 18 x 9 the Burning Soul's, 8 x 3 and 18 x 3 the Abaddon Flame's); the spell effect layer then draws the result's own element,
 * so an ice result is drawn as ice. The blanket rules are those of `abilities-ordnance.ts`.
 */

import type { AbilityDef, ElementId, StatusApplication, StatusId, Targeting } from '../../../battle/common/types.ts';

/** One rider: the status, the record's chance byte and the duration byte of its slot (254 for a status that has none). */
const s = (status: StatusId, chance: number, duration: number): StatusApplication => ({ status, chance, duration });

interface OrdnanceSpec {
  power: number;
  hits: number;
  targeting: Extract<Targeting, 'all-enemies' | 'random-enemy'>;
  element?: ElementId;
  /** The record can crit (flag word bit 2): the grenade line. */
  crit?: boolean;
  /** The existing family this result borrows its effect from. */
  family: string;
  statuses?: StatusApplication[];
}

/** A Mix offensive result: the shared blanket rules of `abilities-ordnance.ts` (rank 6, `other`, always hits, ignores Armored, 9,999 cap) around the record's numbers. */
function ordnance(id: string, name: string, spec: OrdnanceSpec): AbilityDef {
  return {
    id, name, game: 'ffx', category: 'overdrive', mpCost: 0, rank: 6, power: spec.power, formula: 'fixed', damageType: 'other',
    element: spec.element ? [spec.element] : [], targeting: spec.targeting, hits: spec.hits,
    canMiss: false, // Mix results always hit (hard rule 5; ffx-bfa-yu-yevon.md §1.3 [estimate], the same as the 43 before them)
    statusEffects: spec.statuses ?? [], removesStatuses: [],
    flags: ['ignores-armored', 'never-break-damage-limit', ...(spec.crit ? (['crit-eligible'] as const) : [])],
    canReflect: false, minigame: null,
    extra: { vfxKey: `vfx-${spec.family}`, fxFamily: spec.family },
  };
}

export const ORDNANCE_MIX_ABILITIES_2: Record<string, AbilityDef> = {
  // 0x308d: opposing whole side, fixed 27 x 1
  'mix-pineapple': ordnance('mix-pineapple', 'Pineapple', { power: 27, hits: 1, targeting: 'all-enemies', crit: true, family: 'mix-potato-masher' }),
  // 0x3091: opposing whole side, fixed 22 x 1 + riders
  'mix-blaster-mine': ordnance('mix-blaster-mine', 'Blaster Mine', { power: 22, hits: 1, targeting: 'all-enemies', crit: true, family: 'mix-chaos-grenade', statuses: [s('sleep', 150, 3), s('silence', 150, 3), s('darkness', 150, 3)] }),
  // 0x3092: opposing whole side, fixed 45 x 1 + riders
  'mix-hazardous-shell': ordnance('mix-hazardous-shell', 'Hazardous Shell', { power: 45, hits: 1, targeting: 'all-enemies', crit: true, family: 'mix-chaos-grenade', statuses: [s('poison', 150, 254), s('sleep', 254, 4), s('silence', 254, 4), s('darkness', 254, 4)] }),
  // 0x3093: opposing whole side, fixed 72 x 1 + riders
  'mix-calamity-bomb': ordnance('mix-calamity-bomb', 'Calamity Bomb', { power: 72, hits: 1, targeting: 'all-enemies', crit: true, family: 'mix-chaos-grenade', statuses: [s('poison', 254, 254), s('power-break', 50, 254), s('magic-break', 50, 254), s('armor-break', 50, 254), s('mental-break', 50, 254), s('sleep', 254, 5), s('silence', 254, 5), s('darkness', 254, 5)] }),
  // 0x3095: opposing random group, fixed 8 x 5, fire
  'mix-heat-blaster': ordnance('mix-heat-blaster', 'Heat Blaster', { power: 8, hits: 5, targeting: 'random-enemy', element: 'fire', family: 'mix-firestorm' }),
  // 0x3098: opposing random group, fixed 8 x 3, fire + riders
  'mix-brimstone': ordnance('mix-brimstone', 'Brimstone', { power: 8, hits: 3, targeting: 'random-enemy', element: 'fire', family: 'mix-abaddon-flame', statuses: [s('poison', 150, 254), s('sleep', 150, 3), s('silence', 150, 3), s('darkness', 150, 3)] }),
  // 0x309a: opposing random group, fixed 8 x 5, ice
  'mix-snow-flurry': ordnance('mix-snow-flurry', 'Snow Flurry', { power: 8, hits: 5, targeting: 'random-enemy', element: 'ice', family: 'mix-firestorm' }),
  // 0x309b: opposing random group, fixed 14 x 6, ice
  'mix-icefall': ordnance('mix-icefall', 'Icefall', { power: 14, hits: 6, targeting: 'random-enemy', element: 'ice', family: 'mix-firestorm' }),
  // 0x309c: opposing random group, fixed 18 x 9, ice
  'mix-winter-storm': ordnance('mix-winter-storm', 'Winter Storm', { power: 18, hits: 9, targeting: 'random-enemy', element: 'ice', family: 'mix-burning-soul' }),
  // 0x309d: opposing random group, fixed 8 x 3, ice + riders
  'mix-black-ice': ordnance('mix-black-ice', 'Black Ice', { power: 8, hits: 3, targeting: 'random-enemy', element: 'ice', family: 'mix-abaddon-flame', statuses: [s('poison', 150, 254), s('sleep', 150, 3), s('silence', 150, 3), s('darkness', 150, 3)] }),
  // 0x309e: opposing random group, fixed 18 x 3, ice + riders
  'mix-krysta': ordnance('mix-krysta', 'Krysta', { power: 18, hits: 3, targeting: 'random-enemy', element: 'ice', family: 'mix-abaddon-flame', statuses: [s('poison', 254, 254), s('power-break', 50, 254), s('magic-break', 50, 254), s('armor-break', 50, 254), s('mental-break', 50, 254), s('sleep', 254, 3), s('silence', 254, 3), s('darkness', 254, 3)] }),
  // 0x309f: opposing random group, fixed 8 x 5, thunder
  'mix-thunderbolt': ordnance('mix-thunderbolt', 'Thunderbolt', { power: 8, hits: 5, targeting: 'random-enemy', element: 'lightning', family: 'mix-firestorm' }),
  // 0x30a0: opposing random group, fixed 14 x 6, thunder
  'mix-rolling-thunder': ordnance('mix-rolling-thunder', 'Rolling Thunder', { power: 14, hits: 6, targeting: 'random-enemy', element: 'lightning', family: 'mix-firestorm' }),
  // 0x30a1: opposing random group, fixed 18 x 9, thunder
  'mix-lightning-bolt': ordnance('mix-lightning-bolt', 'Lightning Bolt', { power: 18, hits: 9, targeting: 'random-enemy', element: 'lightning', family: 'mix-burning-soul' }),
  // 0x30a2: opposing random group, fixed 8 x 3, thunder + riders
  'mix-electroshock': ordnance('mix-electroshock', 'Electroshock', { power: 8, hits: 3, targeting: 'random-enemy', element: 'lightning', family: 'mix-abaddon-flame', statuses: [s('poison', 150, 254), s('sleep', 150, 3), s('silence', 150, 3), s('darkness', 150, 3)] }),
  // 0x30a3: opposing random group, fixed 18 x 3, thunder + riders
  'mix-thunderblast': ordnance('mix-thunderblast', 'Thunderblast', { power: 18, hits: 3, targeting: 'random-enemy', element: 'lightning', family: 'mix-abaddon-flame', statuses: [s('poison', 254, 254), s('power-break', 50, 254), s('magic-break', 50, 254), s('armor-break', 50, 254), s('mental-break', 50, 254), s('sleep', 254, 3), s('silence', 254, 3), s('darkness', 254, 3)] }),
  // 0x30a4: opposing random group, fixed 8 x 5, water
  'mix-waterfall': ordnance('mix-waterfall', 'Waterfall', { power: 8, hits: 5, targeting: 'random-enemy', element: 'water', family: 'mix-firestorm' }),
  // 0x30a5: opposing random group, fixed 14 x 6, water
  'mix-flash-flood': ordnance('mix-flash-flood', 'Flash Flood', { power: 14, hits: 6, targeting: 'random-enemy', element: 'water', family: 'mix-firestorm' }),
  // 0x30a6: opposing random group, fixed 18 x 9, water
  'mix-tidal-wave': ordnance('mix-tidal-wave', 'Tidal Wave', { power: 18, hits: 9, targeting: 'random-enemy', element: 'water', family: 'mix-burning-soul' }),
  // 0x30a7: opposing random group, fixed 8 x 3, water + riders
  'mix-aqua-toxin': ordnance('mix-aqua-toxin', 'Aqua Toxin', { power: 8, hits: 3, targeting: 'random-enemy', element: 'water', family: 'mix-abaddon-flame', statuses: [s('poison', 150, 254), s('sleep', 150, 3), s('silence', 150, 3), s('darkness', 150, 3)] }),
  // 0x30a8: opposing random group, fixed 18 x 3, water + riders
  'mix-dark-rain': ordnance('mix-dark-rain', 'Dark Rain', { power: 18, hits: 3, targeting: 'random-enemy', element: 'water', family: 'mix-abaddon-flame', statuses: [s('poison', 254, 254), s('power-break', 50, 254), s('magic-break', 50, 254), s('armor-break', 50, 254), s('mental-break', 50, 254), s('sleep', 254, 3), s('silence', 254, 3), s('darkness', 254, 3)] }),
};
