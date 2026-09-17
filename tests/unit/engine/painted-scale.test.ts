import { describe, expect, it } from 'vitest';

import {
  computePoseScale,
  contactBandFor,
  type PoseFrame,
} from '../../../src/engine/PaintedScale.ts';

/**
 * Real sidecar numbers from `public/art/characters/tidus/*.json`, as they stood
 * when the defect was filed. The art fleet re-renders these constantly, so they
 * are copied in rather than read from disk — what matters is the *shapes*: idle
 * and hurt are portrait renders, `ko` is a landscape one, and the old "every
 * pose is `worldHeight` tall" rule blew the KO plane up past 2.6 units wide.
 */
const TIDUS = {
  idle: { width: 709, height: 1056, baselineY: 1040 },
  hurt: { width: 617, height: 1129, baselineY: 1113 },
  ko: { width: 1216, height: 823, baselineY: 813 },
  victory: { width: 605, height: 1181, baselineY: 1165 },
} satisfies Record<string, PoseFrame>;

const H = 1.75;

describe('computePoseScale', () => {
  it('sizes the reference pose to exactly the standing height', () => {
    const s = computePoseScale(TIDUS.idle, { worldHeight: H, reference: TIDUS.idle });
    // baselineY -> the group origin, so the painted figure is H tall.
    expect(s.unitsPerPixel).toBeCloseTo(H / TIDUS.idle.baselineY, 10);
    expect(s.height - (TIDUS.idle.height - TIDUS.idle.baselineY) * s.unitsPerPixel).toBeCloseTo(
      H,
      6,
    );
    expect(s.prone).toBe(false);
  });

  it('gives every pose of a subject the same pixels-per-world-unit', () => {
    const idle = computePoseScale(TIDUS.idle, { worldHeight: H, reference: TIDUS.idle });
    for (const pose of [TIDUS.hurt, TIDUS.ko, TIDUS.victory]) {
      const s = computePoseScale(pose, { worldHeight: H, reference: TIDUS.idle });
      expect(s.unitsPerPixel).toBeCloseTo(idle.unitsPerPixel, 10);
    }
  });

  it('makes a landscape KO render wide and low instead of enormous', () => {
    const s = computePoseScale(TIDUS.ko, { worldHeight: H, reference: TIDUS.idle });
    expect(s.prone).toBe(true);
    // Body length ~2.0 world units, height ~1.4 — a person lying down, not a
    // figure at twice scale.
    expect(s.width).toBeCloseTo(2.046, 2);
    expect(s.height).toBeCloseTo(1.385, 2);
    expect(s.clamped).toBe(false);

    // The defect, for the record: sized against itself the same PNG is 2.6 wide
    // and a full standing height tall.
    const old = computePoseScale(TIDUS.ko, { worldHeight: H });
    expect(old.width).toBeGreaterThan(2.6);
    expect(old.width / s.width).toBeGreaterThan(1.25);
  });

  it('keeps a portrait hurt pose at its own scale, upright', () => {
    const s = computePoseScale(TIDUS.hurt, { worldHeight: H, reference: TIDUS.idle });
    expect(s.prone).toBe(false);
    // Within a few percent of the standing figure — not stretched, not shrunk.
    expect(s.height).toBeGreaterThan(H * 0.95);
    expect(s.height).toBeLessThan(H * 1.15);
    expect(s.width).toBeCloseTo((617 / 709) * ((709 * H) / 1040), 4);
  });

  it('anchors a pose at its baseline: the anchor row sits on the origin', () => {
    for (const pose of [TIDUS.idle, TIDUS.ko] as PoseFrame[]) {
      const s = computePoseScale(pose, { worldHeight: H, reference: TIDUS.idle });
      // Plane centre + half height - (pixels below the anchor) == 0.
      const anchorWorldY = s.offsetY + s.height / 2 - s.anchorY * s.unitsPerPixel;
      expect(anchorWorldY).toBeCloseTo(0, 10);
      // Nothing painted below the anchor may hang more than the PNG's own
      // padding under the ground plane.
      expect(s.offsetY - s.height / 2).toBeCloseTo(
        -(pose.height - pose.baselineY) * s.unitsPerPixel,
        10,
      );
    }
  });

  it('reads the sidecar `scale` override', () => {
    const plain = computePoseScale(TIDUS.ko, { worldHeight: H, reference: TIDUS.idle });
    const shrunk = computePoseScale(
      { ...TIDUS.ko, scale: 0.8 },
      { worldHeight: H, reference: TIDUS.idle },
    );
    expect(shrunk.width).toBeCloseTo(plain.width * 0.8, 10);
    expect(shrunk.height).toBeCloseTo(plain.height * 0.8, 10);

    // On the reference itself the factor applies exactly once.
    const ref: PoseFrame = { ...TIDUS.idle, scale: 1.2 };
    const self = computePoseScale(ref, { worldHeight: H, reference: ref });
    expect(self.unitsPerPixel).toBeCloseTo((H / TIDUS.idle.baselineY) * 1.2, 10);
    // ...and calibrates the rest of the subject once, too.
    const ko = computePoseScale(TIDUS.ko, { worldHeight: H, reference: ref });
    expect(ko.unitsPerPixel).toBeCloseTo(self.unitsPerPixel, 10);
  });

  it('reads the sidecar `anchorY` override as pixels or as a fraction', () => {
    const px = computePoseScale(
      { ...TIDUS.ko, anchorY: 700 },
      { worldHeight: H, reference: TIDUS.idle },
    );
    expect(px.anchorY).toBe(700);

    const frac = computePoseScale(
      { ...TIDUS.ko, anchorY: 700 / TIDUS.ko.height },
      { worldHeight: H, reference: TIDUS.idle },
    );
    expect(frac.anchorY).toBeCloseTo(700, 6);
    expect(frac.offsetY).toBeCloseTo(px.offsetY, 6);

    // An override past the bottom of the image clamps instead of flying off.
    const over = computePoseScale(
      { ...TIDUS.ko, anchorY: 99_999 },
      { worldHeight: H, reference: TIDUS.idle },
    );
    expect(over.anchorY).toBe(TIDUS.ko.height);
  });

  it('clamps a render that came back at a wildly different pixel scale', () => {
    // A close-crop portrait at four times the subject's pixel scale.
    const huge = computePoseScale(
      { width: 3000, height: 4000, baselineY: 3960 },
      { worldHeight: H, reference: TIDUS.idle },
    );
    expect(huge.clamped).toBe(true);
    expect(Math.max(huge.width, huge.height)).toBeCloseTo(2.2 * H, 6);

    const tiny = computePoseScale(
      { width: 90, height: 120, baselineY: 118 },
      { worldHeight: H, reference: TIDUS.idle },
    );
    expect(tiny.clamped).toBe(true);
    expect(Math.max(tiny.width, tiny.height)).toBeCloseTo(0.35 * H, 6);
  });

  it('gives a prone pose a footprint wide enough to shadow the whole body', () => {
    const idle = computePoseScale(TIDUS.idle, { worldHeight: H, reference: TIDUS.idle });
    const ko = computePoseScale(TIDUS.ko, { worldHeight: H, reference: TIDUS.idle });
    expect(ko.footprint).toBeGreaterThan(idle.footprint * 2);
    expect(ko.footprint).toBeCloseTo(ko.width * 0.44, 10);
  });

  it('falls back to sizing a pose against itself with no reference', () => {
    const s = computePoseScale(TIDUS.victory, { worldHeight: H });
    expect(s.height - (TIDUS.victory.height - TIDUS.victory.baselineY) * s.unitsPerPixel).toBeCloseTo(
      H,
      6,
    );
  });

  it('survives garbage metadata', () => {
    const s = computePoseScale(
      { width: 0, height: Number.NaN, baselineY: -5 },
      { worldHeight: H, reference: TIDUS.idle },
    );
    expect(Number.isFinite(s.width)).toBe(true);
    expect(Number.isFinite(s.height)).toBe(true);
    expect(Number.isFinite(s.offsetY)).toBe(true);
    expect(s.width).toBeGreaterThan(0);
  });
});

describe('contactBandFor', () => {
  it('is a fixed world distance, so a short plane gets a short ramp', () => {
    const standing = contactBandFor(1.78);
    const prone = contactBandFor(1.38);
    expect(standing * 1.78).toBeCloseTo(prone * 1.38, 10);
    expect(prone).toBeGreaterThan(standing);
  });

  it('clamps at both ends and tolerates a degenerate height', () => {
    expect(contactBandFor(40)).toBeCloseTo(0.02, 10);
    expect(contactBandFor(0.05)).toBeCloseTo(0.2, 10);
    expect(contactBandFor(0)).toBeCloseTo(0.1, 10);
    expect(contactBandFor(Number.NaN)).toBeCloseTo(0.1, 10);
  });
});
