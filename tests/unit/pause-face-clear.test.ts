/**
 * PR-0079 (both games): the pause frames each member's face clear of the
 * chrome the screen actually drew, by panning and scaling the painting the way
 * approved frame (c) does. `docs/plans/pr-0079-method-check.md`.
 */
import { describe, expect, it } from 'vitest';
import { clearFace, FACE_BOXES, faceInFrame, faceOverlap, faceRectOn, type Rect } from '../../src/app/screens/pause/faceClear.ts';
import { framePlate, PLATE_FRAMING } from '../../src/app/screens/pause/plates.ts';
import { estimateBlocks, FaceFramer, scaleBlocks } from '../../src/app/screens/pause/faceFramer.ts';

/** The two columns as measured at 1600x900 (left chrome), plus the objective line. */
const LEFT_CHROME_1600: Rect[] = [
  { left: 62, right: 372, top: 296, bottom: 520 },
  { left: 416, right: 866, top: 296, bottom: 520 },
  { left: 62, right: 564, top: 732, bottom: 780 },
];

describe('face boxes', () => {
  it('has a face box for every shipped member plate', () => {
    for (const id of Object.keys(PLATE_FRAMING)) expect(FACE_BOXES[id], id).toBeDefined();
  });

  it('keeps every face box inside its painting and the right way round', () => {
    for (const [id, f] of Object.entries(FACE_BOXES)) {
      expect(f.x0, id).toBeGreaterThanOrEqual(0);
      expect(f.x1, id).toBeLessThanOrEqual(1);
      expect(f.x0, id).toBeLessThan(f.x1);
      expect(f.y0, id).toBeLessThan(f.y1);
    }
  });
});

describe('clearFace', () => {
  it('returns the approved framing untouched when the face already clears', () => {
    const f = PLATE_FRAMING['yuna-ffx2']!;
    const base = framePlate(f, 1600, 900);
    expect(clearFace(base, f, FACE_BOXES['yuna-ffx2'], 1600, 900, [])).toBe(base);
    const far: Rect[] = [{ left: 0, right: 10, top: 0, bottom: 10 }];
    expect(clearFace(base, f, FACE_BOXES['yuna-ffx2'], 1600, 900, far)).toBe(base);
  });

  it('pans FFX-2 Yuna off IN THIS FIGHT at 1600x900, keeping her whole face on screen', () => {
    const f = PLATE_FRAMING['yuna-ffx2']!;
    const face = FACE_BOXES['yuna-ffx2']!;
    const base = framePlate(f, 1600, 900);
    expect(faceOverlap(faceRectOn(base, face), LEFT_CHROME_1600)).toBeGreaterThan(0);
    const box = clearFace(base, f, face, 1600, 900, LEFT_CHROME_1600);
    expect(faceOverlap(faceRectOn(box, face), LEFT_CHROME_1600)).toBe(0);
    expect(faceInFrame(box, face, 1600, 900)).toBe(true);
    // No empty page at either edge, never magnified past the approved zoom.
    expect(box.left).toBeLessThanOrEqual(0);
    expect(box.left + box.width).toBeGreaterThanOrEqual(1600 - 0.5);
    expect(box.width).toBeLessThanOrEqual(base.width + 0.5);
  });

  it('falls back to the approved framing when no framing can clear (a layout question)', () => {
    const f = PLATE_FRAMING['rikku-ffx2']!;
    const face = FACE_BOXES['rikku-ffx2']!;
    const base = framePlate(f, 1600, 900);
    expect(clearFace(base, f, face, 1600, 900, LEFT_CHROME_1600)).toBe(base);
  });

  it('never clears the chrome by pushing the face off the screen', () => {
    const wall: Rect[] = [{ left: 500, right: 1280, top: 0, bottom: 960 }];
    const f = PLATE_FRAMING['paine']!;
    const face = FACE_BOXES['paine']!;
    const base = framePlate(f, 1280, 960);
    const box = clearFace(base, f, face, 1280, 960, wall);
    if (box !== base) expect(faceInFrame(box, face, 1280, 960)).toBe(true);
  });

  it('leaves a portrait frame (the phone, frame f) alone', () => {
    const f = PLATE_FRAMING['tidus']!;
    const base = framePlate(f, 390, 844);
    const all: Rect[] = [{ left: 0, right: 390, top: 0, bottom: 844 }];
    expect(clearFace(base, f, FACE_BOXES['tidus'], 390, 844, all)).toBe(base);
  });
});

describe('fix12 verifier follow-ups', () => {
  it('keeps the face on screen through the whole push-in, not only at rest', () => {
    const wall: Rect[] = [{ left: 480, right: 1280, top: 0, bottom: 960 }];
    for (const id of ['paine', 'yuna', 'kimahri']) {
      const f = PLATE_FRAMING[id]!;
      const face = FACE_BOXES[id]!;
      const base = framePlate(f, 1280, 960);
      const box = clearFace(base, f, face, 1280, 960, wall);
      if (box === base) continue;
      const r = faceRectOn(box, face, true);
      expect(r.left, id).toBeGreaterThanOrEqual(0);
      expect(r.right, id).toBeLessThanOrEqual(1280);
    }
  });

  it('re-frames an approved framing whose face the push-in carries off screen', () => {
    const f = PLATE_FRAMING['kimahri']!;
    const face = FACE_BOXES['kimahri']!;
    const base = framePlate(f, 1280, 960);
    const far: Rect[] = [{ left: 1270, right: 1280, top: 0, bottom: 10 }];
    const box = clearFace(base, f, face, 1280, 960, far);
    expect(faceInFrame(box, face, 1280, 960)).toBe(true);
  });
});

describe('FaceFramer', () => {
  const f = PLATE_FRAMING['yuna-ffx2']!;
  const chrome1600 = LEFT_CHROME_1600;

  it('estimates from the last member chrome on a fixed-tab resize, then settles once measured', () => {
    const framer = new FaceFramer();
    const measured = framer.frame('yuna-ffx2', framePlate(f, 1600, 900), f, 1600, 900, chrome1600);
    expect(measured.settled).toBe(false);
    // A resize with no member chrome up: an estimate, not the uncleared approved framing.
    const base1280 = framePlate(f, 1280, 960);
    const est = framer.frame('yuna-ffx2', base1280, f, 1280, 960, null);
    const scaled = estimateBlocks(chrome1600, 1600, 900, 1280, 960);
    expect(faceOverlap(faceRectOn(est.box, FACE_BOXES['yuna-ffx2']!), scaled)).toBe(0);
    // The fixed tab re-renders at the same size: the estimate holds.
    expect(framer.frame('yuna-ffx2', base1280, f, 1280, 960, null).box).toBe(est.box);
    // Back on the member: the real chrome is measured and the move is flagged to glide.
    const real: Rect[] = [{ left: 40, right: 700, top: 280, bottom: 560 }];
    const back = framer.frame('yuna-ffx2', base1280, f, 1280, 960, real);
    expect(back.settled).toBe(sameOrNot(est.box, back.box));
    expect(framer.frame('yuna-ffx2', base1280, f, 1280, 960, real).settled).toBe(false);
  });

  it('estimates the chrome between plain stretching and pixel-pinned boxes (the columns have pixel floors)', () => {
    const b: Rect[] = [
      { left: 64, right: 382, top: 297, bottom: 519 },
      { left: 1394, right: 1536, top: 826, bottom: 848 },
    ];
    const est = estimateBlocks(b, 1600, 900, 1280, 960);
    const stretched = scaleBlocks(b, 1600, 900, 1280, 960);
    // Left column: pinned to the left edge, between 64..382 px and the stretched box.
    expect(est[0]!.left).toBeGreaterThan(stretched[0]!.left);
    expect(est[0]!.left).toBeLessThan(64);
    expect(est[0]!.right).toBeGreaterThan(stretched[0]!.right);
    expect(est[0]!.right).toBeLessThan(382);
    // The right-hand prompt: pinned to the right edge (1536 - 320 px), or stretched.
    expect(est[1]!.right).toBeLessThan(stretched[1]!.right);
    expect(est[1]!.right).toBeGreaterThan(1536 - 320);
    expect(est[0]!.top).toBeCloseTo(stretched[0]!.top, 6);
  });

  it('falls back to the approved framing when the plate has never had member chrome', () => {
    const framer = new FaceFramer();
    const base = framePlate(f, 1280, 960);
    expect(framer.frame('yuna-ffx2', base, f, 1280, 960, null).box).toBe(base);
  });
});

function sameOrNot(a: { left: number; width: number }, b: { left: number; width: number }): boolean {
  return Math.abs(a.left - b.left) >= 0.5 || Math.abs(a.width - b.width) >= 0.5;
}
