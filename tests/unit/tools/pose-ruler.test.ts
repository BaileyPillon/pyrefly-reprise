import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkPoseScale } from '../../../tools/pose-scale-check.mjs';
import { LEGACY_REASON, LEGACY_WORDS, buildLegacyLedger, pruneLegacyLedger, sealDigest, sealOf, validateLedger, waiverKey } from '../../../tools/pose-gate-ledger.mjs';
import { judgedStature, statureFloorOf } from '../../../tools/posescale/pose-bands.mjs';
import { diffRecords, ruleRecords } from '../../../tools/posescale/pose-ruler.mjs';
import { RULE_ID, ruleSize, virtualHeadBox } from '../../../tools/posescale/pose-rule.mjs';
import { readPose } from '../../../tools/posescale/pose-model.mjs';
import { ROOT } from './pose-gate-fixtures.ts';

/**
 * **The W3 sizing rule** (pose continuity, 2026-10-17; both games, the size changes land mostly on FFX-2's dresspheres). Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix
 * for this please." The release driver picked the rule (item 89e): size a standing pose by the geometric mean of its head scale and its height scale; lift a stature under the floor (0.90, 0.75 low) to it and record
 * the head cost (a hold); refuse a lift whose head would pass the hold range and draw such a pose at the mean under its legacy waiver; read a props-out pose (victory, defend) head to soles.
 *
 * The numbers below are the options sheets' (\`D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/options/notes.md\` Part A) worked through the rule: a head scale and a height scale are the two numbers the
 * generator reads off a painting (the reviewed head reading, and the scale at which the pose's stature is 1.0).
 */

describe('ruleSize: the geometric mean, lifted to the floor, refused where no size is in band', () => {
  it('draws a painting whose head and body agree at the mean, which is no lift and no hold (Lady Luck hurt: mean 1.409, stature 0.923, head x1.084)', () => {
    const o = ruleSize({ head: 1.3, height: 1.5263, floor: 0.9 });
    expect(o.scale).toBe(1.409);
    expect(o.lift).toBeNull();
    expect(o.held).toBe(false);
    expect(o.stature).toBeCloseTo(0.923, 3);
    expect(o.headRatio).toBeCloseTo(1.084, 3);
  });

  it("lifts a mean under the floor to it and records the head cost as a hold (Lulu hurt: mean 0.815 is stature 0.82; lifted to 0.90 at head x1.345, r50.1's hold)", () => {
    const o = ruleSize({ head: 0.667, height: 0.996, floor: 0.9 });
    expect(o.lift).toBe('floor');
    expect(o.held).toBe(true);
    expect(o.scale).toBe(0.897);
    expect(o.stature).toBeGreaterThanOrEqual(0.9);
    expect(o.stature).toBeLessThan(0.901);
    expect(o.headRatio).toBeCloseTo(1.345, 3);
  });

  it('reads the low class from 0.75 (Lulu critical: lifted to 0.75, head x1.368)', () => {
    expect(statureFloorOf('low', 'critical')).toBe(0.75);
    expect(statureFloorOf('standing', 'hurt')).toBe(0.9);
    const o = ruleSize({ head: 0.533, height: 0.972, floor: 0.75 });
    expect(o.lift).toBe('floor');
    expect(o.scale).toBe(0.729);
    expect(o.headRatio).toBeCloseTo(1.368, 3);
  });

  it('records a hold when the mean is in the stature band but its head is not (Auron critical: mean 0.78, head x1.28, no lift)', () => {
    const o = ruleSize({ head: 0.64, height: 1.051, floor: 0.75 });
    expect(o.lift).toBeNull();
    expect(o.held).toBe(true);
    expect(o.stature).toBeCloseTo(0.78, 2);
    expect(o.headRatio).toBeCloseTo(1.281, 2);
  });

  it('holds a mean over 1.10 to the ceiling (Tidus victory, head to soles: mean 1.12 is held to 1.10, head x0.875)', () => {
    const o = ruleSize({ head: 1.585, height: 1.262, floor: 0.9 });
    expect(o.lift).toBe('ceiling');
    expect(o.held).toBe(true);
    expect(o.stature).toBeLessThanOrEqual(1.1);
    expect(o.stature).toBeGreaterThan(1.099);
    expect(o.headRatio).toBeCloseTo(0.875, 2);
  });

  it("refuses a lift whose head would pass the hold range: no single size is in band, so the pose is drawn at the mean (Paine Songstress hurt: mismatch 1.70, 0.59 becomes 0.77)", () => {
    const o = ruleSize({ head: 0.646, height: 1.095, floor: 0.9 });
    expect(o.lift).toBe('refused');
    expect(o.held).toBe(false);
    expect(o.scale).toBe(0.841);
    expect(o.stature).toBeCloseTo(0.768, 3);
    expect(o.headRatio).toBeCloseTo(1.302, 3);
  });

  it('never lands a lift under the floor or a hold over the ceiling, whatever the rounding', () => {
    for (let head = 0.5; head <= 1.6; head += 0.0137) {
      for (let height = 0.6; height <= 1.6; height += 0.0291) {
        const o = ruleSize({ head, height, floor: 0.9 });
        if (o.lift === 'floor') expect(o.stature, `${head} ${height}`).toBeGreaterThanOrEqual(0.9 - 1e-9);
        if (o.lift === 'ceiling') expect(o.stature, `${head} ${height}`).toBeLessThanOrEqual(1.1 + 1e-9);
        if (o.lift === 'refused') expect(o.scale).toBe(Math.round(Math.sqrt(head * height) * 1000) / 1000);
        // the head the player sees is the applied scale over the reading, always
        expect(o.headRatio, `${head} ${height}`).toBeCloseTo(o.scale / head, 9);
      }
    }
  });

  it('is symmetric in its two scales (the mean has no favourite) and needs positive ones', () => {
    expect(ruleSize({ head: 0.8, height: 1.2, floor: 0.5 }).scale).toBe(ruleSize({ head: 1.2, height: 0.8, floor: 0.5 }).scale);
    expect(() => ruleSize({ head: 0, height: 1, floor: 0.9 })).toThrow(/positive/);
    expect(() => ruleSize({ head: 1, height: Number.NaN, floor: 0.9 })).toThrow(/positive/);
  });

  it("registers the idle's head over the applied scale, centred on the head (the virtual box that stands the head lock down)", () => {
    const box = virtualHeadBox({ anchor: [377, 200], idleHead: [303, 143, 386, 196], scale: 0.897 });
    const w = box[2] - box[0];
    const h = box[3] - box[1];
    expect(w).toBeCloseTo(83 / 0.897, 0);
    expect(h).toBeCloseTo(53 / 0.897, 0);
    expect((box[0] + box[2]) / 2).toBeCloseTo(377, 0);
    expect((box[1] + box[3]) / 2).toBeCloseTo(200, 0);
  });

  it('judges a props-out pose by its body: the stature the band reads', () => {
    expect(judgedStature({ propsOut: true, bodyStature: 1.1, stature: 1.39 })).toBe(1.1);
    expect(judgedStature({ propsOut: false, bodyStature: 1.1, stature: 1.39 })).toBe(1.39);
  });
});

describe('the legacy ledger only shrinks (pruneLegacyLedger)', () => {
  const paintings = [
    { subject: 'a', pose: 'hurt', sha: 'a'.repeat(64) },
    { subject: 'a', pose: 'ready', sha: 'b'.repeat(64) },
    { subject: 'b', pose: 'attack', sha: 'c'.repeat(64) },
  ];
  const ledger = buildLegacyLedger(paintings, '2026-10-17');

  it('removes the legacy rows of paintings that are in band, and their seal entries, and says the digest to pin', () => {
    const still = new Set([waiverKey('b', 'attack', 'c'.repeat(64))]);
    const out = pruneLegacyLedger(ledger, still);
    expect(out.removed.map((r: { subject: string; pose: string }) => `${r.subject}/${r.pose}`)).toEqual(['a/hurt', 'a/ready']);
    expect(out.ledger.rows).toHaveLength(1);
    expect(out.ledger.legacySeal).toEqual([sealOf('b', 'attack', 'c'.repeat(64))]);
    expect(out.digest).toBe(sealDigest(out.ledger.legacySeal ?? []));
    expect(out.digest).not.toBe(sealDigest(ledger.legacySeal ?? []));
    expect(validateLedger(out.ledger, { pin: out.digest }).problems).toEqual([]);
  });

  it('does not let a removed row come back: re-adding it fails the ratchet, with or without its seal entry', () => {
    const out = pruneLegacyLedger(ledger, new Set([waiverKey('b', 'attack', 'c'.repeat(64))]));
    const back = { ...out.ledger, rows: [...out.ledger.rows, ledger.rows[0]] };
    expect(validateLedger(back, { pin: out.digest }).problems.map((p: { code: string }) => p.code)).toContain('ledger-legacy-added');
    const withSeal = { ...back, legacySeal: [...(out.ledger.legacySeal ?? []), sealOf('a', 'hurt', 'a'.repeat(64))] };
    expect(validateLedger(withSeal, { pin: out.digest }).problems.map((p: { code: string }) => p.code)).toContain('ledger-legacy-added');
  });

  it('never touches a row that is not legacy (a waiver in Bailey\'s words stays whatever the pixels say)', () => {
    const bailey = { subject: 'z', pose: 'hurt', sha: 'd'.repeat(64), reason: 'r', words: 'Bailey: "a sentence of his, long enough"', source: 'D-001', date: '2026-10-17' };
    const out = pruneLegacyLedger({ ...ledger, rows: [...ledger.rows, bailey] }, new Set());
    expect(out.ledger.rows).toEqual([bailey]);
    expect(LEGACY_REASON).toMatch(/ruler pick/);
    expect(LEGACY_WORDS).toMatch(/Bailey/);
  });
});

describe('tools/pose-scale-check.mjs on a ruled pose', () => {
  const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');
  const tmp = mkdtempSync(join(tmpdir(), 'pose-ruled-'));
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));
  const paint = (pose: string, bytes: string): string => {
    const dir = join(tmp, 'characters', 'hero');
    mkdirSync(dir, { recursive: true });
    const b = Buffer.from(bytes);
    writeFileSync(join(dir, `${pose}.png`), b);
    return sha(b);
  };
  const idleSha = paint('idle', 'idle-bytes');
  const hurtSha = paint('hurt', 'hurt-bytes');
  const box = (cx: number, size: number): number[] => [cx - size / 2, 0, cx + size / 2, size];
  const BY = 'the W3 sizing rule (pick 89e), under Bailey 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix for this please."';
  // head scale 0.667, height scale 0.996: the mean 0.815 is under the 0.90 floor, so the scale is lifted to 0.897 and the head ratio is 1.345
  const records = (over: Record<string, unknown> = {}, ruled: Record<string, unknown> | null = {}, held: Record<string, unknown> | null = {}) => ({
    subjects: {
      hero: {
        idleHead: box(100, 100),
        poses: {
          idle: { sha: idleSha, prone: false, standing: true, scaleSrc: 'reference', stance: { x: 100, row: 500 } },
          hurt: {
            sha: hurtSha, prone: false, standing: true, scaleSrc: 'held', scale: 0.897, reading: 0.667, stature: 0.9, head: box(100, 100 / 0.897), stance: { x: 80, row: 500 },
            ...(ruled ? { ruled: { rule: RULE_ID, basis: 'box', head: 0.667, height: 0.996, mean: 0.815, lift: 'floor', headRatio: 1.345, stature: 0.9, ...ruled } } : {}),
            ...(held ? { held: { by: BY, reading: 0.667, readingStature: 0.669, stature: 0.9, headRatio: 1.345, ...held } } : {}),
            ...over,
          },
        },
      },
    },
  });
  const table = { hero: { idle: { stanceX: 100 }, hurt: { scale: 0.897, stanceX: 80 } } };
  const failures = (r: object, t: object = table) => checkPoseScale({ records: r as never, table: t as never, artDir: tmp, subjects: ['hero'] }).failures.join('\n');

  it("passes a ruled hold whose scale is the rule's answer for its readings, with the cost recorded and the head box the idle's at the applied scale", () => {
    expect(failures(records())).toBe('');
  });

  it('passes a ruled pose that needs no hold (a mean inside the band) and refuses one that carries a hold the rule does not make', () => {
    const plain = records({ scaleSrc: 'ruled', scale: 1.409, stature: 0.923, reading: 1.3, head: box(100, 100 / 1.409) }, { head: 1.3, height: 1.526, mean: 1.409, lift: null, headRatio: 1.084, stature: 0.923 }, null);
    expect(failures(plain, { hero: { idle: { stanceX: 100 }, hurt: { scale: 1.409, stanceX: 80 } } })).toBe('');
    const falsely = records({ scaleSrc: 'held', scale: 1.409, stature: 0.923, reading: 1.3, head: box(100, 100 / 1.409) }, { head: 1.3, height: 1.526, mean: 1.409, lift: null, headRatio: 1.084, stature: 0.923 }, { reading: 1.3, headRatio: 1.084 });
    expect(failures(falsely, { hero: { idle: { stanceX: 100 }, hurt: { scale: 1.409, stanceX: 80 } } })).toMatch(/carries a hold the rule does not make/);
  });

  it("refuses a scale that is not the rule's answer for the readings, and a record that names no rule", () => {
    expect(failures(records({ scale: 0.95 }), { hero: { idle: { stanceX: 100 }, hurt: { scale: 0.95, stanceX: 80 } } })).toMatch(/the rule gives scale 0\.897 \(floor\) for head 0\.667 and height 0\.996, the record has 0\.95/);
    expect(failures(records({ scaleSrc: 'ruled' }, null, null))).toMatch(/a ruled pose needs the rule's record/);
    expect(failures(records({}, { rule: 'mean/0' }))).toMatch(/a ruled pose needs the rule's record/);
  });

  it('refuses a rule head scale that is not the record\'s reading, a head ratio that is not the scale over it, and a table that does not carry the scale', () => {
    expect(failures(records({ reading: 0.7 }))).toMatch(/the rule's head scale \(0\.667\) is not the record's reading \(0\.7\)/);
    expect(failures(records({}, { headRatio: 1.2 }, { headRatio: 1.2 }))).toMatch(/its head ratio \(1\.2\) is not the applied scale/);
    expect(failures(records(), { hero: { idle: { stanceX: 100 }, hurt: { scale: 0.667, stanceX: 80 } } })).toMatch(/the table's scale \(0\.667\) is not the record's \(0\.897\)/);
  });

  it("refuses a ruled pose whose registered head is the ruler's and not the applied scale's (the head lock would undo the rule)", () => {
    expect(failures(records({ head: box(100, 100 / 0.667) }))).toMatch(/the ruled pose's registered head, at the scale the engine uses \(0\.897\), is x1\.3/);
  });

  it('refuses a recorded hold with no word behind it', () => {
    expect(failures(records({}, {}, { by: '' }))).toMatch(/a recorded hold needs held\.by/);
  });
});

// ------------------------------------------------------------------ the art half: the rule against the pixels and the one pose model

const haveArt = existsSync(join(ROOT, 'public', 'art', 'characters', 'lulu', 'idle.png')) && existsSync(join(ROOT, 'docs', 'target', 'pose-measure.json'));
const SAMPLE = ['lulu', 'auron', 'tidus', 'paine-songstress', 'paine-lady-luck', 'paine-black-mage'];

describe.skipIf(!haveArt)('the rule against the pixels (r50 art)', () => {
  const records = haveArt ? JSON.parse(readFileSync(join(ROOT, 'docs', 'target', 'pose-measure.json'), 'utf8')) : null;

  it('the records of six subjects are what the rule gives from the paintings now (the full check is `node tools/posescale/pose-ruler.mjs --check`)', async () => {
    const { rules } = await ruleRecords({ root: ROOT, subjects: SAMPLE });
    expect(rules.length).toBeGreaterThan(40);
    expect(diffRecords(records, rules)).toEqual([]);
  }, 300_000);

  it('the one pose model reads each ruled pose where the rule put it: the judged stature and the real head, to 0.01', async () => {
    for (const [subject, pose] of [['lulu', 'hurt'], ['lulu', 'critical'], ['auron', 'attack'], ['tidus', 'victory'], ['paine-songstress', 'hurt'], ['paine-lady-luck', 'hurt'], ['paine-black-mage', 'defend']] as const) {
      const r = await readPose(subject, pose);
      const u = records.subjects[subject].poses[pose].ruled;
      expect(Math.abs((judgedStature(r) ?? 9) - u.stature), `${subject}/${pose} stature`).toBeLessThan(0.01);
      expect(Math.abs((r.headReal ?? 9) - u.headRatio), `${subject}/${pose} head`).toBeLessThan(0.01);
    }
  }, 300_000);

  it('Paine Songstress hurt is drawn at the mean under its waiver (0.59 becomes 0.77), Lady Luck hurt is in band with no hold, Tidus victory is read head to soles', async () => {
    const songstress = records.subjects['paine-songstress'].poses['hurt'];
    expect(songstress.ruled.lift).toBe('refused');
    expect(songstress.held).toBeUndefined();
    expect(songstress.stature).toBeCloseTo(0.77, 2);
    const lady = records.subjects['paine-lady-luck'].poses['hurt'];
    expect(lady.scaleSrc).toBe('ruled');
    expect(lady.stature).toBeCloseTo(0.92, 2);
    expect(lady.ruled.headRatio).toBeCloseTo(1.08, 2);
    const tidus = records.subjects['tidus'].poses['victory'];
    expect(tidus.ruled.basis).toBe('body');
    expect(tidus.ruled.lift).toBe('ceiling');
    const r = await readPose('tidus', 'victory');
    expect(r.propsOut).toBe(true);
    expect(r.bodyStature).toBeLessThan(1.105);
    expect(r.stature).toBeGreaterThan(1.3); // the box counts the raised sword; the band does not
  }, 300_000);
});
