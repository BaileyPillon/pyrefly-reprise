/**
 * The comfort flags a battle's stage reads (OPTIONS accessibility A2, D-285):
 * REDUCE MOTION (the pause row, or the OS preference, as the title and the
 * moments read it) and LOW EFFECTS. Passed to `PaintedStage` as a getter, so a
 * change in the pause applies the moment the fight resumes.
 *
 * Game case: both (shared battle plumbing; FF7's own effects read the same flags
 * in `battleFf7Fx.ts`).
 */

import { readSetting } from '../SaveData.ts';
import type { ComfortFlags } from '../../engine/ComfortCamera.ts';
import { prefersReducedMotion } from '../../ui/common/transitions/reduceMotion.ts';

export function battleComfort(): ComfortFlags {
  return { reduceMotion: prefersReducedMotion(), lowEffects: readSetting('lowEffects') === true };
}
