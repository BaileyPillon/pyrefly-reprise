/**
 * The shape of the measured pose registration (see `src/engine/PoseRegistration.ts`, which reads it, and
 * `tools/posescale/measure.py`, which writes `docs/target/pose-measure.json` and, with `table`, the three tables beside this file).
 * Pure data types: nothing here imports the engine.
 */
/**
 * Where a pose's head is on its painting, as fractions of the painting (`[u0, t0, u1, t1]`: u across from the left, t down from the top,
 * both 0 to 1): the record's head box over the painting's size, the same box the continuity harness (CHK-026) reads. The engine
 * (`HeadLock.ts`) holds it to the idle's head size on screen.
 */
export type HeadBox = readonly [number, number, number, number];

export interface PoseRegistrationRow {
  /** The pose's `scale` that brings its head to the idle's head (PaintedScale.ts): replaces the sidecar's and the KO table's. */
  scale?: number;
  /** Where the figure stands: x in the painting's own pixels from its left edge. */
  stanceX?: number;
  /** The row of the soles, when a weapon's tip hangs lower than the boots and the alpha baseline would float the figure. */
  feetRow?: number;
  /** A standing pose that is wider than tall (a lunge, a wing-spread): the aspect test must not lay it down like a KO. */
  upright?: true;
  /** r394 (D-510): where the pose's head is, so the engine can hold it to the idle's size on screen under any stage camera. Absent: no head is registered, the table scale stands. */
  head?: HeadBox;
}

export type PoseRegistrationTable = Readonly<Record<string, Readonly<Record<string, PoseRegistrationRow>>>>;
