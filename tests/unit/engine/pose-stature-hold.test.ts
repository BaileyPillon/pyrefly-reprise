import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { POSE_REGISTRATION_FFX } from '../../../src/data/art/poseRegistrationFfx.ts';
import { checkPoseScale } from '../../../tools/pose-scale-check.mjs';

/**
 * **Stature holds: a hurt figure is not drawn at two thirds of her height** (release 50.1, carried by the W3 sizing rule, 2026-10-17; **FFX only**: the paintings and the records are the FFX party's).
 *
 * Bailey, 2026-10-16, with a screenshot of Chapter XXVII: "lulu looks tiny when hurt - this problem again? ugh". The registration (release 39, D-420) scaled every pose so its HEAD was the idle's head, and a painting
 * whose proportions differ from the idle's (Lulu's hurt and low-HP paintings are squat, big-headed figures of a slender idle) came out at 0.67 and 0.55 of her height in the live game. r50.1 held nine FFX poses
 * to a floor (0.90 of the idle's height; 0.75 for the low-HP slouch, which bends) and a ceiling (1.10) at the cost of a head bigger than the idle's, and said so in the record (`held`).
 *
 * The W3 sizing rule (`tools/posescale/pose-ruler.mjs`, 2026-10-17: the geometric mean of the head and height scales, lifted to the floor) replaced the hold as a mechanism and keeps the nine as a special case: Lulu hurt,
 * Lulu critical, Auron hurt and attack, Yuna hurt and Rikku attack are still lifted to their floor (within 0.012 of the r50.1 draw); Auron's low-HP pose, Wakka's cast and Yuna's attack are where the mean sits INSIDE
 * the band, so no lift is needed and they are drawn at the mean (Auron critical 0.75 to 0.78, Wakka cast 1.10 to 1.06, Yuna attack 0.90 to 0.94: the head cost shrinks or stays in band).
 *
 * Held here: the nine poses' records and tables, exactly; that every FFX party member's hurt, attack and cast stand inside 0.90 to 1.10 of the idle's height in the record and their low-HP pose at 0.75 or more;
 * that the table, the record and `tools/pose-scale-check.mjs` agree on a held pose (its registered head is the idle's at the APPLIED scale, so the head lock does not undo the hold); and what the check refuses
 * (a hold with no owner's word, a ratio that is not the scale over the reading). A KO or other lying pose is never held (its length against the idle's height is a decision for Bailey, docs/handoff/r50-1.md).
 */

interface Rec {
  scale?: number;
  scaleSrc?: string;
  stature?: number;
  prone?: boolean;
  reading?: number;
  head?: number[];
  size?: number[];
  held?: { by?: string; reading: number; readingStature: number; stature: number; headRatio: number };
  ruled?: { rule: string; head: number; height: number; mean: number; lift: string | null; headRatio: number; stature: number };
}
const record = JSON.parse(readFileSync(resolve(__dirname, '..', '..', '..', 'docs', 'target', 'pose-measure.json'), 'utf8')) as { subjects: Record<string, { poses: Record<string, Rec> }> };
const PARTY = ['tidus', 'yuna', 'wakka', 'lulu', 'kimahri', 'auron', 'rikku'] as const;

/**
 * The nine r50.1 holds: [subject, pose, scale now, the head ruler's reading, stature drawn now, held now?, what r50.1 drew (box stature through the model)].
 * Six come out within 0.012 of the r50.1 draw; the other three are drawn at the mean because it sits inside the band (see the header).
 */
const NINE: ReadonlyArray<readonly [string, string, number, number, number, boolean, number]> = [
  ['auron', 'attack', 0.886, 0.69, 0.9, true, 0.9025],
  ['auron', 'critical', 0.82, 0.64, 0.78, true, 0.7505],
  ['auron', 'hurt', 0.931, 0.75, 0.9, true, 0.8997],
  ['lulu', 'critical', 0.729, 0.533, 0.75, true, 0.754],
  ['lulu', 'hurt', 0.897, 0.667, 0.9, true, 0.9074],
  ['rikku', 'attack', 0.835, 0.734, 0.901, true, 0.8895],
  ['wakka', 'cast', 1.032, 1.09, 1.057, false, 1.0995],
  ['yuna', 'attack', 0.813, 0.761, 0.937, false, 0.9008],
  ['yuna', 'hurt', 0.935, 0.804, 0.9, true, 0.8995],
];
/** The three whose draw moves by more than 0.012 on purpose: the mean is inside the band, so it needs no lift. */
const MOVED = new Set(['auron/critical', 'wakka/cast', 'yuna/attack']);

describe('the FFX party is drawn within a tenth of its idle height when it fights or is hurt', () => {
  it('every hurt, attack and cast pose stands at 0.90 to 1.10 of its idle, and the low-HP pose at 0.75 or more', () => {
    for (const s of PARTY) {
      for (const [pose, lo, hi] of [['hurt', 0.9, 1.1], ['attack', 0.9, 1.1], ['cast', 0.9, 1.1], ['critical', 0.75, 9]] as const) {
        const r = record.subjects[s]!.poses[pose];
        expect(r, `${s}/${pose}`).toBeDefined();
        expect(r!.prone, `${s}/${pose} is a standing pose`).toBe(false);
        expect(r!.stature!, `${s}/${pose} stature`).toBeGreaterThanOrEqual(lo - 0.002);
        expect(r!.stature!, `${s}/${pose} stature`).toBeLessThanOrEqual(hi + 0.002);
      }
    }
  });

  it("Lulu's hurt was 0.67 of her height and is 0.90; her low-HP slouch was 0.55 and is 0.75 (the screenshot's complaint)", () => {
    const hurt = record.subjects['lulu']!.poses['hurt']!;
    const crit = record.subjects['lulu']!.poses['critical']!;
    expect([hurt.held!.readingStature, hurt.stature]).toEqual([0.669, 0.9]);
    expect([crit.held!.readingStature, crit.stature]).toEqual([0.549, 0.75]);
    expect(POSE_REGISTRATION_FFX['lulu']!['hurt']!.scale).toBe(0.897);
    expect(POSE_REGISTRATION_FFX['lulu']!['critical']!.scale).toBe(0.729);
  });
});

describe('the nine r50.1 holds under the sizing rule', () => {
  it('each keeps its record and its table scale; seven are still lifted to the floor (a recorded hold), two are drawn at the mean', () => {
    for (const [s, p, scale, reading, stature, held] of NINE) {
      const r = record.subjects[s]!.poses[p]!;
      const w = `${s}/${p}`;
      expect(r.scaleSrc, w).toBe(held ? 'held' : 'ruled');
      expect(r.scale, w).toBe(scale);
      expect(r.reading, w).toBe(reading);
      expect(r.stature, w).toBe(stature);
      expect(r.ruled!.rule, w).toBe('geomean/1');
      expect(POSE_REGISTRATION_FFX[s]![p]!.scale, `${w} table`).toBe(scale);
      if (held) {
        expect(r.held!.headRatio, w).toBeCloseTo(scale / reading, 2);
        expect(r.held!.headRatio, w).toBeGreaterThan(0.8);
        expect(r.held!.headRatio, w).toBeLessThan(1.45);
        expect(r.held!.by, `${w} says whose word it is`).toMatch(/Bailey 2026-10-16/);
      } else {
        expect(r.held, w).toBeUndefined();
      }
    }
  });

  it('six come out within 0.012 of the stature r50.1 drew (the box through the model); the other three move on purpose, to the mean', () => {
    for (const [s, p, , , stature, , before] of NINE) {
      const w = `${s}/${p}`;
      if (MOVED.has(w)) expect(Math.abs(stature - before), w).toBeGreaterThan(0.012);
      else expect(Math.abs(stature - before), w).toBeLessThanOrEqual(0.012);
    }
  });

  it("a held pose registers the head the lock must hold at the applied scale: its head box is the idle's over the scale, not the ruler's", () => {
    for (const [s, p, scale, , , held] of NINE) {
      if (!held) continue;
      const sub = record.subjects[s]!;
      const r = sub.poses[p]!;
      const side = (b: number[]): number => Math.sqrt((b[2]! - b[0]!) * (b[3]! - b[1]!));
      const idleHead = (sub as unknown as { idleHead: number[] }).idleHead;
      expect(side(r.head!) * scale / side(idleHead), `${s}/${p} head at the applied scale`).toBeCloseTo(1, 1);
    }
  });

  it('no KO is held or ruled, and the poses the rule leaves alone keep their readings', () => {
    for (const s of PARTY) {
      expect(record.subjects[s]!.poses['ko']!.scaleSrc, `${s}/ko`).not.toBe('held');
      expect(record.subjects[s]!.poses['ko']!.scaleSrc, `${s}/ko`).not.toBe('ruled');
      expect(record.subjects[s]!.poses['ko']!.held, `${s}/ko`).toBeUndefined();
    }
    // Lulu's attack and cast: the mean of their head and height scales (the head ruler read 1.000 and 1.053), within a few percent
    expect(record.subjects['lulu']!.poses['attack']!.scale).toBe(1.015);
    expect(record.subjects['lulu']!.poses['cast']!.scale).toBe(1.026);
    expect(record.subjects['tidus']!.poses['hurt']!.scale).toBe(0.932);
    expect(record.subjects['kimahri']!.poses['hurt']!.scale).toBe(1.065);
  });
});

describe('tools/pose-scale-check.mjs on a held pose', () => {
  const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');
  const tmp = mkdtempSync(join(tmpdir(), 'pose-stature-'));
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
  const BY = 'Bailey 2026-10-16: "lulu looks tiny when hurt"';
  // the ruler read 0.667 (the head is 1.5 times the idle's); the hold applies 0.9, so the head the lock must hold is the idle's over 0.9
  const records = (over: Record<string, unknown> = {}, held: Record<string, unknown> | null = { by: BY, reading: 0.667, readingStature: 0.665, stature: 0.9, headRatio: 1.349 }) => ({
    subjects: {
      hero: {
        idleHead: box(100, 100),
        poses: {
          idle: { sha: idleSha, prone: false, standing: true, scaleSrc: 'reference', stance: { x: 100, row: 500 } },
          hurt: { sha: hurtSha, prone: false, standing: true, scaleSrc: 'held', scale: 0.9, reading: 0.667, stature: 0.9, head: box(100, 100 / 0.9), stance: { x: 80, row: 500 }, ...(held ? { held } : {}), ...over },
        },
      },
    },
  });
  const table = { hero: { idle: { stanceX: 100 }, hurt: { scale: 0.9, stanceX: 80 } } };

  it('passes a held pose whose record names the word, the reading and the cost, and whose head box is the idle\'s at the applied scale', () => {
    expect(checkPoseScale({ records: records(), table, artDir: tmp, subjects: ['hero'] }).failures).toEqual([]);
  });

  it('refuses a hold with no owner\'s word, and one whose head ratio is not the scale over the reading', () => {
    expect(checkPoseScale({ records: records({}, null), table, artDir: tmp, subjects: ['hero'] }).failures.join('\n')).toMatch(/a stature hold needs held\.by/);
    expect(checkPoseScale({ records: records({}, { by: '', reading: 0.667, readingStature: 0.665, stature: 0.9, headRatio: 1.349 }), table, artDir: tmp, subjects: ['hero'] }).failures.join('\n')).toMatch(/a stature hold needs held\.by/);
    expect(checkPoseScale({ records: records({}, { by: BY, reading: 0.667, readingStature: 0.665, stature: 0.9, headRatio: 1.2 }), table, artDir: tmp, subjects: ['hero'] }).failures.join('\n')).toMatch(/held head ratio \(1\.2\)/);
  });

  it('refuses a hold that moves the head past x1.45 of the idle\'s, and a registered head that is the ruler\'s and not the held scale\'s (the lock would undo the hold)', () => {
    expect(checkPoseScale({ records: records({ scale: 0.9, reading: 0.5 }, { by: BY, reading: 0.5, readingStature: 0.5, stature: 0.9, headRatio: 1.8 }), table, artDir: tmp, subjects: ['hero'] }).failures.join('\n')).toMatch(/between x0\.8 and x1\.45/);
    expect(checkPoseScale({ records: records({ head: box(100, 100 / 0.667) }), table, artDir: tmp, subjects: ['hero'] }).failures.join('\n')).toMatch(/registered head, at the scale the engine uses \(0\.9\), is x1\.3/);
  });

  it('refuses a table that does not carry the held scale', () => {
    expect(checkPoseScale({ records: records(), table: { hero: { idle: { stanceX: 100 }, hurt: { scale: 0.667, stanceX: 80 } } }, artDir: tmp, subjects: ['hero'] }).failures.join('\n')).toMatch(/the table's scale \(0\.667\) is not the record's \(0\.9\)/);
  });
});
