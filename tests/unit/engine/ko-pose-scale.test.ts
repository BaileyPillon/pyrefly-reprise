import { describe, expect, it } from 'vitest';
import { KO_POSE_SCALE, poseScaleFor } from '../../../src/engine/KoPoseScale.ts';
import { computePoseScale } from '../../../src/engine/PaintedScale.ts';

/**
 * VP-1001-05 (both games): KO paintings rendered at the idle's pixel scale came
 * out at the wrong size (Yuna FFX ~1.8x, Rikku Black Mage ~0.6x). The src-side
 * table replaces the pose scale for the listed `ko` paintings only.
 */
describe('poseScaleFor', () => {
  it('replaces the scale of a listed ko painting', () => {
    expect(poseScaleFor('/art/characters/yuna/ko.png', undefined)).toBe(KO_POSE_SCALE['yuna']);
    expect(poseScaleFor('/pyrefly-reprise/art/characters/rikku-black-mage/ko.png', 0.75)).toBe(1.15);
    expect(poseScaleFor('/art/characters/yuna/ko.png?v=2', undefined)).toBe(KO_POSE_SCALE['yuna']);
  });

  it('leaves every other pose and subject on its sidecar value', () => {
    expect(poseScaleFor('/art/characters/yuna/idle.png', undefined)).toBeUndefined();
    expect(poseScaleFor('/art/characters/yuna/hurt.png', 1.1)).toBe(1.1);
    expect(poseScaleFor('/art/characters/tidus/ko.png', undefined)).toBeUndefined();
    expect(poseScaleFor('/art/characters/paine-black-mage/ko.png', 0.82)).toBe(0.82);
    expect(poseScaleFor('/art/backdrops/ko.png', 0.5)).toBe(0.5);
  });

  it('every entry is a sane head-match factor', () => {
    for (const [subject, s] of Object.entries(KO_POSE_SCALE)) {
      expect(s, subject).toBeGreaterThan(0.3);
      expect(s, subject).toBeLessThan(1.6);
    }
  });

  it('Yuna White Mage (FFX-2 only) is not listed: her D-341 re-roll KO is a body-length match drawn at its sidecar scale', () => {
    // Release 38's art install replaced the close-up KO that the old 0.64 entry corrected; the new painting is 1,070 px long
    // against a 1,151 px idle (0.93), so any entry here would shrink it. The sidecar has no scale: undefined, i.e. 1.0.
    expect(KO_POSE_SCALE['yuna-white-mage']).toBeUndefined();
    expect(poseScaleFor('/art/characters/yuna-white-mage/ko.png', undefined)).toBeUndefined();
    expect(poseScaleFor('/art/characters/yuna-white-mage/ko.png', 0.9)).toBe(0.9);
    // the other FFX-2 entries are untouched
    expect(poseScaleFor('/art/characters/yuna-gunner/ko.png', undefined)).toBe(KO_POSE_SCALE['yuna-gunner']);
    expect(poseScaleFor('/art/characters/yuna-black-mage/ko.png', undefined)).toBe(KO_POSE_SCALE['yuna-black-mage']);
  });
});

describe('a downed FFX Yuna is drawn at her standing scale', () => {
  // Real sidecar sizes: public/art/characters/yuna/{idle,ko}.json.
  const idle = { width: 803, height: 1075, baselineY: 1060 };
  const koRaw = { width: 1216, height: 816, baselineY: 805 };

  it('shrinks the KO plane by the table factor, nothing else', () => {
    const before = computePoseScale(koRaw, { worldHeight: 1.75, reference: idle });
    const scale = poseScaleFor('/art/characters/yuna/ko.png', undefined);
    const after = computePoseScale({ ...koRaw, ...(scale ? { scale } : {}) }, { worldHeight: 1.75, reference: idle });
    expect(after.unitsPerPixel / before.unitsPerPixel).toBeCloseTo(KO_POSE_SCALE['yuna']!, 5);
    // Not clamped by the min-extent net: the body still lies its full painted length.
    expect(after.clamped).toBe(false);
    expect(after.prone).toBe(true);
  });
});
