/**
 * **No local path ships in the hidden 3D Bahamut's models** (ch-yrp review MAJOR-2, 2026-11-02; FFX-2 only; `tools/dist-filter.mjs`, `tools/yrp-models-verify.mjs`). The extraction scripts wrote provenance notes into the
 * dresspheres' clip maps, and one (`dress/rikku-thief/clipmap.json`, the `evidence` of her alternate idle) named the scratch folder its probe renders were in, so a build shipped a path on this PC to every player's
 * browser. The source file is a hard link to the extraction output and is left as it is; the BUILD's copy is cleaned. What this pins:
 *
 * 1. **The scrub**: a parenthetical naming a drive path or the scratch folder goes whole, a bare path is cut to its last name, the file still parses and the sentence still reads; text with no path is returned as it was.
 * 2. **The prune**: `pruneUnshipped` cleans the shipped JSON notes of a copied tree (and only the build's copy), a second prune changes nothing.
 * 3. **The verifier**: a build with a local path in a clip map or in a glTF's JSON chunk fails and names the file; a source tree is not held to it.
 * 4. **The real files** (skipped when the models are not on this disk): the shipped set, scrubbed, has no local path and still parses; no shipped glTF's JSON chunk has one.
 *
 * Game case: FFX-2 only (the models are the game's own); the filter and the check are shared delivery plumbing.
 */
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, readSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { carriesLocalPath, pruneUnshipped, scrubLocalPaths, scrubModelNotes, shippedDressIndex } from '../../tools/dist-filter.mjs';
import { scanBuildForLocalPaths } from '../../tools/dist-local-paths.mjs';
import { expectedYrpFiles, verifyYrpModels } from '../../tools/yrp-models-verify.mjs';
import { BASE, fullManifest, tinyGlb } from './helpers/yrpShip.ts';

let tmp: string | null = null;
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

/** The note as the extraction wrote it (one JSON string; the path is the scratch folder's, spelled with a stand-in drive). */
const NOTE =
  "c026's .chr default list leaves slots 0x08 (APPEAR_00) and 0x10 (IDLE1) unset; the 60-frame loop right before IDLE2 renders as the Thief's low ready crouch, the same stance IDLE2 shows (renders in D:/Tools/pyrefly-scratch/2026-10-22/yrp-dress/renders/probe); the standing loops are the idle";
const CLIPMAP = `{\n "clips": [\n  {\n   "evidence": "${NOTE}"\n  }\n ]\n}\n`;

/** A binary glTF with a JSON chunk of `json` (one chunk, no BIN), whole: header length equals the file's. */
function glbWith(json: string): Buffer {
  const padded = Buffer.from(json + ' '.repeat((4 - (Buffer.byteLength(json) % 4)) % 4));
  const b = Buffer.alloc(20 + padded.length);
  b.write('glTF', 0, 'latin1');
  b.writeUInt32LE(2, 4);
  b.writeUInt32LE(b.length, 8);
  b.writeUInt32LE(padded.length, 12);
  b.write('JSON', 16, 'latin1');
  padded.copy(b, 20);
  return b;
}

describe('the scrub', () => {
  it('takes a parenthetical that names a drive path out whole, and the sentence still reads', () => {
    const clean = scrubLocalPaths(CLIPMAP);
    expect(carriesLocalPath(clean)).toBe(false);
    expect(clean).toContain('the same stance IDLE2 shows; the standing loops are the idle');
    expect(clean).not.toContain('renders in');
    expect(() => JSON.parse(clean)).not.toThrow();
    expect(clean).toContain('(APPEAR_00)'); // a parenthetical with no path is kept
  });

  it('cuts a bare path to its last name (the painting sidecars\' rule), either slash, and hides the scratch folder\'s name', () => {
    expect(scrubLocalPaths('see C:\\Users\\x\\y.png for it')).toBe('see y.png for it'); // the sidecars' rule: a path is cut to its last name
    expect(scrubLocalPaths('probe in d:/Tools/z/q, then')).toBe('probe in q, then');
    expect(scrubLocalPaths('kept under pyrefly-scratch/2026')).toBe('kept under (a local folder)');
  });

  it('leaves text with no local path as it was, and does not mistake a URL scheme or a word for a drive', () => {
    const plain = '{"uri":"data:/x","a":"slot 0x11 MOT_IDLE2 (the alternate fidget)","b":"http://example.test/p","c":"ratio 3:1/2"}';
    expect(scrubLocalPaths(plain)).toBe(plain);
    expect(carriesLocalPath(plain)).toBe(false);
  });
});

describe('the prune and the verifier', () => {
  /** A pruned-shape build: every file of the set (stand-in glTFs), the manifest trimmed, one clip map carrying the note. */
  function build(clipmap: string, glb: Buffer = tinyGlb()): string {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-yrp-paths-'));
    for (const rel of expectedYrpFiles()) {
      mkdirSync(dirname(join(tmp, rel)), { recursive: true });
      writeFileSync(join(tmp, rel), rel.endsWith('.glb') ? glb : '{}');
    }
    writeFileSync(join(tmp, BASE, 'dress', 'index.json'), JSON.stringify(shippedDressIndex(fullManifest())));
    writeFileSync(join(tmp, BASE, 'dress', 'rikku-thief', 'clipmap.json'), clipmap);
    return tmp;
  }

  it('cleans the build\'s copy of a clip map and says so, and a second prune changes nothing', () => {
    const root = build(CLIPMAP);
    const file = join(root, BASE, 'dress', 'rikku-thief', 'clipmap.json');
    expect(scrubModelNotes(root)).toEqual([`${BASE}/dress/rikku-thief/clipmap.json`]);
    const once = readFileSync(file, 'utf8');
    expect(carriesLocalPath(once)).toBe(false);
    expect(scrubModelNotes(root)).toEqual([]);
    pruneUnshipped(root);
    expect(readFileSync(file, 'utf8')).toBe(once);
  });

  it('is part of pruneUnshipped (the deploy\'s and the build\'s one entry point)', () => {
    const root = build(CLIPMAP);
    pruneUnshipped(root);
    expect(carriesLocalPath(readFileSync(join(root, BASE, 'dress', 'rikku-thief', 'clipmap.json'), 'utf8'))).toBe(false);
    expect(verifyYrpModels(root).problems.filter((p) => p.includes('local path'))).toEqual([]);
  });

  it('passes the deploy\'s privacy gate after the prune (before it, the gate refused the build: the note was a drive path in a shipped JSON file)', () => {
    const root = build(CLIPMAP);
    expect(scanBuildForLocalPaths(root).hits.map((h) => h.kind)).toEqual(['drive']);
    pruneUnshipped(root);
    expect(scanBuildForLocalPaths(root).hits).toEqual([]);
  });

  it('leaves a file alone when the scrub would stop it parsing (the verifier then names it)', () => {
    const broken = '{"a": "x (see D:/y/z", "b": [1,}'; // not JSON before or after: left as it is
    const root = build(broken);
    expect(scrubModelNotes(root)).toEqual([]);
    expect(readFileSync(join(root, BASE, 'dress', 'rikku-thief', 'clipmap.json'), 'utf8')).toBe(broken);
    expect(verifyYrpModels(root).problems.some((p) => p.includes('rikku-thief/clipmap.json') && p.includes('local path'))).toBe(true);
  });

  it('fails a build whose clip map still carries a local path, and names the file', () => {
    const root = build(CLIPMAP);
    const r = verifyYrpModels(root);
    expect(r.ok).toBe(false);
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]).toMatch(/rikku-thief\/clipmap\.json: has a local path in a string/);
  });

  it('fails a build whose glTF JSON chunk carries a local path, and passes a clean one', () => {
    const dirty = build('{}', glbWith('{"asset":{"version":"2.0","generator":"export from D:/Tools/pyrefly-scratch/x"}}'));
    const r = verifyYrpModels(dirty);
    expect(r.ok).toBe(false);
    expect(r.problems.length).toBe(expectedYrpFiles().filter((f) => f.endsWith('.glb')).length);
    expect(r.problems.every((p) => p.includes('has a local path'))).toBe(true);
    rmSync(dirty, { recursive: true, force: true });
    const clean = build('{}', glbWith('{"asset":{"version":"2.0","generator":"export"}}'));
    expect(verifyYrpModels(clean)).toMatchObject({ ok: true, problems: [] });
  });

  it('does not hold a source tree to it (the source keeps its working notes; only the build is clean)', () => {
    const root = build(CLIPMAP);
    expect(verifyYrpModels(root, { mode: 'source' }).ok).toBe(true);
  });
});

// ---- the real files ------------------------------------------------------------------------------------------------
const PUBLIC = 'public';
const haveModels = existsSync(`${PUBLIC}/${BASE}/yuna.glb`) && existsSync(`${PUBLIC}/${BASE}/dress/index.json`);

/** The JSON chunk of a binary glTF on disk, read from its header only (the files are up to 22 MiB). */
function glbJson(path: string): string {
  const fd = openSync(path, 'r');
  try {
    const head = Buffer.alloc(20);
    readSync(fd, head, 0, 20, 0);
    const len = head.readUInt32LE(12);
    const body = Buffer.alloc(len);
    readSync(fd, body, 0, len, 20);
    return body.toString('utf8');
  } finally {
    closeSync(fd);
  }
}

describe.skipIf(!haveModels)('the real files (local only: skipped without public/models-exp)', () => {
  const set = expectedYrpFiles().filter((f) => existsSync(join(PUBLIC, f)));

  it('ships no local path once the notes are scrubbed: every JSON of the set still parses and is clean', () => {
    const jsons = set.filter((f) => f.endsWith('.json'));
    expect(jsons.length).toBe(1 + 1 + 1 + 14); // base clip map, HD clip map, the manifest, the dresspheres' maps
    for (const rel of jsons) {
      const clean = scrubLocalPaths(readFileSync(join(PUBLIC, rel), 'utf8'));
      expect(carriesLocalPath(clean), rel).toBe(false);
      expect(() => JSON.parse(clean), rel).not.toThrow();
    }
  });

  it('has no local path in any shipped glTF\'s JSON chunk', () => {
    const glbs = set.filter((f) => f.endsWith('.glb'));
    expect(glbs.length).toBeGreaterThan(20);
    for (const rel of glbs) expect(carriesLocalPath(glbJson(join(PUBLIC, rel))), rel).toBe(false);
  });
});
