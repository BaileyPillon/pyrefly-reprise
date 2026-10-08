import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { POSE_REGISTRATION } from '../../../src/engine/PoseRegistration.ts';
import { checkPoseScale, TOLERANCE } from '../../../tools/pose-scale-check.mjs';

/**
 * Release 39 pose registration (both games): a figure's head is one size and its feet one place in every pose.
 * The check (`node tools/pose-scale-check.mjs`) is what the art lane runs on new keys; this runs it from the suite.
 */

const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');
const tmp = mkdtempSync(join(tmpdir(), 'pose-scale-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function paint(subject: string, pose: string, bytes: string): string {
  const dir = join(tmp, 'characters', subject);
  mkdirSync(dir, { recursive: true });
  const b = Buffer.from(bytes);
  writeFileSync(join(dir, `${pose}.png`), b);
  return sha(b);
}

describe('checkPoseScale (what the art lane runs on a new key)', () => {
  const idleSha = paint('hero', 'idle', 'idle-bytes');
  const readySha = paint('hero', 'ready', 'ready-bytes');
  const box = (cx: number, size: number): number[] => [cx - size / 2, 0, cx + size / 2, size];
  const records = (over: Record<string, unknown> = {}): { subjects: Record<string, unknown> } => ({
    subjects: {
      hero: {
        idleHead: box(100, 100),
        poses: {
          idle: { sha: idleSha, prone: false, standing: true, scaleSrc: 'reference', stance: { x: 100, row: 500 } },
          ready: { sha: readySha, prone: false, standing: true, scaleSrc: 'reviewed', scale: 1.25, head: box(100, 80), stance: { x: 80, row: 500 }, ...over },
        },
      },
    },
  });
  const table = { hero: { idle: { stanceX: 100 }, ready: { scale: 1.25, stanceX: 80 } } };

  it('passes a measured, reviewed, current subject', () => {
    const r = checkPoseScale({ records: records(), table, artDir: tmp, subjects: ['hero'] });
    expect(r.failures).toEqual([]);
  });

  it('fails a painting nobody measured (a new key)', () => {
    paint('hero', 'victory', 'new-key');
    const r = checkPoseScale({ records: records(), table, artDir: tmp, subjects: ['hero'] });
    expect(r.failures.join('\n')).toMatch(/hero\/victory: painted but never measured/);
    rmSync(join(tmp, 'characters', 'hero', 'victory.png'));
  });

  it('fails a painting that was re-rendered after it was measured', () => {
    const r = checkPoseScale({ records: records({ sha: 'not-the-file' }), table, artDir: tmp, subjects: ['hero'] });
    expect(r.failures.join('\n')).toMatch(/hero\/ready: the painting changed since it was measured/);
  });

  it('fails a table that is not the record (a hand edit, or measure.py table not run)', () => {
    const r = checkPoseScale({ records: records(), table: { hero: { idle: { stanceX: 100 }, ready: { scale: 1.4, stanceX: 80 } } }, artDir: tmp, subjects: ['hero'] });
    expect(r.failures.join('\n')).toMatch(/table's scale \(1\.4\) is not the record's \(1\.25\)/);
  });

  it('fails an applied scale whose head box is not the idle\'s size at it', () => {
    // the record's head box is 80 wide at scale 1.25: 100 at the idle's size. A box of 60 is x0.75 of it.
    const r = checkPoseScale({ records: records({ head: box(100, 60) }), table, artDir: tmp, subjects: ['hero'] });
    expect(r.failures.join('\n')).toMatch(/head at the scale the engine uses \(1\.25\) is x0\.750 of the idle's/);
    expect(TOLERANCE).toBe(0.08);
  });

  it('lets a reading inside the resolution stand without a table scale, and fails one outside it', () => {
    const own = { hero: { idle: { stanceX: 100 }, ready: { stanceX: 80 } } };
    const inside = records({ scaleSrc: 'noise', scale: 1.0, current: 1.0, reading: 1.06 });
    expect(checkPoseScale({ records: inside, table: own, artDir: tmp, subjects: ['hero'] }).failures).toEqual([]);
    const outside = records({ scaleSrc: 'noise', scale: 1.0, current: 1.0, reading: 1.3 });
    expect(checkPoseScale({ records: outside, table: own, artDir: tmp, subjects: ['hero'] }).failures.join('\n')).toMatch(/the reading \(1\.3\) is not within 8 percent/);
    // a table that carries a scale the record says it does not need
    expect(checkPoseScale({ records: inside, table, artDir: tmp, subjects: ['hero'] }).failures.join('\n')).toMatch(/keeps the pose's own scale but the table has one/);
  });

  it('gives a KO its reading over the lying plane projection (r391: a KO draws its head smaller than the same head standing)', () => {
    const koSha = paint('hero', 'ko', 'ko-bytes');
    const rec = records() as { subjects: Record<string, any>; koProjection?: number };
    rec.subjects.hero.poses.ko = { sha: koSha, prone: true, standing: false, scaleSrc: 'reviewed', scale: 0.5, head: box(100, 200), stance: null };
    rec.koProjection = 0.978;
    // the record reads 0.5 and the projection is 0.978: the table must say 0.5 / 0.978 = 0.511
    const good = { hero: { ...table.hero, ko: { scale: 0.511 } } };
    expect(checkPoseScale({ records: rec, table: good, artDir: tmp, subjects: ['hero'] }).failures).toEqual([]);
    const forgot = { hero: { ...table.hero, ko: { scale: 0.5 } } };
    const failed = checkPoseScale({ records: rec, table: forgot, artDir: tmp, subjects: ['hero'] }).failures.join(' | ');
    expect(failed).toContain("hero/ko: the table's scale (0.5) is not the record's (0.5 over the KO projection 0.978)");
    rmSync(join(tmp, 'characters', 'hero', 'ko.png'));
  });

  it('carries a camera allowance over the reading, with its reason, and fails a table that forgot it (r392)', () => {
    const why = 'the close victory camera draws a head that sits lower than the idle head smaller';
    const withAllow = records({ allow: { scale: 1.03, why } });
    // the reading is 1.25; the table says 1.25 x 1.03 = 1.288, and the head check still reads the reading's scale
    const good = { hero: { ...table.hero, ready: { scale: 1.288, stanceX: 80 } } };
    expect(checkPoseScale({ records: withAllow, table: good, artDir: tmp, subjects: ['hero'] }).failures).toEqual([]);
    const forgot = checkPoseScale({ records: withAllow, table, artDir: tmp, subjects: ['hero'] }).failures.join(' | ');
    expect(forgot).toContain("the table's scale (1.25) is not the record's (1.25 times its camera allowance 1.03)");
    // a pose that keeps its own scale (noise) gets a row of its own once it carries an allowance
    const noise = records({ scaleSrc: 'noise', scale: 1.0, current: 1.0, reading: 1.0, allow: { scale: 1.015, why }, head: box(100, 100) });
    const own = { hero: { idle: { stanceX: 100 }, ready: { scale: 1.015, stanceX: 80 } } };
    expect(checkPoseScale({ records: noise, table: own, artDir: tmp, subjects: ['hero'] }).failures).toEqual([]);
    // no reason, or a factor that is not a small one, is refused
    expect(checkPoseScale({ records: records({ allow: { scale: 1.03 } }), table: good, artDir: tmp, subjects: ['hero'] }).failures.join(' | ')).toMatch(/needs a reason/);
    expect(checkPoseScale({ records: records({ allow: { scale: 1.3, why } }), table: good, artDir: tmp, subjects: ['hero'] }).failures.join(' | ')).toMatch(/between 0\.9 and 1\.1/);
  });

  it('gives a KO its allowance on top of the projection', () => {
    const koSha = paint('hero', 'ko', 'ko-bytes');
    const rec = records() as { subjects: Record<string, any>; koProjection?: number };
    rec.subjects.hero.poses.ko = { sha: koSha, prone: true, standing: false, scaleSrc: 'reviewed', scale: 0.5, head: box(100, 200), stance: null, allow: { scale: 0.99, why: 'the stage cameras span 0.975 to 1.03' } };
    rec.koProjection = 0.978;
    expect(checkPoseScale({ records: rec, table: { hero: { ...table.hero, ko: { scale: 0.506 } } }, artDir: tmp, subjects: ['hero'] }).failures).toEqual([]); // 0.5 / 0.978 x 0.99
    rmSync(join(tmp, 'characters', 'hero', 'ko.png'));
  });

  it('wants the table to carry the record\'s head box as fractions of the painting, and to carry none the record lacks (r394, D-510: the engine holds it to the idle\'s size on screen)', () => {
    // the record's head box is [60, 0, 140, 80] on a 200 x 400 painting: 0.3, 0, 0.7, 0.2
    const sized = records({ size: [200, 400] });
    const good = { hero: { idle: { stanceX: 100 }, ready: { scale: 1.25, stanceX: 80, head: [0.3, 0, 0.7, 0.2] } } };
    expect(checkPoseScale({ records: sized, table: good, artDir: tmp, subjects: ['hero'] }).failures).toEqual([]);
    // a table generated before the head boxes, and a box that is not the record's
    expect(checkPoseScale({ records: sized, table, artDir: tmp, subjects: ['hero'] }).failures.join(' | ')).toMatch(/hero\/ready: the table's head box \(none\) is not the record's \(0\.3000, 0\.0000, 0\.7000, 0\.2000\); run measure\.py table/);
    const off = { hero: { ...good.hero, ready: { ...good.hero.ready, head: [0.3, 0, 0.7, 0.25] } } };
    expect(checkPoseScale({ records: sized, table: off, artDir: tmp, subjects: ['hero'] }).failures.join(' | ')).toMatch(/the table's head box \(0\.3, 0, 0\.7, 0\.25\) is not the record's/);
    // a record with a painting size and no head (a pose whose head was never read) may not have one in the table
    const bare = records({ size: [200, 400], head: undefined });
    expect(checkPoseScale({ records: bare, table: good, artDir: tmp, subjects: ['hero'] }).failures.join(' | ')).toMatch(/the table has a head box \(0\.3, 0, 0\.7, 0\.2\) that the record does not/);
    // a foe with no face box has the 1 px stand-in for an idle head, which registers nothing
    const foe = records({ size: [200, 400], head: [0, 0, 1, 1] }) as { subjects: Record<string, { idleHead: number[] }> };
    foe.subjects['hero']!.idleHead = [0, 0, 1, 1];
    expect(checkPoseScale({ records: foe, table: { hero: { idle: { stanceX: 100 }, ready: { scale: 1.25, stanceX: 80 } } }, artDir: tmp, subjects: ['hero'] }).failures.join(' | ')).not.toMatch(/head box/);
  });

  it('fails a standing pose wider than tall that the table does not mark upright', () => {
    const r = checkPoseScale({ records: records({ prone: true, standing: true }), table, artDir: tmp, subjects: ['hero'] });
    expect(r.failures.join('\n')).toMatch(/must be marked upright/);
  });
});

const art = resolve('public/art');
const haveArt = existsSync(join(art, 'characters', 'tidus', 'idle.png')) && existsSync(resolve('docs/target/pose-measure.json'));

describe.skipIf(!haveArt)('the measured art on this disk', () => {
  it('every measured subject is current, registered and within the head tolerance', () => {
    const records = JSON.parse(readFileSync(resolve('docs/target/pose-measure.json'), 'utf8'));
    const r = checkPoseScale({ records, table: POSE_REGISTRATION, artDir: art });
    expect(r.failures).toEqual([]);
    expect(r.summary.length).toBeGreaterThan(0);
  });
});

describe.skipIf(!existsSync(resolve('docs/target/pose-measure.json')))('the D-298 stature floor (a bent, hunched or kneeling pose is not drawn under 0.60 of its idle height)', () => {
  // Bailey, 2026-10-05, on the driver's recommendation: lifted for exactly these two poses and no other.
  const LIFTED = ['lulu/critical', 'rikku-berserker/ready'];
  it('holds for every measured pose except the two Bailey lifted, and those two say so in the record', () => {
    const records = JSON.parse(readFileSync(resolve('docs/target/pose-measure.json'), 'utf8')) as { subjects: Record<string, { poses: Record<string, { stature?: number; gateLifted?: unknown }> }> };
    const under: string[] = [];
    for (const [subject, sub] of Object.entries(records.subjects)) {
      for (const [pose, r] of Object.entries(sub.poses)) {
        const key = `${subject}/${pose}`;
        if (typeof r.stature === 'number' && r.stature < 0.595) under.push(key);
        if (r.gateLifted) expect(LIFTED, `${key} lifts the floor without Bailey's yes`).toContain(key);
      }
    }
    expect(under.sort()).toEqual([...LIFTED].sort());
  });
});
