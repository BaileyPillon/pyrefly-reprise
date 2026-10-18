/**
 * **The pose model** (pose continuity, W1; both games): one reading of a character painting the way the game draws it, shared by the gate, the census and the
 * critic (`tools/posescale/pose-model.mjs`, `pose-geometry.mjs`, `pose-pixels.mjs`, `pose-bands.mjs`, `pose-rows.mjs`, `pose-kinds.mjs`).
 *
 * Two halves. The pure half (placement maths, bands, rows, classes) runs anywhere. The art half reads real paintings and is held against the numbers angle 1
 * of the 2026-10-16 survey measured with its own independent implementation (`D:/Tools/pyrefly-scratch/2026-10-16/pose-continuity/poses.csv`, release r50
 * art): six known rows (Lulu hurt and critical, a Dark Aeon pose, a Lady Luck row, an aeon, an FFX-2 twirl). It runs only when `public/art` holds the
 * painting with the pinned sha256; a tree with other art skips that row rather than pinning numbers to it.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POSE_REGISTRATION_FFX } from '../../../src/data/art/poseRegistrationFfx.ts';
import { POSE_REGISTRATION_FFX2 } from '../../../src/data/art/poseRegistrationFfx2.ts';
import { POSE_REGISTRATION_FOES } from '../../../src/data/art/poseRegistrationFoes.ts';
import { POSE_REGISTRATION_EXP } from '../../../src/data/art/poseRegistrationExp.ts';
import { poseStatusTrusted, type PoseRegistrationRow } from '../../../src/data/art/poseRegistrationTypes.ts';
import { KO_POSE_SCALE } from '../../../src/engine/KoPoseScale.ts';
import { makeRef, placePose } from '../../../tools/posescale/pose-geometry.mjs';
import { gameOf, mirrorFor, parseFacing, poseClassOf, sideOf, subjectKind } from '../../../tools/posescale/pose-kinds.mjs';
import { bandVerdict, proposeStatus } from '../../../tools/posescale/pose-bands.mjs';
import { diffStored, recordStatureGap, rowFieldsFromReading, shaMatches } from '../../../tools/posescale/pose-rows.mjs';
import { loadModelInputs, readPose, type ModelInputs, type ModelRow, type PoseReading } from '../../../tools/posescale/pose-model.mjs';

const ROOT = resolve(__dirname, '..', '..', '..');
const ART = resolve(ROOT, 'public', 'art');

// ------------------------------------------------------------------ the pure half

const facingOf = (m: { sidecar?: { facing?: unknown } }) => parseFacing(m.sidecar?.facing);
const noKo = {};

/** A synthetic idle (800 x 1000, ground line 900, figure from row 50) and a function that places a pose against it. */
function rig(refRow: Record<string, unknown> = { stanceX: 400, head: [0.4, 0.05, 0.6, 0.15] }) {
  const ref = { pose: 'idle', W: 800, H: 1000, engineBase: 900, engineBox: { x0: 100, x1: 700, y0: 50, y1: 900 }, stance: { x: 400, row: 900 }, sidecar: {} };
  const R = makeRef({ subject: 'x', refName: 'idle', ref, reg: { idle: refRow }, koScale: noKo, want: 1, facingOf, mirrorFor });
  const place = (over: Record<string, unknown>, row: Record<string, unknown>, rec: Record<string, unknown> = {}) =>
    placePose(R, { pose: 'attack', W: 800, H: 1000, engineBase: 900, engineBox: { x0: 100, x1: 700, y0: 150, y1: 900 }, stance: { x: 400, row: 900 }, sidecar: {}, ...over }, { row, rec, koScale: noKo, facingOf, mirrorFor });
  return { R, place };
}

describe('the placement maths (PaintedScale + PoseRegistration + HeadLock, in plain numbers)', () => {
  it('sizes the idle once and reads a shorter pose against it: stature 0.882, head 1.0 at the idle\'s head size', () => {
    const { R, place } = rig();
    expect(R.figH).toBeCloseTo(850 / 900, 6);
    const g = place({}, { head: [0.4, 0.15, 0.6, 0.25], stanceX: 400 });
    expect(g.stature).toBeCloseTo(750 / 850, 6);
    expect(g.headReal).toBeCloseTo(1, 6);
    expect(g.lock).toBeCloseTo(1, 6);
    expect(g.feetDx).toBeCloseTo(0, 6);
    expect(g.feetDy).toBeCloseTo(0, 6);
  });

  it('holds a big head to the idle\'s within 0.9 to 1.1 and says so: the real head is what the lock could not fix', () => {
    const { place } = rig();
    const g = place({}, { head: [0.3, 0.1, 0.7, 0.3], stanceX: 400 }); // a head twice the idle's
    expect(g.headTable).toBeCloseTo(2, 4);
    expect(g.lock).toBeCloseTo(0.9, 6);
    expect(g.headReal).toBeCloseTo(1.8, 4);
    expect(g.stature).toBeCloseTo((750 / 850) * 0.9, 6);
  });

  it('reads a recorded hold\'s real head ratio, not the lock\'s', () => {
    const { place } = rig();
    const g = place({}, { head: [0.4, 0.15, 0.6, 0.25], stanceX: 400 }, { held: { by: 'x', headRatio: 1.354, reading: 0.667, stature: 0.901 } });
    expect(g.held).toBe(true);
    expect(g.headReal).toBeCloseTo(1.354, 6);
  });

  it('clamps the longest side to 2.2 world heights and says it', () => {
    const { place } = rig();
    const g = place({}, { scale: 3, stanceX: 400 });
    expect(g.clamped).toBe(true);
    expect(Math.max(800, 1000) * g.upp).toBeCloseTo(2.2, 6);
  });

  it('plants a figure on the registered feetRow, and reports how far that row is above the alpha baseline (the knee-planted Lady Luck defect)', () => {
    const { place } = rig();
    const g = place({}, { feetRow: 600, stanceX: 400 });
    expect(g.anchorSrc).toBe('feetRow');
    expect(g.anchor).toBe(600);
    expect(g.feetRowGap).toBeCloseTo(0.3, 6);
    expect(g.sinkIdle).toBeCloseTo(300 / 900 / (850 / 900), 6);
    expect(g.stature).toBeCloseTo((600 - 150) / 850, 6); // the figure is drawn shorter than its painting says
  });

  it('slides a registered stance onto the idle\'s, and never a laid-down plane', () => {
    const { place } = rig();
    const slid = place({ stance: { x: 300, row: 900 } }, { stanceX: 300 });
    expect(slid.shift).toBeCloseTo(100 / 900, 6); // the idle stands 100 px right of this pose's stance
    expect(slid.feetDx).toBeCloseTo(0, 6);
    const lying = place({ W: 1216, H: 771, stance: { x: 300, row: 700 } }, { stanceX: 300 });
    expect(lying.prone).toBe(true);
    expect(lying.shift).toBe(0);
    expect(lying.feetDx).toBeNull();
  });

  it('mirrors a painting that faces the wrong way for its side, like the engine', () => {
    expect(mirrorFor('left', 1)).toBe(-1);
    expect(mirrorFor('right', 1)).toBe(1);
    expect(mirrorFor('left', -1)).toBe(1);
    expect(mirrorFor(null, 1)).toBe(1);
  });
});

describe('subject kinds and pose classes', () => {
  it('classes the subjects the survey did, and the game from the art id', () => {
    expect(subjectKind('lulu')).toBe('party-ffx');
    expect(subjectKind('paine-lady-luck')).toBe('dressphere-ffx2');
    expect(subjectKind('dark-sandy')).toBe('dark-aeon');
    expect(subjectKind('bahamut')).toBe('aeon');
    expect(subjectKind('sin-core')).toBe('part');
    expect(subjectKind('exp-leblanc-yuna-white-mage')).toBe('exp-leblanc');
    expect(gameOf('lulu', undefined)).toBe('FFX');
    expect(gameOf('rikku-songstress', undefined)).toBe('FFX-2');
    expect(gameOf('dark-sandy', undefined)).toBe('FFX');
    expect(gameOf('vegnagun-body', undefined)).toBe('FFX-2');
    expect(sideOf('lulu')).toBe(1);
    expect(sideOf('dark-sandy')).toBe(-1);
  });

  it('puts each pose in the class that decides its band', () => {
    const c = (pose: string, o: Partial<{ isRef: boolean; prone: boolean; kind: string }> = {}) => poseClassOf({ pose, isRef: false, prone: false, kind: 'party-ffx', ...o });
    expect(c('idle', { isRef: true })).toBe('idle');
    expect(c('hurt')).toBe('standing');
    expect(c('critical')).toBe('low');
    expect(c('sleep')).toBe('low');
    expect(c('ko', { prone: true })).toBe('ko');
    expect(c('twirl-end', { kind: 'dressphere-ffx2' })).toBe('staged');
    expect(c('twirl-end', { kind: 'exp-leblanc' })).toBe('staged');
    // pose continuity, 2026-10-17: the exemption is the five keys on the dresspheres' own subjects, not any pose called twirl... on any subject
    expect(c('twirl-end')).toBe('standing');
    expect(c('twirl-strike', { kind: 'dressphere-ffx2' })).toBe('standing');
    expect(c('attack', { prone: true })).toBe('wide');
    expect(c('attack', { kind: 'part' })).toBe('part');
  });
});

/** A reading in band in every axis, to bend one axis at a time. */
const reading = (over: Partial<PoseReading> = {}): PoseReading =>
  ({
    subject: 's', pose: 'attack', kind: 'party-ffx', game: 'FFX', class: 'standing', isRef: false, refPose: 'idle', sha: 'a'.repeat(64), size: [800, 1000],
    hasRow: true, hasHead: true, hasStance: true, held: false, heldHeadRatio: null, status: null, rowSha: null,
    scale: 1, scaleSrc: 'reg', anchorRow: 900, anchorSrc: 'baseline', clamped: false, lock: 1, prone: false, mirror: 1,
    stature: 1, statureTable: 1, bodyStature: 1, headReal: 1, headTable: 1, lengthRatio: null, massRatio: null, iou: 0.6,
    empty: false, areaOverIdle: 1, headBox: { cy: 0.2, coverage: 1 }, refHasHead: true, refWide: false, heldGap: null, hires: null,
    feetPx: { x: 400, row: 900 }, feet: { dx: 0, dy: 0 }, feetRowGap: 0, sinkIdle: 0, stanceRegistered: 400, stanceDiffPx: 0,
    fromPixels: { size: [800, 1000], alphaBaseline: 900, alphaBox: null, bbox: [], stanceX: 400, stanceRow: 900, figureHeightPx: 850, heightOverIdle: 1, feetRowGap: 0, sinkIdle: 0, stanceBothRead: true },
    drawn: { upp: 1, anchor: 900, shift: 0, mirror: 1 },
    ...over,
  }) as PoseReading;

describe('the bands', () => {
  it('passes a figure in band and names every axis it fails', () => {
    expect(bandVerdict(reading()).flags).toEqual([]);
    expect(bandVerdict(reading({ stature: 0.85 })).flags).toEqual(['stature-low']);
    expect(bandVerdict(reading({ stature: 1.15 })).flags).toEqual(['stature-high']);
    expect(bandVerdict(reading({ headReal: 1.36 })).flags).toEqual(['head-big']);
    expect(bandVerdict(reading({ headReal: 0.8 })).flags).toEqual(['head-small']);
    expect(bandVerdict(reading({ feet: { dx: 0.03, dy: -0.05 } })).flags).toEqual(['feet-y', 'feet-x']);
    expect(bandVerdict(reading({ hasRow: false })).flags).toEqual(['unregistered']);
  });

  it('gives a stature band half a percent of slack, so a hold\'s 0.90 is not flagged', () => {
    expect(bandVerdict(reading({ stature: 0.8955 })).flags).toEqual([]);
    expect(bandVerdict(reading({ stature: 0.894 })).flags).toEqual(['stature-low']);
  });

  it('widens only the head for a recorded hold: Lulu hurt at stature 0.907 and head 1.356 is a hold, not a failure', () => {
    expect(bandVerdict(reading({ held: true, stature: 0.907, headReal: 1.356 })).flags).toEqual([]);
    expect(bandVerdict(reading({ held: true, stature: 0.85, headReal: 1.356 })).flags).toEqual(['stature-low']);
    expect(bandVerdict(reading({ held: true, stature: 0.95, headReal: 1.5 })).flags).toEqual(['head-big']);
    expect(proposeStatus(reading({ held: true, stature: 0.907, headReal: 1.356 }))).toBe('held');
  });

  it('judges the low class from 0.75 and a KO\'s length by report only', () => {
    expect(bandVerdict(reading({ class: 'low', pose: 'critical', stature: 0.754 })).flags).toEqual([]);
    expect(bandVerdict(reading({ class: 'low', pose: 'critical', stature: 0.7 })).flags).toEqual(['stature-low']);
    const ko = bandVerdict(reading({ class: 'ko', pose: 'ko', stature: 0.26, lengthRatio: 0.42, feet: null }));
    expect(ko.flags).toEqual([]);
    expect(ko.report).toEqual(['ko-short']);
  });

  it('judges a part by its stance only, and exempts a staged twirl painting and an FF7 still', () => {
    expect(bandVerdict(reading({ class: 'part', kind: 'part', stature: 0.4, headReal: null })).flags).toEqual([]);
    expect(bandVerdict(reading({ class: 'part', kind: 'part', feet: { dx: 0.2, dy: 0 } })).flags).toEqual(['feet-x']);
    expect(bandVerdict(reading({ class: 'staged', stature: 1.3, feet: { dx: -0.22, dy: 0 } })).exempt).toBe(true);
    expect(proposeStatus(reading({ class: 'staged', stature: 1.3 }))).toBeNull();
    expect(bandVerdict(reading({ kind: 'ff7', class: 'part', hasRow: false })).exempt).toBe(true);
  });

  it('refuses a degenerate painting that the height and head bands alone passed (the holes a verifier found on 2026-10-17)', () => {
    expect(bandVerdict(reading({ empty: true })).flags).toEqual(['empty']); // nothing opaque, and no exemption covers that
    expect(bandVerdict(reading({ empty: true, class: 'staged' })).flags).toEqual(['empty']);
    expect(bandVerdict(reading({ massRatio: 0.3 })).flags).toEqual(['mass-low']); // a bar, a blob and a pole, a small figure holding a full-height pole
    expect(bandVerdict(reading({ massRatio: 2.4 })).flags).toEqual(['mass-high']); // an opaque slab
    expect(bandVerdict(reading({ massRatio: 0.55 })).flags).toEqual([]); // r50's least is 0.55
    expect(bandVerdict(reading({ solidity: 1 })).flags).toEqual(['slab']); // a rectangle of any size, however well it matches the idle's mass
    expect(bandVerdict(reading({ solidity: 0.91 })).flags).toEqual([]); // r50's most is 0.91 (a column of a boss)
    expect(bandVerdict(reading({ feetPx: null, feet: null })).flags).toEqual(['no-stance']);
    expect(bandVerdict(reading({ iou: 0.02 })).flags).toEqual(['no-overlap']);
    expect(bandVerdict(reading({ iou: 0.06 })).flags).toEqual([]); // r50's least is 0.054
    expect(bandVerdict(reading({ class: 'ko', pose: 'ko', feetPx: null, feet: null, iou: 0.01, massRatio: 0.4 })).flags).toEqual([]); // a laid-down body has none of these
  });

  it('checks where the head box sits, not just how big it is, and that the head ratio of a hold is not typed', () => {
    expect(bandVerdict(reading({ headBox: { cy: 0.75, coverage: 1 } })).flags).toEqual(['head-off']); // a box moved onto the legs reads the same size
    expect(bandVerdict(reading({ headBox: { cy: 0.3, coverage: 0.02 } })).flags).toEqual(['head-off']); // a box on empty canvas
    expect(bandVerdict(reading({ headBox: { cy: 0.45, coverage: 0.9 } })).flags).toEqual([]); // a crouching figure's head, r50's lowest is 0.54
    expect(bandVerdict(reading({ hasHead: false, headReal: null })).flags).toEqual(['no-head']); // its idle has a face box, this pose has none
    expect(bandVerdict(reading({ hasHead: false, headReal: null, refHasHead: false })).flags).toEqual([]); // a creature has no face anywhere
    expect(bandVerdict(reading({ held: true, stature: 0.907, headReal: 1.0, heldGap: 0.35 })).flags).toEqual(['held-head']); // headRatio 1.0 typed over a head drawn at 0.55
    expect(bandVerdict(reading({ held: true, stature: 0.907, headReal: 1.356, heldGap: 0.001 })).flags).toEqual([]);
  });

  it('lays a pose that is wider than tall down only where the idle is wide too', () => {
    expect(bandVerdict(reading({ class: 'wide', pose: 'attack' })).flags).toEqual(['wide-pose']); // a lunge padded to 1.4 x: the engine lays it on the floor
    expect(bandVerdict(reading({ class: 'wide', pose: 'attack', refWide: true })).flags).toEqual([]); // a hull whose idle is wide
  });

  it('flags a feetRow that sinks the boots under the floor (the knee-planted Lady Luck rows)', () => {
    const v = bandVerdict(reading({ stature: 0.495, feetRowGap: 0.402, sinkIdle: 0.357 }));
    expect(v.flags).toContain('feet-sunk');
    expect(v.flags).toContain('stature-low');
    expect(proposeStatus(reading({ stature: 0.495, feetRowGap: 0.402 }))).toBe('blocked');
    expect(proposeStatus(reading({ stature: 0.495, feetRowGap: 0.402 }), { waived: true })).toBe('waived');
  });
});

describe('the row fields and the second reading', () => {
  it('writes the additive fields from a reading, three decimals, with a 16-character sha', () => {
    const f = rowFieldsFromReading(reading({ stature: 0.90742, headReal: 1.35571, iou: 0.31434, sha: 'ab12'.repeat(16) }), 'held');
    expect(f).toEqual({ status: 'held', class: 'standing', stature: 0.907, headReal: 1.356, iou: 0.314, sha: 'ab12ab12ab12ab12' });
    expect(shaMatches(f.sha, 'ab12'.repeat(16))).toBe(true);
    expect(shaMatches(f.sha, 'cd34'.repeat(16))).toBe(false);
    expect(shaMatches('ab12', 'ab12'.repeat(16))).toBe(false); // a prefix shorter than 12 describes nothing
  });

  it('catches a stored reading that the pixels do not bear out: Paine Lady Luck hurt stored at 0.852, drawn at 0.495', () => {
    const now = reading({ stature: 0.4947, sha: 'f'.repeat(64) });
    const stored: PoseRegistrationRow = { status: 'ok', class: 'standing', stature: 0.852, sha: 'f'.repeat(16) };
    const d = diffStored(stored, now);
    expect(d.stale.join(' ')).toMatch(/stature 0\.852 stored, 0\.495 recomputed/);
    expect(diffStored({ ...stored, stature: 0.495 }, now).stale).toEqual([]);
  });

  it('calls a row stale when the painting changed, and unfinished when it has no status or sha', () => {
    const now = reading({ sha: 'f'.repeat(64) });
    expect(diffStored({ status: 'ok', sha: '0'.repeat(16) }, now).stale[0]).toMatch(/painting changed/);
    expect(diffStored({ stature: 1 }, now).missing).toEqual(['status', 'sha']);
    expect(diffStored(undefined, now).missing).toEqual(['row']);
  });

  it('reads the old tool\'s record against the drawn stature', () => {
    expect(recordStatureGap(reading({ stature: 0.4947 }), { stature: 0.852 })).toBeCloseTo(-0.357, 3);
    expect(recordStatureGap(reading(), undefined)).toBeNull();
  });

  it('trusts ok, held and waived; absent and blocked are not drawn', () => {
    expect(poseStatusTrusted('ok')).toBe(true);
    expect(poseStatusTrusted('held')).toBe(true);
    expect(poseStatusTrusted('waived')).toBe(true);
    expect(poseStatusTrusted('blocked')).toBe(false);
    expect(poseStatusTrusted(undefined)).toBe(false);
  });
});

// ------------------------------------------------------------------ the art half

const sha16 = (path: string): string | null => (existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 12) : null);
const artHas = (subject: string, pose: string, sha12: string): boolean => sha16(resolve(ART, 'characters', subject, `${pose}.png`)) === sha12;

interface Known {
  subject: string;
  pose: string;
  sha: string;
  why: string;
  /** Read against the rows as r50.1 shipped them (before the data lane registered the Dark Aeons and Valefor and repaired the five Lady Luck rows): `legacyInputs`. */
  before?: true;
  want: Partial<Record<'stature' | 'bodyStature' | 'headReal' | 'lengthRatio' | 'iou', number | null>> & { class: string; hasRow: boolean; anchorSrc?: string; feet?: { dx: number; dy: number } | null };
}

/** angle 1's own numbers (poses.csv), from its independent implementation; r50 art. */
const KNOWN: Known[] = [
  { subject: 'lulu', pose: 'hurt', sha: '34fc093a2614', why: 'FFX: a stature hold, the head paid for', want: { class: 'standing', hasRow: true, stature: 0.907, bodyStature: 0.874, headReal: 1.356, iou: 0.316, feet: { dx: 0, dy: 0 } } },
  { subject: 'lulu', pose: 'critical', sha: '01b736ed8dd5', why: 'FFX: the low class, a hold', want: { class: 'low', hasRow: true, stature: 0.754, bodyStature: 0.687, headReal: 1.374, iou: 0.461 } },
  { subject: 'lulu', pose: 'ko', sha: 'cdd75693478c', why: 'FFX: a KO is read by length', want: { class: 'ko', hasRow: true, lengthRatio: 0.423, headReal: 1, iou: 0.224, feet: null } },
  { subject: 'dark-sandy', pose: 'attack', sha: 'f231535d77ac', before: true, why: 'as r50.1 shipped it, FFX: a Dark Aeon with no row, the stance slides', want: { class: 'standing', hasRow: false, stature: 0.979, headReal: null, iou: 0.07, feet: { dx: -0.084, dy: 0.02 } } },
  { subject: 'paine-lady-luck', pose: 'hurt', sha: '68685265e295', before: true, why: 'as r50.1 shipped it, FFX-2: feetRow at the knees', want: { class: 'standing', hasRow: true, anchorSrc: 'feetRow', stature: 0.495, bodyStature: 0.322, iou: 0.092, feet: { dx: -0.023, dy: -0.356 } } },
  { subject: 'rikku-lady-luck', pose: 'attack', sha: '965c0e6b01b1', before: true, why: 'as r50.1 shipped it, FFX-2: feetRow at the knees', want: { class: 'standing', hasRow: true, anchorSrc: 'feetRow', stature: 0.434, bodyStature: 0.285, iou: 0.146, feet: { dx: -0.007, dy: -0.282 } } },
  { subject: 'bahamut', pose: 'attack', sha: '2331f25b981b', why: 'FFX: a player aeon, no head box', want: { class: 'standing', hasRow: true, stature: 1.047, headReal: null, iou: 0.694, feet: { dx: 0, dy: 0.006 } } },
  { subject: 'valefor', pose: 'attack', sha: '8d98a668c7ca', before: true, why: 'as r50.1 shipped it, FFX: an aeon with no row, laid down by the aspect test', want: { class: 'wide', hasRow: false, stature: 0.977, lengthRatio: 1.65, iou: 0.566, feet: null } },
  { subject: 'dark-sandy', pose: 'attack', sha: 'f231535d77ac', why: 'FFX: a Dark Aeon registered (2026-10-17), the stance no longer slides', want: { class: 'standing', hasRow: true, stature: 0.979, headReal: 1, iou: 0.331, feet: { dx: 0, dy: 0.0205 } } },
  { subject: 'paine-lady-luck', pose: 'hurt', sha: '68685265e295', why: "FFX-2: planted at the soles (2026-10-17), the record's own 0.85", want: { class: 'standing', hasRow: true, anchorSrc: 'baseline', stature: 0.851, feet: { dx: 0, dy: 0 } } },
  { subject: 'rikku-lady-luck', pose: 'attack', sha: '965c0e6b01b1', why: "FFX-2: planted at the soles (2026-10-17), the record's own 0.72", want: { class: 'standing', hasRow: true, anchorSrc: 'baseline', stature: 0.715, feet: { dx: 0, dy: 0 } } },
  { subject: 'valefor', pose: 'attack', sha: '8d98a668c7ca', why: 'FFX: an aeon registered with its stance (2026-10-17): upright, not laid down by the aspect test', want: { class: 'standing', hasRow: true } },
  { subject: 'rikku-songstress', pose: 'twirl-end', sha: '43c71b80a42c', why: 'FFX-2: the staged costume change', want: { class: 'staged', hasRow: false, stature: 1.121, iou: 0.318 } },
];

const artPresent = existsSync(resolve(ART, 'characters', 'lulu', 'idle.png'));
let inputsPromise: Promise<ModelInputs> | null = null;
const inputs = () => (inputsPromise ??= loadModelInputs({ root: ROOT }));
/**
 * The registration table as r50.1 shipped it for the rows the data lane changed (2026-10-17): no record for the Dark Aeons and Valefor, and the five Lady Luck rows planted
 * at the knees by a `feetRow` the generator wrote from a silhouette that had lost the boots. The independent second reading must keep catching exactly these.
 */
const legacyInputs = async (): Promise<ModelInputs> => {
  const base = await inputs();
  const table: Record<string, Record<string, ModelRow>> = {};
  for (const [s, rows] of Object.entries(base.table)) table[s] = { ...rows };
  for (const s of ['dark-sandy', 'dark-mindy', 'dark-cindy', 'dark-yojimbo', 'valefor']) delete table[s];
  const head = (h: [number, number, number, number]): ModelRow['head'] => h;
  table['paine-lady-luck'] = {
    ...table['paine-lady-luck'],
    follow: { scale: 1.611, stanceX: 328.0, feetRow: 552.0, head: head([0.36, 0.1298, 0.4722, 0.2113]) },
    hurt: { stanceX: 287.5, feetRow: 472.0, head: head([0.3136, 0.2478, 0.4962, 0.3429]) },
    'od-x2-lady-luck-attack-reels': { scale: 1.298, stanceX: 338.5, feetRow: 760.0, head: head([0.5257, 0.2855, 0.6679, 0.3586]) },
    'od-x2-lady-luck-magic-reels': { scale: 1.298, stanceX: 338.5, feetRow: 760.0, head: head([0.5257, 0.2855, 0.6679, 0.3586]) },
  };
  table['rikku-lady-luck'] = { ...table['rikku-lady-luck'], attack: { scale: 0.86, stanceX: 326.0, feetRow: 594.0, head: head([0.3381, 0.2702, 0.5213, 0.3646]) } };
  return { ...base, table, refs: new Map() };
};

describe.skipIf(!artPresent)('readPose against real paintings (angle 1\'s independent numbers)', () => {
  // a row whose painting is not the pinned one (other art in this tree) is skipped, never failed: nothing is pinned to art it was not measured on
  for (const k of KNOWN) it.skipIf(!artHas(k.subject, k.pose, k.sha))(`${k.subject}/${k.pose}: ${k.why}`, async () => {
    const r = await readPose(k.subject, k.pose, { inputs: k.before ? await legacyInputs() : await inputs() });
    expect(r.class).toBe(k.want.class);
    expect(r.hasRow).toBe(k.want.hasRow);
    if (k.want.anchorSrc) expect(r.anchorSrc).toBe(k.want.anchorSrc);
    for (const key of ['stature', 'bodyStature', 'headReal', 'lengthRatio'] as const) {
      const want = k.want[key];
      if (want === undefined) continue;
      if (want === null) expect(r[key], key).toBeNull();
      else expect(r[key], `${k.subject}/${k.pose} ${key}`).toBeCloseTo(want, 2);
    }
    if (k.want.iou !== undefined && k.want.iou !== null) expect(Math.abs((r.iou ?? 9) - k.want.iou), 'iou').toBeLessThan(0.02);
    if (k.want.feet === null) expect(r.feet).toBeNull();
    else if (k.want.feet) {
      expect(r.feet?.dx).toBeCloseTo(k.want.feet.dx, 2);
      expect(r.feet?.dy).toBeCloseTo(k.want.feet.dy, 2);
    }
    expect(r.sha.startsWith(k.sha)).toBe(true);
  });

  it.skipIf(!artHas('paine-lady-luck', 'hurt', '68685265e295'))('reads the Lady Luck knee-planted row two ways, and they disagree by the whole defect: 0.85 by the pixels, 0.49 as drawn', async () => {
    const r = await readPose('paine-lady-luck', 'hurt', { inputs: await legacyInputs() });
    expect(r.fromPixels.heightOverIdle).toBeGreaterThan(0.8); // the record's own 0.852: boots at the bottom of the painting
    expect(r.stature).toBeLessThan(0.55); // the engine plants the knee row on the floor
    expect(r.feetRowGap).toBeGreaterThan(0.3);
    expect(bandVerdict(r).flags).toEqual(expect.arrayContaining(['stature-low', 'feet-sunk']));
    expect(proposeStatus(r)).toBe('blocked');
  });

  it.skipIf(!artHas('dark-sandy', 'attack', 'f231535d77ac'))('flags the Dark Aeon pose with no row as unregistered, and its stance as off the idle\'s', async () => {
    const r = await readPose('dark-sandy', 'attack', { inputs: await legacyInputs() });
    const v = bandVerdict(r);
    expect(v.flags).toEqual(expect.arrayContaining(['unregistered', 'feet-x', 'feet-y']));
    expect(v.report).toContain('ghost-fail');
  });

  it.skipIf(!artHas('paine-lady-luck', 'hurt', '68685265e295'))("the repaired Lady Luck rows (feetRow guard, 2026-10-17) stand on their soles: the pixels' 0.85 is what is drawn, and no feet flag is left", async () => {
    for (const [subject, pose, stature] of [['paine-lady-luck', 'hurt', 0.851], ['paine-lady-luck', 'follow', 0.989], ['paine-lady-luck', 'od-x2-lady-luck-attack-reels', 1.13], ['rikku-lady-luck', 'attack', 0.715]] as const) {
      const r = await readPose(subject, pose, { inputs: await inputs() });
      expect(r.feetRowGap, `${subject}/${pose}`).toBe(0);
      expect(r.stature, `${subject}/${pose}`).toBeCloseTo(stature, 2);
      expect(Math.abs(r.fromPixels.heightOverIdle! - r.stature!), `${subject}/${pose}: the two readings agree`).toBeLessThan(0.02);
      expect(bandVerdict(r).flags.filter((f: string) => f.startsWith('feet')), `${subject}/${pose}`).toEqual([]);
    }
  });

  it.skipIf(!artHas('dark-sandy', 'attack', 'f231535d77ac'))('the four Dark Aeons are registered now: a stance row that agrees with the pixels, a head box, stature 0.94 to 1.00', async () => {
    for (const subject of ['dark-sandy', 'dark-mindy', 'dark-cindy', 'dark-yojimbo']) {
      for (const pose of ['attack', 'cast', 'hurt']) {
        const r = await readPose(subject, pose, { inputs: await inputs() });
        expect(r.hasRow, `${subject}/${pose}`).toBe(true);
        expect(r.hasHead, `${subject}/${pose} has a head box`).toBe(true);
        expect(r.stature!, `${subject}/${pose}`).toBeGreaterThan(0.93);
        expect(r.stature!, `${subject}/${pose}`).toBeLessThan(1.02);
        expect(Math.abs(r.feet!.dx), `${subject}/${pose} feet x`).toBeLessThan(0.02);
      }
    }
  });

  it.skipIf(!artHas('lulu', 'hurt', '34fc093a2614'))('passes Lulu hurt as a hold and rewrites the same row fields from a second reading', async () => {
    const r = await readPose('lulu', 'hurt', { inputs: await inputs() });
    expect(proposeStatus(r)).toBe('held');
    const fields = rowFieldsFromReading(r, 'held');
    expect(diffStored({ ...fields }, r)).toEqual({ stale: [], missing: [] });
    expect(diffStored({ ...fields, stature: 0.85 }, r).stale.length).toBe(1);
  });

  it('reads the repository\'s own tables and KO scales when none are given', async () => {
    const i = await inputs();
    expect(Object.keys(i.table).length).toBe(new Set([...Object.keys(POSE_REGISTRATION_FFX), ...Object.keys(POSE_REGISTRATION_FFX2), ...Object.keys(POSE_REGISTRATION_FOES), ...Object.keys(POSE_REGISTRATION_EXP)]).size);
    expect(i.koScale).toEqual(KO_POSE_SCALE);
    expect(i.tableSource['lulu']).toBe('ffx');
    expect(i.tableSource['paine-lady-luck']).toBe('ffx2');
  });
});
