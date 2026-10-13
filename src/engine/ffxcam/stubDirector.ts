/**
 * The **stub shot director** of the hidden Fayth chapter (FFX only; `src/scenes/exp-fayth-deck.ts`): a director for every one of the ten beats that **declines them all**.
 *
 * It exists so the seam (`../ShotDirector.ts`, `BattleMoments`) runs end to end in the chapter before any real camera does: `BattleMoments` asks it at every beat and, because it answers `false` each
 * time, plays Chapter VIII's own shot, so the chapter looks and plays exactly like Chapter VIII (`tests/unit/shot-director.test.ts` pins it, beside the same beats with no director at all). The FFX
 * shot table and its variants A and B (D-632) replace the handlers one beat at a time, here in `src/engine/ffxcam/`.
 *
 * Pure: no `three`, no DOM. Game case: FFX only (it is published by an FFX chapter's scene; the seam it plugs into is shared plumbing and inert elsewhere).
 */

import type { ShotDirector } from '../ShotDirector.ts';

/** A director that has an answer for every beat and the answer is always no. */
export const STUB_SHOT_DIRECTOR: ShotDirector = {
  battleStart: () => false,
  turnStart: () => false,
  actionOpen: () => false,
  impact: () => false,
  actionClose: () => false,
  overdriveStart: () => false,
  overdriveEnd: () => false,
  telegraph: () => false,
  formChange: () => false,
  victory: () => false,
};
