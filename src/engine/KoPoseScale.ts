import { logicalArtUrl } from './ArtShipped.ts';

/**
 * **KO paintings drawn at their standing figure's scale** (VP-1001-05, both games).
 *
 * `computePoseScale` sizes every pose from the idle's pixels per world unit and
 * trims it only by a sidecar `scale`. Several KO paintings were rendered at a
 * closer or wider zoom than their idle and carry no `scale`, so a downed Yuna
 * (FFX) drew her head about twice the standing head and lay across Kimahri's
 * station, while Rikku Black Mage's KO (FFX-2), sized by its sidecar's 0.75,
 * lay at about 0.6 of her standing size.
 *
 * The approved paintings and their sidecars are not touched (approved-hashes):
 * the correction lives here, in src. Each value is the pose `scale` the subject's
 * `ko` painting should be drawn at (engine: ko px x scale = idle px), measured
 * by head-matching the KO head against the idle head at the same pixel scale
 * (`D:/Tools/pyrefly-scratch/2026-09-30-visual/vis-fix/ko-scale/*-compare.jpg`,
 * the method of the 2026-09-25 repair: eye spacing, eye line to chin, head
 * width, checked by eye beside the idle head). It **replaces** the sidecar's
 * `scale` for that pose, so a sidecar value that was itself the defect is
 * corrected rather than multiplied.
 *
 * Subjects whose KO already reads within 10 percent of the idle head (Tidus,
 * and the D-194 dressphere KOs with measured sidecar scales) are not listed.
 */
export const KO_POSE_SCALE: Readonly<Record<string, number>> = {
  // FFX party (FFX only: these are FFX's own paintings).
  yuna: 0.52,
  auron: 0.45,
  wakka: 0.58,
  lulu: 0.47,
  kimahri: 0.58,
  rikku: 0.56,
  // FFX-2 dressphere KOs (FFX-2 only).
  'yuna-gunner': 0.6,
  'yuna-black-mage': 0.66,
  'yuna-white-mage': 0.64,
  'rikku-black-mage': 1.15,
};

const CHARACTER_POSE = /\/art\/characters\/([^/]+)\/([^/.?#]+)\.png(?:[?#].*)?$/;

/**
 * The `scale` a pose loaded from `imageUrl` should carry: the table's value for
 * a listed subject's `ko` painting, otherwise the sidecar's own (`undefined`
 * when it had none).
 */
export function poseScaleFor(imageUrl: string, sidecarScale: number | undefined): number | undefined {
  const m = CHARACTER_POSE.exec(logicalArtUrl(imageUrl)); // a derived `ko.webp` is the master's `ko.png` (ArtShipped.ts)
  if (m && m[2] === 'ko') {
    const fixed = KO_POSE_SCALE[m[1]!];
    if (fixed !== undefined) return fixed;
  }
  return sidecarScale;
}
