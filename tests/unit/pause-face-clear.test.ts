/**
 * PR-0079 (both games): the pause frames each member's face clear of the
 * chrome the screen actually drew, by panning and scaling the painting the way
 * approved frame (c) does. `docs/plans/pr-0079-method-check.md`.
 */
import { describe, expect, it } from 'vitest';
import { clearFace, FACE_BOXES, faceInFrame, faceOverlap, faceRectOn, type Rect } from '../../src/app/screens/pause/faceClear.ts';
import { framePlate, PLATE_FRAMING } from '../../src/app/screens/pause/plates.ts';

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
