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

  it('fails a head more than 3 percent off its idle\'s at the table\'s scale', () => {
    // the record's head box is 80 wide at scale 1.25: 100 at the idle's size. A box of 90 is 12 percent too big.
    const r = checkPoseScale({ records: records({ head: box(100, 90) }), table, artDir: tmp, subjects: ['hero'] });
    expect(r.failures.join('\n')).toMatch(/head at the table's scale is x1\.125 of the idle's/);
    expect(TOLERANCE).toBe(0.03);
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
