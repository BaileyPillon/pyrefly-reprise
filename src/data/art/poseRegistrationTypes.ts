/**
 * The shape of the measured pose registration (see `src/engine/PoseRegistration.ts`, which reads it, and
 * `tools/posescale/measure.py`, which writes `docs/target/pose-measure.json` and, with `table`, the three tables beside this file).
 * Pure data types (and one tiny pure predicate, `poseStatusTrusted`): nothing here imports the engine.
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
  /**
   * Pose continuity (2026-10-16; `docs/plans/pose-continuity-review.md`): what the install says about this painting. Absent on a row written before the
   * install did: such a row draws as it always did and the gate (`tools/pose-gate.mjs`) lists it. See {@link PoseStatus}.
   */
  status?: PoseStatus;
  /** The class the painting was judged in (see {@link PoseClass}); the bands of `tools/posescale/pose-bands.mjs` follow it. */
  class?: PoseClass;
  /** The figure's height as drawn over its idle's, head lock applied (`tools/posescale/pose-model.mjs`, `stature`). Written at install; recomputed from the pixels by the gate. */
  stature?: number;
  /** The head the player sees over the idle's (a hold's real ratio, not the lock's): the reading CHK-026's 3 percent cannot see. */
  headReal?: number;
  /** A KO's (or a laid-down painting's) length over the idle's height. Report-only. */
  lengthRatio?: number;
  /** The silhouette's overlap with the idle's as drawn (intersection over union), 0 to 1. */
  iou?: number;
  /** The first 16 hex characters of the painting master's sha256 the readings describe. A row whose `sha` is not the file's is stale (the painting was re-installed). */
  sha?: string;
}

/**
 * What the install says about a character painting's registration (pose continuity, 2026-10-16; both games):
 *  - `ok`      measured, in its class's band;
 *  - `held`    out of band on purpose with its cost recorded honestly (r50.1's nine FFX holds: the figure kept at height, the head paid for);
 *  - `waived`  out of band, drawn as it was, with a row in `docs/target/pose-waivers.json` that carries whose words say so (the table is generated from that ledger);
 *  - `blocked` out of band and not waived: not trusted.
 * No row at all is **absent**. A painting that is absent or `blocked` is treated as missing by the runtime (it falls down `resolvePoseName`'s chain to the idle).
 */
export type PoseStatus = 'ok' | 'held' | 'waived' | 'blocked';

/**
 * The class a pose is judged in (`tools/posescale/pose-kinds.mjs#poseClassOf`): `idle` the reference; `standing` strike, hurt, ready and the rest; `low` critical, sleep, kneel;
 * `ko`; `wide` laid down but not a KO; `part` any pose of a hull, fin or limb; `staged` an FFX-2 `twirl-*` costume-change painting (exempt, as today).
 */
export type PoseClass = 'idle' | 'standing' | 'low' | 'ko' | 'wide' | 'part' | 'staged';

/** The statuses the runtime draws: everything else (`blocked`, or no row at all) is treated as a missing painting. */
export const POSE_TRUSTED_STATUSES: readonly PoseStatus[] = ['ok', 'held', 'waived'];

/** True when a row's status lets the runtime draw the painting. Absent (no row) is not trusted; FF7 and twirl keys are the caller's exemptions. */
export function poseStatusTrusted(status: PoseStatus | undefined): boolean {
  return status !== undefined && POSE_TRUSTED_STATUSES.includes(status);
}

export type PoseRegistrationTable = Readonly<Record<string, Readonly<Record<string, PoseRegistrationRow>>>>;
