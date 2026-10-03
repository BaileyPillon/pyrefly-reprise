/**
 * What the player is asked to press for each Bushido, and how hard each
 * Swordplay tier is (PR-0308, release 38). **FFX only**: Auron's Bushido and
 * Tidus's Swordplay exist only in FFX; FFX-2 has neither.
 *
 * Before this file every Bushido showed one invented 7-input sequence and every
 * Swordplay tier the same zone and speed, whatever Overdrive was chosen
 * (`minigameParams` published `inputs: 7`, which the overlay never read, and
 * `zonePercent`/`travelMs`, which the Swordplay overlay never read either).
 *
 * ## Bushido: sequence LENGTH is sourced, button ORDER is our estimate
 *
 * Lengths: Dragon Fang 8, Shooting Star 7, Banishing Blade 7, Tornado 6,
 * `[verified: 4 sources]` (FW-BU, GF-PF, XU, AGS;
 * `research/ffx-overdrive-input-rules-2026-09-30.md` D2). One dissent: GF-KB
 * lists Tornado with 5 inputs; four sources say 6, so 6 ships.
 *
 * Order: the sources conflict (same note, D3): the International order (the
 * `research/ffx-combat-core.md` §5.5 baseline, FW-BU and XU) against the NA/JP
 * order that the HD-era GameFAQs guide GF-KB and AGS give. **Our estimate,
 * Bailey 2026-10-03 ("all your recommendations"; GameFAQs is his preferred
 * source): the GameFAQs order**, until the Steam HD copy settles it (two Steam
 * checks on 2026-10-01 never got past a white window, so nothing here is
 * `[verified: Steam HD]`):
 *
 * - Dragon Fang: the NA/JP order, the one that ends Circle, Cross (D3: GF-KB
 *   "Dragon Fang ends Circle, X"; the first six inputs are the same in every
 *   source). GF-PF's four-input "Left, Down, Up, Right" is a different layout
 *   of the same first buttons and is not used.
 * - Shooting Star: GF-KB's own order, written out in D3: Triangle, Circle,
 *   Square, Circle, Left, Right, X. It matches no other source (the
 *   International order is Triangle, Cross, Square, Circle, Left, Right,
 *   Circle; NA/JP Triangle, Circle, Square, Cross, Left, Right, Cross). It is
 *   GameFAQs, so it ships; if the Steam copy shows a typo it is one line here.
 * - Banishing Blade: no source disagrees (International = NA/JP,
 *   FW-BU "unchanged across versions"); the GameFAQs page is not transcribed
 *   in research/, so this is FW-BU's order.
 * - Tornado: the NA/JP order, which opens with Cross (D3: GF-KB, AGS); the
 *   rest from FW-BU's NA/JP variant, which AGS repeats.
 *
 * The tokens are the game's own `UiButton` names (`src/ui/ffx/rawInput.ts`):
 * `confirm` is Cross, `cancel` is Circle.
 *
 * ## Swordplay: the ORDERING is sourced, the numbers are authored estimates
 *
 * "Zone width, marker speed and timer length all scale with the Overdrive's
 * strength: stronger Overdrive, narrower zone, faster marker, shorter timer"
 * `[verified: 2 sources]` (`research/ffx-combat-core.md` §5.3 rule 2). No source
 * publishes the values: the table below is §5.3's own "shipping parameters"
 * table, tagged `[estimate]` there ("tune freely; they are not facts"), chosen
 * to reproduce the published ordering. The timers (3000, 3000, 2600, 2200 ms)
 * already shipped (`TIMER_MS` in `battle/ffx/overdrive.ts`) and are not repeated.
 * Spiral Cut's pair is what the engine already published for every tier.
 */

/** A Bushido input, in the overlay's own button names. */
export type BushidoInput = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'triangle' | 'square' | 'l1' | 'r1';

/** Bushido sequences by ability id. Lengths `[verified: 4 sources]`; order `[estimate]`: the GameFAQs order (see the file header). */
export const BUSHIDO_SEQUENCES: Readonly<Record<string, readonly BushidoInput[]>> = {
  // down, left, up, right, L1, R1, Circle, Cross (8)
  'dragon-fang': ['down', 'left', 'up', 'right', 'l1', 'r1', 'cancel', 'confirm'],
  // Triangle, Circle, Square, Circle, left, right, Cross (7), GF-KB as recorded in D3
  'shooting-star': ['triangle', 'cancel', 'square', 'cancel', 'left', 'right', 'confirm'],
  // up, L1, down, R1, right, left, Triangle (7)
  'banishing-blade': ['up', 'l1', 'down', 'r1', 'right', 'left', 'triangle'],
  // Cross, right, R1, left, L1, Triangle (6)
  tornado: ['confirm', 'right', 'r1', 'left', 'l1', 'triangle'],
};

/** One Swordplay tier's marker and zone. `[estimate]`: ffx-combat-core §5.3 "shipping parameters"; only the ordering is sourced. */
export interface SwordplayTuning {
  /** Time for the marker to cross the meter once, left to right, in ms. */
  travelMs: number;
  /** Width of the gold zone as a percentage of the meter. */
  zonePercent: number;
}

export const SWORDPLAY_TUNING: Readonly<Record<string, SwordplayTuning>> = {
  'spiral-cut': { travelMs: 1400, zonePercent: 22 },
  'slice-and-dice': { travelMs: 1150, zonePercent: 16 },
  'energy-rain': { travelMs: 900, zonePercent: 12 },
  'blitz-ace': { travelMs: 700, zonePercent: 9 },
};
