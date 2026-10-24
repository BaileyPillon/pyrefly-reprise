/**
 * Lane boss-matte (2026-10-23): the install check of the boss re-cut (`tools/boss-matte-install.mjs`): it parses the files doc, classifies every row against an art folder and refuses a folder that is not the
 * playtest art state the re-cut was made from. Bahamut is FFX-2 only, Seymour Flux FFX only; the tool is shared plumbing.
 */
import { createHash } from 'node:crypto';
import { linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { FILES_DOC, classify, install, parseFilesDoc, summarize } from '../../tools/boss-matte-install.mjs';

const sha = (b: Buffer | string): string => createHash('sha256').update(b).digest('hex');
const tmp = mkdtempSync(join(tmpdir(), 'boss-matte-install-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('the files doc', () => {
  const rows = parseFilesDoc(readFileSync(FILES_DOC, 'utf8'));
  it('lists the two bosses files with full sha256 hashes', () => {
    expect(rows.length).toBeGreaterThan(100);
    for (const r of rows) {
      expect(r.new).toMatch(/^[0-9a-f]{64}$/);
      expect(r.old === null || /^[0-9a-f]{64}$/.test(r.old)).toBe(true);
      expect(r.file).toMatch(/^(characters|rigs)\/(ffx2-bahamut|seymour-flux-body)\//);
    }
    expect(rows.some((r) => r.file === 'rigs/ffx2-bahamut/rig.json')).toBe(true);
    expect(rows.some((r) => r.file === 'rigs/seymour-flux-body/rig.json')).toBe(true);
    expect(new Set(rows.map((r) => r.file)).size).toBe(rows.length);
  });
});

describe('classify and install', () => {
  const rows = [
    { file: 'characters/x/a.png', old: sha('a-old'), new: sha('a-new') },
    { file: 'characters/x/b.png', old: sha('b-old'), new: sha('b-new') },
    { file: 'rigs/x/c.png', old: null, new: sha('c-new') },
    { file: 'rigs/x/d.png', old: sha('d-old'), new: sha('d-new') },
  ];
  const files: Record<string, string> = { 'characters/x/a.png': 'a-old', 'characters/x/b.png': 'b-new', 'rigs/x/d.png': 'something-else' };
  const shaOf = (f: string): string | null => (files[f] === undefined ? null : sha(files[f]!));

  it('names the state of every row', () => {
    const c = classify(rows, shaOf);
    expect(c.map((r) => r.state)).toEqual(['ready', 'done', 'add', 'conflict']);
    const s = summarize(c);
    expect(s).toMatchObject({ ready: 1, done: 1, add: 1, conflict: 1, missing: 0, total: 4, ok: false });
  });

  it('a file the original should be but is not there is `missing`: the folder is older than the playtest art', () => {
    const c = classify(rows, () => null);
    expect(c.map((r) => r.state)).toEqual(['missing', 'missing', 'add', 'missing']);
    expect(summarize(c).ok).toBe(false);
  });

  it('a folder in the playtest state, or one already installed, is ok', () => {
    const before = classify(rows, (f) => ({ 'characters/x/a.png': sha('a-old'), 'characters/x/b.png': sha('b-old'), 'rigs/x/d.png': sha('d-old') })[f] ?? null);
    expect(summarize(before)).toMatchObject({ ready: 3, add: 1, ok: true });
    const after = classify(rows, (f) => ({ 'characters/x/a.png': sha('a-new'), 'characters/x/b.png': sha('b-new'), 'rigs/x/c.png': sha('c-new'), 'rigs/x/d.png': sha('d-new') })[f] ?? null);
    expect(summarize(after)).toMatchObject({ done: 4, ok: true });
  });

  it('installs by unlinking first, so a hard link to the original keeps its bytes', () => {
    const art = join(tmp, 'art');
    const keep = join(tmp, 'keep');
    const mirror = join(tmp, 'mirror');
    for (const d of [art, keep, mirror]) mkdirSync(join(d, 'characters/x'), { recursive: true });
    mkdirSync(join(art, 'rigs/x'), { recursive: true });
    mkdirSync(join(mirror, 'rigs/x'), { recursive: true });
    writeFileSync(join(keep, 'characters/x/a.png'), 'a-old');
    linkSync(join(keep, 'characters/x/a.png'), join(art, 'characters/x/a.png')); // the art folder's file IS the other folder's file
    writeFileSync(join(mirror, 'characters/x/a.png'), 'a-new');
    writeFileSync(join(mirror, 'rigs/x/c.png'), 'c-new');
    const two = [rows[0]!, rows[2]!];
    const c = classify(two, (f) => (statSafe(join(art, f)) ? sha(readFileSync(join(art, f))) : null));
    expect(c.map((r) => r.state)).toEqual(['ready', 'add']);
    expect(install(c, art, mirror)).toEqual(['characters/x/a.png', 'rigs/x/c.png']);
    expect(readFileSync(join(art, 'characters/x/a.png'), 'utf8')).toBe('a-new');
    expect(readFileSync(join(keep, 'characters/x/a.png'), 'utf8')).toBe('a-old'); // never written through the link
    expect(readFileSync(join(art, 'rigs/x/c.png'), 'utf8')).toBe('c-new');
  });

  it('refuses a mirror file that is not the listed new one', () => {
    const art = join(tmp, 'art2');
    const mirror = join(tmp, 'mirror2');
    mkdirSync(join(art, 'rigs/x'), { recursive: true });
    mkdirSync(join(mirror, 'rigs/x'), { recursive: true });
    writeFileSync(join(mirror, 'rigs/x/c.png'), 'not-the-listed-file');
    expect(() => install(classify([rows[2]!], () => null), art, mirror)).toThrow(/not the listed new file/);
  });
});

function statSafe(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}
