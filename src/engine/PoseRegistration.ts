import { logicalArtUrl } from './ArtShipped.ts';
import type { PoseRegistrationRow, PoseRegistrationTable } from '../data/art/poseRegistrationTypes.ts';
import { POSE_REGISTRATION_FFX } from '../data/art/poseRegistrationFfx.ts';
import { POSE_REGISTRATION_FFX2 } from '../data/art/poseRegistrationFfx2.ts';
import { POSE_REGISTRATION_FOES } from '../data/art/poseRegistrationFoes.ts';
import { POSE_REGISTRATION_EXP } from '../data/art/poseRegistrationExp.ts';

/**
 * **One figure, one size and one stance in every pose** (release 39 pose registration; both games).
 *
 * The generator paints each pose separately and does not paint them at one pixels-per-metre, so the same head came out
 * between half and one and a half times the idle's, and the engine, which places a plane by its PNG's centre, slid the
 * feet whenever the pose changed. `tools/posescale/measure.py` measures, for every painting, how big its head is against
 * the subject's idle and where it stands; `docs/target/pose-measure.json` is the record (with each painting's sha256) and
 * the tables in `src/data/art/poseRegistration*.ts` are generated from it. This module reads them.
 *
 * - `scale` is the pose's `scale` in the sense of `PaintedScale.ts`: the idle's pixel scale times it brings this pose's
 *   head to the idle's head. It **replaces** the sidecar's own `scale` and the KO table's (a sidecar value was an eye
 *   estimate and was often 15 to 40 percent off).
 * - `stanceX` is where the figure stands, in the painting's own pixels from its left edge: the middle of the lowest thick
 *   part of its silhouette. {@link stanceShift} slides each plane so that point sits where the idle's does.
 * - `feetRow` is the row of the soles when a weapon's tip is lower than the boots and the alpha baseline would plant the
 *   figure above the floor.
 * - `upright` marks a standing pose that is wider than tall (a lunge): the aspect test would lay it down like a KO.
 *
 * Pure: no `three`, no DOM.
 */

export type { PoseRegistrationRow, PoseRegistrationTable };

/** Every measured subject, by the art id (`tidus`, `yuna-gunner`, `valefor`). */
export const POSE_REGISTRATION: PoseRegistrationTable = {
  ...POSE_REGISTRATION_FFX,
  ...POSE_REGISTRATION_FFX2,
  ...POSE_REGISTRATION_FOES,
  ...POSE_REGISTRATION_EXP, // the experimental Leblanc chapter's paintings, `exp-leblanc-<subject>` (`tools/exp-art-table.mjs`)
};

const CHARACTER_POSE = /\/art\/characters\/([^/]+)\/([^/.?#]+)\.png(?:[?#].*)?$/;

/** `?posereg=off` (captures and A/B comparisons only): paintings are sized and placed as before the measured table. */
export function poseRegistrationOff(): boolean {
  return new URLSearchParams(globalThis.location?.search ?? '').get('posereg') === 'off';
}

/** The measured row for the painting loaded from `imageUrl` (a shipped `.webp` is its master's `.png`), or undefined. */
export function poseRegistrationFor(imageUrl: string, table: PoseRegistrationTable = POSE_REGISTRATION): PoseRegistrationRow | undefined {
  if (table === POSE_REGISTRATION && poseRegistrationOff()) return undefined;
  const m = CHARACTER_POSE.exec(logicalArtUrl(imageUrl));
  if (!m) return undefined;
  return table[m[1]!]?.[m[2]!];
}

/** What {@link stanceShift} needs to know about one plane. */
export interface StancePlane {
  /** The stance's x in the painting's own pixels, from its left edge. */
  stanceX: number;
  /** The painting's width in pixels. */
  width: number;
  /** World units per painting pixel, with the pose's own `scale` in it. */
  unitsPerPixel: number;
  /** `-1` when the plane is drawn mirrored. */
  mirror: 1 | -1;
}

/** Where a plane's stance centre lies, in the actor's frame, before any shift: the plane is centred on the actor's x. */
export function stanceOffset(p: StancePlane): number {
  return (p.stanceX - p.width / 2) * p.unitsPerPixel * p.mirror;
}

/**
 * The shift (world units, + = toward +x) that puts a plane's stance centre where the reference pose's is, so a change of pose
 * does not slide the feet. The reference itself is never shifted. 0 when either stance is unknown.
 */
export function stanceShift(plane: StancePlane | null, reference: StancePlane | null): number {
  if (!plane || !reference) return 0;
  return stanceOffset(reference) - stanceOffset(plane);
}
