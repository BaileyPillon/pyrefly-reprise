/**
 * Release 38 ("r38-bytes"): the gates that prove a build's derived art (`tools/art-verify.mjs`) and the Vite plugin that makes
 * the build (`tools/art-derive-plugin.mjs`). The pixel-identity gate fails a tampered build; the reference audit fails a page that
 * names a file the build left out; the plugin inserts the list, applies the plan and names the served files. Tiny synthetic images
 * in a temporary folder (`helpers/artFixtures.ts`). Both games: shared build plumbing.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DERIVED_REPORT, applyPlan, planArtDerivation } from '../../tools/art-derive-lib.mjs';
import { pyreflyArtDerive } from '../../tools/art-derive-plugin.mjs';
import { artNamesIn, auditArtReferences, formatAudit, verifyShippedArt } from '../../tools/art-verify.mjs';
import { makeBuild, makeStandardArt, makeWorld, removeWorld, sprite } from './helpers/artFixtures.ts';

let root = '';
let pub = '';
let cache = '';
beforeEach(() => {
  ({ root, pub, cache } = makeWorld());
});
afterEach(() => removeWorld(root));
const fakeBuild = (extra: Record<string, string> = {}): string => makeBuild(pub, root, extra);
const standardArt = (): Promise<void> => makeStandardArt(pub);

describe('applying the plan to a build, and the gates over the result', () => {
  it('writes the WebP, leaves out the PNG, records every mapping, and passes the pixel-identity gate', async () => {
    await standardArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    const out = fakeBuild();
    const done = applyPlan(out, plan);
    expect(done).toMatchObject({ webp: 5, png: 0, skipped: [] });
    for (const e of plan.entries) {
      expect(existsSync(join(out, e.shippedRel)), e.shippedRel).toBe(true);
      expect(existsSync(join(out, e.rel)), `${e.rel} must be left out`).toBe(false);
      expect(statSync(join(out, e.shippedRel)).size).toBe(e.shippedBytes);
    }
    expect(existsSync(join(out, 'art/pause/x.2x.webp'))).toBe(true); // the lossy 2x master is nobody's derived copy
    expect(existsSync(join(pub, 'art/characters/hero/idle.png'))).toBe(true); // the masters never change
    const record = JSON.parse(readFileSync(join(out, DERIVED_REPORT), 'utf8')) as { files: Array<{ path: string; kind: string; shipped?: string }>; version: number };
    expect(record.version).toBe(1);
    expect(record.files.map((f) => f.path)).toEqual(plan.entries.map((e) => e.rel));
    expect(record.files.every((f) => f.kind === 'webp' && f.shipped?.endsWith('.webp'))).toBe(true);
    const v = await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2 });
    expect(v).toMatchObject({ ok: true, checked: 5, webp: 5, png: 0, decoded: 5, problems: [] });
  });

  it('the gate fails a WebP that does not decode to the master, a missing file, a doubled file and a stale record', async () => {
    await standardArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    const out = fakeBuild();
    applyPlan(out, plan);
    // 1. a different picture under the right name
    writeFileSync(join(out, 'art/backdrops/sky.webp'), await sharp(sprite(96, 54), { raw: { width: 96, height: 54, channels: 4 } }).webp({ lossless: true }).toBuffer());
    // 2. a lossy copy (close, not equal)
    writeFileSync(join(out, 'art/characters/hero/idle.webp'), await sharp(join(pub, 'art/characters/hero/idle.png')).webp({ quality: 90 }).toBuffer());
    // 3. both the PNG and its WebP
    cpSync(join(pub, 'art/portraits/grey.png'), join(out, 'art/portraits/grey.png'));
    // 4. neither
    rmSync(join(out, 'art/pause/x.webp'));
    const v = await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2 });
    expect(v.ok).toBe(false);
    const text = v.problems.join('\n');
    expect(text).toMatch(/art\/backdrops\/sky\.png: the shipped WebP decodes to different pixels/);
    expect(text).toMatch(/art\/characters\/hero\/idle\.png: the shipped WebP decodes to different pixels/);
    expect(text).toMatch(/art\/portraits\/grey\.png: the build holds both/);
    expect(text).toMatch(/art\/pause\/x\.png: the build holds neither/);
  });

  it('the gate fails a build that ships WebP with no record, and a record of a file that is not an art master', async () => {
    await standardArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    const out = fakeBuild();
    applyPlan(out, plan);
    const file = join(out, DERIVED_REPORT);
    const record = JSON.parse(readFileSync(file, 'utf8')) as { files: Array<Record<string, unknown>> };
    writeFileSync(file, JSON.stringify({ ...record, files: [...record.files, { path: 'art/ghost.png', kind: 'copy', master: 1, bytes: 1 }] }));
    expect((await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2 })).problems.join('\n')).toMatch(/art\/ghost\.png: art\/derived\.json lists a master that is not in public\/art/);
    rmSync(file);
    expect((await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2 })).problems.join('\n')).toMatch(/art\/derived\.json is missing from a build that ships 5 derived WebP/);
  });

  it('a build with the switch off passes the same gate with the PNGs byte for byte', async () => {
    await standardArt();
    const out = fakeBuild();
    const v = await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2 });
    expect(v).toMatchObject({ ok: true, webp: 0, png: 5, decoded: 0, problems: [] });
  });
});

describe('the reference audit', () => {
  const FILES = {
    'index.html': '<link rel="preload" as="image" href="/pyrefly-reprise/art/backdrops/sky.webp">',
    'assets/index-1.css': '.a{background:url(/pyrefly-reprise/art/pause/x.2x.webp)}',
    'assets/index-1.js': 'const a="art/backdrops/sky.png",b="art/characters/hero/idle.png",c="art/portraits/missing.png",d=`art/portraits/${e}.png`;',
    'audio/manifest.json': '{"tracks":[]}',
    // Provenance: where a depth map came from. A path behind public/ or inside a sentence is not a reference.
    'fx/sky/depth.json': '{"source":"public/art/backdrops/sky.png","note":"derived from art/backdrops/sky.png, then shrunk"}',
  };

  it('reads the names a text carries, and not a word that merely ends in art/', () => {
    expect(artNamesIn('a "/pyrefly-reprise/art/backdrops/sky.png?v=1" b "art/pause/x.2x.webp" c martart/x.png d `art/${id}.png`')).toEqual(['art/backdrops/sky.png', 'art/pause/x.2x.webp']);
  });

  it('passes pages and styles that name shipped files, and counts the bundle\'s names without judging the dangling ones that always were', async () => {
    await standardArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    const out = fakeBuild(FILES);
    applyPlan(out, plan);
    const base = join(root, 'base');
    cpSync(pub, base, { recursive: true });
    for (const [rel, body] of Object.entries(FILES)) {
      mkdirSync(dirname(join(base, rel)), { recursive: true });
      writeFileSync(join(base, rel), rel === 'index.html' ? body.replace('sky.webp', 'sky.png') : body);
    }
    const r = auditArtReferences(out, { baselineDir: base });
    expect(r.problems).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.stats).toMatchObject({ strictNames: 2, jsNames: 3, jsDerived: 2, dynamicPieces: 1, provenanceMentions: 3 });
    expect(r.dangling).toEqual(['art/portraits/missing.png']);
    expect(r.newDangling).toEqual([]);
    expect(formatAudit(r)).toMatch(/PASS/);
  });

  it('fails a page that still names a PNG the build left out, and a bundle name that became dangling', async () => {
    await standardArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    const out = fakeBuild({ ...FILES, 'index.html': '<link rel="preload" as="image" href="/pyrefly-reprise/art/backdrops/sky.png">', 'data/plates.json': '{"plate":"/pyrefly-reprise/art/backdrops/ghost.png","list":["art/backdrops/sky.png"]}' });
    applyPlan(out, plan);
    const base = join(root, 'base');
    cpSync(pub, base, { recursive: true });
    mkdirSync(join(base, 'assets'), { recursive: true });
    writeFileSync(join(base, 'assets/index-1.js'), 'const a="art/backdrops/sky.png";');
    const r = auditArtReferences(out, { baselineDir: base });
    expect(r.ok).toBe(false);
    expect(r.strict).toEqual([
      'data/plates.json: names art/backdrops/ghost.png, which is not in the build',
      'data/plates.json: names art/backdrops/sky.png, which is not in the build',
      'index.html: names art/backdrops/sky.png, which is not in the build',
    ]);
    expect(r.newDangling).toEqual(['art/portraits/missing.png']);
    expect(formatAudit(r)).toMatch(/FAIL/);
  });
});

describe('the Vite plugin', () => {
  it('puts the derived list in the bundle, applies the plan to the output and names the served files in the finished index.html', async () => {
    await standardArt();
    const plugin = pyreflyArtDerive({ scope: 'all', cacheDir: cache, jobs: 2 }) as unknown as {
      apply: string;
      config(user: { root: string }): Promise<{ define: Record<string, string> }>;
      configResolved(c: { root: string; build: { outDir: string } }): void;
      closeBundle(): void;
    };
    expect(plugin.apply).toBe('build');
    const cfg = await plugin.config({ root });
    expect(JSON.parse(cfg.define['__PYREFLY_ART_WEBP__']!)).toEqual(['art/backdrops/sky.png', 'art/characters/hero/idle.png', 'art/characters/hero/idle@2x.png', 'art/pause/x.png', 'art/portraits/grey.png']);
    // The page as Vite writes it: the title preload names the plate in `href` and in `imagesrcset`, behind the base path.
    const out = fakeBuild({
      'index.html': '<link href="/pyrefly-reprise/art/backdrops/sky.png" imagesrcset="/pyrefly-reprise/art/pause/x.png 1344w, /pyrefly-reprise/art/pause/x.2x.webp 2688w"><img src="/pyrefly-reprise/art/elsewhere/z.png">',
    });
    plugin.configResolved({ root, build: { outDir: 'out' } });
    plugin.closeBundle();
    expect(readFileSync(join(out, 'index.html'), 'utf8')).toBe(
      '<link href="/pyrefly-reprise/art/backdrops/sky.webp" imagesrcset="/pyrefly-reprise/art/pause/x.webp 1344w, /pyrefly-reprise/art/pause/x.2x.webp 2688w"><img src="/pyrefly-reprise/art/elsewhere/z.png">',
    );
    expect(existsSync(join(out, 'art/backdrops/sky.webp'))).toBe(true);
    expect(existsSync(join(out, 'art/backdrops/sky.png'))).toBe(false);
    expect(existsSync(join(out, DERIVED_REPORT))).toBe(true);
    expect(existsSync(join(pub, 'art/backdrops/sky.png'))).toBe(true);
  });

  it('is a no-op with the switch off: an empty list, the HTML as it was, every PNG shipped', async () => {
    await standardArt();
    const plugin = pyreflyArtDerive({ scope: 'off', cacheDir: cache }) as unknown as {
      config(user: { root: string }): Promise<{ define: Record<string, string> }>;
      configResolved(c: { root: string; build: { outDir: string } }): void;
      closeBundle(): void;
    };
    expect((await plugin.config({ root })).define['__PYREFLY_ART_WEBP__']).toBe('[]');
    const out = fakeBuild({ 'index.html': '<img src="/art/backdrops/sky.png">' });
    plugin.configResolved({ root, build: { outDir: 'out' } });
    plugin.closeBundle();
    expect(existsSync(join(out, 'art/backdrops/sky.png'))).toBe(true);
    expect(existsSync(join(out, DERIVED_REPORT))).toBe(false);
    expect(readFileSync(join(out, 'index.html'), 'utf8')).toBe('<img src="/art/backdrops/sky.png">');
  });

  it('stops a build whose output lacks a planned art file, rather than ship a name with no file', async () => {
    await standardArt();
    const plugin = pyreflyArtDerive({ scope: 'all', cacheDir: cache, jobs: 2 }) as unknown as {
      config(user: { root: string }): Promise<unknown>;
      configResolved(c: { root: string; build: { outDir: string } }): void;
      closeBundle(): void;
    };
    await plugin.config({ root });
    const out = fakeBuild();
    rmSync(join(out, 'art/backdrops/sky.png'));
    plugin.configResolved({ root, build: { outDir: 'out' } });
    expect(() => plugin.closeBundle()).toThrow(/planned art file\(s\) are not in the build output/);
  });

  it('lets a checkout with no art at all through (public/art is gitignored): an empty list, nothing written', async () => {
    const plugin = pyreflyArtDerive({ scope: 'all', cacheDir: cache, jobs: 1 }) as unknown as {
      config(user: { root: string }): Promise<{ define: Record<string, string> }>;
      configResolved(c: { root: string; build: { outDir: string } }): void;
      closeBundle(): void;
    };
    expect((await plugin.config({ root })).define['__PYREFLY_ART_WEBP__']).toBe('[]');
    const out = join(root, 'out');
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'index.html'), '<html></html>');
    plugin.configResolved({ root, build: { outDir: 'out' } });
    expect(() => plugin.closeBundle()).not.toThrow();
    expect(existsSync(join(out, 'art'))).toBe(false);
  });
});

