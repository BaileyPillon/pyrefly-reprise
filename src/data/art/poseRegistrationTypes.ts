/**
 * The shape of the measured pose registration (see `src/engine/PoseRegistration.ts`, which reads it, and
 * `tools/posescale/measure.py`, which writes `docs/target/pose-measure.json` and, with `table`, the three tables beside this file).
 * Pure data types: nothing here imports the engine.
 */
export interface PoseRegistrationRow {
  /** The pose's `scale` that brings its head to the idle's head (PaintedScale.ts): replaces the sidecar's and the KO table's. */
  scale?: number;
  /** Where the figure stands: x in the painting's own pixels from its left edge. */
  stanceX?: number;
  /** The row of the soles, when a weapon's tip hangs lower than the boots and the alpha baseline would float the figure. */
  feetRow?: number;
  /** A standing pose that is wider than tall (a lunge, a wing-spread): the aspect test must not lay it down like a KO. */
  upright?: true;
}

export type PoseRegistrationTable = Readonly<Record<string, Readonly<Record<string, PoseRegistrationRow>>>>;
