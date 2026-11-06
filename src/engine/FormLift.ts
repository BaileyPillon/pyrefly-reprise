/**
 * **The stage lift of a form** (`SceneStaging.formLifts`; release 76, FFX only in use: the hidden Penance chapter's half disc). Pure: no `three`, no DOM.
 *
 * The engine plants a painting's lowest opaque row on the floor (`PaintedScale.computePoseScale`, the anchor row). When a boss swaps to a painting whose lowest row is higher on the figure than the last
 * painting's (Penance's lower half falls away at the Separation, and the half that stays ends 280 of the whole disc's 913 rows higher), the part that stays would drop by what fell away. A scene names, per
 * art id, the lift that keeps it where it was, as a fraction of the figure's world height; the stage stands the plane that much higher (`PaintedActor.setPerch`) while that painting is up.
 */

/** What the lift needs of the scene's slots. */
export interface FormLiftSlots {
  readonly formLifts?: Readonly<Record<string, number>> | undefined;
}

/**
 * The lift, in world units, for the painting `artId` of a figure `worldHeight` tall: the scene's fraction of the height, or 0 (no entry, a fraction that is not a positive finite number, no height).
 * Zero is "stand on the floor", exactly as every figure stood before this existed.
 */
export function formLiftFor(slots: FormLiftSlots, artId: string, worldHeight: number): number {
  const fraction = slots.formLifts?.[artId];
  if (fraction === undefined || !Number.isFinite(fraction) || fraction <= 0) return 0;
  if (!Number.isFinite(worldHeight) || worldHeight <= 0) return 0;
  return fraction * worldHeight;
}
