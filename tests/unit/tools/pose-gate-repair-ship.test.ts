/**
 * **The pose gate, second pass, part two: what ships and whose word** (pose continuity repair, 2026-10-17; both games). Bailey, 2026-10-16: "pose continuity is the strongest
 * recurring issue we need a permanent fix for this please." The hi-DPI masters beside a painting, the master the build ships, the waiver's quotation checked against the
 * decisions ledger, the ratchet that fails closed, and the installer. The first part is `pose-gate-repair.test.ts`.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { checkMastersUnchanged, enforceBuiltPaintings, judgePainting, listBuiltPaintings, runGate } from '../../../tools/pose-gate-lib.mjs';
import { LEDGER_PATH, LEGACY_SEAL_DIGEST, buildLegacyLedger, loadDecisionWords, loadLedgerAtRef, quotedPassages, sealDigest, validateLedger, verifyBaileyWords } from '../../../tools/pose-gate-ledger.mjs';
import { applyInstall, hiresBeside, planInstall, poseGateAfter, register, subjectsWithoutAnnotation } from '../../../tools/art-install-lib.mjs';
import { checkHires } from '../../../tools/posescale/pose-hires.mjs';
import { readSubject } from '../../../tools/posescale/pose-model.mjs';
import { readPaint } from '../../../tools/posescale/pose-pixels.mjs';
import {
  BAILEY_SAID, BAILEY_SOURCE, BAILEY_WORDS, FIXTURE_DECISIONS, IDLE_FIG, ROOT, TALL_FIG, bareTable, codesOf, fakeRoot, gateOf as gate, inputsFor, installedTable, must, only, paint,
  paintBoss, tempDir, withRow, type Fig, type Table,
} from './pose-gate-fixtures.ts';

// each test decodes images or spawns git; under a full run of the suite the machine is busy, so the default 15 s is too short
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('the hi-DPI masters (`@2x`, `@3x`, `@4x`) beside a painting are part of it', () => {
  const art = tempDir('pose-gate-hires-');
  let fresh: Table;
  const dbl = (f: Fig): Fig => ({ x0: f.x0 * 2, x1: f.x1 * 2, y0: f.y0 * 2, y1: f.y1 * 2 });
  beforeAll(async () => {
    await paintBoss(art);
    fresh = await installedTable(art, bareTable(), 'zz-boss');
    await paint(art, 'zz-boss', 'attack@2x', dbl(TALL_FIG), { W: 800, H: 1000 });
  }, 60_000);

  it('passes a master that is the 1x painting at twice the size', async () => {
    const m = await readPaint(join(art, 'characters', 'zz-boss', 'attack.png'), 'attack');
    expect(await checkHires(join(art, 'characters', 'zz-boss'), 'attack', m)).toEqual([]);
    expect((await gate(art, fresh, { subjects: ['zz-boss'], hires: true })).failures).toEqual([]);
  });

  it('refuses a `@2x` that is another painting (the 1x was replaced and the master left behind): `hires-differs`', async () => {
    const art2 = tempDir('pose-gate-hires-old-');
    await paintBoss(art2);
    await paint(art2, 'zz-boss', 'attack@2x', dbl({ x0: 150, x1: 250, y0: 200, y1: 450 }), { W: 800, H: 1000 }); // the OLD, shorter figure
    const r = await gate(art2, fresh, { subjects: ['zz-boss'], hires: true });
    expect(codesOf(r, 'zz-boss/attack')).toEqual(['hires-differs']);
    expect(must(r.failures[0], 'failure').message).toContain('left behind');
  });

  it('refuses a master that is not exactly N times the 1x size (any tier): `hires-size`', async () => {
    const art2 = tempDir('pose-gate-hires-size-');
    await paintBoss(art2);
    await paint(art2, 'zz-boss', 'idle@4x', { x0: 600, x1: 1000, y0: 200, y1: 1800 }, { W: 1600, H: 2100 });
    const r = await gate(art2, fresh, { subjects: ['zz-boss'], hires: true });
    expect(codesOf(r, 'zz-boss/idle')).toEqual(['hires-size']);
  });

  it('a waiver does not cover a stale master: a waived painting with a bad `@2x` still fails', async () => {
    const art2 = tempDir('pose-gate-hires-waived-');
    await paintBoss(art2);
    await paint(art2, 'zz-boss', 'attack@2x', dbl({ x0: 150, x1: 250, y0: 200, y1: 450 }), { W: 800, H: 1000 });
    const reading = (await readSubject(await inputsFor(art2, fresh, true), 'zz-boss', { poses: ['attack'] }))[0]!;
    const waiver = { subject: 'zz-boss', pose: 'attack', sha: reading.sha, reason: 'x', words: BAILEY_WORDS, source: BAILEY_SOURCE, date: '2026-10-17' };
    const j = judgePainting(reading, withRow(fresh, 'zz-boss', 'attack', { status: 'waived' })['zz-boss']!.attack, waiver);
    expect(j.failures.map((x) => x.code)).toContain('hires-differs');
  });

  it('an exempt painting (a staged twirl) with a stale master fails too', async () => {
    const art2 = tempDir('pose-gate-hires-twirl-');
    await paint(art2, 'rikku-songstress', 'idle', IDLE_FIG);
    await paint(art2, 'rikku-songstress', 'twirl-end', TALL_FIG);
    await paint(art2, 'rikku-songstress', 'twirl-end@2x', { x0: 100, x1: 300, y0: 100, y1: 900 }, { W: 800, H: 1000 });
    const r = await gate(art2, { 'rikku-songstress': { idle: { stanceX: 200 } } }, { subjects: ['rikku-songstress'], hires: true });
    expect(codesOf(r, 'rikku-songstress/twirl-end')).toEqual(['hires-differs']);
  });

  it('the installer moves a replaced painting\'s hi-DPI masters aside with it', async () => {
    const target = tempDir('art-install-hires-');
    await paintBoss(target);
    await paint(target, 'zz-boss', 'attack@2x', dbl(TALL_FIG), { W: 800, H: 1000 });
    for (const f of ['idle', 'attack', 'attack@2x']) writeFileSync(join(target, 'characters', 'zz-boss', `${f}.json`), '{"width":400,"height":500,"facing":"right"}\n');
    expect(hiresBeside(join(target, 'characters', 'zz-boss'), 'attack').map((p) => p.split(/[\\/]/).pop())).toEqual(['attack@2x.png', 'attack@2x.json']);
    const from = tempDir('art-install-hires-src-');
    copyFileSync(join(target, 'characters', 'zz-boss', 'attack.png'), join(from, 'attack.png'));
    writeFileSync(join(from, 'attack.json'), '{"width":400,"height":500,"facing":"right"}\n');
    const backup = tempDir('art-install-hires-backup-');
    const plan = await planInstall({ target, items: [{ subject: 'zz-boss', from, poses: ['attack'] }], replace: true, backup });
    expect(plan.problems).toEqual([]);
    expect(must(plan.writes[0], 'write').replaces.map((p) => p.split(/[\\/]/).pop())).toEqual(['attack.png', 'attack.json', 'attack@2x.png', 'attack@2x.json']);
    applyInstall(plan, { backup });
    expect(existsSync(join(target, 'characters', 'zz-boss', 'attack@2x.png'))).toBe(false);
    expect(existsSync(join(backup, 'zz-boss', 'attack@2x.png'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('the build ships the painting the gate read', () => {
  it('a master that changed between the gate and the build is `master-changed`', async () => {
    const art = tempDir('pose-gate-toctou-');
    await paintBoss(art);
    const t = await installedTable(art, bareTable(), 'zz-boss');
    const result = await gate(art, only(t, 'zz-boss'));
    expect(result.failures).toEqual([]);
    const dist = tempDir('pose-gate-toctou-dist-');
    mkdirSync(join(dist, 'art', 'characters', 'zz-boss'), { recursive: true });
    for (const f of ['idle', 'attack']) writeFileSync(join(dist, 'art', 'characters', 'zz-boss', `${f}.webp`), 'x');
    const built = listBuiltPaintings(dist);
    expect(checkMastersUnchanged(built, result)).toEqual([]);
    await paint(art, 'zz-boss', 'attack', TALL_FIG, { tint: 50 }); // the art fleet writes into the shared tree after stage one
    const changed = checkMastersUnchanged(built, result);
    expect(changed.map((x) => `${x.subject}/${x.pose} ${x.code}`)).toEqual(['zz-boss/attack master-changed']);
    expect(() => enforceBuiltPaintings({ dist, result, log: () => {}, fail: (m: string): never => { throw new Error(m); } })).toThrow(/pose gate refuses this deploy \(on the built art list\)/);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('whose words: a waiver quotes a decision, and the gate checks the quotation against the decisions ledger', () => {
  const row = (over: Record<string, unknown> = {}): Record<string, unknown> => ({ words: BAILEY_WORDS, source: BAILEY_SOURCE, ...over });

  it('accepts his sentence, quoted verbatim, from the decision it names', () => {
    expect(verifyBaileyWords(row(), FIXTURE_DECISIONS)).toBeNull();
    expect(verifyBaileyWords(row({ words: `Bailey: \u201c${BAILEY_SAID}\u201d` }), FIXTURE_DECISIONS)).toBeNull(); // curly quotes
    expect(verifyBaileyWords(row({ words: 'Bailey: "a permanent fix for this please."' }), FIXTURE_DECISIONS)).toBeNull(); // a passage of it
    expect(quotedPassages('Bailey: "short" and "a long enough passage here"')).toEqual(['a long enough passage here']);
  });

  it('refuses a sentence made up in his name, which used to pass because it named him and had ten quoted characters', () => {
    expect(verifyBaileyWords(row({ words: 'Bailey "xxxxxxxxxx"' }), FIXTURE_DECISIONS)).toContain('is not in D-9990');
    expect(verifyBaileyWords(row({ words: 'Bailey: "ship the squashed Tidus, it is fine"' }), FIXTURE_DECISIONS)).toContain('is not in D-9990');
    expect(verifyBaileyWords(row({ words: 'driver note: Bailey approved this' }), FIXTURE_DECISIONS)).toContain('do not name him');
  });

  it('refuses a row that names no decision, a decision that is not in the ledger, one with no words, and a ledger it cannot read', () => {
    expect(verifyBaileyWords({ words: BAILEY_WORDS }, FIXTURE_DECISIONS)).toContain('"source"');
    expect(verifyBaileyWords(row({ source: 'D-1' }), FIXTURE_DECISIONS)).toContain('"source"'); // not a D-nnn
    expect(verifyBaileyWords(row({ source: 'D-9991' }), FIXTURE_DECISIONS)).toContain('is not in the decisions ledger');
    expect(verifyBaileyWords(row(), new Map([[BAILEY_SOURCE, '']]))).toContain('records no words');
    expect(verifyBaileyWords(row(), new Map())).toContain('could not be read');
    expect(verifyBaileyWords(row(), null)).toContain('could not be read');
  });

  it('reads the real decisions ledger of this repository (D-nnn and E-nnn each with their words)', () => {
    const real = loadDecisionWords(ROOT);
    expect(real.size).toBeGreaterThan(100);
    expect([...real.keys()].some((k) => k.startsWith('E-'))).toBe(true);
    expect(real.get('D-785')).toContain('all your recommendations');
  });

  it('validateLedger fails closed with no decisions loaded', () => {
    const l = { version: 1 as const, rows: [{ subject: 'a', pose: 'b', sha: 'c'.repeat(64), reason: 'r', words: BAILEY_WORDS, source: BAILEY_SOURCE, date: '2026-10-17' }] };
    expect(validateLedger(l, { pin: null }).problems.map((p) => p.code)).toEqual(['ledger-words']);
    expect(validateLedger(l, { pin: null, decisions: FIXTURE_DECISIONS }).problems).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('the ratchet fails closed', () => {
  /** A fake repository root with a git history: the ledger committed (or not) at HEAD. */
  const repo = (committed: boolean): string => {
    const art = fakeRoot({}, { ledger: { version: 1, rows: [] } });
    const git = (...a: string[]): string => execFileSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', ...a], { cwd: art, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    git('init', '-q');
    if (committed) git('add', '-A');
    else git('add', 'src');
    git('commit', '-q', '-m', 'x', '--allow-empty');
    return art;
  };
  const artWithBoss = tempDir('pose-gate-ratchet-art-');
  let table: Table;
  beforeAll(async () => {
    await paintBoss(artWithBoss);
    table = only(await installedTable(artWithBoss, bareTable(), 'zz-boss'), 'zz-boss');
  }, 60_000);

  it('tells a ledger at the ref, no ledger there yet, and a ref git cannot read apart', () => {
    const withLedger = repo(true);
    const without = repo(false);
    expect(loadLedgerAtRef(withLedger, 'HEAD')).toMatchObject({ state: 'ref', ledger: { version: 1, rows: [] } });
    expect(loadLedgerAtRef(without, 'HEAD')).toMatchObject({ state: 'absent', ledger: null });
    expect(loadLedgerAtRef(withLedger, 'not-a-ref')).toMatchObject({ state: 'error', ledger: null });
    expect(loadLedgerAtRef(tempDir('not-a-repo-'), 'HEAD').state).toBe('error');
  });

  it('a base ref git cannot read is a `ledger-base` failure, not a skipped check', async () => {
    const root = repo(true);
    for (const baseRef of ['not-a-ref', '$(whoami)', 'HEAD~40']) {
      const r = await runGate({ root, artDir: artWithBoss, inputs: await inputsFor(artWithBoss, table), baseRef, concurrency: 1 });
      expect(r.failures.map((x) => x.code), baseRef).toEqual(['ledger-base']);
      expect(must(r.failures[0], 'failure').message).toContain('the ratchet\'s second half was not checked');
      expect(r.ledger.base).toBe('error');
    }
  });

  it('a ref that has no ledger yet (the first deploy after it was born) passes on the pinned seal and says so; a ref with one compares', async () => {
    const root = repo(false);
    const o = { root, artDir: artWithBoss, concurrency: 1 };
    const first = await runGate({ ...o, inputs: await inputsFor(artWithBoss, table), baseRef: 'HEAD' });
    expect(first.failures).toEqual([]);
    expect(first.ledger.base).toBe('absent');
    expect(first.notes.some((n) => n.message.includes('first build with a ledger'))).toBe(true);
    const second = await runGate({ ...o, root: repo(true), inputs: await inputsFor(artWithBoss, table), baseRef: 'HEAD' });
    expect(second.ledger.base).toBe('ref');
    const none = await runGate({ ...o, inputs: await inputsFor(artWithBoss, table) });
    expect(none.ledger.base).toBe('none');
    expect(none.notes.some((n) => n.message.includes('no base ref was given'))).toBe(true);
  });

  it('the seal is pinned in code for this repository\'s own ledger: the real ledger hashes to the pinned digest, a forged seal does not', () => {
    const real = JSON.parse(readFileSync(join(ROOT, LEDGER_PATH), 'utf8')) as { legacySeal: string[] };
    expect(sealDigest(real.legacySeal)).toBe(LEGACY_SEAL_DIGEST);
    const forged = buildLegacyLedger([{ subject: 'a', pose: 'b', sha: 'c'.repeat(64) }], '2026-10-17');
    expect(validateLedger(forged).problems.map((p) => p.code)).toEqual(['ledger-legacy-added']);
    expect(sealDigest(['b', 'a'])).toBe(sealDigest(['a', 'b'])); // order does not matter
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('installing', () => {
  it('stops before it measures a subject that tools/posescale/subjects.json does not annotate (it used to register a figure with no head and call it done)', () => {
    const root = tempDir('art-install-ann-');
    mkdirSync(join(root, 'tools', 'posescale'), { recursive: true });
    writeFileSync(join(root, 'tools', 'posescale', 'subjects.json'), JSON.stringify({ 'zz-known': { game: 'foe', rowFromBaseline: true } }));
    expect(subjectsWithoutAnnotation(['zz-known', 'zz-new'], root)).toEqual(['zz-new']);
    const calls: string[] = [];
    const logs: string[] = [];
    const r = register({ subjects: ['zz-known', 'zz-new'], target: tempDir('art-install-ann-t-'), root, python: 'py.exe', log: (l) => logs.push(l), run: (cmd) => { calls.push(cmd); return { status: 0 }; } });
    expect(r).toMatchObject({ ok: false, step: 'annotation' });
    expect(calls).toEqual([]);
    expect(logs.join('\n')).toContain('zz-new is not in tools/posescale/subjects.json');
    expect(logs.join('\n')).toContain('"game": "foe", "rowFromBaseline": true');
  });

  it('measure.py refuses a subject with no entry, rather than reading it as a figure with no face', () => {
    const py = process.env.ART_INSTALL_PYTHON ?? 'D:/Tools/ComfyUI/python_embeded/python.exe';
    if (!existsSync(py)) return; // no interpreter on this machine
    let out = '';
    try {
      execFileSync(py, ['-s', 'tools/posescale/measure.py', 'measure', 'zz-no-such-subject'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { out = String((e as { stderr?: string }).stderr ?? e); }
    expect(out).toContain('zz-no-such-subject: not in tools/posescale/subjects.json');
  });

  it('hires-install and gui-art-install end in the pose gate for the subjects they touched', () => {
    const calls: Array<{ cmd: string; args: string[] }> = [];
    expect(poseGateAfter({ art: 'X:/art', subjects: [], log: () => {}, run: () => ({ status: 9 }) })).toBe(0);
    const logs: string[] = [];
    const status = poseGateAfter({ art: 'X:/art', subjects: ['tidus', 'lulu'], root: ROOT, log: (l) => logs.push(l), run: (cmd, args) => { calls.push({ cmd, args }); return { status: 1 }; } });
    expect(status).toBe(1);
    expect(must(calls[0], 'call').args.slice(1)).toEqual(['--check', '--art', resolve('X:/art'), '--root', ROOT, '--subjects', 'tidus,lulu']);
    expect(logs.join('\n')).toContain('NOT shippable');
  });
});
