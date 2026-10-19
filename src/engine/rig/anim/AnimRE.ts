/**
 * What FFX's own motion data says about Lulu's action timing, as the clock of the animation prototype's pass 2 (`?anim=proto&style=P2`; FFX ONLY: these are Lulu's clips in FFX's motion set `c006`;
 * the clip machinery that reads them is shared plumbing for both games; presentation only; erasable TS, no `three`).
 *
 * Source: `research/re-ffx-party-motion-timing.md` (branch `re-parity-party-motion-timing`, section 2 "Lulu"): Bailey's own Steam copy, FFX.exe build 25501027, the PS2-tree files inside
 * `FFX_Data.vbf` (`chr/pc/c006/mot/resident0..3.mgrp`, `battle/mot/regmot.mgrp`), read with our own VBF reader; frame counts and event frames only [R]. Every clip runs at 30 frames a second
 * (the rate field 7680 = 30.0 in 8.8 fixed point), one frame an update tick, so 1 frame = 1000 / 30 ms IF the tick is 30 Hz (read as consistent with the live counter, still unverified [I]).
 * Which of the three cast types a spell uses was NOT read (nothing here claims one); the prototype plays type 1 unless `?cast=2|3` asks.
 *
 * The three-part structure of an action (`_00` start, `_01` looping hold, `_02` release) is the game's: "how long the hold lasts is set by the spell effect, not by the clip".
 */

/** Milliseconds of `f` frames at the game's 30 frames a second. */
export const frameMs = (f: number): number => (f * 1000) / 30;

/** A cast type: the start clip, the hold loop, the release clip's frame the spell leaves on and the frame it ends on (all frames at 30 fps). */
export interface CastRE {
  start: number;
  loop: number;
  hit: number;
  end: number;
}

/** Lulu's three cast types: MAGIC1/2/3 `_00` (start), `_01` (loop), `_02` (release, hit frame in it, its end). */
export const LULU_CAST: readonly [CastRE, CastRE, CastRE] = [
  { start: 45, loop: 24, hit: 28, end: 43 },
  { start: 49, loop: 23, hit: 15, end: 48 },
  { start: 55, loop: 30, hit: 20, end: 90 },
];

/** Lulu's item: ITEM_00 (start), ITEM_01 (loop), ITEM_02_1 (party target) and ITEM_02_2 (the other release): the frame the item leaves on and the clip's end. */
export const LULU_ITEM = { start: 22, loop: 50, ally: { hit: 37, end: 64 }, self: { hit: 33, end: 56 } } as const;

/** Lulu's attack ATTACK2 (the stand-still one with the signals): the hit signal, the end signal and the clip's length. */
export const LULU_ATTACK = { hit: 20, end: 54, total: 60 } as const;

/** DMG1, DEAD_00 with the frame its floor-impact sound plays on, WIN_00 and WIN_01 (the loop). */
export const LULU_REACT = { hurt: 50, ko: 65, koFloor: 37, victory: 118, victoryLoop: 30 } as const;
