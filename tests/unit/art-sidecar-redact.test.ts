/**
 * The painting sidecars as the build ships them (r46-fix, FOC46-01; both games, build plumbing): every local path of the build PC in a string
 * value is replaced by its last name, in the BUILD OUTPUT only, and the game reads exactly what it read before.
 *
 * The proof has four parts. (1) The READERS table: every place `src/` fetches an art JSON, and the fields it takes; a guard test fails when a
 * new reader appears, so nobody can add one without listing its fields here. (2) For every sidecar of the master folder (`public/art`, the
 * approved masters; skipped when the checkout has no art, which is gitignored): the redacted text is valid JSON, deep-equal to the master in
 * every field the game reads, equal to it in everything but the string values that held a path, and no read field holds a path at all (if one
 * did, the redaction would change what the game reads: STOP). (3) The function itself: the formatting rule, keys and numbers untouched, a file
 * without a path byte-identical. (4) The build step: it writes the output's files only, through a temporary name (a master that is hard-linked
 * into the output is not changed), and the gate (`verifyShippedSidecars`) fails a build that kept a path or changed anything else.
 */
import { existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { pyreflyArtDerive } from '../../tools/art-derive-plugin.mjs';
import { listMasterSidecars, redactBuildSidecars, redactJsonText } from '../../tools/art-sidecar-redact.mjs';
import { verifyShippedSidecars } from '../../tools/art-verify.mjs';
import { findLocalPaths, redactLocalPaths } from '../../tools/dist-local-paths.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const PUBLIC = join(ROOT, 'public');
const HAVE_ART = existsSync(join(PUBLIC, 'art', 'manifest.json'));

/** Which file a reader takes its fields from: a painting's sidecar (any `<painting>.json`), or one of the two manifests. */
type Scope = 'painting' | 'art/manifest.json' | 'art/portrait-parts/manifest.json';

/**
 * Every place the game reads an art JSON, with the fields it takes from it (read from the code on 2026-10-13). A path in any of these fields
 * would be changed by the redaction and must stop the work: the tests below prove none of the sidecars holds one. A field is read of ITS file only:
 * the `master` the parts manifest has is read, while three backdrop sidecars have a provenance field of the same name (a path), which no reader takes.
 */
const READERS: { file: string; reads: string; scope: Scope; fields: string[] }[] = [
  { file: 'src/engine/PaintedArt.ts', reads: '<painting>.json of every pose and backdrop (tryLoadMeta)', scope: 'painting', fields: ['width', 'height', 'baselineY', 'scale', 'anchorY', 'facing', 'seed', 'prompt'] },
  { file: 'src/engine/fx/mix/twirl.ts', reads: 'the idle sidecar of a figure, through tryLoadMeta', scope: 'painting', fields: ['width', 'height', 'baselineY', 'scale', 'anchorY', 'facing', 'seed', 'prompt'] },
  { file: 'src/engine/ArtShipped.ts', reads: 'builds the name of a sidecar (sidecarUrlOf); reads nothing', scope: 'painting', fields: [] },
  { file: 'src/ui/common/chapterPanel.ts', reads: 'the sidecar of a pause plate, through sidecarUrlOf (parseArtFocal)', scope: 'painting', fields: ['focal'] },
  { file: 'src/ui/common/restPoses.ts', reads: 'the sidecar of a sleeping or critical pose, through sidecarUrlOf', scope: 'painting', fields: ['headTop'] },
  { file: 'src/ui/common/portrait.ts', reads: 'art/portraits/<id>.json', scope: 'painting', fields: ['focal'] },
  { file: 'src/ui/ffx/portraits.ts', reads: 'art/characters/<id>/idle.json', scope: 'painting', fields: ['width', 'height'] },
  { file: 'src/engine/ArtManifest.ts', reads: 'art/manifest.json (parseArtManifest)', scope: 'art/manifest.json', fields: ['version', 'generatedAt', 'subjects', 'portraits', 'backdrops', 'pause', 'pause2x', 'title', 'title2x', 'backdropTiers'] },
  { file: 'src/app/screens/pause/livingParts.ts', reads: 'art/portrait-parts/manifest.json (parsePartsManifest)', scope: 'art/portrait-parts/manifest.json', fields: ['version', 'master', 'plates'] },
];
const fieldsOf = (scope: Scope): string[] => [...new Set(READERS.filter((r) => r.scope === scope).flatMap((r) => r.fields))].sort();
/** The fields the game reads of one file of the master folder (a path relative to `public/`). */
const readFieldsFor = (rel: string): string[] => (rel === 'art/manifest.json' || rel === 'art/portrait-parts/manifest.json' ? fieldsOf(rel) : fieldsOf('painting'));

/** Not art JSON: the audio manifest, the dev-only route to Bailey's own converted FFX files (`/__ffx-local/`, never in a build), a lint pattern. */
const NOT_ART = [`src${sep}audio${sep}`, `src${sep}engine${sep}ffx3d${sep}`, `src${sep}engine${sep}ffxcam${sep}`, `src${sep}story${sep}textLint.ts`];

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return name.endsWith('.ts') && !name.endsWith('.d.ts') ? [full] : [];
  });

/** The code of a source file without comments and without import lines. */
const codeOf = (text: string): string =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
    .split('\n')
    .filter((l) => !/^\s*(import|export)\b[^=]*\bfrom\s+['"]/.test(l) && !/^\s*}\s*from\s+['"]/.test(l))
    .join('\n');

describe('the readers of an art JSON in src/ (the guard)', () => {
  it('are exactly the files in the READERS table: a new reader must list its fields here and be proved never to hold a path', () => {
    const found = sourceFiles(join(ROOT, 'src'))
      .map((f) => relative(ROOT, f))
      .filter((rel) => !NOT_ART.some((p) => rel.startsWith(p)))
      .filter((rel) => {
        const code = codeOf(readFileSync(join(ROOT, rel), 'utf8'));
        return /(['"`])(?:(?!\1).)*\.json\b(?:(?!\1).)*\1/.test(code) || /\bsidecarUrlOf\(/.test(code) || /\btryLoadMeta\(/.test(code);
      })
      .map((rel) => rel.split(sep).join('/'))
      .sort();
    expect(found).toEqual(READERS.map((r) => r.file).sort());
  });

  it('read the fields the table lists, and no provenance field', () => {
    // The loader copies these and nothing else out of a sidecar; the provenance fields (candidateOf, status, controlnet, ipadapter, img2img,
    // installedFrom, scaleNote, replaces, provenance, source, ref, ...) are named by no reader.
    const meta = codeOf(readFileSync(join(ROOT, 'src/engine/PaintedArt.ts'), 'utf8'));
    const body = meta.slice(meta.indexOf('export async function tryLoadMeta'), meta.indexOf('export async function loadPainted'));
    const used = [...new Set([...body.matchAll(/\braw\.(\w+)/g)].map((m) => m[1]!))].sort();
    expect(used).toEqual(['anchorY', 'baselineY', 'facing', 'height', 'prompt', 'scale', 'seed', 'width']);
    expect(READERS[0]!.fields.slice().sort()).toEqual(used);
  });
});

/** Every string literal that is a value (not a key) replaced by `""`: the text of a JSON file without its string values. */
const skeleton = (text: string): string => text.replace(/"(?:[^"\\]|\\.)*"(\s*:)?/g, (m, colon) => (colon ? m : '""'));

/** Walk two parsed values together; returns what differs other than a string value that held a path. */
function differences(a: unknown, b: unknown, at: string, out: string[], changed: { n: number }): void {
  if (typeof a === 'string' && typeof b === 'string') {
    if (a === b) return;
    changed.n++;
    if (findLocalPaths(a).length === 0) out.push(`${at}: a string without a path changed`);
    else if (findLocalPaths(b).length !== 0) out.push(`${at}: a path is left`);
    else if (b !== redactLocalPaths(a)) out.push(`${at}: not the rule's replacement`);
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return void out.push(`${at}: array length`);
    a.forEach((x, i) => differences(x, b[i], `${at}[${i}]`, out, changed));
    return;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.join('\u0000') !== kb.join('\u0000')) return void out.push(`${at}: keys or their order`);
    for (const k of ka) differences((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${at}.${k}`, out, changed);
    return;
  }
  if (!Object.is(a, b)) out.push(`${at}: a ${typeof a} changed`);
}

describe.skipIf(!HAVE_ART)('every sidecar of the master folder, redacted', () => {
  const masters = listMasterSidecars(PUBLIC);

  it('is valid JSON, equal to the master in every field the game reads, and none of those fields holds a path', () => {
    const problems: string[] = [];
    let withPath = 0;
    for (const m of masters) {
      const text = readFileSync(m.full, 'utf8');
      const r = redactJsonText(text);
      const before = JSON.parse(text) as Record<string, unknown>;
      let after: Record<string, unknown>;
      try {
        after = JSON.parse(r.text) as Record<string, unknown>;
      } catch {
        problems.push(`${m.rel}: the redacted text is not valid JSON`);
        continue;
      }
      if (r.text !== text) withPath++;
      if (r.plain) problems.push(`${m.rel}: not JSON`);
      if (before === null || typeof before !== 'object') continue;
      for (const f of readFieldsFor(m.rel)) {
        if (!(f in before)) continue;
        if (JSON.stringify(after[f]) !== JSON.stringify(before[f])) problems.push(`${m.rel}: the read field ${f} changed`);
        if (findLocalPaths(JSON.stringify(before[f])).length > 0) problems.push(`${m.rel}: the read field ${f} HOLDS A PATH (stop: the redaction would change what the game reads)`);
      }
    }
    expect(problems).toEqual([]);
    expect(withPath, 'the master folder carries paths today; the test would prove nothing without them').toBeGreaterThan(0);
  });

  it('differs from the master only inside string values that held a path: the same keys in the same order, numbers and layout as the master', () => {
    const problems: string[] = [];
    let strings = 0;
    for (const m of masters) {
      const text = readFileSync(m.full, 'utf8');
      const r = redactJsonText(text);
      if (skeleton(r.text) !== skeleton(text)) problems.push(`${m.rel}: the text outside its string values changed`);
      const found: string[] = [];
      const changed = { n: 0 };
      differences(JSON.parse(text), JSON.parse(r.text), '', found, changed);
      for (const f of found) problems.push(`${m.rel}${f}`);
      if (changed.n !== r.strings) problems.push(`${m.rel}: ${changed.n} strings differ, ${r.strings} reported`);
      if (r.text === text && changed.n !== 0) problems.push(`${m.rel}: reported unchanged`);
      strings += changed.n;
    }
    expect(problems).toEqual([]);
    expect(strings).toBeGreaterThan(0);
  });

  it('leaves nothing the gate finds, writes a file without a path as the master exactly, and is idempotent', () => {
    const problems: string[] = [];
    for (const m of masters) {
      const text = readFileSync(m.full, 'utf8');
      const r = redactJsonText(text);
      if (findLocalPaths(r.text).length > 0) problems.push(`${m.rel}: a path is left`);
      if (redactJsonText(r.text).text !== r.text) problems.push(`${m.rel}: not idempotent`);
      if (findLocalPaths(text).length === 0 && r.text !== text) problems.push(`${m.rel}: had no path and changed`);
    }
    expect(problems).toEqual([]);
  });
});

describe('redactJsonText: the formatting rule', () => {
  const sample = '{\r\n  "width": 1.0,\r\n  "baselineY": 1e3,\r\n  "scale": 0.50,\r\n  "installedFrom": "D:\\\\Tools\\\\staging\\\\idle.png",\r\n  "note": "a \\u00e9 and \\/ kept",\r\n  "ref": "see C:/Users/someone/Pictures/x.png, then D:/Project Files/art/y.png.",\r\n  "keep": ["12:30/45", "https://example.com/Users/list"]\r\n}\r\n';

  it('rewrites a string value that held a path in place and keeps every other byte: layout, line ends, number spelling, other escapes', () => {
    const r = redactJsonText(sample);
    expect(r.text).toBe(sample.replace('"D:\\\\Tools\\\\staging\\\\idle.png"', '"idle.png"').replace('see C:/Users/someone/Pictures/x.png, then D:/Project Files/art/y.png.', 'see x.png, then y.png.'));
    expect(r.strings).toBe(2);
    expect(r.paths).toBe(3);
    expect(r.plain).toBe(false);
    expect(r.text).toContain('1.0,'); // numbers as spelt
    expect(r.text).toContain('1e3');
    expect(r.text).toContain('0.50');
    expect(r.text).toContain('\\u00e9 and \\/ kept'); // the escapes of an untouched string
    expect(r.text).toContain('["12:30/45", "https://example.com/Users/list"]'); // a time, and a URL with a Users segment, are not paths
    expect(findLocalPaths(r.text)).toEqual([]);
  });

  it('keeps the key order and never rewrites a key', () => {
    const text = '{"D:/Tools/a/b.png": "D:/Tools/a/b.png", "b": 1}';
    const r = redactJsonText(text);
    expect(r.text).toBe('{"D:/Tools/a/b.png": "b.png", "b": 1}');
    expect(Object.keys(JSON.parse(r.text))).toEqual(['D:/Tools/a/b.png', 'b']);
    expect(findLocalPaths(r.text).length, 'a key that held a path is a leak the gate reports').toBe(1);
  });

  it('returns the very text when there is no path, and handles a value that is the whole document', () => {
    const clean = '{ "a": "https://example.com/Users/x", "b": [1, 2, 3], "c": "12:30/45" }';
    expect(redactJsonText(clean)).toEqual({ text: clean, strings: 0, paths: 0, plain: false });
    expect(redactJsonText('"E:/Tools/x/y.png"').text).toBe('"y.png"');
  });

  it('redacts a text that is not JSON as plain text, so it cannot carry a path either', () => {
    const r = redactJsonText('{ "a": D:/Tools/x/y.png, ');
    expect(r.plain).toBe(true);
    expect(r.text).toBe('{ "a": y.png, ');
  });
});

describe('the build step', () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
  });
  const tmp = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'sidecar-redact-'));
    roots.push(dir);
    return dir;
  };
  const put = (file: string, text: string): void => {
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, text);
  };
  const DIRTY = '{ "width": 10, "height": 20, "installedFrom": "D:/Tools/art-backup/title/echo.png", "provenance": "C:\\\\Users\\\\someone\\\\Pictures\\\\echo.png" }\n';
  const CLEAN = '{ "width": 30, "height": 40, "facing": "right" }\n';

  it('writes the output only, leaves a file without a path as it was, and reports counts, never a path', () => {
    const root = tmp();
    put(join(root, 'public/art/title/echo.json'), DIRTY);
    put(join(root, 'public/art/characters/yuna/idle.json'), CLEAN);
    put(join(root, 'dist/art/title/echo.json'), DIRTY);
    put(join(root, 'dist/art/characters/yuna/idle.json'), CLEAN);
    put(join(root, 'dist/art/title/echo.png'), 'not json');
    const before = statSync(join(root, 'dist/art/characters/yuna/idle.json')).mtimeMs;
    const done = redactBuildSidecars(join(root, 'dist'));
    expect(done).toMatchObject({ files: 2, changed: 1, strings: 2, paths: 2, changedFiles: ['art/title/echo.json'], plain: [] });
    expect(JSON.stringify(done)).not.toMatch(/Tools|someone|Pictures/);
    expect(JSON.parse(readFileSync(join(root, 'dist/art/title/echo.json'), 'utf8'))).toEqual({ width: 10, height: 20, installedFrom: 'echo.png', provenance: 'echo.png' });
    expect(readFileSync(join(root, 'dist/art/characters/yuna/idle.json'), 'utf8')).toBe(CLEAN);
    expect(statSync(join(root, 'dist/art/characters/yuna/idle.json')).mtimeMs).toBe(before);
    expect(readFileSync(join(root, 'public/art/title/echo.json'), 'utf8'), 'the master is untouched').toBe(DIRTY);
    expect(readdirSync(join(root, 'dist/art/title')).sort(), 'no temporary file is left').toEqual(['echo.json', 'echo.png']);
    expect(redactBuildSidecars(join(root, 'dist')).changed, 'a second run changes nothing').toBe(0);
  });

  it('does not change a master that shares its data with the output (a hard link): the file is replaced, not written in place', () => {
    const root = tmp();
    put(join(root, 'public/art/title/echo.json'), DIRTY);
    mkdirSync(join(root, 'dist/art/title'), { recursive: true });
    linkSync(join(root, 'public/art/title/echo.json'), join(root, 'dist/art/title/echo.json'));
    redactBuildSidecars(join(root, 'dist'));
    expect(readFileSync(join(root, 'public/art/title/echo.json'), 'utf8')).toBe(DIRTY);
    expect(JSON.parse(readFileSync(join(root, 'dist/art/title/echo.json'), 'utf8')).installedFrom).toBe('echo.png');
  });

  it('does nothing for a build without an art folder', () => {
    const root = tmp();
    mkdirSync(join(root, 'dist'));
    expect(redactBuildSidecars(join(root, 'dist'))).toMatchObject({ files: 0, changed: 0 });
  });

  it('is what the gate checks: a faithful build passes, a build that kept a path or changed anything else fails', () => {
    const root = tmp();
    put(join(root, 'public/art/title/echo.json'), DIRTY);
    put(join(root, 'public/art/characters/yuna/idle.json'), CLEAN);
    put(join(root, 'public/art/characters/yuna/idle.2.json'), '{"numbered":"take"}'); // a numbered take never ships
    for (const f of ['title/echo.json', 'characters/yuna/idle.json']) put(join(root, 'dist/art', f), readFileSync(join(root, 'public/art', f), 'utf8'));
    const args = { distDir: join(root, 'dist'), publicDir: join(root, 'public') };
    expect(verifyShippedSidecars(args).problems.join('\n'), 'the build as Vite copied it still carries the paths').toMatch(/echo\.json: the shipped sidecar is not the master with its local paths replaced/);
    redactBuildSidecars(join(root, 'dist'));
    expect(verifyShippedSidecars(args)).toEqual({ checked: 2, redacted: 1, problems: [] });
    put(join(root, 'dist/art/characters/yuna/idle.json'), CLEAN.replace('30', '31'));
    expect(verifyShippedSidecars(args).problems.join('\n')).toMatch(/idle\.json: the shipped sidecar is not the master/);
    rmSync(join(root, 'dist/art/title/echo.json'));
    expect(verifyShippedSidecars(args).problems.join('\n')).toMatch(/echo\.json: the build does not hold this sidecar/);
  });

  it('runs in the Vite plugin at closeBundle, whatever the art switch says, and never writes public/', () => {
    const root = tmp();
    put(join(root, 'public/art/title/echo.json'), DIRTY);
    put(join(root, 'dist/index.html'), '<!doctype html>');
    put(join(root, 'dist/art/title/echo.json'), DIRTY);
    const plugin = pyreflyArtDerive({ scope: 'off' }) as unknown as { configResolved(c: unknown): void; closeBundle(): void };
    plugin.configResolved({ root, build: { outDir: 'dist' } });
    plugin.closeBundle();
    expect(readFileSync(join(root, 'dist/art/title/echo.json'), 'utf8')).not.toMatch(/Tools|someone|Pictures/);
    expect(readFileSync(join(root, 'public/art/title/echo.json'), 'utf8')).toBe(DIRTY);
    plugin.closeBundle(); // a second call is a no-op
  });
});
