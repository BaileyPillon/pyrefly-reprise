import { describe, expect, it } from 'vitest';
import { POSE_REGISTRATION, poseRegistrationFor, stanceOffset, stanceShift, type PoseRegistrationTable } from '../../../src/engine/PoseRegistration.ts';
import { computePoseScale, type PoseFrame } from '../../../src/engine/PaintedScale.ts';

/**
 * Release 39 pose registration (both games): one head size and one stance for a figure in every pose.
 * `tools/posescale/measure.py` measures and `docs/target/pose-measure.json` records; this is the engine's half.
 */

const TABLE: PoseRegistrationTable = {
  tidus: { victory: { scale: 1.6, stanceX: 310 }, ko: { scale: 0.85 }, follow: { scale: 1.34, stanceX: 320, upright: true } },
  'yuna-gunner': { cast: { scale: 1.07, stanceX: 200, feetRow: 1120 } },
};

describe('poseRegistrationFor', () => {
  it('finds a measured painting behind any base path, with a query, and as the .webp the build ships', () => {
    expect(poseRegistrationFor('/art/characters/tidus/victory.png', TABLE)).toEqual({ scale: 1.6, stanceX: 310 });
    expect(poseRegistrationFor('/pyrefly-reprise/art/characters/tidus/victory.png?v=3', TABLE)?.scale).toBe(1.6);
    expect(poseRegistrationFor('/art/characters/yuna-gunner/cast.png', TABLE)?.feetRow).toBe(1120);
  });

  it('says nothing about a painting it has not measured', () => {
    expect(poseRegistrationFor('/art/characters/tidus/idle.png', TABLE)).toBeUndefined();
    expect(poseRegistrationFor('/art/characters/auron/victory.png', TABLE)).toBeUndefined();
    expect(poseRegistrationFor('/art/backdrops/victory.png', TABLE)).toBeUndefined();
    expect(poseRegistrationFor('/art/characters/tidus/victory.json', TABLE)).toBeUndefined();
  });
});

describe('stanceShift', () => {
  const idle = { stanceX: 413, width: 730, unitsPerPixel: 0.0016, mirror: 1 as const };

  it('never moves the reference, and moves nothing when a stance is unknown', () => {
    expect(stanceShift(idle, idle)).toBe(0);
    expect(stanceShift(null, idle)).toBe(0);
    expect(stanceShift(idle, null)).toBe(0);
  });

  it('puts the pose\'s stance where the idle\'s is, in world units, whatever the pose\'s own size and width', () => {
    // A pose 461 px wide whose feet are at x 310 and which is drawn 1.6x the idle's pixel size.
    const pose = { stanceX: 310, width: 461, unitsPerPixel: 0.0016 * 1.6, mirror: 1 as const };
    const shift = stanceShift(pose, idle);
    // The plane is centred on the actor; after the shift the stance is at the idle's offset from the actor.
    expect(stanceOffset(pose) + shift).toBeCloseTo(stanceOffset(idle), 12);
    expect(stanceOffset(idle)).toBeCloseTo((413 - 365) * 0.0016, 12);
  });

  it('follows the mirror: a plane drawn flipped puts the same painted point on the other side of the actor', () => {
    const flipped = { stanceX: 200, width: 600, unitsPerPixel: 0.0016, mirror: -1 as const };
    const plain = { ...flipped, mirror: 1 as const };
    expect(stanceOffset(flipped)).toBeCloseTo(-stanceOffset(plain), 12);
    expect(stanceOffset(flipped) + stanceShift(flipped, idle)).toBeCloseTo(stanceOffset(idle), 12);
  });

  it('a plane whose feet are at its own middle stays where it is when the idle\'s are too', () => {
    const centred = { stanceX: 300, width: 600, unitsPerPixel: 0.002, mirror: 1 as const };
    const same = { stanceX: 500, width: 1000, unitsPerPixel: 0.001, mirror: 1 as const };
    expect(stanceShift(same, centred)).toBeCloseTo(0, 12);
  });
});

describe('a standing pose wider than tall is not laid down like a KO', () => {
  const idle: PoseFrame = { width: 795, height: 1124, baselineY: 1116 };
  const lunge: PoseFrame = { width: 795, height: 686, baselineY: 670, scale: 1.4 }; // aspect 1.159: over the 1.15 line
  const opts = { worldHeight: 1.82, reference: idle };

  it('is prone by its aspect when nothing says otherwise (the defect)', () => {
    expect(computePoseScale(lunge, opts).prone).toBe(true);
  });

  it('is upright when the measured table marks it', () => {
    const s = computePoseScale({ ...lunge, upright: true }, opts);
    expect(s.prone).toBe(false);
    expect(s.footprint).toBeCloseTo(s.width * 0.3, 10);
  });

  it('a KO is still laid down, marked or not (the table never marks one)', () => {
    const ko: PoseFrame = { width: 1164, height: 480, baselineY: 464 };
    expect(computePoseScale(ko, opts).prone).toBe(true);
  });
});

describe('the generated tables', () => {
  const rows = Object.entries(POSE_REGISTRATION).flatMap(([subject, poses]) => Object.entries(poses).map(([pose, row]) => ({ subject, pose, row })));

  it('every scale is a sane head-match factor', () => {
    for (const { subject, pose, row } of rows) {
      if (row.scale === undefined) continue;
      expect(row.scale, `${subject}/${pose}`).toBeGreaterThan(0.25);
      expect(row.scale, `${subject}/${pose}`).toBeLessThan(3.6);
    }
  });

  it('no KO is marked upright, and a stance is a positive pixel', () => {
    for (const { subject, pose, row } of rows) {
      if (pose === 'ko') expect(row.upright, `${subject}/${pose}`).toBeUndefined();
      if (row.stanceX !== undefined) expect(row.stanceX, `${subject}/${pose}`).toBeGreaterThan(0);
      if (row.feetRow !== undefined) expect(row.feetRow, `${subject}/${pose}`).toBeGreaterThan(0);
    }
  });
});
