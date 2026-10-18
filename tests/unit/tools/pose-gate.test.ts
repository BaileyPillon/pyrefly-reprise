/**
 * **The pose gate, on fixtures** (pose continuity, W1; both games). Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent
 * fix for this please." Every case here PASSED the checks that were in the tree on 2026-10-16 (`tools/pose-scale-check.mjs`, the engine's own table read by
 * CHK-026) and must now FAIL: an unregistered new subject, a stale sha, a knee-planted `feetRow`, a stature of 0.30 with a matched head, a ledger row added
 * with the driver's words. The art is rectangles with known sizes (`pose-gate-fixtures.ts`), so each failure is the gate's call and never a painting's.
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  censusReport, checkBuilt, countByCode, enforceBuiltPaintings, formatFailure, judgePainting, legacyPaintings, listBuiltPaintings, poseGateRefusal, runGate, scrubPath,
  type GateResult,
} from '../../../tools/pose-gate-lib.mjs';
import {
  LEDGER_PATH, LEGACY_REASON, LEGACY_WORDS, buildLegacyLedger, formatLedger, isBaileyWords, sealDigest, sealOf, validateLedger, waiverKey,
  type WaiverLedger, type WaiverRow,
} from '../../../tools/pose-gate-ledger.mjs';
import { checkPoseScale } from '../../../tools/pose-scale-check.mjs';
import { readSubject } from '../../../tools/posescale/pose-model.mjs';
import {
  BAILEY_SOURCE, BAILEY_WORDS, FIXTURE_DECISIONS, IDLE_FIG, ROOT, TALL_FIG, bareTable, installedTable, modelInputs, must, paint, paintBoss, paintTiny, rowOf, tempDir, withRow, type Table,
} from './pose-gate-fixtures.ts';

// each test spawns node processes or decodes images; under a full run of the suite the machine is busy, so the default 15 s is too short
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const art = tempDir('pose-gate-art-');
let fresh: Table; // what a fresh install writes for both fixture subjects
let sha: Record<string, string>; // full sha256 of each painting, by `subject/pose`

const gate = async (table: Table, ledger: WaiverLedger | null = null, subjects?: string[]): Promise<GateResult> =>
  runGate({ root: ROOT, inputs: await modelInputs(art, table), ledger, subjects, concurrency: 1, decisions: FIXTURE_DECISIONS, pin: null });
const shaOf = (key: string): string => must(sha[key], `sha of ${key}`);
const codes = (r: GateResult, key?: string): string[] => r.failures.filter((x) => !key || `${x.subject}/${x.pose}` === key).map((x) => x.code);

const waiverRow = (subject: string, pose: string, words: string, extra: Partial<WaiverRow> = {}): WaiverRow => ({
  subject, pose, sha: shaOf(`${subject}/${pose}`), reason: 'a fixture waiver', words, source: BAILEY_SOURCE, date: '2026-10-16', ...extra,
});
/** The ledger as validated in these tests: the fixture decisions, and the seal pinned to the ledger's own (a ledger built by the test is the "bootstrap" here). */
const check = (ledger: WaiverLedger, o: { base?: WaiverLedger | null; pin?: string | null } = {}): ReturnType<typeof validateLedger> =>
  validateLedger(ledger, { decisions: FIXTURE_DECISIONS, pin: o.pin !== undefined ? o.pin : sealDigest(ledger.legacySeal ?? []), ...(o.base !== undefined ? { base: o.base } : {}) });
const ledgerOf = (...rows: WaiverRow[]): WaiverLedger => ({ version: 1, rows });

beforeAll(async () => {
  await paintBoss(art);
  await paintTiny(art);
  const bare = bareTable();
  fresh = await installedTable(art, bare, 'zz-boss');
  fresh = await installedTable(art, fresh, 'zz-tiny');
  const inputs = await modelInputs(art, bare);
  sha = {};
  for (const s of ['zz-boss', 'zz-tiny']) for (const r of await readSubject(inputs, s)) sha[`${s}/${r.pose}`] = r.sha;
}, 60_000);

describe('a fresh install passes (the control: the fixtures are not failing for another reason)', () => {
  it('writes ok to the idle and the in-band attack, and blocked to the 0.30 hurt', () => {
    expect(rowOf(fresh, 'zz-boss', 'idle').status).toBe('ok');
    expect(rowOf(fresh, 'zz-boss', 'attack')).toMatchObject({ status: 'ok', class: 'standing' });
    expect(rowOf(fresh, 'zz-boss', 'attack').stature).toBeCloseTo(0.925, 2);
    expect(rowOf(fresh, 'zz-tiny', 'hurt')).toMatchObject({ status: 'blocked', class: 'standing' });
    expect(rowOf(fresh, 'zz-tiny', 'hurt').stature).toBeCloseTo(0.3, 2);
    expect(rowOf(fresh, 'zz-tiny', 'hurt').headReal).toBeCloseTo(1, 2);
    expect(rowOf(fresh, 'zz-boss', 'attack').sha).toBe(shaOf('zz-boss/attack').slice(0, 16));
  });

  it('passes the in-band subject with no ledger at all', async () => {
    const r = await gate(fresh, null, ['zz-boss']);
    expect(r.failures).toEqual([]);
    expect(r.entries.map((e) => e.outcome)).toEqual(['pass', 'pass']);
  });
});

describe('an unregistered new subject (FOC501-01, the Dark Aeons: painted, never measured)', () => {
  it('fails every painting of it with `unregistered`, and says what a fresh install would write', async () => {
    const art2 = tempDir('pose-gate-new-');
    await paint(art2, 'zz-new', 'idle', IDLE_FIG);
    await paint(art2, 'zz-new', 'attack', TALL_FIG);
    const r = await runGate({ root: ROOT, inputs: await modelInputs(art2, {}), ledger: null, concurrency: 1 });
    expect(codes(r)).toEqual(['unregistered', 'unregistered']);
    expect(must(r.failures[0], 'first failure').message).toContain('would write status ok');
    expect(formatFailure(must(r.failures[0], 'failure'))).toMatch(/^zz-new\/attack {2}unregistered {2}painted but not registered/);
  });

  it('is invisible to the check that was in the tree: tools/pose-scale-check.mjs passes it with no record and no table row', () => {
    // (angle 3 of the survey, probe (a): 0 failures, 0 notes, exit 0)
    const old = checkPoseScale({ records: { subjects: {} }, table: {}, artDir: art });
    expect(old.failures).toEqual([]);
  });
});

describe('a stale sha (the painting was re-installed since it was measured)', () => {
  it('fails `stale-sha`, in the pixels\' own words', async () => {
    const art2 = tempDir('pose-gate-stale-');
    mkdirSync(join(art2, 'characters', 'zz-boss'), { recursive: true });
    for (const f of ['idle', 'attack']) copyFileSync(join(art, 'characters', 'zz-boss', `${f}.png`), join(art2, 'characters', 'zz-boss', `${f}.png`));
    expect((await runGate({ root: ROOT, inputs: await modelInputs(art2, fresh), ledger: null, concurrency: 1 })).failures).toEqual([]);
    await paint(art2, 'zz-boss', 'attack', TALL_FIG, { tint: 40 }); // same figure, other pixels: a re-install
    const r = await runGate({ root: ROOT, inputs: await modelInputs(art2, fresh), ledger: null, concurrency: 1 });
    expect(codes(r)).toEqual(['stale-sha']);
    expect(must(r.failures[0], 'first failure').message).toContain('re-installed painting is measured again');
  });

  it('a re-installed painting loses its waiver: the ledger row is bound to the old sha', async () => {
    const art2 = tempDir('pose-gate-stale-waiver-');
    await paint(art2, 'zz-tiny', 'idle', IDLE_FIG);
    await paint(art2, 'zz-tiny', 'hurt', { x0: 150, x1: 250, y0: 330, y1: 450 });
    const table = await installedTable(art2, bareTable(), 'zz-tiny', { hurt: 'waived' });
    const inputs = await modelInputs(art2, table);
    const hurtSha = (await readSubject(inputs, 'zz-tiny')).find((x) => x.pose === 'hurt')!.sha;
    const ledger = ledgerOf({ subject: 'zz-tiny', pose: 'hurt', sha: hurtSha, reason: 'fixture', words: BAILEY_WORDS, source: BAILEY_SOURCE, date: '2026-10-16' });
    const o = { ledger, concurrency: 1, decisions: FIXTURE_DECISIONS, pin: null };
    expect((await runGate({ root: ROOT, inputs, ...o })).failures).toEqual([]);
    await paint(art2, 'zz-tiny', 'hurt', { x0: 150, x1: 250, y0: 330, y1: 450 }, { tint: 30 }); // re-installed
    const r = await runGate({ root: ROOT, inputs: await modelInputs(art2, table), ...o });
    expect(codes(r, 'zz-tiny/hurt')).toEqual(['stale-sha']);
    expect(r.entries.find((e) => e.pose === 'hurt')!.waived).toBe(false);
  });
});

describe('a knee-planted feetRow (the five Lady Luck rows: the table said 0.85, the game drew 0.49)', () => {
  it('fails `stale-reading` from the second reading and `out-of-band` from the feet, though the stored numbers sat in the band', async () => {
    const table = withRow(fresh, 'zz-boss', 'attack', { feetRow: 250 }); // planted 200 px above the soles; the stored stature (0.925) is the old tool's
    const r = await gate(table, null, ['zz-boss']);
    const own = codes(r, 'zz-boss/attack');
    expect(own).toContain('stale-reading');
    expect(own).toContain('out-of-band');
    const stale = r.failures.find((x) => x.code === 'stale-reading')!;
    expect(stale.message).toMatch(/stature 0\.925 stored, 0\.\d+ recomputed from the pixels/);
    const band = r.failures.find((x) => x.code === 'out-of-band')!;
    expect(band.message).toContain('feetRow');
    expect(band.message).toContain('planted at the knees');
    const entry = r.entries.find((e) => e.pose === 'attack')!;
    expect(entry.stature).toBeLessThan(0.6); // the game draws her at about half the height the table says
    expect(entry.flags).toEqual(expect.arrayContaining(['stature-low', 'feet-sunk']));
  });

  it('a stored reading the pixels do not give is stale even when the painting is in its band', async () => {
    const table = withRow(fresh, 'zz-boss', 'attack', { stature: 1.0, iou: 0.5 });
    const r = await gate(table, null, ['zz-boss']);
    expect(codes(r, 'zz-boss/attack')).toEqual(['stale-reading', 'stale-reading']);
  });
});

describe('a stature of 0.30 with a matched head (the old gate had no stature input)', () => {
  it('fails `blocked` when the install said blocked, and `out-of-band` when a row claims ok with honest numbers', async () => {
    const asInstalled = await gate(fresh, null, ['zz-tiny']);
    expect(codes(asInstalled, 'zz-tiny/hurt')).toEqual(['blocked']);
    expect(must(asInstalled.failures[0], 'first failure').message).toContain('stature 0.30 of its idle');
    expect(must(asInstalled.failures[0], 'first failure').message).toContain("Bailey's own quoted words");
    const claimedOk = withRow(fresh, 'zz-tiny', 'hurt', { status: 'ok' });
    const r = await gate(claimedOk, null, ['zz-tiny']);
    expect(codes(r, 'zz-tiny/hurt')).toEqual(['out-of-band']);
    expect(r.entries.find((e) => e.pose === 'hurt')!.flags).toEqual(['stature-low']); // the head is matched: only the height is wrong
  });

  it('the head being matched does not pass it: headReal is 1.00 and the verdict is still stature-low', async () => {
    const e = (await gate(fresh, null, ['zz-tiny'])).entries.find((x) => x.pose === 'hurt')!;
    expect(e.headReal).toBeCloseTo(1, 2);
    expect(e.stature).toBeCloseTo(0.3, 2);
    expect(e.flags).toEqual(['stature-low']);
  });
});

describe('the waiver ledger and its ratchet', () => {
  it('accepts Bailey\'s own quoted words and nothing else as a waiver', () => {
    expect(isBaileyWords(BAILEY_WORDS)).toBe(true);
    expect(isBaileyWords('Bailey: "ship that one as it is, it is fine"')).toBe(true);
    expect(isBaileyWords('Bailey: “ship that one as it is, it is fine”')).toBe(true);
    expect(isBaileyWords(LEGACY_WORDS)).toBe(false);
    expect(isBaileyWords('driver: ship it, Bailey asked for a permanent fix')).toBe(false); // names him, quotes nothing
    expect(isBaileyWords('driver, per Bailey: "ok"')).toBe(false); // a quote under ten characters
    expect(isBaileyWords('"ship that one as it is, it is fine"')).toBe(false); // a quote without his name
    expect(isBaileyWords(undefined)).toBe(false);
  });

  it('fails a ledger row added with the driver\'s words, and the painting stays unwaived', async () => {
    const ledger = ledgerOf(waiverRow('zz-tiny', 'hurt', 'driver, under Bailey\'s request to fix pose continuity'));
    const v = check(ledger);
    expect(v.problems.map((p) => p.code)).toEqual(['ledger-words']);
    expect(must(v.problems[0], 'first problem').message).toContain("not Bailey's own quoted words");
    expect(v.index.size).toBe(0);
    const table = withRow(fresh, 'zz-tiny', 'hurt', { status: 'waived' });
    const r = await gate(table, ledger, ['zz-tiny']);
    expect(r.failures.map((x) => x.code).sort()).toEqual(['ledger-words', 'waived-by-hand']);
    expect(r.entries.find((e) => e.pose === 'hurt')!.waived).toBe(false);
  });

  it('fails a `legacy` row the bootstrap did not write, even with the bootstrap\'s exact words', () => {
    const born = buildLegacyLedger([{ subject: 'zz-tiny', pose: 'hurt', sha: shaOf('zz-tiny/hurt') }], '2026-10-16');
    expect(check(born).problems).toEqual([]);
    const sneaked: WaiverLedger = { ...born, rows: [...born.rows, { ...waiverRow('zz-boss', 'attack', LEGACY_WORDS, { reason: LEGACY_REASON, legacy: true }) }] };
    const v = check(sneaked);
    expect(v.problems.map((p) => p.code)).toEqual(['ledger-legacy-added']);
    expect(must(v.problems[0], 'first problem').message).toContain('legacy rows may only be removed');
  });

  it('fails a legacy row added together with its seal entry: the seal is pinned in code, and the ledger at the base ref is the second witness', () => {
    const base = buildLegacyLedger([{ subject: 'zz-tiny', pose: 'hurt', sha: shaOf('zz-tiny/hurt') }], '2026-10-16');
    const forged = buildLegacyLedger([{ subject: 'zz-tiny', pose: 'hurt', sha: shaOf('zz-tiny/hurt') }, { subject: 'zz-boss', pose: 'attack', sha: shaOf('zz-boss/attack') }], '2026-10-17');
    const pinned = sealDigest(base.legacySeal ?? []);
    // the pin alone tells: the forged seal hashes to something else, whatever git says (no base ref at all)
    const byPin = check(forged, { pin: pinned });
    expect(byPin.problems.map((p) => p.code)).toEqual(['ledger-legacy-added']);
    expect(must(byPin.problems[0], 'first problem').message).toContain('LEGACY_SEAL_DIGEST');
    // an agent who also edits the pin in code is caught by the ledger the deploy last shipped
    const byBase = check(forged, { pin: null, base });
    expect(byBase.problems.map((p) => p.code)).toEqual(['ledger-legacy-added']);
    expect(must(byBase.problems[0], 'first problem').message).toContain('base ref');
    expect(check(base, { base: forged }).problems).toEqual([]); // removal is always allowed
    expect(check(forged, { pin: null }).problems).toEqual([]); // and with neither witness the forgery is invisible: why the deploy always gives a base and the pin is in code
  });

  it('writes the seal of exactly the rows it wrote, and a ledger round-trips through its text', () => {
    const born = buildLegacyLedger([{ subject: 'zz-tiny', pose: 'hurt', sha: shaOf('zz-tiny/hurt') }, { subject: 'zz-boss', pose: 'attack', sha: shaOf('zz-boss/attack') }], '2026-10-16');
    expect(born.rows.map((r) => `${r.subject}/${r.pose}`)).toEqual(['zz-boss/attack', 'zz-tiny/hurt']); // sorted
    expect(born.legacySeal).toEqual(born.rows.map((r) => sealOf(r.subject, r.pose, r.sha)).sort());
    expect(JSON.parse(formatLedger(born))).toEqual(born);
    expect(formatLedger(born).split('\n').filter((l) => l.includes('"legacy":true')).length).toBe(2); // one waiver to a line
  });

  it('rejects rows that are not bound to a whole painting hash, and duplicates', () => {
    const bad = ledgerOf({ ...waiverRow('zz-tiny', 'hurt', BAILEY_WORDS), sha: 'abc123' });
    expect(check(bad).problems.map((p) => p.code)).toEqual(['ledger-row']);
    const one = waiverRow('zz-tiny', 'hurt', BAILEY_WORDS);
    expect(check(ledgerOf(one, one)).problems.map((p) => p.code)).toEqual(['ledger-row']);
    expect(check({ version: 2, rows: [] } as unknown as WaiverLedger).problems.map((p) => p.code)).toEqual(['ledger-shape']);
  });

  it('waives a blocked painting with Bailey\'s words once the table says waived (the generator reads the ledger)', async () => {
    const ledger = ledgerOf(waiverRow('zz-tiny', 'hurt', BAILEY_WORDS));
    const table = withRow(fresh, 'zz-tiny', 'hurt', { status: 'waived' });
    const r = await gate(table, ledger, ['zz-tiny']);
    expect(r.failures).toEqual([]);
    expect(r.entries.find((e) => e.pose === 'hurt')).toMatchObject({ outcome: 'waived', waived: true, legacy: false });
    expect(r.ledger).toMatchObject({ exists: true, rows: 1, legacy: 0, bailey: 1 });
    // the ledger row alone is not enough: the table still says blocked, so the runtime would not draw it
    const stale = await gate(fresh, ledger, ['zz-tiny']);
    expect(codes(stale, 'zz-tiny/hurt')).toEqual(['waiver-not-compiled']);
  });

  it('refuses a table that says waived with no ledger row behind it', async () => {
    const table = withRow(fresh, 'zz-tiny', 'hurt', { status: 'waived' });
    const r = await gate(table, null, ['zz-tiny']);
    expect(codes(r, 'zz-tiny/hurt')).toEqual(['waived-by-hand']);
    expect(must(r.failures[0], 'first failure').message).toContain('generated from the ledger, never typed into a table');
  });
});

describe('what the legacy bootstrap waives', () => {
  it('lists the out-of-band and unregistered paintings, and leaves the in-band and the exempt ones alone', async () => {
    const art2 = tempDir('pose-gate-legacy-');
    await paintBoss(art2);
    await paintTiny(art2);
    await paint(art2, 'zz-new', 'idle', IDLE_FIG);
    await paint(art2, 'ff7-still', 'idle', IDLE_FIG);
    await paint(art2, 'ff7-still', 'attack', TALL_FIG);
    const r = await runGate({ root: ROOT, inputs: await modelInputs(art2, bareTable()), ledger: null, concurrency: 1 });
    const rows = legacyPaintings(r);
    expect(rows.map((x) => `${x.subject}/${x.pose}`)).toEqual(['zz-new/idle', 'zz-tiny/hurt']);
    expect(rows.find((x) => x.pose === 'hurt')!.flags).toEqual(['stature-low']);
    expect(rows.find((x) => x.subject === 'zz-new')!.flags).toEqual(['unregistered']);
    expect(legacyPaintings(r, { except: ['zz-new'] }).map((x) => x.subject)).toEqual(['zz-tiny']);
    expect(new Set(r.entries.filter((e) => e.outcome === 'exempt').map((e) => e.subject))).toEqual(new Set(['ff7-still']));
  });
});

describe('what the build ships', () => {
  const makeDist = (files: string[]): string => {
    const dist = tempDir('pose-gate-dist-');
    for (const f of files) {
      mkdirSync(join(dist, 'art', 'characters', must(f.split('/')[0], 'subject')), { recursive: true });
      writeFileSync(join(dist, 'art', 'characters', f), 'x');
    }
    return dist;
  };

  it('lists the character paintings (png or webp), not the @2x masters, the sidecars or the dotted candidates', () => {
    const dist = makeDist(['zz-boss/idle.webp', 'zz-boss/attack.png', 'zz-boss/attack@2x.png', 'zz-boss/attack.json', 'zz-boss/attack.1.png']);
    expect(listBuiltPaintings(dist).map((b) => b.file)).toEqual(['art/characters/zz-boss/attack.png', 'art/characters/zz-boss/idle.webp']);
  });

  it('refuses a painting the gate never read from a master (`built-unvetted`) and names nothing else', async () => {
    const result = await gate(fresh, null, ['zz-boss']);
    const dist = makeDist(['zz-boss/idle.webp', 'zz-boss/attack.webp', 'zz-ghost/idle.webp']);
    const unvetted = checkBuilt(listBuiltPaintings(dist), result);
    expect(unvetted).toEqual([expect.objectContaining({ subject: 'zz-ghost', pose: 'idle', code: 'built-unvetted' })]);
    const lines: string[] = [];
    const fail = (m: string): never => { throw new Error(m); };
    expect(() => enforceBuiltPaintings({ dist, result, log: (l) => lines.push(l), fail })).toThrow(/pose gate refuses this deploy \(on the built art list\)/);
    expect(lines[0]).toBe('pose gate (the build): 3 character paintings shipped, 1 the gate did not read or that changed since it did');
    expect(enforceBuiltPaintings({ dist: makeDist(['zz-boss/idle.webp']), result, log: () => {}, fail })).toHaveLength(1);
  });

  it('the refusal says a waiver row with Bailey\'s quoted words is the only way through, and that --owner-override does not cover it', () => {
    const msg = poseGateRefusal([{ code: 'unregistered' }, { code: 'unregistered' }, { code: 'blocked' }], 'before the build, on public/art');
    expect(msg).toContain('2 unregistered, 1 blocked');
    expect(msg).toContain(LEDGER_PATH);
    expect(msg).toContain("Bailey's own quoted words");
    expect(msg).toContain('--owner-override and --skip-tests do not cover it');
    expect(countByCode([{ code: 'a' }, { code: 'a' }, { code: 'b' }])).toEqual({ a: 2, b: 1 });
  });
});

describe('the census', () => {
  it('is JSON-safe, carries the bands and the totals, and names no folder of this machine', async () => {
    const r = await gate(fresh, null);
    const report = censusReport(r);
    const text = JSON.stringify(report);
    expect(report.schema).toBe('pose-gate-report/1');
    expect(report.totals).toMatchObject({ subjects: 2, paintings: 4, pass: 3, fail: 1, exempt: 0, waived: 0 });
    expect(report.failuresByCode).toEqual({ blocked: 1 });
    expect(report.outOfBand.map((e: { key: string }) => e.key)).toEqual(['zz-tiny/hurt']);
    expect(report.bands.standing.stature).toEqual([0.9, 1.1]);
    expect(text).not.toContain(art.replace(/\\/g, '\\\\'));
    expect(text).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(censusReport(r, { full: true }).entries).toHaveLength(4);
  });
});

describe('a painting that cannot be read', () => {
  it('is an `unreadable` failure for its subject, not a crash, and the other subjects are still judged', async () => {
    const art2 = tempDir('pose-gate-bad-');
    await paintBoss(art2);
    mkdirSync(join(art2, 'characters', 'zz-bad'), { recursive: true });
    writeFileSync(join(art2, 'characters', 'zz-bad', 'idle.png'), 'this is not a png');
    const r = await runGate({ root: ROOT, inputs: await modelInputs(art2, fresh), ledger: null, concurrency: 2 });
    expect(r.failures.map((x) => `${x.subject}/${x.pose}  ${x.code}`)).toEqual(['zz-bad/*  unreadable']);
    expect(r.entries.filter((e) => e.subject === 'zz-boss')).toHaveLength(2);
    const text = JSON.stringify(censusReport(r));
    expect(text).toContain('cannot vouch');
    expect(text).not.toContain('pose-gate-bad-'); // no folder of this machine in the census
  });

  it('scrubPath names the art folder `<art>` in either slash style', () => {
    expect(scrubPath(String.raw`x D:\work\art\characters and D:/work/art/characters`, String.raw`D:\work\art`)).toBe(String.raw`x <art>\characters and <art>/characters`);
    expect(scrubPath('nothing here', undefined)).toBe('nothing here');
  });
});

describe('judgePainting on a reading alone (no files)', () => {
  it('passes a staged twirl painting and an FF7 still as exempt and fails nothing for them', () => {
    const base = { hasRow: false, class: 'staged', kind: 'dressphere-ffx2' } as never;
    expect(judgePainting(base, undefined, undefined)).toMatchObject({ outcome: 'exempt', failures: [] });
    expect(judgePainting({ hasRow: false, class: 'part', kind: 'ff7' } as never, undefined, undefined).outcome).toBe('exempt');
  });

  it('keys a waiver to subject, pose and the whole sha', () => {
    expect(waiverKey('a', 'b', 'c')).toBe('a/b/c');
  });
});
