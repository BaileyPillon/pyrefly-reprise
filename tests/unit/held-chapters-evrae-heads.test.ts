/**
 * **Evrae's near-range heads are registered where the paintings draw them** (held-chapters lane, 2026-10-29; FFX only: Chapter VIII's Evrae and Sin's Fins draw their own sets).
 *
 * Release 68 kept Evrae out of the wide swap scope because the continuity harness read a fixed 53 to 55 px head step on every `cast>idle` of his own (11 and 12 swap jerks against round 30's 2).
 * The registration was the cause of half of it: the record carried TWO head boxes for ONE painting (`idle` and `idle-near` are the same file, sha f4d167f4...: [10, 55, 150, 165] and [10, 105, 150, 215]),
 * `breath-charge` (the same face in the same place) a third, and `hurt` a box 46 painting px left of where the face is. The harness reads a head from the registered box, so a swap between two paintings
 * that draw the head in one place read as a head that moves. The boxes below were re-read against the paintings (`D:/Tools/pyrefly-scratch/2026-10-29/held-chapters/img/evrae-boxes.png`): the face of the
 * idle is the idle-near row's own box, so the two rows of one painting now agree, and so does every other painting in the record.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POSE_REGISTRATION_FFX } from '../../src/data/art/poseRegistrationFfx.ts';

interface Rec { head?: number[]; anchor?: number[]; baseline?: number; sha?: string; size?: number[]; scale?: number }
const record = JSON.parse(readFileSync(resolve(__dirname, '..', '..', 'docs', 'target', 'pose-measure.json'), 'utf8')) as { subjects: Record<string, { idleHead?: number[]; poses: Record<string, Rec> }> };
const evrae = record.subjects['evrae']!;

describe('one painting, one head box', () => {
  it('every subject in the record gives the rows that draw the same painting (same sha) the same head box', () => {
    const clashes: string[] = [];
    for (const [subject, sub] of Object.entries(record.subjects)) {
      const by = new Map<string, [string, Rec][]>();
      for (const [pose, rec] of Object.entries(sub.poses)) if (rec.sha && rec.head) by.set(rec.sha, [...(by.get(rec.sha) ?? []), [pose, rec]]);
      for (const list of by.values()) {
        const first = list[0]!;
        for (const [pose, rec] of list.slice(1)) if (JSON.stringify(rec.head) !== JSON.stringify(first[1].head)) clashes.push(`${subject}: ${first[0]} ${JSON.stringify(first[1].head)} against ${pose} ${JSON.stringify(rec.head)}`);
      }
    }
    expect(clashes).toEqual([]);
  });
});

describe("Evrae's near-range heads", () => {
  it('the idle, idle-near and breath-charge draw one face in one place: one box, centred at (80, 160) on a 1136 x 784 painting standing on row 768', () => {
    for (const pose of ['idle', 'idle-near', 'breath-charge']) {
      const rec = evrae.poses[pose]!;
      expect(rec.head, pose).toEqual([10, 105, 150, 215]);
      expect(rec.baseline, pose).toBe(768);
    }
    expect(evrae.idleHead).toEqual([10, 105, 150, 215]);
    expect(evrae.poses['idle']!.anchor).toEqual([80, 160]);
    expect(evrae.poses['breath-charge']!.anchor).toEqual([80, 160]);
  });

  it('hurt: the box sits over the face (centre 125, 150), not over the nose (80, 165); it keeps the size the record gave it (the idle box over the 0.965 scale)', () => {
    const hurt = evrae.poses['hurt']!;
    expect(hurt.anchor).toEqual([125, 150]);
    expect(hurt.head).toEqual([52.5, 93, 197.5, 207]);
    const [x0, y0, x1, y1] = hurt.head!;
    expect((x1! - x0!) * 0.965).toBeCloseTo(140, 0);
    expect((y1! - y0!) * 0.965).toBeCloseTo(110, 0);
  });

  it("the heads' height above the soles is what the paintings draw: level for the idle and breath-charge, 86 painting px lower for the attack, 100 higher for the hurt (the head rears when he is hit)", () => {
    const above = (pose: string): number => evrae.poses[pose]!.baseline! - evrae.poses[pose]!.anchor![1]!;
    expect(above('idle')).toBe(above('breath-charge'));
    expect(above('idle') - above('attack')).toBe(86);
    expect(above('hurt') - above('idle')).toBe(100);
  });

  it('the generated table carries the same boxes as fractions of each painting (idle-near was already right)', () => {
    const t = POSE_REGISTRATION_FFX['evrae']!;
    expect(t['idle']!.head).toEqual(t['idle-near']!.head);
    expect(t['breath-charge']!.head).toEqual(t['idle-near']!.head);
    expect(t['hurt']!.head).toEqual([0.0462, 0.1064, 0.1739, 0.2368]);
  });
});
