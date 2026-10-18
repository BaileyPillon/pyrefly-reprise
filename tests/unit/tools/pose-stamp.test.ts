/**
 * **The table stamp** (pose continuity, W1; both games): `tools/posescale/pose-stamp.mjs` writes what the install says about each painting (`status`, `class`, `stature`,
 * `headReal`, `lengthRatio`, `iou`, `sha`) into the generated registration tables, as the last step of `measure.py table`. Bailey, 2026-10-16: "pose continuity is the
 * strongest recurring issue we need a permanent fix for this please." The pure half (parse, render, which paintings get a row, how a row is stamped) runs anywhere; the
 * data half holds the tables as the data lane left them: every row stamped, none blocked, the five Lady Luck rows on their soles.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { POSE_REGISTRATION } from '../../../src/engine/PoseRegistration.ts';
import { poseStatusTrusted } from '../../../src/data/art/poseRegistrationTypes.ts';
import type { PoseReading } from '../../../tools/posescale/pose-model.mjs';
import { STAMP_FIELDS, TABLE_GROUPS, applyStamps, computeStamps, groupFor, parseTable, readTables, renderTable } from '../../../tools/posescale/pose-stamp-lib.mjs';

const ROOT = resolve(__dirname, '..', '..', '..');
const SHA = 'a'.repeat(64);
const CRLF = '\r\n';

/** The fields of a reading the bands, the status and the stamp read; the rest of a real reading is left out. */
const reading = (over: Partial<PoseReading> & Record<string, unknown>): PoseReading =>
  ({
    subject: 'boss', pose: 'attack', kind: 'boss-foe', game: 'FFX', class: 'standing', isRef: false, hasRow: false, held: false, stature: 1, headReal: 1, lengthRatio: null,
    iou: 0.5, feet: { dx: 0, dy: 0 }, feetRowGap: 0, massRatio: null, sha: SHA, ...over,
  }) as unknown as PoseReading;

const TEXT = [
  "import type { PoseRegistrationTable } from './poseRegistrationTypes.ts';",
  '',
  '/** Generated. */',
  'export const POSE_REGISTRATION_FOES: PoseRegistrationTable = {',
  '  boss: {',
  '    attack: { stanceX: 100.0, head: [0.1, 0.2, 0.3, 0.4] },',
  "    'od-x': { scale: 1.5, stanceX: 90.5, upright: true },",
  '  },',
  "  'zz-last': {",
  '    idle: { stanceX: 10.0 },',
  '  },',
  '};',
  '',
].join(CRLF);

const EMPTY = (name: string): string => ["import type { PoseRegistrationTable } from './poseRegistrationTypes.ts';", '', `export const POSE_REGISTRATION_${name}: PoseRegistrationTable = {`, '};', ''].join(CRLF);

describe('parseTable and renderTable', () => {
  it('round-trip the generated files byte for byte (CRLF, number formats, quoted keys, arrays)', () => {
    for (const g of TABLE_GROUPS) {
      const text = readFileSync(resolve(ROOT, 'src', 'data', 'art', g.file), 'utf8');
      expect(renderTable(parseTable(text)), g.file).toBe(text);
    }
  });

  it('read a row into its fields, keep the quoted pose keys and the arrays whole, and say which line they cannot read', () => {
    const t = parseTable(TEXT);
    expect(t.name).toBe('POSE_REGISTRATION_FOES');
    expect(t.subjects.map((s) => s.key)).toEqual(['boss', 'zz-last']);
    expect(t.subjects[0]!.rows[0]).toEqual({ key: 'attack', entries: [['stanceX', '100.0'], ['head', '[0.1, 0.2, 0.3, 0.4]']] });
    expect(t.subjects[0]!.rows[1]!.key).toBe('od-x');
    expect(() => parseTable(TEXT.replace('upright: true', 'upright true'))).toThrow(/cannot read the entry/);
    expect(() => parseTable(TEXT.replace(`  },${CRLF}  'zz-last'`, `  nonsense,${CRLF}  'zz-last'`))).toThrow(/grammar/);
  });
});

describe('computeStamps: which paintings get a row', () => {
  const inputs = { table: { boss: { attack: { stanceX: 100 } } } as never };
  const none = new Map();

  it('stamps a painting with numbers in the table, or a record, or a waiver, and no other (a painting nobody registered must stay without a row)', () => {
    const rs = [reading({ pose: 'attack' }), reading({ pose: 'cast' }), reading({ pose: 'hurt' }), reading({ pose: 'item' })];
    const records = { subjects: { boss: { game: 'foe', poses: { cast: { sha: SHA } } } } };
    const waivers = new Map([[`boss/hurt/${SHA}`, { legacy: true }]]);
    const out = computeStamps(rs, inputs, records, waivers);
    expect(out.map((s) => `${s.pose}:${s.status}`)).toEqual(['attack:ok', 'cast:ok', 'hurt:waived']);
  });

  it('writes blocked for an out-of-band painting that no ledger row waives, and waived once the ledger has its sha (never for another sha)', () => {
    const tall = reading({ stature: 0.3 });
    expect(computeStamps([tall], inputs, undefined, none)[0]!.status).toBe('blocked');
    expect(computeStamps([tall], inputs, undefined, new Map([[`boss/attack/${SHA}`, {}]]))[0]!.status).toBe('waived');
    expect(computeStamps([tall], inputs, undefined, new Map([[`boss/attack/${'b'.repeat(64)}`, {}]]))[0]!.status).toBe('blocked');
  });

  it('never stamps an exempt painting (an FFX-2 twirl key, an FF7 still) and never one the record skips', () => {
    const rs = [reading({ pose: 'twirl-end', class: 'staged' }), reading({ subject: 'ff7-guard', kind: 'ff7', pose: 'idle' }), reading({ pose: 'idle-far' })];
    const records = { subjects: { boss: { poses: { 'idle-far': { skip: 'the airship director places it' } } }, 'ff7-guard': { poses: { idle: {} } } } };
    expect(computeStamps(rs, inputs, records, none)).toEqual([]);
  });

  it("writes the install's fields: class, the readings rounded to three places, the first 16 hex characters of the sha", () => {
    const [s] = computeStamps([reading({ stature: 0.98765, headReal: 1.0004, iou: 0.3333, lengthRatio: null })], inputs, undefined, none);
    expect(s!.fields).toEqual({ status: 'ok', class: 'standing', stature: 0.988, headReal: 1, iou: 0.333, sha: 'a'.repeat(16) });
  });

  it('says held for a pose that rides a recorded hold and is in band', () => {
    const [s] = computeStamps([reading({ held: true, headReal: 1.3, stature: 0.91 })], inputs, undefined, none);
    expect(s!.status).toBe('held');
  });
});

describe('applyStamps', () => {
  const stamp = (subject: string, pose: string, extra: Record<string, unknown> = {}) => ({
    subject, pose, status: 'ok' as const, game: 'FFX', record: undefined, fields: { status: 'ok' as const, class: 'standing', stature: 1, sha: 'a'.repeat(16), ...extra },
  });
  const tables = () => ({ foes: parseTable(TEXT), ffx: parseTable(EMPTY('FFX')), ffx2: parseTable(EMPTY('FFX2')), exp: parseTable(EMPTY('EXP')) });

  it("appends the stamped fields after the generator's own and replaces an earlier stamp: running it twice changes nothing", () => {
    const t = tables();
    const first = applyStamps(t, [stamp('boss', 'attack')] as never);
    expect(first.updated).toBe(1);
    expect(renderTable(t.foes)).toContain("attack: { stanceX: 100.0, head: [0.1, 0.2, 0.3, 0.4], status: 'ok', class: 'standing', stature: 1, sha: 'aaaaaaaaaaaaaaaa' },");
    const again = applyStamps(t, [stamp('boss', 'attack', { stature: 0.95 })] as never);
    expect(again.changed.has('foes')).toBe(true);
    expect(renderTable(t.foes)).toContain("status: 'ok', class: 'standing', stature: 0.95, sha:");
    expect(renderTable(t.foes).match(/status:/g)).toHaveLength(1);
    expect(applyStamps(t, [stamp('boss', 'attack', { stature: 0.95 })] as never).changed.size).toBe(0);
  });

  it("adds a row for a painting whose generated row had no number (sorted among the subject's poses) and a subject that had none, in the file its game names", () => {
    const t = tables();
    const r = applyStamps(t, [stamp('boss', 'ko'), stamp('boss', 'aaa'), { ...stamp('new-boss', 'idle'), record: { game: 'foe' } }, { ...stamp('girl-thing', 'idle'), game: 'FFX-2' }] as never);
    expect(r.added).toBe(4);
    expect(t.foes.subjects[0]!.rows.map((x) => x.key)).toEqual(['aaa', 'attack', 'ko', 'od-x']);
    expect(t.foes.subjects.map((s) => s.key)).toEqual(['boss', 'new-boss', 'zz-last']);
    expect(t.ffx2.subjects.map((s) => s.key)).toEqual(['girl-thing']);
  });

  it('leaves every subject outside `only` exactly as it is', () => {
    const t = tables();
    const before = renderTable(t.foes);
    applyStamps(t, [stamp('zz-last', 'idle')] as never, { only: new Set(['boss']) });
    expect(renderTable(t.foes)).toBe(before);
  });

  it('groupFor: a foe by its record, a girl by her game, the hidden chapter by its prefix, anything unknown with the foes', () => {
    expect(groupFor('x', { game: 'foe' }, 'FFX')).toBe('foes');
    expect(groupFor('x', { game: 'ffx2' }, 'FFX')).toBe('ffx2');
    expect(groupFor('x', undefined, 'FFX-2')).toBe('ffx2');
    expect(groupFor('x', undefined, 'FFX')).toBe('ffx');
    expect(groupFor('exp-leblanc-yuna-gunner', undefined, 'FFX-2')).toBe('exp');
    expect(groupFor('x', undefined, 'unknown')).toBe('foes');
  });
});

describe('the generated tables as the data lane left them (2026-10-17)', () => {
  const rows = Object.entries(POSE_REGISTRATION).flatMap(([subject, poses]) => Object.entries(poses).map(([pose, row]) => ({ subject, pose, row })));

  it('every row that carries a status is one the runtime trusts: ok, held or waived; none is blocked', () => {
    const stamped = rows.filter((r) => r.row.status !== undefined);
    expect(stamped.length).toBeGreaterThan(800);
    for (const { subject, pose, row } of stamped) expect(poseStatusTrusted(row.status), `${subject}/${pose} is ${row.status}`).toBe(true);
  });

  it('every stamped row carries its whole stamp (class, sha of 16 hex characters), and the stamp fields come last and in order', () => {
    for (const { subject, pose, row } of rows) {
      if (row.status === undefined) continue;
      expect(row.class, `${subject}/${pose}`).toBeTruthy();
      expect(row.sha, `${subject}/${pose}`).toMatch(/^[0-9a-f]{16}$/);
    }
    for (const g of TABLE_GROUPS) {
      const text = readFileSync(resolve(ROOT, 'src', 'data', 'art', g.file), 'utf8');
      for (const line of text.split(CRLF).filter((l) => l.includes('status:'))) {
        const keys = [...line.matchAll(/\b(status|class|stature|headReal|lengthRatio|iou|sha):/g)].map((m) => m[1]!);
        expect(keys, line).toEqual(STAMP_FIELDS.filter((k) => keys.includes(k)));
      }
    }
  });

  it('the five Lady Luck rows stand on their soles: no feetRow, the stance read from the soles', () => {
    for (const [s, p] of [['paine-lady-luck', 'hurt'], ['paine-lady-luck', 'follow'], ['paine-lady-luck', 'od-x2-lady-luck-attack-reels'], ['paine-lady-luck', 'od-x2-lady-luck-magic-reels'], ['rikku-lady-luck', 'attack']] as const) {
      expect(POSE_REGISTRATION[s]![p]!.feetRow, `${s}/${p}`).toBeUndefined();
    }
    expect(POSE_REGISTRATION['paine-lady-luck']!['hurt']!.stanceX).toBe(266.5);
  });

  it('the four Dark Aeons have a stance and a head box in every standing pose; the tips read by eye keep their feet rows', () => {
    for (const s of ['dark-sandy', 'dark-mindy', 'dark-cindy', 'dark-yojimbo']) {
      for (const p of ['attack', 'cast', 'hurt']) {
        expect(POSE_REGISTRATION[s]![p]!.stanceX, `${s}/${p}`).toBeGreaterThan(0);
        expect(POSE_REGISTRATION[s]![p]!.head, `${s}/${p}`).toBeDefined();
      }
    }
    expect(POSE_REGISTRATION['yuna-dark-knight']!['ready']!.feetRow).toBe(1016);
    expect(POSE_REGISTRATION['yuna-warrior']!['sleep']!.feetRow).toBe(1072);
  });

  it('every subject the game draws that had no record on r50.1 has rows now', () => {
    for (const s of ['valefor', 'ixion', 'x2-ixion', 'seymour-guest', 'pterya', 'paragon', 'yunalesca-3', 'vegnagun-body', 'vegnagun-head', 'vegnagun-tail', 'sinspawn-gui', 'overdrive-sin']) {
      expect(Object.keys(POSE_REGISTRATION[s] ?? {}).length, s).toBeGreaterThan(0);
      expect(POSE_REGISTRATION[s]!['idle'], `${s} idle`).toBeDefined();
    }
  });

  it('the stamp tool is the last step of `measure.py table` (and `table --no-stamp` is the way to skip it)', () => {
    const py = readFileSync(resolve(ROOT, 'tools', 'posescale', 'measure.py'), 'utf8');
    expect(py).toContain('pose-stamp.mjs');
    expect(py).toMatch(/if stamp:\s+run_stamp\(\)/);
    expect(py).toContain('--no-stamp');
    expect(existsSync(resolve(ROOT, 'tools', 'posescale', 'pose-stamp.mjs'))).toBe(true);
  });

  it('readTables reads the four generated files', () => {
    const t = readTables(ROOT);
    expect(Object.keys(t).sort()).toEqual(['exp', 'ffx', 'ffx2', 'foes']);
    expect(t.foes!.subjects.some((s) => s.key === 'dark-sandy')).toBe(true);
  });
});
