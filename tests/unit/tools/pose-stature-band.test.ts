/**
 * **A margin for one pose** (PR-0531; pc-residues lane; FFX-2 only: Yuna White Mage's cast and Rikku Thief's hurt). The sizing rule holds a pose at the edge of the 0.90 to 1.10 stature band when its
 * head and height disagree; the head lock and the lens then move a figure 1 to 3 percent on the screen and the pose leaves the band (round 30: Yuna White Mage's cast read 1.1166 and 1.1155 over the
 * idle in two chapters, Rikku Thief's hurt 0.879 to 0.885 in nine swaps). `overrides.json` `statureBand` gives that one pose a narrower band, carried on its record with its reason; the table follows.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POSE_REGISTRATION_FFX2 } from '../../../src/data/art/poseRegistrationFfx2.ts';
import { ruleSize } from '../../../tools/posescale/pose-rule.mjs';
import { ROOT } from './pose-gate-fixtures.ts';

const records = JSON.parse(readFileSync(join(ROOT, 'docs', 'target', 'pose-measure.json'), 'utf8')) as { subjects: Record<string, { poses: Record<string, { statureBand?: { floor?: number; ceiling?: number; why: string }; scale: number; stature: number }> }> };
const overrides = JSON.parse(readFileSync(join(ROOT, 'tools', 'posescale', 'overrides.json'), 'utf8')) as Record<string, Record<string, { statureBand?: { floor?: number; ceiling?: number; why: string } }>>;

describe('the rule with a ceiling or a floor of its own', () => {
  it('holds a pose at its own ceiling instead of 1.10 (Yuna White Mage cast: head 1.25, height 1.01499)', () => {
    const plain = ruleSize({ head: 1.25, height: 1.01499, floor: 0.9 });
    expect(plain.scale).toBe(1.116);
    expect(plain.stature).toBeCloseTo(1.0995, 3);
    const margin = ruleSize({ head: 1.25, height: 1.01499, floor: 0.9, ceiling: 1.07 });
    expect(margin.scale).toBe(1.086);
    expect(margin.lift).toBe('ceiling');
    expect(margin.stature).toBeLessThanOrEqual(1.07);
    expect(margin.headRatio).toBeCloseTo(0.869, 3); // the head pays 2.4 percent more, inside the hold range 0.80 to 1.45
  });

  it('lifts a pose to its own floor instead of 0.90 (Rikku Thief hurt: head 1.15, height 1.46891)', () => {
    const plain = ruleSize({ head: 1.15, height: 1.46891, floor: 0.9 });
    expect(plain.scale).toBe(1.323);
    const margin = ruleSize({ head: 1.15, height: 1.46891, floor: 0.93 });
    expect(margin.scale).toBe(1.367);
    expect(margin.lift).toBe('floor');
    expect(margin.stature).toBeGreaterThanOrEqual(0.93);
    expect(margin.headRatio).toBeCloseTo(1.189, 3);
  });
});

describe('the two poses, in the override, the record and the table', () => {
  it('each override has a reason and only the two named poses have one', () => {
    const named: string[] = [];
    for (const [subject, poses] of Object.entries(overrides)) for (const [pose, o] of Object.entries(poses)) if (o.statureBand) { named.push(`${subject}/${pose}`); expect(o.statureBand.why.length).toBeGreaterThan(40); }
    expect(named.sort()).toEqual(['rikku-thief/hurt', 'yuna-white-mage/cast']);
  });

  it('the records carry the band and the table draws the margin: the same scale and stature, no re-derivation by hand', () => {
    const cast = records.subjects['yuna-white-mage']!.poses['cast']!;
    expect(cast.statureBand).toEqual(overrides['yuna-white-mage']!['cast']!.statureBand);
    expect(cast.scale).toBe(1.086);
    expect(POSE_REGISTRATION_FFX2['yuna-white-mage']!['cast']!.scale).toBe(1.086);
    expect(POSE_REGISTRATION_FFX2['yuna-white-mage']!['cast']!.stature).toBeLessThanOrEqual(1.075);
    const hurt = records.subjects['rikku-thief']!.poses['hurt']!;
    expect(hurt.statureBand).toEqual(overrides['rikku-thief']!['hurt']!.statureBand);
    expect(POSE_REGISTRATION_FFX2['rikku-thief']!['hurt']!.scale).toBe(1.367);
    expect(POSE_REGISTRATION_FFX2['rikku-thief']!['hurt']!.stature).toBeGreaterThanOrEqual(0.93);
  });

  it('no other pose of those two figures, and no other dress, moved', () => {
    expect(POSE_REGISTRATION_FFX2['yuna-white-mage']!['hurt']!.scale).toBe(1.601);
    expect(POSE_REGISTRATION_FFX2['rikku-thief']!['cast']!.scale).toBe(1.323);
    expect(POSE_REGISTRATION_FFX2['rikku-white-mage']!['cast']!.scale).toBe(1.105);
    expect(POSE_REGISTRATION_FFX2['yuna-dark-knight']!['cast']!.scale).toBe(1.08);
  });
});
