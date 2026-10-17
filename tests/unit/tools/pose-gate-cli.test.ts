/**
 * **The pose gate's command line and the deploy's two stages** (pose continuity, W1; both games), run on a fake repository root and a folder of rectangle
 * paintings (`pose-gate-fixtures.ts`): `--check` (exit 1 and one line per failure), `--report` (the census), `--write-legacy` (once, never twice), `--dist`
 * (a build that ships a painting the gate never read), and `enforcePoseGate`, the function `tools/deploy-pages.mjs` calls before the build. Bailey, 2026-10-16:
 * "pose continuity is the strongest recurring issue we need a permanent fix for this please."
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { enforcePoseGate } from '../../../tools/pose-gate-lib.mjs';
import { LEGACY_REASON, LEGACY_WORDS, sealDigest, validateLedger, type WaiverLedger } from '../../../tools/pose-gate-ledger.mjs';
import {
  IDLE_FIG, ROOT, TALL_FIG, bareTable, fakeRoot, installedTable, must, only, paint, paintBoss, paintTiny, tempDir, withRow, type Table,
} from './pose-gate-fixtures.ts';

// each test spawns node processes or decodes images; under a full run of the suite the machine is busy, so the default 15 s is too short
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const CLI = resolve(ROOT, 'tools', 'pose-gate.mjs');
const art = tempDir('pose-gate-cli-art-');
let fresh: Table;

const run = (args: string[], root: string, artDir = art): { code: number; out: string; err: string } => {
  const r = spawnSync(process.execPath, [CLI, ...args, '--root', root, '--art', artDir, '--quiet'], { encoding: 'utf8', timeout: 120_000 });
  return { code: r.status ?? -1, out: r.stdout, err: r.stderr };
};

beforeAll(async () => {
  await paintBoss(art);
  await paintTiny(art);
  fresh = await installedTable(art, bareTable(), 'zz-boss');
  fresh = await installedTable(art, fresh, 'zz-tiny');
}, 60_000);

describe('node tools/pose-gate.mjs --check', () => {
  it('exits 0 and says PASS for a folder whose every painting has a fresh row', () => {
    const bossOnly = only(fresh, 'zz-boss');
    const art2 = tempDir('pose-gate-cli-pass-');
    return paintBoss(art2).then(() => {
      const r = run(['--check'], fakeRoot(bossOnly), art2);
      expect(r.err).toBe('');
      expect(r.code).toBe(0);
      expect(r.out).toContain('pose-gate: 2 paintings of 1 subjects: 2 pass, 0 waived, 0 exempt, 0 fail; ledger absent');
      expect(r.out).toContain('pose-gate: PASS');
    });
  });

  it('exits 1 with one line per failure: the blocked 0.30 hurt and nothing else', () => {
    const r = run(['--check'], fakeRoot(fresh));
    expect(r.code).toBe(1);
    const fails = r.out.split('\n').filter((l) => l.startsWith('FAIL'));
    expect(fails).toHaveLength(1);
    expect(fails[0]).toMatch(/^FAIL {2}zz-tiny\/hurt {2}blocked {2}blocked, not waived: stature-low \(stature 0\.30 of its idle's height\)/);
    expect(r.out).toContain('pose-gate: FAIL, 1 failure(s): 1 blocked');
  });

  it('exits 1 on a painted subject that is in no table: the case that shipped the Dark Aeons', async () => {
    const art2 = tempDir('pose-gate-cli-new-');
    await paint(art2, 'zz-new', 'idle', IDLE_FIG);
    await paint(art2, 'zz-new', 'attack', TALL_FIG);
    const r = run(['--check'], fakeRoot({}), art2);
    expect(r.code).toBe(1);
    expect(r.out).toContain('FAIL  zz-new/attack  unregistered  painted but not registered');
    expect(r.out).toContain('FAIL  zz-new/idle  unregistered');
    expect(r.out).toContain('2 unregistered');
  });

  it('exits 2 for a folder with no character paintings, and 2 for an unknown --subjects name it cannot read', () => {
    const empty = tempDir('pose-gate-cli-empty-');
    mkdirSync(join(empty, 'characters'), { recursive: true });
    expect(run(['--check'], fakeRoot({}), empty).code).toBe(2);
    const r = run(['--check', '--subjects', 'zz-nothing'], fakeRoot(fresh));
    expect(r.code).toBe(1);
    expect(r.out).toContain('unknown-subject');
  });

  it('exits 2 and prints the usage when no mode, or two, are given', () => {
    expect(run([], fakeRoot(fresh)).code).toBe(2);
    expect(run(['--check', '--report'], fakeRoot(fresh)).code).toBe(2);
  });

  it('--dist refuses a build that ships a character painting the gate never read from a master', async () => {
    const art2 = tempDir('pose-gate-cli-dist-art-');
    await paintBoss(art2);
    const dist = tempDir('pose-gate-cli-dist-');
    mkdirSync(join(dist, 'art', 'characters', 'zz-boss'), { recursive: true });
    mkdirSync(join(dist, 'art', 'characters', 'zz-ghost'), { recursive: true });
    for (const f of ['zz-boss/idle.webp', 'zz-boss/attack.webp', 'zz-ghost/idle.webp']) writeFileSync(join(dist, 'art', 'characters', f), 'x');
    const root = fakeRoot(only(fresh, 'zz-boss'));
    const r = run(['--check', '--dist', dist], root, art2);
    expect(r.code).toBe(1);
    expect(r.out).toContain('the build holds 3 character paintings');
    expect(r.out).toContain('FAIL  zz-ghost/idle  built-unvetted');
    expect(run(['--check', '--dist', join(dist, 'nothing')], root, art2).code).toBe(2); // not a build folder: a typo must not read as a pass
  });
});

describe('node tools/pose-gate.mjs --report', () => {
  it('prints the census as JSON and writes it to --out', () => {
    const root = fakeRoot(fresh);
    const r = run(['--report'], root);
    expect(r.code).toBe(0);
    const report = JSON.parse(r.out);
    expect(report.schema).toBe('pose-gate-report/1');
    expect(report.totals).toMatchObject({ paintings: 4, pass: 3, fail: 1 });
    const out = join(tempDir('pose-gate-cli-out-'), 'census.json');
    expect(run(['--report', '--out', out], root).code).toBe(0);
    expect(JSON.parse(readFileSync(out, 'utf8')).totals.paintings).toBe(4);
  });
});

describe('node tools/pose-gate.mjs --write-legacy', () => {
  it('lists what it would waive with --dry, writes the ledger once, and refuses a second run', () => {
    const root = fakeRoot(fresh);
    const ledgerPath = join(root, 'docs', 'target', 'pose-waivers.json');
    const dry = run(['--write-legacy', '--dry', '--date', '2026-10-16'], root);
    expect(dry.code).toBe(0);
    expect(dry.out).toContain('zz-tiny: hurt[stature-low]');
    expect(dry.out).toContain('1 legacy waiver row(s) over 1 subjects out of 4 paintings');
    expect(existsSync(ledgerPath)).toBe(false);

    const wrote = run(['--write-legacy', '--date', '2026-10-16'], root);
    expect(wrote.code).toBe(0);
    const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8')) as WaiverLedger;
    expect(ledger.rows).toHaveLength(1);
    expect(must(ledger.rows[0], 'row')).toMatchObject({ subject: 'zz-tiny', pose: 'hurt', reason: LEGACY_REASON, words: LEGACY_WORDS, date: '2026-10-16', legacy: true });
    expect(must(ledger.rows[0], 'row').sha).toMatch(/^[0-9a-f]{64}$/);
    expect(validateLedger(ledger, { pin: sealDigest(ledger.legacySeal ?? []) }).problems).toEqual([]);

    const again = run(['--write-legacy'], root);
    expect(again.code).toBe(2);
    expect(again.err).toContain('exists already');
    expect(JSON.parse(readFileSync(ledgerPath, 'utf8'))).toEqual(ledger); // untouched
  });

  it('after the bootstrap the gate passes only once the table says waived (the generator reads the ledger), and a row added by hand fails', () => {
    const root = fakeRoot(fresh);
    expect(run(['--write-legacy', '--date', '2026-10-16'], root).code).toBe(0);
    const before = run(['--check'], root);
    expect(before.code).toBe(1);
    expect(before.out).toContain('waiver-not-compiled'); // the table still says blocked

    const table = withRow(fresh, 'zz-tiny', 'hurt', { status: 'waived' });
    const waivedRoot = fakeRoot(table);
    writeFileSync(join(waivedRoot, 'docs', 'target', 'pose-waivers.json'), readFileSync(join(root, 'docs', 'target', 'pose-waivers.json')));
    const after = run(['--check'], waivedRoot);
    expect(after.out).toContain('pose-gate: 4 paintings of 2 subjects: 3 pass, 1 waived, 0 exempt, 0 fail; ledger 1 row(s) (1 legacy, 0 Bailey\'s; compared with no base ref, the pinned seal only)');
    expect(after.code).toBe(0);

    // an agent adds a waiver for the in-band attack with its own words: the gate fails the ledger
    const ledgerPath = join(waivedRoot, 'docs', 'target', 'pose-waivers.json');
    const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8')) as WaiverLedger;
    const { legacy: _legacy, ...first } = must(ledger.rows[0], 'row');
    ledger.rows.push({ ...first, pose: 'attack', words: 'driver: it looks fine' });
    writeFileSync(ledgerPath, JSON.stringify(ledger));
    const grown = run(['--check'], waivedRoot);
    expect(grown.code).toBe(1);
    expect(grown.out).toContain('ledger-words');
  });
});

describe('enforcePoseGate (the deploy\'s stage one)', () => {
  const lines: string[] = [];
  const fail = (m: string): never => { throw new Error(m); };

  it('returns the result for a passing folder and logs the one-line census', async () => {
    const art2 = tempDir('pose-gate-enforce-pass-');
    await paintBoss(art2);
    lines.length = 0;
    const result = await enforcePoseGate({ root: fakeRoot(only(fresh, 'zz-boss')), artDir: art2, log: (l) => lines.push(l), fail });
    expect(result.failures).toEqual([]);
    expect(lines).toEqual(['pose gate: 2 paintings of 1 subjects, 0 waived, 0 failure(s); ledger absent']);
  }, 60_000);

  it('ends the deploy on a failure, listing it, with the refusal that names the ledger as the only way through', async () => {
    lines.length = 0;
    await expect(enforcePoseGate({ root: fakeRoot(fresh), artDir: art, log: (l) => lines.push(l), fail })).rejects.toThrow(
      /pose gate refuses this deploy \(before the build, on public\/art\): 1 failure\(s\) \(1 blocked\).*Bailey's own quoted words is the only way through; --owner-override and --skip-tests do not cover it/s,
    );
    expect(lines.some((l) => l.includes('zz-tiny/hurt  blocked'))).toBe(true);
  }, 60_000);

  it('ends the deploy when the art folder holds no character painting at all (an empty folder cannot be vouched for)', async () => {
    const empty = tempDir('pose-gate-enforce-empty-');
    mkdirSync(join(empty, 'characters'), { recursive: true });
    await expect(enforcePoseGate({ root: fakeRoot({}), artDir: empty, log: () => {}, fail })).rejects.toThrow(/read no character painting/);
  });
});
