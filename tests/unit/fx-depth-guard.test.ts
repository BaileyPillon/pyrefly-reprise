/**
 * The depth-map guard (release 39 repair, 2026-10-04; the independent fidelity check's defect 4).
 *
 * `public/fx` is untracked, so a build made from a clean worktree has no `fx/<backdrop>/depth.png` and the game asks for it and gets a
 * 404: the plates, the drift and the defocus of every listed backdrop silently go. `tools/fx-assets.mjs verify` now checks the room
 * registry as well as the recorded list: every backdrop the game draws depth plates for must have its depth map in the folder checked.
 *
 * Game case: both games, shared build plumbing. The rooms are per game (FFX: Gagazet, Macalania, Zanarkand dome, Dream's End, the Garden
 * of Pain, Via Purifico; FFX-2: Bevelle, Djose, the Farplane, Leblanc's room, Via Infinito, Den of Woe) and every message names the room's game.
 * It reads files under the folder it is given and no address, so it is the same for GitHub Pages and for Cloudflare; the deploy that runs
 * it for both is `tools/deploy-pages.mjs` (one build gate for every host).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error: a plain .mjs tool with no type declarations
import { check, checkAll, checkPlateRooms, plateRooms } from '../../tools/fx-assets.mjs';

const ROOT = join(__dirname, '..', '..');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const made: string[] = [];

/** A build output for a host: `index.html` under that host's base, and `fx/<key>/depth.png|json` for the given rooms. */
function fakeBuild(base: string, keys: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'fx-guard-'));
  made.push(dir);
  writeFileSync(join(dir, 'index.html'), `<script type="module" src="${base}assets/index-abc123.js"></script>`);
  for (const key of keys) {
    mkdirSync(join(dir, 'fx', key), { recursive: true });
    writeFileSync(join(dir, 'fx', key, 'depth.png'), PNG);
    writeFileSync(join(dir, 'fx', key, 'depth.json'), '{"width":1344,"height":768}');
  }
  return dir;
}

afterEach(() => {
  while (made.length) rmSync(made.pop() as string, { recursive: true, force: true });
});

const ROOMS = [
  { key: 'gagazet', game: 'ffx' },
  { key: 'bevelle-underground', game: 'ffx2' },
];

describe('the room registry', () => {
  it('lists every backdrop that has depth plates, FFX and FFX-2', async () => {
    const rooms = await plateRooms();
    const keys = rooms.map((r: { key: string }) => r.key);
    expect(keys).toEqual([...keys].sort());
    for (const key of ['gagazet', 'macalania-temple', 'bevelle-underground', 'djose-chamber-provisional', 'zanarkand-dome', 'dreams-end', 'garden-of-pain', 'farplane', 'leblanc-last-room', 'via-infinito', 'via-purifico', 'den-of-woe']) {
      expect(keys).toContain(key);
    }
    expect(new Set(rooms.map((r: { game: string }) => r.game))).toEqual(new Set(['ffx', 'ffx2']));
  });

  it('is recorded whole in tools/fx/fx-assets.json, so the list cannot lag the game', async () => {
    const listed = new Set((JSON.parse(readFileSync(join(ROOT, 'tools', 'fx', 'fx-assets.json'), 'utf8')).files as { path: string }[]).map((f) => f.path));
    for (const { key } of await plateRooms()) {
      expect(listed, `${key}/depth.png is not recorded in tools/fx/fx-assets.json`).toContain(`${key}/depth.png`);
      expect(listed, `${key}/depth.json is not recorded in tools/fx/fx-assets.json`).toContain(`${key}/depth.json`);
    }
  });
});

describe('checkPlateRooms', () => {
  it('passes a build that holds every listed backdrop\'s depth map', () => {
    const dir = fakeBuild('/pyrefly-reprise/', ROOMS.map((r) => r.key));
    expect(checkPlateRooms(join(dir, 'fx'), ROOMS)).toEqual([]);
  });

  it('fails a build with no fx folder at all (a clean worktree), naming every backdrop and its game', () => {
    const dir = fakeBuild('/pyrefly-reprise/', []);
    const bad = checkPlateRooms(join(dir, 'fx'), ROOMS);
    expect(bad).toHaveLength(4);
    expect(bad.join('\n')).toContain('no depth map for FFX backdrop gagazet: gagazet/depth.png is missing');
    expect(bad.join('\n')).toContain('no depth map for FFX-2 backdrop bevelle-underground: bevelle-underground/depth.png is missing');
  });

  it('fails one missing depth map, an empty one, and a file that is not a PNG', () => {
    const dir = fakeBuild('/pyrefly-reprise/', ROOMS.map((r) => r.key));
    rmSync(join(dir, 'fx', 'gagazet', 'depth.png'));
    writeFileSync(join(dir, 'fx', 'bevelle-underground', 'depth.png'), '');
    expect(checkPlateRooms(join(dir, 'fx'), ROOMS)).toEqual([
      'no depth map for FFX backdrop gagazet: gagazet/depth.png is missing',
      'empty bevelle-underground/depth.png (FFX-2 backdrop bevelle-underground)',
    ]);
    writeFileSync(join(dir, 'fx', 'bevelle-underground', 'depth.png'), 'GIF89a....');
    expect(checkPlateRooms(join(dir, 'fx'), ROOMS)).toContain('bevelle-underground/depth.png is not a PNG (FFX-2 backdrop bevelle-underground)');
  });

  it('is the same for both hosts: the build differs only in its base path, the check reads files', () => {
    for (const base of ['/pyrefly-reprise/', '/']) {
      const dir = fakeBuild(base, ROOMS.map((r) => r.key));
      expect(checkPlateRooms(join(dir, 'fx'), ROOMS), `base ${base}`).toEqual([]);
      rmSync(join(dir, 'fx', 'bevelle-underground', 'depth.json'));
      expect(checkPlateRooms(join(dir, 'fx'), ROOMS), `base ${base}`).toEqual(['no depth map for FFX-2 backdrop bevelle-underground: bevelle-underground/depth.json is missing']);
    }
  });
});

describe('checkAll (the list and the registry together)', () => {
  it('catches a backdrop the recorded list never knew about', async () => {
    const dir = fakeBuild('/', ['gagazet']);
    const list = [{ path: 'gagazet/depth.png', bytes: PNG.length, sha256: await sha(join(dir, 'fx', 'gagazet', 'depth.png')) }];
    expect(check(join(dir, 'fx'), list)).toEqual([]);
    const bad = await checkAll(join(dir, 'fx'), list, ROOMS);
    expect(bad.join('\n')).toContain('bevelle-underground/depth.png is missing');
    expect(bad.join('\n')).not.toContain('gagazet');
  });

  it('names a file once when the list and the registry both miss it', async () => {
    const dir = fakeBuild('/', []);
    const list = [{ path: 'gagazet/depth.png', bytes: 1, sha256: 'x' }];
    const bad = await checkAll(join(dir, 'fx'), list, ROOMS);
    expect(bad.filter((m: string) => m.includes('gagazet/depth.png'))).toEqual(['missing gagazet/depth.png']);
    expect(bad.filter((m: string) => m.includes('gagazet/depth.json'))).toHaveLength(1);
  });
});

async function sha(file: string): Promise<string> {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

describe('the deploy runs it for every host', () => {
  it('fails the command line on a build without depth maps and passes one that has them (exit codes)', () => {
    const empty = fakeBuild('/', []);
    const failing = spawnSync(process.execPath, [join(ROOT, 'tools', 'fx-assets.mjs'), 'verify', '--dir', join(empty, 'fx')], { encoding: 'utf8' });
    expect(failing.status).toBe(1);
    expect(failing.stdout).toContain('FAIL');
    expect(failing.stdout).toContain('gagazet/depth.png');
  });

  it('is called by tools/deploy-pages.mjs on the finished build, before that build is hashed (one gate for GitHub Pages and Cloudflare)', () => {
    const src = readFileSync(join(ROOT, 'tools', 'deploy-pages.mjs'), 'utf8');
    const at = (needle: string): number => src.indexOf(needle);
    const verify = at("'fx-assets.mjs'), 'verify', '--dir', join(DIST, 'fx')");
    expect(verify).toBeGreaterThan(-1);
    expect(verify).toBeGreaterThan(at("runNpx(['vite', 'build'"));
    expect(verify).toBeLessThan(at('await buildManifest(DIST)'));
    expect(src.slice(verify, verify + 300)).toContain('fail(');
  });
});
