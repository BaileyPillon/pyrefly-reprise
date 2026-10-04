/**
 * Release 38 ("r38-bytes"): the production build ships the painted art as lossless WebP, and `artUrl` hands the browser the file
 * the site serves (`src/engine/ArtShipped.ts`). Dev and the unit suite serve PNG and map every URL to itself, so a mistake here
 * would show only in a production build. Two rules over the source keep the mapping in one place; each failure names the file.
 * Both games: shared build plumbing, no game content.
 *
 *   1. An art URL is made by `artUrl` and nowhere else. A file that builds one by hand from the base path
 *      (`import.meta.env.BASE_URL`) would name a master that no longer ships: only the art loader, the art manifest's own path
 *      and the audio loader may read the base.
 *   2. Code that reads an art URL back apart with a pattern naming `.png` must first ask `logicalArtUrl` (or `sidecarUrlOf`),
 *      or a derived `.webp` would not match and the art would look missing. A file with such a pattern must import `ArtShipped`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', '..', 'src');

function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sources(full, out);
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

/** The code of a source file: whole-line comments and block-comment lines dropped, trailing `//` comments cut. */
function codeLines(source: string): Array<{ n: number; text: string }> {
  const out: Array<{ n: number; text: string }> = [];
  let inBlock = false;
  source.split(/\r?\n/).forEach((line, i) => {
    let text = line;
    if (inBlock) {
      const end = text.indexOf('*/');
      if (end < 0) return;
      inBlock = false;
      text = text.slice(end + 2);
    }
    for (let start = text.indexOf('/*'); start >= 0; start = text.indexOf('/*')) {
      const end = text.indexOf('*/', start + 2);
      if (end < 0) {
        text = text.slice(0, start);
        inBlock = true;
        break;
      }
      text = text.slice(0, start) + text.slice(end + 2);
    }
    text = text.replace(/(^|\s)\/\/.*$/, '$1');
    if (text.trim()) out.push({ n: i + 1, text });
  });
  return out;
}

const rel = (f: string) => relative(SRC, f).split('\\').join('/');
const ALL = sources(SRC);
// Read and stripped once, at load: three tests share it, and a test's own time limit should not pay for reading 1,200 files.
const TEXT = new Map(ALL.map((f) => [f, readFileSync(f, 'utf8')] as const));
const CODE = new Map(ALL.map((f) => [f, codeLines(TEXT.get(f)!)] as const));
const codeOf = (relative: string) => CODE.get(join(SRC, relative))!;

describe('art URLs come from artUrl', () => {
  const MAY_READ_THE_BASE = new Set(['engine/PaintedArt.ts', 'engine/ArtManifest.ts', 'audio/AudioManager.ts']);

  it('reads the source set it checks', () => {
    expect(ALL.length).toBeGreaterThan(400);
    expect(ALL.map(rel)).toContain('engine/ArtShipped.ts');
  });

  it('only the art loader, the art manifest path and the audio loader read the base path', () => {
    const offenders = ALL.filter((f) => !MAY_READ_THE_BASE.has(rel(f)) && CODE.get(f)!.some((l) => /\bBASE_URL\b/.test(l.text))).map(rel);
    expect(offenders, 'build the URL with artUrl(path) so a derived WebP is named as the site serves it').toEqual([]);
  });

  it('every file whose code matches a pattern naming .png also imports ArtShipped', () => {
    const PATTERN = /\\\.png/; // a backslash, a dot and "png": a regular expression naming the extension
    const IMPORTS_IT = /from '[./]+(?:[a-z-]+\/)*ArtShipped\.ts'/;
    const offenders = ALL.filter((f) => rel(f) !== 'engine/ArtShipped.ts' && CODE.get(f)!.some((l) => PATTERN.test(l.text)) && !IMPORTS_IT.test(TEXT.get(f)!)).map(rel);
    expect(offenders, 'read the URL through logicalArtUrl() (src/engine/ArtShipped.ts) before matching it').toEqual([]);
  });

  it('the files that read an art URL apart do call the mapping, not just import it', () => {
    for (const f of ['engine/ArtManifest.ts', 'engine/ArtTier.ts', 'engine/KoFallback.ts', 'engine/KoPoseScale.ts', 'ui/common/portrait.ts', 'ui/common/chapterPanel.ts', 'ui/common/restPoses.ts', 'app/screens/frontend/titleMarkup.ts']) {
      const code = codeOf(f).map((l) => l.text).join('\n');
      expect(/\b(?:logicalArtUrl|sidecarUrlOf)\(/.test(code), f).toBe(true);
    }
    expect(codeOf('engine/PaintedArt.ts').some((l) => /shippedArtUrl\(/.test(l.text))).toBe(true);
    expect(codeOf('app/screens/pause/livingParts.ts').some((l) => /shippedArtUrl\(/.test(l.text))).toBe(true);
  });
});
