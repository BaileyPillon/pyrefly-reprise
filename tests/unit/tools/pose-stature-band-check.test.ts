import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkPoseScale } from '../../../tools/pose-scale-check.mjs';
import { diffRecords, ruleRecords } from '../../../tools/posescale/pose-ruler.mjs';
import { RULE_ID, ruleSize } from '../../../tools/posescale/pose-rule.mjs';
import { ROOT } from './pose-gate-fixtures.ts';

/**
 * **`statureBand`, executed** (PR-0531; pc-residues lane review minor 7, 2026-10-28; FFX-2 only in effect: Yuna White Mage's cast and Rikku Thief's hurt). `pose-stature-band.test.ts` reads the generated
 * records; this file runs the two READERS of the field, so a reader that ignored a pose's own band would fail here and not only at the next `pose-ruler --check`:
 *   - `tools/pose-scale-check.mjs` re-derives a ruled record's scale with the record's band (a synthetic subject: no art needed);
 *   - `tools/posescale/pose-ruler.mjs` rules the paintings with it (the two real rows, only where the art folder is on disk).
 * (`measure.py`, which copies the band from `overrides.json` into the record, is Python and is covered by `pose-ruler --check` and `pose-scale-check` on the generated table.)
 */

describe('tools/pose-scale-check.mjs on a pose with its own stature band', () => {
  const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');
  const tmp = mkdtempSync(join(tmpdir(), 'pose-band-'));
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));
  const paint = (pose: string): string => {
    const dir = join(tmp, 'characters', 'hero');
    mkdirSync(dir, { recursive: true });
    const b = Buffer.from(`${pose}-bytes`);
    writeFileSync(join(dir, `${pose}.png`), b);
    return sha(b);
  };
  const idleSha = paint('idle');
  const castSha = paint('cast');
  const box = (cx: number, size: number): number[] => [cx - size / 2, 0, cx + size / 2, size];
  const BY = 'the W3 sizing rule (pick 89e), under Bailey 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix for this please."';

  // a cast painted a little tall: head scale 1.12, height scale 1.00 (the mean 1.058 is stature 1.058, inside 0.90 to 1.10 with no hold)
  const HEAD = 1.12;
  const HEIGHT = 1.0;
  const BAND = { ceiling: 1.04, why: 'a test margin: the screen adds 1.5 percent to this pose, so the card must read under the band edge' };
  /** The record the table would carry for the rule's answer with `band` (or none). */
  function record(band: { floor?: number; ceiling?: number; why: string } | null, answer: ReturnType<typeof ruleSize>, extra: Record<string, unknown> = {}) {
    return {
      subjects: {
        hero: {
          idleHead: box(100, 100),
          poses: {
            idle: { sha: idleSha, prone: false, standing: true, scaleSrc: 'reference', stance: { x: 100, row: 500 } },
            cast: {
              sha: castSha, prone: false, standing: true, scaleSrc: answer.held ? 'held' : 'ruled', scale: answer.scale, reading: HEAD, stature: answer.stature, head: box(100, 100 / answer.scale), stance: { x: 80, row: 500 },
              ruled: { rule: RULE_ID, basis: 'box', head: HEAD, height: HEIGHT, mean: Math.round(answer.mean * 1000) / 1000, lift: answer.lift, headRatio: Math.round(answer.headRatio * 1000) / 1000, stature: Math.round(answer.stature * 1000) / 1000 },
              ...(answer.held ? { held: { by: BY, reading: HEAD, readingStature: HEAD / HEIGHT, stature: answer.stature, headRatio: Math.round(answer.headRatio * 1000) / 1000 } } : {}),
              ...(band ? { statureBand: band } : {}),
              ...extra,
            },
          },
        },
      },
    };
  }
  const failures = (r: object, scale: number): string => checkPoseScale({ records: r as never, table: { hero: { idle: { stanceX: 100 }, cast: { scale, stanceX: 80 } } } as never, artDir: tmp, subjects: ['hero'] }).failures.join('\n');

  it('the band changes the rule\'s answer, so there is something for a reader to ignore', () => {
    const plain = ruleSize({ head: HEAD, height: HEIGHT, floor: 0.9 });
    const banded = ruleSize({ head: HEAD, height: HEIGHT, floor: 0.9, ceiling: BAND.ceiling });
    expect(plain.lift).toBeNull();
    expect(banded.lift).toBe('ceiling');
    expect(banded.scale).toBeLessThan(plain.scale);
    expect(banded.stature).toBeLessThanOrEqual(BAND.ceiling);
  });

  it('passes a record whose scale is the rule\'s answer WITH its own band, and refuses the same record when the band is taken off (the reader must use it)', () => {
    const banded = ruleSize({ head: HEAD, height: HEIGHT, floor: 0.9, ceiling: BAND.ceiling });
    expect(failures(record(BAND, banded), banded.scale)).toBe('');
    expect(failures(record(null, banded), banded.scale)).toMatch(/the rule gives scale 1\.0\d+ \(the mean\) for head 1\.12 and height 1, the record has 1\.04/);
  });

  it('refuses a record that carries the band but whose scale ignores it (the table was not regenerated)', () => {
    const plain = ruleSize({ head: HEAD, height: HEIGHT, floor: 0.9 });
    expect(failures(record(BAND, plain), plain.scale)).toMatch(/the rule gives scale 1\.04 \(ceiling\)/);
  });

  it('reads a floor margin the same way (Rikku Thief\'s hurt held at the floor on the card, 0.879 to 0.885 on the screen)', () => {
    const floorBand = { floor: 0.93, why: 'a test margin: the screen takes 2 percent off this pose, so the card must read over the band edge' };
    const low = { head: 0.667, height: 0.996 };
    const banded = ruleSize({ ...low, floor: floorBand.floor });
    const plain = ruleSize({ ...low, floor: 0.9 });
    expect(banded.scale).toBeGreaterThan(plain.scale);
    const rec = record(floorBand, banded, { reading: low.head, ruled: { rule: RULE_ID, basis: 'box', head: low.head, height: low.height, mean: Math.round(banded.mean * 1000) / 1000, lift: banded.lift, headRatio: Math.round(banded.headRatio * 1000) / 1000, stature: Math.round(banded.stature * 1000) / 1000 }, held: { by: BY, reading: low.head, readingStature: low.head / low.height, stature: banded.stature, headRatio: Math.round(banded.headRatio * 1000) / 1000 } });
    expect(failures(rec, banded.scale)).toBe('');
    const stripped = JSON.parse(JSON.stringify(rec));
    delete stripped.subjects.hero.poses.cast.statureBand;
    expect(failures(stripped, banded.scale)).toMatch(/the rule gives scale 0\.897/);
  });
});

const haveArt = existsSync(join(ROOT, 'public', 'art', 'characters', 'yuna-white-mage', 'cast.png')) && existsSync(join(ROOT, 'docs', 'target', 'pose-measure.json'));

describe.skipIf(!haveArt)('tools/posescale/pose-ruler.mjs on the two real rows (the art folder)', () => {
  it('rules Yuna White Mage\'s cast and Rikku Thief\'s hurt with their own bands: the records are what the ruler gives from the pixels now, and the margin is in the scale', async () => {
    const records = JSON.parse(readFileSync(join(ROOT, 'docs', 'target', 'pose-measure.json'), 'utf8'));
    const { rules } = await ruleRecords({ root: ROOT, subjects: ['yuna-white-mage', 'rikku-thief'] });
    expect(diffRecords(records, rules)).toEqual([]);
    const cast = rules.find((r: { subject: string; pose: string }) => r.subject === 'yuna-white-mage' && r.pose === 'cast');
    const hurt = rules.find((r: { subject: string; pose: string }) => r.subject === 'rikku-thief' && r.pose === 'hurt');
    expect(cast!.stature).toBeLessThanOrEqual(1.0701);
    expect(hurt!.stature).toBeGreaterThanOrEqual(0.9299);
  }, 300_000);
});
