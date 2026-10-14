/**
 * The build must carry no path of the machine that made it (r46-fix, FOC46-01): the matcher, the redaction and the gate of
 * `tools/dist-local-paths.mjs` (both games, build plumbing).
 * Positive cases are the shapes the painting sidecars carried (a drive and a staging folder, a user-profile folder, both slashes, a JSON string);
 * the negative cases are what a bundle, a stylesheet and a page legitimately hold: URLs, CSS declarations, SVG path data, regex literals in
 * minified code, prose that mentions "Users". The scan reports a file, a line and a kind, and never the path. The redaction replaces each path
 * by its last name: the same rule decides what is found and what is replaced, and nothing the matcher does not find is touched.
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findLocalPaths, formatLocalPathReport, leafOfPath, redactLocalPaths, scanBuildForLocalPaths } from '../../tools/dist-local-paths.mjs';

const kinds = (text: string): string[] => findLocalPaths(text).map((h) => h.kind);

/** What a bundle, a stylesheet, a page and a sentence legitimately hold: none of it is a local path, and the redaction must leave each as it is. */
const NOT_PATHS: [string, string][] = [
  ['https', 'see https://example.com/a and http://localhost:5173/x'],
  ['an ftp or data URL', 'ftp://host/dir and data:image/png;base64,AAAA and blob:http://x/1'],
  ['a protocol-relative URL', 'url(//cdn.example.com/x.js)'],
  ['a URL with a Users segment', 'https://example.com/Users/list and https://example.com/docs/Users/guide'],
  ['a CSS declaration with a space', 'a { d: 0; x: 1px } p{ color: red }'],
  ['a CSS pseudo-class and a selector', 'a:hover{color:red} li:first-child{margin:0}'],
  ['SVG path data', '<path d="M10 10 L20:30" /> <svg viewBox="0 0 10 10">'],
  ['a ternary with a slash', 'x?a:/*c*/b'],
  ['a time and a ratio, again, after a quote', '"12:30/45" \'16:9/10\''],
  ['a time and a ratio', 'at 12:30/45 and 16:9/10'],
  ['a relative path', './art/characters/yuna/idle.json and ../x/y and art/title/echo.json'],
  ['a site path', '/art/characters/yuna/idle.json'],
  ['a part of a longer path named Users', 'src/Users/list and docs/Documents and Settings/page'],
  ['a word that ends in a letter and a colon', 'Note: see Users guide; Status: ok; Game: FFX'],
  ['the bare word Users in prose', 'All Users can open the pause menu; the Users tab and the Users: list'],
  ['a port and a path', 'localhost:8080/path'],
  ['a letter and a colon without a slash', 'D: stuff, and C:'],
];

describe('findLocalPaths: what it catches', () => {
  it.each([
    ['a drive and a staging folder, forward slashes', '"installedFrom": "D:/Tools/staging/idle.png"', ['drive']],
    ['the same with backslashes escaped in JSON', '"init": "D:\\\\Tools\\\\scratch\\\\init.png"', ['drive']],
    ['a lower-case drive', 'see c:\\work\\notes.txt', ['drive']],
    ['another drive letter and a space in the folder name', 'E:/Project Files/art/x.png', ['drive']],
    ['a file URL to a drive', 'file:///D:/Tools/backup/x.png', ['drive']],
    ['a user-profile folder under a drive (the drive rule has it whole: one hit)', '"pickFile": "C:/Users/someone/Downloads/x.png"', ['drive']],
    ['a user-profile folder without a drive', 'in /Users/someone/Library/x.png', ['profile']],
    ['a profile folder at the start of a value', '"c": "Users/someone/Library/x.png"', ['profile']],
    ['a Windows profile with backslashes', 'C:\\Users\\someone\\AppData\\x', ['drive']],
    ['a drive-less Windows profile, escaped in JSON', '"p": "\\\\Users\\\\someone\\\\AppData"', ['profile']],
    ['an old profile folder name', 'C:\\Documents and Settings\\someone\\x', ['drive']],
    ['a path inside a longer sentence', 'copied from D:/Tools/art-backup/title/echo.png on the build machine', ['drive']],
  ])('%s', (_name, text, expected) => {
    expect(kinds(text).sort()).toEqual([...expected].sort());
  });

  it('reports the line and column, one hit per path, in order', () => {
    const hits = findLocalPaths('{\n  "a": 1,\n  "b": "x D:/Tools/a and E:/Tools/b",\n  "c": "Users/me/x"\n}\n');
    expect(hits.map((h) => `${h.line}:${h.column}:${h.kind}`)).toEqual(['3:11:drive', '3:26:drive', '4:9:profile']);
  });
});

describe('findLocalPaths: what it must not trip on', () => {
  it.each(NOT_PATHS)('%s', (_name, text) => {
    expect(findLocalPaths(text), text).toEqual([]);
  });
});

describe('findLocalPaths in code and stylesheets (the stricter drive rule)', () => {
  const code = (text: string): string[] => findLocalPaths(text, { code: true }).map((h) => h.kind);

  it('does not read an object key followed by a regex literal as a drive', () => {
    expect(code('var t={a:/foo\\/bar/i,b:/x/y/g,c:/[\\\\/]a/}')).toEqual([]);
    expect(code('x?a:/b/c/.test(d):e')).toEqual([]);
    expect(code('.a{background:url(a:/b/c)}')).toEqual([]);
  });

  it('still catches an upper-case drive path with two folders, in a string of the bundle', () => {
    expect(code('const p="D:/Tools/staging/idle.png"')).toEqual(['drive']);
    expect(code('const p="D:\\\\Tools\\\\staging\\\\idle.png"')).toEqual(['drive']);
    expect(code('const p="C:/Users/someone/x"')).toEqual(['drive']);
    expect(code('const p="/Users/someone/Library/x"')).toEqual(['profile']);
  });
});

describe('redactLocalPaths: each local path becomes its last name', () => {
  it.each([
    ['a drive path', 'D:/Tools/staging/idle.png', 'idle.png'],
    ['backslashes', 'D:\\Tools\\staging\\idle.png', 'idle.png'],
    ['doubled backslashes (a JSON text, not yet decoded)', 'D:\\\\Tools\\\\staging\\\\idle.png', 'idle.png'],
    ['a path inside a longer sentence', 'copied from D:/Tools/art-backup/title/echo.png on the build machine', 'copied from echo.png on the build machine'],
    ['a path that ends in a folder, with a slash', 'saved to D:/Tools/scratch/out/ then', 'saved to out then'],
    ['a path that ends in a folder, without one', 'in D:/Tools/scratch/out and more', 'in out and more'],
    ['commas and a full stop after paths', 'see D:/Tools/a/b.png, then E:/Tools/c/d.png.', 'see b.png, then d.png.'],
    ['in parentheses and in quotes', '(see D:/Tools/a/b.png) and "D:/Tools/c/d.png" and \'D:/Tools/e/f.png\'', '(see b.png) and "d.png" and \'f.png\''],
    ['a folder name with a space (every word capitalised, a slash after it)', 'D:\\Project Files\\public\\art\\x.png and Notes', 'x.png and Notes'],
    ['a lower-case joining word inside a folder name', 'C:\\Documents and Settings\\someone\\x\\y.txt', 'y.txt'],
    ['words after a file name are never eaten, even with a slash and capitals in them', 'D:/Tools/x/y.png and Final Notes/more', 'y.png and Final Notes/more'],
    ['a profile path under a drive', 'C:/Users/someone/AppData/Roaming/Foo/bar.txt', 'bar.txt'],
    ['a profile path without a drive', 'in /Users/someone/Library/x.png ok', 'in x.png ok'],
    ['a profile path at the start of a value', 'Users/someone/Pictures/x.png', 'x.png'],
    ['the profile folder itself is never a person', 'saved in C:/Users/someone', 'saved in Users'],
    ['a glob and an @ in a name', 'D:/Tools/out-2026*/idle@2x.png', 'idle@2x.png'],
    ['a name in another script', 'D:/Tools/\u30c6\u30b9\u30c8/\u7d75.png', '\u7d75.png'],
  ])('%s', (_name, text, expected) => {
    expect(redactLocalPaths(text)).toBe(expected);
  });

  it('counts what it replaced, and leaves no path the matcher finds', () => {
    const text = 'a D:/Tools/x/y.png and C:\\Users\\me\\z.png and Users/me/w.png';
    expect(redactLocalPaths(text, { count: true })).toEqual({ text: 'a y.png and z.png and w.png', count: 3 });
    expect(findLocalPaths(redactLocalPaths(text))).toEqual([]);
  });

  it.each(NOT_PATHS)('leaves %s as it was', (_name, text) => {
    expect(redactLocalPaths(text)).toBe(text);
  });

  it('is idempotent, and a replaced name never starts a new path', () => {
    for (const text of ['D:/Tools/a:/b/c.png', 'x D:/a/b:/c/d.png y', 'C:/Users/someone and D:/Tools/x/']) {
      const once = redactLocalPaths(text);
      expect(redactLocalPaths(once)).toBe(once);
      expect(findLocalPaths(once), text).toEqual([]);
    }
  });

  it('names a span by its last name, a full stop after it kept', () => {
    expect(leafOfPath('D:/Tools/a/b.png.')).toBe('b.png.');
    expect(leafOfPath('Users/someone')).toBe('Users');
    expect(leafOfPath('D:/Tools')).toBe('Tools');
  });
});

describe('the deploy runs the gate', () => {
  it('searches every shipped text file after the art audits and before the browser load, and refuses the deploy on a hit', () => {
    const deploy = readFileSync(join(import.meta.dirname, '..', '..', 'tools', 'deploy-pages.mjs'), 'utf8');
    const at = (s: string): number => deploy.indexOf(s);
    expect(deploy).toContain("import { formatLocalPathReport, scanBuildForLocalPaths } from './dist-local-paths.mjs';");
    expect(at('scanBuildForLocalPaths(DIST)')).toBeGreaterThan(at('auditArtReferences(DIST)'));
    expect(at('await verifyArtLoads(')).toBeGreaterThan(at('scanBuildForLocalPaths(DIST)'));
    expect(deploy).toMatch(/if \(localPaths\.hits\.length\) fail\(/);
    expect(deploy.slice(at('scanBuildForLocalPaths(DIST)'), at('await verifyArtLoads('))).not.toMatch(/localPaths\.hits\.slice|\.hits\.map|JSON\.stringify\(localPaths/); // the paths are never printed
  });

  it('is run by the Vite build itself, for the sidecars: the plugin calls the redaction at closeBundle, and the gate is the deploy\'s second line', () => {
    const plugin = readFileSync(join(import.meta.dirname, '..', '..', 'tools', 'art-derive-plugin.mjs'), 'utf8');
    expect(plugin).toContain("import { redactBuildSidecars } from './art-sidecar-redact.mjs';");
    expect(plugin.indexOf('redactBuildSidecars(outDir)')).toBeGreaterThan(plugin.indexOf('closeBundle()'));
    // before the plan is looked at: the art switch (PYREFLY_ART_WEBP=off) cannot turn it off
    expect(plugin.indexOf('redactBuildSidecars(outDir)')).toBeLessThan(plugin.indexOf('if (plan === null || applied) return;'));
  });
});

describe('scanBuildForLocalPaths: a build folder', () => {
  it('lists the files that carry a path, skips binary files, and never prints a path', () => {
    const root = mkdtempSync(join(tmpdir(), 'dist-paths-'));
    try {
      mkdirSync(join(root, 'art', 'characters'), { recursive: true });
      writeFileSync(join(root, 'index.html'), '<a href="https://example.com/x">x</a>');
      writeFileSync(join(root, 'art', 'characters', 'clean.json'), JSON.stringify({ width: 10, height: 20 }));
      writeFileSync(join(root, 'art', 'characters', 'dirty.json'), JSON.stringify({ width: 10, installedFrom: 'D:/Tools/staging/x.png', note: 'C:\\Users\\someone\\x' }, null, 1));
      writeFileSync(join(root, 'art', 'characters', 'picture.png'), Buffer.from('D:/Tools/staging/binary-not-read'));
      const report = scanBuildForLocalPaths(root);
      expect(report.scanned).toBe(3);
      expect([...new Set(report.hits.map((h) => h.file))]).toEqual(['art/characters/dirty.json']);
      expect(report.hits.map((h) => h.kind).sort()).toEqual(['drive', 'drive']);
      const text = formatLocalPathReport(report);
      expect(text).toContain('art/characters/dirty.json');
      expect(text).not.toMatch(/Tools|staging|someone/);
      expect(formatLocalPathReport({ scanned: 3, hits: [] })).toBe('local paths: none in 3 text file(s)');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('applies the stricter rule to code and stylesheets, the plain rule to data and pages', () => {
    const root = mkdtempSync(join(tmpdir(), 'dist-paths-'));
    try {
      mkdirSync(join(root, 'assets'), { recursive: true });
      writeFileSync(join(root, 'assets', 'index-abc.js'), 'var t={a:/foo\\/bar/i,b:/x/y/g};export{t}');
      writeFileSync(join(root, 'assets', 'index-abc.css'), '.a{background:url(a:/b/c)}');
      writeFileSync(join(root, 'notes.json'), '{"p":"a:/b"}');
      const report = scanBuildForLocalPaths(root);
      expect(report.hits.map((h) => h.file)).toEqual(['notes.json']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
