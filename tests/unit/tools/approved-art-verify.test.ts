/**
 * **The deploy refuses a `public/art` that is older than the code** (r76c review, MINOR 5; both games, release plumbing). The code names paintings only a newer art mirror holds (release 76's wave-2 chapters name the r76b
 * mirror's); a build cut with `public/art` still pointing at r76 passed the pose gate and the unit tests (the art-reading ones skip) and would have shipped 404 plates and placeholder sprites. `tools/approved-art-verify.mjs`
 * hashes every file the two pin lists name and `tools/deploy-pages.mjs` calls it before the build. This file proves the check on a fake tree, and reads the deploy script for where it is called.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { approvedArtRefusal, enforceApprovedArt, PIN_LISTS, verifyApprovedArt } from '../../../tools/approved-art-verify.mjs';

const REPO = resolve(__dirname, '..', '..', '..');
const made: string[] = [];
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});
const sha = (bytes: string): string => createHash('sha256').update(bytes).digest('hex');

/** A fake repo root: the art files given (`path -> bytes`) and the pin lists given (`list -> sets`). */
function fakeTree(files: Record<string, string>, lists: Record<string, Record<string, Record<string, unknown>>>): string {
  const root = mkdtempSync(join(tmpdir(), 'approved-art-'));
  made.push(root);
  for (const [path, bytes] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), bytes);
  }
  for (const [list, sets] of Object.entries(lists)) {
    mkdirSync(join(root, list, '..'), { recursive: true });
    writeFileSync(join(root, list), JSON.stringify({ sets }));
  }
  return root;
}

const APPROVED = PIN_LISTS[0]!;
const LOCKED = PIN_LISTS[1]!;

describe('verifyApprovedArt', () => {
  it('counts a pin whose file is there with the recorded hash, and reads both lists', () => {
    const root = fakeTree(
      { 'public/art/backdrops/a.png': 'AAA', 'public/art/pause/b.png': 'BBB' },
      {
        [APPROVED]: { one: { words: 'Bailey', note: 'a note', 'public/art/backdrops/a.png': { sha256: sha('AAA') } } },
        [LOCKED]: { two: { 'public/art/pause/b.png': { sha256: sha('BBB') } } },
      },
    );
    expect(verifyApprovedArt({ root })).toEqual({ ok: 2, bad: [], missing: [], pins: 2 });
  });

  it('names a file that is not in public/art as missing (an art mirror older than the code), and one with other bytes as bad', () => {
    const root = fakeTree(
      { 'public/art/backdrops/a.png': 'CHANGED' },
      {
        [APPROVED]: {
          one: { 'public/art/backdrops/a.png': { sha256: sha('AAA') }, 'public/art/backdrops/via-purifico-flooded-1.png': { sha256: sha('NEW') } },
        },
      },
    );
    const result = verifyApprovedArt({ root });
    expect(result.missing).toEqual(['public/art/backdrops/via-purifico-flooded-1.png']);
    expect(result.bad).toEqual(['public/art/backdrops/a.png']);
    expect(result.ok).toBe(0);
  });

  it('checks a tree with no judge-locked list against the approved list alone, and ignores entries that carry no hash', () => {
    const root = fakeTree({ 'public/art/x.png': 'X' }, { [APPROVED]: { s: { 'public/art/x.png': { sha256: sha('X') }, 'public/art/skipped.png': { mtime: 'no hash here' } } } });
    expect(verifyApprovedArt({ root })).toEqual({ ok: 1, bad: [], missing: [], pins: 1 });
  });

  it('reads the public/art pins from an art mirror when artDir is given (the tree\'s own public/art is not looked at), and every other pin from the root', () => {
    const root = fakeTree({ 'docs/other.json': 'D' }, { [APPROVED]: { s: { 'public/art/backdrops/a.png': { sha256: sha('AAA') }, 'docs/other.json': { sha256: sha('D') } } } });
    const mirror = fakeTree({ 'backdrops/a.png': 'AAA' }, {});
    expect(verifyApprovedArt({ root, artDir: mirror })).toEqual({ ok: 2, bad: [], missing: [], pins: 2 });
    expect(verifyApprovedArt({ root }).missing).toEqual(['public/art/backdrops/a.png']);
    expect(() => enforceApprovedArt({ root, artDir: mirror, log: () => {}, fail: (m) => { throw new Error(m); } })).not.toThrow();
  });

  it('judges a file two sets pin by each pin (a file with two different recorded hashes is bad once)', () => {
    const root = fakeTree({ 'public/art/x.png': 'X' }, { [APPROVED]: { early: { 'public/art/x.png': { sha256: sha('OLD') } }, late: { 'public/art/x.png': { sha256: sha('X') } } } });
    const result = verifyApprovedArt({ root });
    expect(result.ok).toBe(1);
    expect(result.bad).toEqual(['public/art/x.png']);
  });
});

describe('enforceApprovedArt (the deploy\'s check)', () => {
  const fail = (m: string): never => {
    throw new Error(m);
  };

  it('returns the result and logs one census line for a tree whose pins are all in place', () => {
    const root = fakeTree({ 'public/art/x.png': 'X' }, { [APPROVED]: { s: { 'public/art/x.png': { sha256: sha('X') } } } });
    const lines: string[] = [];
    const result = enforceApprovedArt({ root, log: (l) => lines.push(l), fail });
    expect(result.ok).toBe(1);
    expect(lines).toEqual(['approved art: 1 pinned painting(s), 1 ok, 0 with another hash, 0 missing']);
  });

  it('ends the deploy on a missing pin, listing it, with the refusal that says what to do', () => {
    const root = fakeTree({}, { [APPROVED]: { s: { 'public/art/characters/baralai/idle.png': { sha256: sha('B') } } } });
    const lines: string[] = [];
    expect(() => enforceApprovedArt({ root, log: (l) => lines.push(l), fail })).toThrow(/approved-art check refuses this deploy: 1 missing of 1 pinned painting\(s\).*older than the code/);
    expect(lines).toContain('  missing: public/art/characters/baralai/idle.png');
  });

  it('ends the deploy on a changed painting too, and says how many of each', () => {
    const root = fakeTree({ 'public/art/x.png': 'X2' }, { [APPROVED]: { s: { 'public/art/x.png': { sha256: sha('X') }, 'public/art/y.png': { sha256: sha('Y') } } } });
    expect(() => enforceApprovedArt({ root, log: () => {}, fail })).toThrow(/1 missing and 1 with a different hash of 2 pinned/);
    expect(approvedArtRefusal({ ok: 0, bad: ['a'], missing: [], pins: 1 })).toMatch(/1 with a different hash of 1 pinned/);
  });

  it('stops listing at 25 of each and says how many more', () => {
    const pins: Record<string, unknown> = {};
    for (let i = 0; i < 30; i++) pins[`public/art/m${i}.png`] = { sha256: sha(String(i)) };
    const root = fakeTree({}, { [APPROVED]: { s: pins } });
    const lines: string[] = [];
    expect(() => enforceApprovedArt({ root, log: (l) => lines.push(l), fail })).toThrow(/30 missing of 30/);
    expect(lines.filter((l) => l.startsWith('  missing: '))).toHaveLength(25);
    expect(lines).toContain('  ... and 5 more (node tools/verify-approved-art.mjs lists them all)');
  });
});

describe('tools/deploy-pages.mjs', () => {
  const deploy = readFileSync(join(REPO, 'tools', 'deploy-pages.mjs'), 'utf8').replace(/\r\n/g, '\n');
  const at = (needle: string): number => {
    const i = deploy.indexOf(needle);
    expect(i, `deploy-pages.mjs should contain ${needle}`).toBeGreaterThan(-1);
    return i;
  };

  it('imports the check where it runs and calls it right after the pose gate, before the build and before the release gate --owner-override reaches', () => {
    expect(deploy).toMatch(/\n {2}const \{ enforceApprovedArt \} = await import\('\.\/approved-art-verify\.mjs'\);\n/);
    expect(deploy).toMatch(/\n {2}enforceApprovedArt\(\{ root: ROOT, log, fail \}\);\n/);
    const call = at('enforceApprovedArt({ root: ROOT, log, fail });');
    expect(call).toBeGreaterThan(at('await enforcePoseGate('));
    expect(call).toBeLessThan(at("runNpx(['vite', 'build'"));
    expect(call).toBeLessThan(at('= releaseGateFor(plan, mainSha);'));
  });

  it('is not relaxed by --owner-override, --skip-tests or --allow-dirty', () => {
    const line = deploy.slice(at('enforceApprovedArt({ root: ROOT'), deploy.indexOf('\n', at('enforceApprovedArt({ root: ROOT')));
    expect(line).not.toMatch(/OVERRIDE|SKIP|ALLOW_DIRTY/i);
    const skipBranch = at('preflight: skipping tsc/vitest (--skip-tests)');
    expect(deploy.slice(skipBranch, at('enforceApprovedArt({ root: ROOT'))).not.toMatch(/SKIP_TESTS|ALLOW_DIRTY|OWNER_OVERRIDE|process\.argv|args\[/);
  });

  it('the repo\'s own two pin lists are the ones the check reads', () => {
    expect(PIN_LISTS).toEqual(['docs/target/approved-hashes.json', 'docs/target/judge-locked-hashes.json']);
    for (const list of PIN_LISTS) expect(readFileSync(join(REPO, list), 'utf8')).toContain('"sets"');
  });
});
