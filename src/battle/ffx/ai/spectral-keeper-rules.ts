/**
 * **The Spectral Keeper's rules, as numbers and ids** (FFX only; the hidden Spectral Keeper chapter; `research/re-ffx-spectral-keeper.md`, "RE section n"). The scripts are `./spectral-keeper.ts`, the platform state is
 * `../platforms.ts`; this file holds what both read, so each number has one home and one source. **Every number is the note's** (rule 6), read from the game's own files (`m129`, `m146`, `dome02_00`); the
 * one that is ours is marked `[estimate]`. The battle layer imports no `src/data` (hard rule 1), so the ids are copied here and `tests/unit/chapters/spectral-keeper-data.test.ts` pins the copies equal
 * `data/ffx/spectral-keeper-ids.ts`.
 *
 * | Rule | Number | RE note |
 * |---|---|---|
 * | The ring | 6 platforms round the Keeper (Positions 1 to 6), a seventh (the aeon rock) 204 units to the side | 2.4, 3 item 8 |
 * | Where "in front" starts | platform 2 (a private variable the tail target overwrites) | 3 item 7, 4.1 |
 * | The sweep | Attack All on whoever stands on the platform in front and its two neighbours (mod 6) | 3 item 7, 4.5 |
 * | The hit counter | +1 per damaging hit (not Scan, buffs, a miss, a heal); mines are laid on the Keeper's next turn once it is 4 or more and no mine is live | 4.3, 4.5 |
 * | With an aeon out | the counter gains +1 more per damaging hit and +1 per Keeper turn; the tail and the sweep give way to a plain Attack; the mine is the rock | 4.4 |
 * | Mines | two per lay on the ring (one on the rock), at most two live; the blast is the Circle's own CTB turn | 4.3, 5.3 |
 * | The fuse | the Circle's idle counter, which cycles to a stored base: **84 `[estimate]`** (45 is the other candidate; the live check, preflight Q2, is not made) | 5.4 |
 */

/** The combatant ids (`data/ffx/spectral-keeper-ids.ts`). */
export const KEEPER_ID = 'spectral-keeper';
export const CIRCLE_IDS = [
  'spectral-circle-1',
  'spectral-circle-2',
  'spectral-circle-3',
  'spectral-circle-4',
  'spectral-circle-5',
  'spectral-circle-6',
  'spectral-circle-7',
] as const;

/** The AI script ids (`data/ffx/spectral-keeper-ids.ts`). */
export const KEEPER_SCRIPT = 'spectral-keeper';
export const CIRCLE_SCRIPT = 'spectral-circle';

/** The move rows (`data/ffx/enemies/spectral-keeper-abilities.ts`). */
export const KEEPER_ROWS = {
  tail: 'keeper-berserk-tail', // 0x6045, the Keeper's turn: Berserk 50
  sweep: 'keeper-attack-all', // 0x6047, the counter on the three platforms in front
  mine: 'keeper-glyph-mine', // 0x604D, arms a Circle
  blast: 'keeper-mine-blast', // 0x6048, the mine's blast: Death 255, a fraction of the maximum
  fizzle: 'keeper-mine-fizzle', // 0x6049, a mine on an empty platform strikes itself
  aeonAttack: 'keeper-aeon-attack', // 0x604E, the Keeper's plain Attack against an aeon
  move: 'move', // 0x3103, the party command
} as const;

/** The ring: Positions 1 to 6; the aeon rock is Position 7 (RE 3 item 8). */
export const RING_PLATFORMS = 6;
export const ROCK_PLATFORM = 7;

/** "The platform in front" before any tail has landed (RE 3 item 7, 4.1). */
export const FRONT_START = 2;

/**
 * The platforms the front line begins on, slot 0 to 2. **Driver pick, his to overturn (preflight Q1 unsettled):** 1, 2 and 3, which every script rule reads (Circles 21 to 23 untargetable, the front starts at 2, the start facings
 * -90 and -120 are platforms 1 and 2); the other candidate is the engine's own write of Positions 0, 1 and 2 followed by a step (RE 3 item 2).
 */
export const START_PLATFORMS: readonly number[] = [1, 2, 3];

/** The hit counter's threshold (RE 4.3 rule 1) and the aeon mode's extra gains (RE 4.4): +1 per Keeper turn, +1 more per damaging hit. */
export const COUNT_TO_ARM = 4;
export const AEON_TURN_GAIN = 1;
export const AEON_HIT_EXTRA = 1;

/** Mines per lay: two on the ring, one on the rock (RE 4.3 rule 2, 4.4). */
export const RING_MINES_PER_LAY = 2;
export const ROCK_MINES_PER_LAY = 1;

/** The Circle's Agility: the record reads 0 (so the stored base, three times the tick speed, comes from AGI 0), the script writes 8 after the opening counters (RE 1.2, 5.1, 5.4). */
export const CIRCLE_SCRIPT_AGI = 8;

/** `state.flags` keys the platform state lives in (like the aeon duel's, so a rebuilt runtime and the advisor's dry runs see the same battle). */
export const RING_FLAG = 'plat.ring';
export const FIRST_STRIKE_FLAG = 'plat.firstStrike';
export const FRONT_FLAG = 'plat.front';
export const COUNT_FLAG = 'plat.count';
export const MINES_FLAG = 'plat.mines';
export const AT_PREFIX = 'plat.at.';
export const ARMED_PREFIX = 'plat.armed.';
