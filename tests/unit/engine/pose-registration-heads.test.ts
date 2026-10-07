/**
 * **The head boxes of the generated registration tables** (D-510, Bailey's pick of 2026-10-06; lane r394-headlock; both games).
 * `tools/posescale/measure.py table` writes a pose's head box into its row as fractions of the painting, from the record's own `head` and `size`
 * (no new measuring); `src/engine/HeadLock.ts` holds it to the idle's size on screen. Held here: every box is a real one, it is the record's, a
 * figure that registers any head registers its idle's (the reference the others are held to), and the experimental chapter's generated rows carry none.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { setShippedArt } from '../../../src/engine/ArtShipped.ts';
import { POSE_REGISTRATION, poseRegistrationFor, subjectOfPainting } from '../../../src/engine/PoseRegistration.ts';
import { POSE_REGISTRATION_EXP } from '../../../src/data/art/poseRegistrationExp.ts';
import { POSE_REGISTRATION_FFX } from '../../../src/data/art/poseRegistrationFfx.ts';
import { POSE_REGISTRATION_FFX2 } from '../../../src/data/art/poseRegistrationFfx2.ts';
import { POSE_REGISTRATION_FOES } from '../../../src/data/art/poseRegistrationFoes.ts';

interface Rec {
  head?: [number, number, number, number];
  size?: [number, number];
  skip?: unknown;
}
const record = JSON.parse(readFileSync(resolve(__dirname, '..', '..', '..', 'docs', 'target', 'pose-measure.json'), 'utf8')) as { subjects: Record<string, { poses: Record<string, Rec> }> };

const rows = Object.entries(POSE_REGISTRATION).flatMap(([subject, poses]) => Object.entries(poses).map(([pose, row]) => ({ subject, pose, row })));
const withHead = rows.filter((r) => r.row.head);

describe('the head boxes in the generated tables', () => {
  it('are there for the figures that have a face box: the FFX party and Evrae, the FFX-2 girls in every dressphere, Yunalesca\'s first form', () => {
    expect(withHead.length).toBeGreaterThanOrEqual(310);
    expect(Object.keys(POSE_REGISTRATION_FFX).filter((s) => rows.some((r) => r.subject === s && r.row.head)).sort()).toEqual(['auron', 'evrae', 'kimahri', 'lulu', 'rikku', 'tidus', 'wakka', 'yuna']);
    expect(Object.keys(POSE_REGISTRATION_FFX2).every((s) => rows.some((r) => r.subject === s && r.row.head))).toBe(true);
    expect(Object.keys(POSE_REGISTRATION_FOES).filter((s) => rows.some((r) => r.subject === s && r.row.head))).toEqual(['yunalesca-1']);
  });

  it('are real boxes inside the painting: four fractions that trace a box a twentieth of the painting or more across, never the 1 px stand-in of a foe with no face box', () => {
    for (const { subject, pose, row } of withHead) {
      const [u0, t0, u1, t1] = row.head!;
      const where = `${subject}/${pose}`;
      for (const v of [u0, t0, u1, t1]) expect(Number.isFinite(v), where).toBe(true);
      expect(u0, where).toBeGreaterThanOrEqual(0);
      expect(t0, where).toBeGreaterThanOrEqual(0);
      expect(u1, where).toBeLessThanOrEqual(1);
      expect(t1, where).toBeLessThanOrEqual(1);
      expect(u1 - u0, where).toBeGreaterThan(0);
      expect(t1 - t0, where).toBeGreaterThan(0);
      expect(Math.sqrt((u1 - u0) * (t1 - t0)), where).toBeGreaterThan(0.04);
    }
  });

  it('are the record\'s own: its head box over its painting\'s size to four decimals, and no row carries a box the record does not have', () => {
    for (const { subject, pose, row } of rows) {
      const rec = record.subjects[subject]?.poses[pose];
      if (!row.head) continue;
      const where = `${subject}/${pose}`;
      expect(rec?.head && rec.size, `${where} has a head in the record`).toBeTruthy();
      const [x0, y0, x1, y1] = rec!.head!;
      const [w, h] = rec!.size!;
      const want = [x0 / w, y0 / h, x1 / w, y1 / h];
      row.head.forEach((v, i) => expect(Math.abs(v - want[i]!), `${where} [${i}]`).toBeLessThan(6e-5));
    }
    // and the other way: every pose of a figure with a real face box that the record gives a head has one in the table
    let checked = 0;
    for (const [subject, sub] of Object.entries(record.subjects)) {
      if (!rows.some((r) => r.subject === subject && r.row.head)) continue;
      for (const [pose, rec] of Object.entries(sub.poses)) {
        if (rec.skip || !rec.head) continue;
        expect(POSE_REGISTRATION[subject]?.[pose]?.head, `${subject}/${pose}`).toBeDefined();
        checked++;
      }
    }
    expect(checked).toBe(withHead.length);
  });

  it('come with the idle\'s: a figure that registers any head registers the head every other pose is held to', () => {
    const subjects = new Set(withHead.map((r) => r.subject));
    expect(subjects.size).toBeGreaterThanOrEqual(36);
    for (const subject of subjects) expect(POSE_REGISTRATION[subject]?.['idle']?.head, subject).toBeDefined();
  });

  it('are found by a painting\'s address, under a base path, with a query and as the .webp the build ships', () => {
    const ko = POSE_REGISTRATION_FFX['yuna']!['ko']!.head!;
    expect(poseRegistrationFor('/art/characters/yuna/ko.png')?.head).toEqual(ko);
    expect(poseRegistrationFor('/pyrefly-reprise/art/characters/yuna/ko.png?v=3')?.head).toEqual(ko);
    setShippedArt(['art/characters/yuna/ko.png']); // a production build: the painting is asked for, and held by the plane, as `ko.webp`
    try {
      expect(poseRegistrationFor('/pyrefly-reprise/art/characters/yuna/ko.webp?v=3')?.head).toEqual(ko);
      expect(subjectOfPainting('/pyrefly-reprise/art/characters/yuna/ko.webp?v=3')).toBe('yuna');
    } finally {
      setShippedArt(undefined);
    }
    expect(poseRegistrationFor('/art/characters/mortiorchis/ko.png')?.head).toBeUndefined();
  });

  it('name the subject of a painting, so the lock only compares planes of one figure', () => {
    expect(subjectOfPainting('/art/characters/yuna-gunner/ko.png')).toBe('yuna-gunner');
    expect(subjectOfPainting('/base/art/characters/exp-leblanc-yuna/ko.png?x=1')).toBe('exp-leblanc-yuna');
    expect(subjectOfPainting('/art/backdrops/ko.png')).toBeNull();
  });
});

describe('the experimental Leblanc chapter\'s rows', () => {
  it('carry no head box: the hidden chapter is not head-locked (tools/exp-art-table.mjs keeps four keys; a decision to lock it flips this, with its regeneration)', () => {
    const exp = Object.entries(POSE_REGISTRATION_EXP).flatMap(([subject, poses]) => Object.entries(poses).map(([pose, row]) => ({ subject, pose, row })));
    expect(exp.length).toBeGreaterThan(100);
    expect(exp.filter((r) => r.row.head)).toEqual([]);
  });
});
