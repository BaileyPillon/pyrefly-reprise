/**
 * FFX-2 Garment Grid layouts: the nodes, the links and the gate numbers of all 44 grids our data holds (re-parity RC9, lane X2-I, and its follow-up D1).
 * **Game case: FFX-2 only** (FFX has no garment grids). Numbers only, in our grid ids: no game text, no copied file.
 *
 * Source: the game's own plain grid cards (`menu/resdat00..63.bin` of Steam build 25501027, SHA-256 6EA7F142...CD69), one card per grid, read in
 * `FFX2-G09` §3.1 and §4.1 [verified: the game's own files, and the path finder over the cards emulated, 24,850 vectors, 0 mismatches];
 * `research/re-ffx2-dressphere.md` §3.4 carries the correction of the old "compressed, not decoded" line. A grid's key is our id;
 * `plate` is the game's plate number n (plate id 0x6000 + n). `battle/ffx2/kernel/grid-path.ts` reads these.
 *
 * - `nodes`: the card's nodes in the card's order, `[gate, x, y]`: gate 0 is a dressphere node, 1 to 4 is a gate node with that number (a gate sits on its
 *   own between two dressphere nodes and never touches another gate); `x`, `y` are whole pixels of the 240 x 320 grid panel (the card stores 1/16 pixel).
 * - `links`: link id k (0, 1, 2 ...) joins the two nodes `links[k]`. A move goes from a dressphere node to another one joined to it directly, or joined
 *   through exactly one gate node (that gate is crossed). The engine numbers a grid's dressphere nodes **along a ring through them** (`ringOrder` in
 *   `battle/ffx2/kernel/grid-path.ts`: our numbering, chosen so that the builds, which place their dresspheres for a ring, keep every join they were written for), not in the card's order.
 * - `colourOfGate`: which of the grid's colours the gate with number 1, 2, 3, 4 wears in our data (null: the grid has no such gate). **This is not one mapping
 *   for all grids and it is not the inferred 1 = red, 2 = green, 3 = yellow, 4 = blue** (the artwork look that would confirm that has not been done). Each table
 *   is the one under which that grid's own existing colour-keyed data pays what the game's plate row pays at the same gate number
 *   (`tests/unit/ffx2-grid-layout-data.test.ts` proves it, grid by grid and for every set of gates crossed). Of the first lane's 39 grids, on 17 (two of them have no gate) that leaves one
 *   table; on the other 22 the data cannot tell (every gate pays the same, two colours only ever come together, or a stat is paid by a pair), several tables pay the
 *   same, and the one closest to the common colours was taken: a label, no number depends on which. The five older stat grids (`vanguard`, `bum-rush`,
 *   `flash-of-steel`, `protection-halo`, `hour-of-need`) have red and yellow on the physical stat and blue and green on the magical one in today's data, and the
 *   game pays the physical stat at the numbers 3 and 4, so their tables read blue, green, yellow, red. The colour flip (it waits for the artwork look) replaces
 *   those five tables with the common colours and swaps red and blue in those five grids' `gateEffects`; nothing else changes.
 *
 * All 44 of the data's grids are here. The first lane laid out 39 of them and left five out, because their data disagreed with the cards (`healing-wind`, `ray-of-hope`,
 * `seething-cauldron`, `strength-of-one`, `howling-wind`: node count, gate set or effects). Follow-up D1 (2026-10-16) corrected those five grids' data and `white-signet`'s gate effects
 * from the game's plate rows (the comments in `early.ts` and `late.ts`; "Follow-up D1" in `docs/handoff/re-parity-rc9-x2-grids.md`) and added their layouts. The tables of these five are
 * labels, like the 22 above (the colour a gate wears was never in the data they were corrected to): the four whose four gates pay the same read red, green, yellow, blue; Healing Wind,
 * whose card has the gates 1 and 4 only, keeps the data's red and blue, as Heart Reborn and Covetous (also the gates 1 and 4) read.
 */

import type { GarmentGridLayout } from './types.ts';

export const GARMENT_GRID_LAYOUTS: Readonly<Record<string, GarmentGridLayout>> = {
  'first-steps': {
    plate: 0,
    colourOfGate: [null, null, null, null],
    nodes: [[0, 184, 216], [0, 120, 104], [0, 56, 216], [0, 144, 160], [0, 120, 192], [0, 96, 160]],
    links: [[1, 3], [0, 3], [0, 4], [2, 4], [2, 5], [1, 5], [3, 5], [4, 5], [3, 4]],
  },
  vanguard: {
    plate: 1,
    colourOfGate: ['blue', 'green', 'yellow', 'red'],
    nodes: [[0, 120, 80], [0, 200, 160], [0, 120, 240], [0, 40, 160], [4, 80, 200], [2, 160, 200], [3, 80, 120], [1, 160, 120], [0, 120, 160]],
    links: [[0, 6], [3, 6], [3, 4], [2, 4], [2, 5], [1, 5], [1, 7], [0, 7], [1, 8], [3, 8], [0, 8], [2, 8]],
  },
  'bum-rush': {
    plate: 2,
    colourOfGate: ['blue', 'green', 'yellow', 'red'],
    nodes: [[0, 120, 80], [0, 200, 160], [0, 120, 240], [0, 40, 160], [4, 80, 200], [2, 160, 200], [3, 80, 120], [1, 160, 120], [0, 120, 160]],
    links: [[0, 6], [3, 6], [3, 4], [2, 4], [2, 5], [1, 5], [1, 7], [0, 7], [1, 8], [3, 8], [0, 8], [2, 8]],
  },
  'flash-of-steel': {
    plate: 4,
    colourOfGate: ['blue', 'green', 'yellow', 'red'],
    nodes: [[0, 120, 80], [0, 200, 160], [0, 120, 240], [0, 40, 160], [4, 80, 200], [2, 160, 200], [3, 80, 120], [1, 160, 120], [0, 120, 160]],
    links: [[0, 6], [3, 6], [3, 4], [2, 4], [2, 5], [1, 5], [1, 7], [0, 7], [1, 8], [3, 8], [0, 8], [2, 8]],
  },
  'protection-halo': {
    plate: 5,
    colourOfGate: ['blue', 'green', 'yellow', 'red'],
    nodes: [[0, 200, 160], [2, 176, 216], [0, 120, 240], [4, 64, 216], [0, 40, 160], [3, 64, 104], [0, 120, 80], [1, 176, 104], [0, 120, 160]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7], [0, 8], [6, 8], [4, 8], [2, 8]],
  },
  'hour-of-need': {
    plate: 6,
    colourOfGate: ['blue', 'green', 'yellow', 'red'],
    nodes: [[0, 200, 160], [2, 176, 216], [0, 120, 240], [4, 64, 216], [0, 40, 160], [3, 64, 104], [0, 120, 80], [1, 176, 104], [0, 120, 160]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7], [0, 8], [6, 8], [4, 8], [2, 8]],
  },
  'valiant-lustre': {
    plate: 8,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 200, 160], [2, 176, 216], [0, 120, 240], [4, 64, 216], [0, 40, 160], [3, 64, 104], [0, 120, 80], [1, 176, 104], [0, 120, 160]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7], [0, 8], [6, 8], [4, 8], [2, 8]],
  },
  'highroad-winds': {
    plate: 9,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 192, 160], [0, 120, 232], [0, 48, 160], [0, 120, 88], [4, 144, 184], [2, 96, 136], [1, 144, 136], [3, 96, 184]],
    links: [[0, 6], [3, 6], [0, 4], [1, 4], [1, 7], [2, 7], [2, 5], [3, 5]],
  },
  'heart-of-flame': {
    plate: 11,
    colourOfGate: ['red', 'green', 'yellow', null],
    nodes: [[0, 184, 216], [0, 120, 104], [0, 56, 216], [1, 144, 160], [3, 120, 192], [2, 96, 160]],
    links: [[1, 3], [0, 3], [0, 4], [2, 4], [2, 5], [1, 5]],
  },
  'ice-queen': {
    plate: 12,
    colourOfGate: ['red', 'green', 'yellow', null],
    nodes: [[0, 184, 216], [0, 120, 104], [0, 56, 216], [1, 144, 160], [3, 120, 192], [2, 96, 160]],
    links: [[1, 3], [0, 3], [0, 4], [2, 4], [2, 5], [1, 5]],
  },
  'thunder-spawn': {
    plate: 13,
    colourOfGate: ['red', 'green', 'yellow', null],
    nodes: [[0, 184, 216], [0, 120, 104], [0, 56, 216], [1, 144, 160], [3, 120, 192], [2, 96, 160]],
    links: [[1, 3], [0, 3], [0, 4], [2, 4], [2, 5], [1, 5]],
  },
  'menace-of-the-deep': {
    plate: 14,
    colourOfGate: ['red', 'green', 'yellow', null],
    nodes: [[0, 184, 216], [0, 120, 104], [0, 56, 216], [1, 144, 160], [3, 120, 192], [2, 96, 160]],
    links: [[1, 3], [0, 3], [0, 4], [2, 4], [2, 5], [1, 5]],
  },
  downtrodder: {
    plate: 15,
    colourOfGate: ['red', 'green', 'yellow', null],
    nodes: [[0, 184, 216], [0, 120, 104], [0, 56, 216], [1, 144, 160], [3, 120, 192], [2, 96, 160]],
    links: [[1, 3], [0, 3], [0, 4], [2, 4], [2, 5], [1, 5]],
  },
  'restless-sleep': {
    plate: 18,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 200, 160], [4, 176, 216], [0, 120, 240], [3, 64, 216], [0, 40, 160], [2, 64, 104], [0, 120, 80], [1, 176, 104], [0, 120, 160]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7], [0, 8], [4, 8], [6, 8], [2, 8]],
  },
  'raging-giant': {
    plate: 21,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 200, 160], [4, 176, 216], [0, 120, 240], [3, 64, 216], [0, 40, 160], [2, 64, 104], [0, 120, 80], [1, 176, 104], [0, 120, 160]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7], [0, 8], [4, 8], [6, 8], [2, 8]],
  },
  'bitter-farewell': {
    plate: 22,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 200, 160], [4, 176, 216], [0, 120, 240], [3, 64, 216], [0, 40, 160], [2, 64, 104], [0, 120, 80], [1, 176, 104], [0, 120, 160]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7], [0, 8], [4, 8], [6, 8], [2, 8]],
  },
  covetous: {
    plate: 26,
    colourOfGate: ['red', null, null, 'blue'],
    nodes: [[0, 176, 208], [0, 120, 112], [0, 64, 208], [1, 152, 168], [4, 88, 168]],
    links: [[1, 3], [0, 3], [2, 4], [1, 4], [0, 2]],
  },
  'disaster-in-bloom': {
    plate: 27,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[4, 184, 224], [3, 56, 224], [0, 88, 160], [0, 120, 128], [0, 120, 192], [0, 152, 160], [1, 184, 96], [2, 56, 96], [0, 120, 160]],
    links: [[1, 2], [0, 4], [1, 4], [0, 5], [5, 6], [3, 6], [3, 7], [2, 7], [5, 8], [2, 8], [3, 8], [4, 8]],
  },
  scourgebane: {
    plate: 28,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[4, 184, 224], [3, 56, 224], [0, 88, 160], [0, 120, 128], [0, 120, 192], [0, 152, 160], [1, 184, 96], [2, 56, 96], [0, 120, 160]],
    links: [[1, 2], [0, 4], [1, 4], [0, 5], [5, 6], [3, 6], [3, 7], [2, 7], [5, 8], [2, 8], [3, 8], [4, 8]],
  },
  'healing-wind': {
    plate: 29,
    colourOfGate: ['red', null, null, 'blue'],
    nodes: [[0, 167, 96], [1, 196, 184], [0, 120, 240], [4, 44, 184], [0, 73, 96]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [0, 4]],
  },
  'heart-reborn': {
    plate: 30,
    colourOfGate: ['red', null, null, 'blue'],
    nodes: [[0, 167, 224], [0, 73, 224], [4, 44, 136], [0, 120, 80], [1, 196, 136]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [0, 4]],
  },
  'healing-light': {
    plate: 31,
    colourOfGate: ['red', 'green', 'yellow', null],
    nodes: [[0, 120, 160], [3, 160, 160], [2, 80, 160], [0, 200, 160], [0, 120, 240], [0, 40, 160], [1, 120, 80]],
    links: [[0, 1], [0, 2], [3, 4], [4, 5], [5, 6], [3, 6], [1, 3], [2, 5], [0, 4]],
  },
  'immortal-soul': {
    plate: 32,
    colourOfGate: ['red', 'green', 'yellow', null],
    nodes: [[0, 120, 160], [3, 160, 160], [2, 80, 160], [0, 200, 160], [1, 120, 240], [0, 40, 160], [0, 120, 80]],
    links: [[0, 1], [0, 2], [3, 4], [4, 5], [5, 6], [3, 6], [1, 3], [2, 5], [0, 6]],
  },
  'strength-of-one': {
    plate: 34,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[4, 144, 160], [0, 176, 216], [3, 120, 184], [0, 64, 216], [2, 96, 160], [0, 64, 104], [1, 120, 136], [0, 176, 104]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7]],
  },
  'seething-cauldron': {
    plate: 35,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[4, 144, 160], [0, 176, 216], [3, 120, 184], [0, 64, 216], [2, 96, 160], [0, 64, 104], [1, 120, 136], [0, 176, 104]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7]],
  },
  stonehewn: {
    plate: 36,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[4, 144, 160], [0, 176, 216], [3, 120, 184], [0, 64, 216], [2, 96, 160], [0, 64, 104], [1, 120, 136], [0, 176, 104]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7]],
  },
  'enigma-plate': {
    plate: 37,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[4, 144, 160], [0, 176, 216], [3, 120, 184], [0, 64, 216], [2, 96, 160], [0, 64, 104], [1, 120, 136], [0, 176, 104]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7]],
  },
  'howling-wind': {
    plate: 38,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[4, 144, 160], [0, 176, 216], [3, 120, 184], [0, 64, 216], [2, 96, 160], [0, 64, 104], [1, 120, 136], [0, 176, 104]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7]],
  },
  'ray-of-hope': {
    plate: 39,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[1, 200, 128], [0, 120, 80], [2, 40, 128], [0, 136, 128], [4, 184, 224], [3, 56, 224], [0, 152, 160], [0, 120, 184], [0, 88, 160], [0, 104, 128]],
    links: [[1, 3], [0, 6], [4, 7], [5, 7], [2, 8], [1, 9], [4, 6], [5, 8], [2, 9], [0, 3]],
  },
  'pride-of-the-sword': {
    plate: 40,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 152, 160], [0, 88, 160], [2, 64, 104], [1, 176, 104], [0, 120, 80], [0, 200, 160], [0, 120, 240], [0, 40, 160], [4, 176, 216], [3, 64, 216]],
    links: [[5, 8], [6, 8], [6, 9], [3, 5], [7, 9], [2, 7], [3, 4], [2, 4], [0, 1], [0, 5], [0, 4], [1, 7], [1, 6]],
  },
  'samurais-honor': {
    plate: 41,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 152, 160], [0, 88, 160], [2, 64, 104], [1, 176, 104], [0, 120, 80], [0, 200, 160], [0, 120, 240], [0, 40, 160], [4, 176, 216], [3, 64, 216]],
    links: [[5, 8], [6, 8], [6, 9], [3, 5], [7, 9], [2, 7], [3, 4], [2, 4], [0, 1], [0, 5], [0, 4], [1, 7], [1, 6]],
  },
  'blood-of-the-beast': {
    plate: 42,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 152, 160], [0, 88, 160], [2, 64, 104], [1, 176, 104], [0, 120, 80], [0, 200, 160], [0, 120, 240], [0, 40, 160], [4, 176, 216], [3, 64, 216]],
    links: [[5, 8], [6, 8], [6, 9], [3, 5], [7, 9], [2, 7], [3, 4], [2, 4], [0, 1], [0, 5], [0, 4], [1, 7], [1, 6]],
  },
  'chaos-maelstrom': {
    plate: 43,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 200, 160], [4, 176, 216], [0, 120, 240], [3, 64, 216], [0, 40, 160], [2, 64, 104], [0, 120, 80], [1, 176, 104], [0, 152, 160], [0, 88, 160]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7], [8, 9], [0, 8], [4, 9], [6, 9], [2, 8]],
  },
  'white-signet': {
    plate: 44,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 200, 160], [4, 176, 216], [0, 120, 240], [3, 64, 216], [0, 40, 160], [2, 64, 104], [0, 120, 80], [1, 176, 104], [0, 152, 160], [0, 88, 160]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7], [8, 9], [0, 8], [4, 9], [6, 9], [2, 8]],
  },
  'black-tabard': {
    plate: 45,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 200, 160], [4, 176, 216], [0, 120, 240], [3, 64, 216], [0, 40, 160], [2, 64, 104], [0, 120, 80], [1, 176, 104], [0, 152, 160], [0, 88, 160]],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [0, 7], [8, 9], [0, 8], [4, 9], [6, 9], [2, 8]],
  },
  'tricks-of-the-trade': {
    plate: 47,
    colourOfGate: ['red', 'green', 'yellow', null],
    nodes: [[0, 200, 160], [0, 120, 240], [0, 40, 160], [0, 120, 80], [0, 160, 160], [2, 120, 200], [0, 80, 160], [1, 120, 120], [3, 120, 160]],
    links: [[0, 1], [1, 2], [2, 3], [0, 3], [5, 6], [4, 7], [3, 7], [1, 5], [2, 6], [0, 4], [6, 8], [4, 8]],
  },
  'treasure-hunt': {
    plate: 49,
    colourOfGate: ['red', null, null, null],
    nodes: [[0, 144, 160], [0, 184, 216], [0, 120, 104], [0, 56, 216], [0, 96, 160], [1, 120, 192]],
    links: [[0, 1], [0, 2], [2, 4], [3, 4], [1, 5], [3, 5], [0, 4]],
  },
  'tempered-will': {
    plate: 50,
    colourOfGate: ['red', 'green', null, null],
    nodes: [[1, 160, 192], [0, 192, 160], [0, 48, 160], [0, 120, 232], [0, 120, 88], [0, 120, 160], [2, 80, 128]],
    links: [[0, 3], [0, 1], [1, 4], [1, 5], [2, 5], [4, 5], [3, 5], [2, 3], [4, 6], [2, 6]],
  },
  'covenant-of-growth': {
    plate: 51,
    colourOfGate: [null, null, 'yellow', 'blue'],
    nodes: [[0, 192, 160], [0, 48, 160], [0, 120, 232], [0, 120, 88], [0, 120, 160], [3, 160, 128], [4, 80, 192]],
    links: [[0, 4], [1, 4], [3, 4], [2, 4], [0, 2], [3, 5], [0, 5], [1, 3], [1, 6], [2, 6]],
  },
  conflagration: {
    plate: 53,
    colourOfGate: ['red', 'green', null, 'blue'],
    nodes: [[1, 120, 80], [0, 184, 144], [0, 120, 240], [0, 56, 144], [4, 96, 184], [2, 144, 184], [0, 120, 144]],
    links: [[3, 4], [2, 4], [2, 5], [1, 5], [0, 1], [0, 3], [3, 6], [1, 6], [2, 6]],
  },
  megiddo: {
    plate: 55,
    colourOfGate: ['red', 'green', 'yellow', null],
    nodes: [[1, 152, 160], [3, 120, 192], [0, 88, 160], [0, 120, 128], [0, 192, 160], [0, 120, 232], [2, 48, 160], [0, 120, 88]],
    links: [[1, 2], [0, 3], [2, 3], [4, 5], [5, 6], [6, 7], [4, 7], [0, 4], [1, 5]],
  },
  'unerring-path': {
    plate: 56,
    colourOfGate: [null, null, null, null],
    nodes: [[0, 168, 208], [0, 72, 112]],
    links: [[0, 1]],
  },
  'font-of-power': {
    plate: 57,
    colourOfGate: ['red', null, 'yellow', 'blue'],
    nodes: [[4, 144, 112], [0, 120, 144], [3, 96, 112], [1, 120, 184], [0, 120, 224], [0, 184, 96], [0, 56, 96]],
    links: [[1, 2], [0, 1], [1, 3], [3, 4], [0, 5], [2, 6], [4, 6], [4, 5]],
  },
  'the-end': {
    plate: 59,
    colourOfGate: ['red', 'green', 'yellow', 'blue'],
    nodes: [[0, 192, 160], [0, 120, 232], [0, 48, 160], [0, 120, 88], [4, 144, 184], [2, 96, 136], [1, 144, 136], [3, 96, 184], [0, 120, 160]],
    links: [[0, 6], [3, 6], [0, 4], [1, 4], [1, 7], [2, 7], [2, 5], [3, 5], [0, 8], [2, 8], [3, 8], [1, 8]],
  },
};
