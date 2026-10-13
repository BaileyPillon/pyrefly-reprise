/**
 * **Loading the camera programs** (`src/engine/ffxcam/load.ts`) and the rule-8 guard around them.
 *
 * Bailey's FFX camera data is a transcription of the game's scripts: never in the repo, never on the site (AGENTS.md hard rule 8). It reaches the game only through the dev server's read-only local
 * route, and this file pins how that goes wrong gracefully:
 *
 * 1. **the pure half**: an index and its program files become the encounter's camera data, or a reason (a path that could leave the folder, a tag naming a program nobody defines, an action row that
 *    is not a row, a program that fails validation, a program listed twice);
 * 2. **the fetching half**: nothing is fetched unless `import.meta.env.DEV`; nothing there is null and quiet (a 404, a network error); data that is there but wrong is null with ONE warning; the
 *    requests stay inside `/__ffx-local/camera/<encounter>/`;
 * 3. **the guard**: no camera-program JSON anywhere in `src/`, `tests/`, `public/` or `tools/`, and none tracked by git under a program's file name.
 *
 * Synthetic data throughout. Game case: FFX only.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CAMERA_INDEX_FORMAT, buildFfxCameraPrograms, checkCameraIndex, isIndexPath, loadFfxCameraPrograms } from '../../src/engine/ffxcam/load.ts';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const rawProgram = (id: string, over: Record<string, unknown> = {}): Record<string, unknown> => ({ format: 'ffx-cam-ir/1', id, entryIndex: 0, code: [{ op: 'camSetScrDpt', args: [1024] }, { op: 'ret' }], ...over });
const FILES = (): Map<string, unknown> =>
  new Map<string, unknown>([
    ['programs/a.json', rawProgram('s.w3.f3')],
    ['programs/b.json', rawProgram('s.w3.f9')],
  ]);
const row = { command: 12354, steps: [{ at: 'start', tags: [27], worker: false }, { at: 'launch', tags: [52], worker: true }] };
const index = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  format: CAMERA_INDEX_FORMAT,
  encounter: 'evrae',
  source: 'made up',
  programs: ['programs/a.json', 'programs/b.json'],
  scripts: ['s', 'c'],
  tags: { 's:0:24': 's.w3.f3', 's:0:26': 's.w3.f9', 'c:0:24': 's.w3.f9' },
  actions: { party: { fire: row }, monster: { breath: { command: 24673, steps: [] } }, items: { potion: { command: 8192, steps: [] } }, attack: { party: row } },
  constants: { CurrentBattle: 37027840 },
  range: { tag: 0, variable: 'battle:0x4', chr: 20, distanceProp: 30, pullBack: { value: 1, distance: 3 }, moveIn: { value: 2, distance: 0 } },
  ...over,
});
const problemOf = (raw: unknown, files = FILES()): string => {
  const b = buildFfxCameraPrograms(raw, files);
  if ('programs' in b) throw new Error('expected a problem');
  return b.problem;
};

describe('the index and the programs become the encounter\'s camera data', () => {
  it('builds the book, the action table, the constants and the range', () => {
    const b = buildFfxCameraPrograms(index(), FILES());
    if (!('programs' in b)) throw new Error(b.problem);
    const p = b.programs;
    expect(p.encounter).toBe('evrae');
    expect(p.source).toBe('made up');
    expect(p.book.size).toBe(2);
    expect(p.book.resolve({ tags: [24] })?.id).toBe('s.w3.f3'); // the formation's tag 24
    expect(p.book.resolve({ tags: [26] })?.id).toBe('s.w3.f9');
    expect(p.actions.party['fire']).toEqual(row);
    expect(p.actions.monster['breath']?.command).toBe(24673);
    expect(p.actions.items['potion']?.command).toBe(8192);
    expect(p.actions.attack.party).toEqual(row);
    expect(p.actions.attack.monster).toBeUndefined();
    expect(p.constants).toEqual({ CurrentBattle: 37027840 });
    expect(p.range).toEqual({ tag: 0, variable: 'battle:0x4', chr: 20, distanceProp: 30, pullBack: { value: 1, distance: 3 }, moveIn: { value: 2, distance: 0 } });
  });

  it('the tables, constants and range are optional: an encounter with none still loads', () => {
    const b = buildFfxCameraPrograms(index({ actions: {}, constants: undefined, range: null }), FILES());
    if (!('programs' in b)) throw new Error(b.problem);
    expect(b.programs.actions.party).toEqual({});
    expect(b.programs.constants).toEqual({});
    expect(b.programs.range).toBeNull();
  });

  it('lists the files an index names, for the loader to fetch', () => {
    expect(checkCameraIndex(index())).toEqual({ files: ['programs/a.json', 'programs/b.json'] });
  });
});

describe('what is refused, with a reason (nothing partial is returned)', () => {
  it.each([
    ['not an object', null, /not an object/],
    ['the wrong format', index({ format: 'ffxcam-index/2' }), /format/],
    ['no encounter', index({ encounter: '' }), /encounter/],
    ['no programs', index({ programs: [] }), /programs/],
    ['no scripts', index({ scripts: [] }), /scripts/],
    ['tags that are not an object', index({ tags: [] }), /tags/],
    ['a tag that names no id', index({ tags: { 's:0:24': '' } }), /tags\["s:0:24"\]/],
    ['no actions', index({ actions: undefined }), /actions/],
    ['an action table that is not an object', index({ actions: { party: [] } }), /actions\.party/],
    ['constants that are not numbers', index({ constants: { CurrentBattle: 'x' } }), /constants\.CurrentBattle/],
    ['a range without its tag', index({ range: { variable: 'v', chr: 1, distanceProp: 2 } }), /range/],
    ['a range move without its distance', index({ range: { tag: 0, variable: 'v', chr: 1, distanceProp: 2, pullBack: { value: 1 }, moveIn: { value: 2, distance: 0 } } }), /range\.pullBack/],
  ])('%s', (_name, raw, reason) => {
    const c = checkCameraIndex(raw);
    expect('problem' in c && c.problem).toMatch(reason);
  });

  it.each([
    ['a command that is not an integer', { command: 'x', steps: [] }, /needs an integer/],
    ['no steps', { command: 1 }, /"steps" list/],
    ['a step at a time that does not exist', { command: 1, steps: [{ at: 'middle', tags: [1], worker: false }] }, /"at"/],
    ['tags that are not integers', { command: 1, steps: [{ at: 'start', tags: ['x'], worker: false }] }, /tags/],
    ['a worker flag that is not a boolean', { command: 1, steps: [{ at: 'start', tags: [1], worker: 1 }] }, /worker/],
    ['a step that is not an object', { command: 1, steps: [3] }, /step/],
  ])('an action row with %s', (_name, bad, reason) => {
    const c = checkCameraIndex(index({ actions: { party: { fire: bad } } }));
    expect('problem' in c && c.problem).toMatch(reason);
  });

  it('a program path that could leave the folder or change a URL\'s meaning', () => {
    for (const path of ['../x.json', 'a/../b.json', '/etc/x.json', 'C:/x.json', 'a\\b.json', 'a%2e%2e/b.json', 'a?b.json', 'a#b.json', 'dir/', 'a//b.json', './a.json', '', 'x\0y.json']) {
      const c = checkCameraIndex(index({ programs: [path] }));
      expect('problem' in c, JSON.stringify(path)).toBe(true);
    }
    expect(isIndexPath('programs/hiku15_00.w3.f3.json')).toBe(true);
    expect(isIndexPath('a.json')).toBe(true);
    expect(isIndexPath('x'.repeat(300))).toBe(false);
  });

  it('a listed file that was not provided, one that fails validation, and a program id listed twice', () => {
    const missing = FILES();
    missing.delete('programs/b.json');
    expect(problemOf(index(), missing)).toMatch(/programs\/b\.json was not provided/);
    const invalid = FILES();
    invalid.set('programs/b.json', { format: 'ffx-cam-ir/1', id: 'x', code: [{ op: 'jmp', to: 99 }] });
    expect(problemOf(index(), invalid)).toMatch(/programs\/b\.json: .*jump target/);
    const twice = FILES();
    twice.set('programs/b.json', rawProgram('s.w3.f3'));
    expect(problemOf(index(), twice)).toMatch(/s\.w3\.f3 is listed twice/);
  });

  it('a tag that names a program no listed file defines', () => {
    expect(problemOf(index({ tags: { 's:0:24': 'ghost' } }))).toMatch(/tags\["s:0:24"\] names ghost/);
  });
});

describe('the loader fetches nothing unless this is a dev server', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  /** A fetch that serves `files` by URL and records what was asked. */
  function server(files: Record<string, unknown>, log: string[] = []): typeof fetch {
    return (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      log.push(`${url}|${init?.cache ?? ''}`);
      if (url in files) return new Response(JSON.stringify(files[url]), { status: 200 });
      return new Response('not found', { status: 404 });
    }) as typeof fetch;
  }
  const BASE = '/__ffx-local/camera/evrae/';
  const served = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
    [`${BASE}index.json`]: index(),
    [`${BASE}programs/a.json`]: rawProgram('s.w3.f3'),
    [`${BASE}programs/b.json`]: rawProgram('s.w3.f9'),
    ...over,
  });

  it('returns null, asks for nothing and says nothing when import.meta.env.DEV is false (a production build)', async () => {
    vi.stubEnv('DEV', false);
    const log: string[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await loadFfxCameraPrograms('evrae', server(served(), log))).toBeNull();
    expect(log).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('checks DEV before it fetches anything, in the source as well (so a build drops the fetch with the branch)', () => {
    const text = readFileSync(join(REPO, 'src/engine/ffxcam/load.ts'), 'utf8');
    const dev = text.indexOf('if (!import.meta.env.DEV) return null');
    const firstFetch = text.indexOf('fetcher(');
    expect(dev).toBeGreaterThan(-1);
    expect(firstFetch).toBeGreaterThan(dev);
  });

  it('loads the data from the dev server, and every request stays inside the encounter\'s folder', async () => {
    vi.stubEnv('DEV', true);
    const log: string[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const programs = await loadFfxCameraPrograms('evrae', server(served(), log));
    expect(programs?.book.size).toBe(2);
    expect(programs?.actions.party['fire']?.command).toBe(12354);
    expect(log.sort()).toEqual([`${BASE}extents.json|no-store`, `${BASE}index.json|no-store`, `${BASE}programs/a.json|no-store`, `${BASE}programs/b.json|no-store`].sort());
    expect(warn).not.toHaveBeenCalled();
  });

  it("reads the characters' camera extents from extents.json beside the index; none (a 404) is an empty table and no warning", async () => {
    vi.stubEnv('DEV', true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const withFile = await loadFfxCameraPrograms('evrae', server(served({ [`${BASE}extents.json`]: { format: 'ffxcam-extents/1', chars: { '0': { height: 21, width: 7 }, '20': { height: 60, width: 90 } } } })));
    expect(withFile?.extents).toEqual({ '0': { height: 21, width: 7 }, '20': { height: 60, width: 90 } });
    const without = await loadFfxCameraPrograms('evrae', server(served()));
    expect(without?.extents).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });

  it('an extents.json that is there but wrong is ONE warning and an empty table; the programs still load', async () => {
    vi.stubEnv('DEV', true);
    for (const bad of [{ format: 'nope', chars: {} }, { format: 'ffxcam-extents/1', chars: { '0': { height: -1, width: 5 } } }]) {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const programs = await loadFfxCameraPrograms('evrae', server(served({ [`${BASE}extents.json`]: bad })));
      expect(programs?.book.size).toBe(2);
      expect(programs?.extents).toEqual({});
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toMatch(/extents.json/);
      warn.mockRestore();
    }
  });

  it('no folder behind the route (a 404) is null and quiet: the ordinary case for everyone but Bailey', async () => {
    vi.stubEnv('DEV', true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await loadFfxCameraPrograms('evrae', server({}))).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('a network error is null and quiet', async () => {
    vi.stubEnv('DEV', true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await loadFfxCameraPrograms('evrae', (async () => { throw new TypeError('offline'); }) as typeof fetch)).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('data that is there but wrong is null with ONE warning that names the problem', async () => {
    vi.stubEnv('DEV', true);
    for (const [name, files, reason] of [
      ['an index of the wrong shape', served({ [`${BASE}index.json`]: index({ scripts: [] }) }), /scripts/],
      ['a tag naming a missing program', served({ [`${BASE}index.json`]: index({ tags: { 's:0:24': 'ghost' } }) }), /ghost/],
      ['a program that fails validation', served({ [`${BASE}programs/b.json`]: { format: 'ffx-cam-ir/1', id: 'x', code: [{ op: 'jmp', to: 9 }] } }), /jump target/],
    ] as const) {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      expect(await loadFfxCameraPrograms('evrae', server(files)), name).toBeNull();
      expect(warn, name).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0]), name).toMatch(reason);
      expect(String(warn.mock.calls[0]?.[0]), name).toMatch(/painted|own camera/);
      warn.mockRestore();
    }
  });

  it('an index that is not JSON, and a program file that cannot be fetched, each warn once', async () => {
    vi.stubEnv('DEV', true);
    const notJson = (async (input: string | URL | Request) => (String(input).endsWith('index.json') ? new Response('{ not json', { status: 200 }) : new Response('', { status: 404 }))) as typeof fetch;
    let warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await loadFfxCameraPrograms('evrae', notJson)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/not valid JSON/);
    warn.mockRestore();
    const files = served();
    delete files[`${BASE}programs/b.json`];
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await loadFfxCameraPrograms('evrae', server(files))).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/programs\/b\.json could not be fetched \(404\)/);
  });

  it('an encounter name that is not a plain folder name is refused before anything is asked', async () => {
    vi.stubEnv('DEV', true);
    for (const name of ['../x', 'a/b', 'A B', '', '-x', 'x?y', 'x#y', 'C:']) {
      const log: string[] = [];
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      expect(await loadFfxCameraPrograms(name, server(served(), log)), JSON.stringify(name)).toBeNull();
      expect(log, JSON.stringify(name)).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    }
  });
});

describe('rule 8: no camera programs in the repo', () => {
  /** Every .json file under `dir` (on disk, tracked or not). */
  function jsonFiles(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === '.vite' || name === '.vite-temp') continue;
      const path = join(dir, name);
      const info = statSync(path);
      if (info.isDirectory()) out.push(...jsonFiles(path));
      else if (name.endsWith('.json')) out.push(path);
    }
    return out;
  }

  it('no JSON file in src, tests, public or tools carries a camera program or the loader\'s index', () => {
    for (const dir of ['src', 'tests', 'public', 'tools']) {
      for (const file of jsonFiles(join(REPO, dir))) {
        const text = readFileSync(file, 'utf8');
        expect(text.includes('ffx-cam-ir/1'), file).toBe(false);
        expect(text.includes(CAMERA_INDEX_FORMAT), file).toBe(false);
      }
    }
  });

  it('git tracks no file named like a program (script.wN.fM.json)', () => {
    const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: REPO, maxBuffer: 64 * 1024 * 1024 }).toString('utf8').split('\0');
    expect(tracked.filter((f) => /\.w\d+\.f\d+\.json$/.test(f))).toEqual([]);
    expect(tracked.filter((f) => /(^|\/)camera\/[^/]+\/(index|programs)\b/.test(f) && f.endsWith('.json'))).toEqual([]);
  });
});
