/**
 * r44-thumbs (both games, shared build plumbing): `tools/art-thumbs.mjs` derives ONE small copy of each painting the chapter board's
 * strips paint, by a rule and never by hand, and proves it. The masters in `public/art` are never written. Synthetic pictures in a
 * temporary folder (`helpers/thumbFixtures.ts`): no real art, no real cache.
 */
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DERIVED_REPORT, MIN_WEBP_BYTES, applyPlan, pixelsOf, planArtDerivation, sha256 } from '../../tools/art-derive-lib.mjs';
import { pyreflyArtDerive } from '../../tools/art-derive-plugin.mjs';
import {
  THUMB_SPEC,
  applyThumbs,
  planThumbs,
  readStripList,
  referenceThumb,
  resolveThumbSwitch,
  thumbCacheTag,
  thumbMap,
  thumbName,
  thumbReport,
  thumbTarget,
} from '../../tools/art-thumbs.mjs';
import { makeBuild, makeWorld, removeWorld } from './helpers/artFixtures.ts';
import { STRIP_FIXTURE_LIST, makeStripArt, writeStripList } from './helpers/thumbFixtures.ts';

let root = '';
let pub = '';
let cache = ''; // a cold cache of this test's own
let warm = ''; // the cache every test may share: one plan fills it once
let listFile = '';
let first: Awaited<ReturnType<typeof planThumbs>>;
const firstLog: string[] = [];
let turn = 0;
// The pictures are made, and the first plan is made, once: encoding a thumbnail at the pipeline's quality takes seconds. Every test
// gets its own cold cache and its own output folder where it needs one, so none depends on another.
beforeAll(async () => {
  ({ root, pub } = makeWorld());
  await makeStripArt(pub);
  listFile = writeStripList(root);
  warm = join(root, 'cache-warm');
  first = await planThumbs({ publicDir: pub, cacheDir: warm, listFile, jobs: 2, log: (m) => firstLog.push(m) });
}, 120_000);
beforeEach(() => {
  turn++;
  cache = join(root, `cache-${turn}`);
});
afterAll(() => removeWorld(root));

/** What Vite leaves in the output before the plugins' closeBundle, in a folder of its own (the previous one is removed). */
function freshBuild(extra: Record<string, string> = {}): string {
  rmSync(join(root, 'out'), { recursive: true, force: true });
  return makeBuild(pub, root, extra);
}

describe('the rule: how big a thumbnail is', () => {
  it("a scene is 768 px wide and a figure 576 px tall, the other side to the master's aspect, rounded to a whole pixel, never enlarged", () => {
    expect(THUMB_SPEC).toMatchObject({ kernel: 'lanczos3', sceneWidth: 768, figureHeight: 576 });
    // The real masters' sizes: the backdrops are 2688 x 1536, a boss is about 816 x 1167.
    expect(thumbTarget('art/backdrops/gagazet.png', 2688, 1536)).toEqual({ width: 768, height: 439, reduced: true });
    expect(thumbTarget('art/characters/trema/idle.png', 816, 1167)).toEqual({ width: 403, height: 576, reduced: true });
    expect(thumbTarget('art/characters/x2-shiva/idle.png', 714, 1287)).toEqual({ width: 320, height: 576, reduced: true });
    expect(thumbTarget('art/backdrops/wide.png', 1500, 1000)).toEqual({ width: 768, height: 512, reduced: true });
    // A master no larger than the thumbnail is not reduced: it has none.
    expect(thumbTarget('art/backdrops/small.png', 768, 432).reduced).toBe(false);
    expect(thumbTarget('art/backdrops/small.png', 500, 300).reduced).toBe(false);
    expect(thumbTarget('art/characters/tiny/idle.png', 300, 400).reduced).toBe(false);
    expect(thumbTarget('art/characters/tiny/idle.png', 600, 576).reduced).toBe(false);
  });

  it('is sized for the strip as the browser draws it, measured on the real board: sharp at 2x on a desktop and at 3x on a phone, with room', () => {
    // Device pixels of the strip on the real board (docs/handoff/r44-thumbs.md, measured with the board mounted in Chromium at each size):
    // the scene is as wide as the card's art, a boss on a card as tall as its tallest placement (Leblanc's 480 percent of a card).
    const scene = { '1600x900@1': 233, '1600x900@2': 467, '2560x1440@1': 374, '3840x2160@1': 562, '390x844@3': 722, '390x844@2': 481, '5K retina (2560x1440@2)': 750 };
    const boss = { '1600x900@1': 118, '1600x900@2': 236, '3840x2160@1': 295, '390x844@3': 478, '768x1024@2 (tablet)': 391, '1024x1366@2 (large tablet)': 528 };
    for (const [name, px] of Object.entries(scene)) expect(THUMB_SPEC.sceneWidth, name).toBeGreaterThanOrEqual(px);
    for (const [name, px] of Object.entries(boss)) expect(THUMB_SPEC.figureHeight, name).toBeGreaterThanOrEqual(px);
  });

  it('reads the switch: on by default, off by word, a typo stops the build', () => {
    expect(resolveThumbSwitch(undefined)).toBe('on');
    expect(resolveThumbSwitch('')).toBe('on');
    expect(resolveThumbSwitch(' ON ')).toBe('on');
    expect(resolveThumbSwitch('OFF')).toBe('off');
    expect(() => resolveThumbSwitch('maybe')).toThrow(/PYREFLY_ART_THUMBS/);
  });
});

describe('the strip list', () => {
  it("reads the masters sorted, and refuses anything that is not a scene backdrop or a character's idle", () => {
    expect(readStripList(listFile)).toEqual([...STRIP_FIXTURE_LIST]);
    const other = join(root, 'other-list.json'); // the shared list is left as it is
    writeFileSync(other, JSON.stringify({ masters: ['art/characters/b/idle.png', 'art/backdrops/a.png'] }));
    expect(readStripList(other)).toEqual(['art/backdrops/a.png', 'art/characters/b/idle.png']);
    for (const bad of [['art/pause/x.png'], ['art/characters/b/attack.png'], ['art/backdrops/A.png'], ['art/backdrops/a.webp'], ['art/backdrops/a.png', 'art/backdrops/a.png'], [3]]) {
      writeFileSync(other, JSON.stringify({ masters: bad }));
      expect(() => readStripList(other), JSON.stringify(bad)).toThrow();
    }
    writeFileSync(other, JSON.stringify({ nope: [] }));
    expect(() => readStripList(other)).toThrow(/masters/);
  });
});

describe('the derivation proves what it writes', () => {
  it('makes a lossless thumbnail of every listed master that can have one: a WebP where every decoder draws it the same, a PNG where not; the others say why', async () => {
    const plan = first;
    const by = Object.fromEntries(plan.entries.map((e) => [e.rel, e]));
    expect(plan.entries.map((e) => e.rel)).toEqual([...STRIP_FIXTURE_LIST]);
    expect(by['art/backdrops/dusk.png']).toMatchObject({ kind: 'webp', thumbRel: 'art/backdrops/dusk.thumb.webp', width: 768, height: 432, alpha: 'opaque' });
    expect(by['art/backdrops/wide.png']).toMatchObject({ kind: 'webp', thumbRel: 'art/backdrops/wide.thumb.webp', width: 768, height: 512 });
    // Soft edges: a decoder that premultiplies would draw a WebP differently from a PNG, so the boss ships as a PNG.
    expect(by['art/characters/boss/idle.png']).toMatchObject({ kind: 'png', thumbRel: 'art/characters/boss/idle.thumb.png', width: 320, height: 576, alpha: 'translucent' });
    expect(by['art/backdrops/gamma.png']).toMatchObject({ kind: 'none' });
    expect(by['art/backdrops/gamma.png']!.note).toMatch(/gAMA/);
    expect(by['art/characters/tiny/idle.png']).toMatchObject({ kind: 'none' });
    expect(by['art/characters/tiny/idle.png']!.note).toMatch(/no larger than a thumbnail/);
    expect(by['art/backdrops/missing.png']).toMatchObject({ kind: 'none', note: 'is not in public/art' });
    // Smaller than the master in pixels and bytes, and above the 64-byte floor a WebP needs.
    for (const e of plan.entries.filter((x) => x.kind !== 'none')) {
      expect(e.bytes!, e.rel).toBeLessThan(e.masterBytes!);
      if (e.kind === 'webp') expect(e.bytes!).toBeGreaterThanOrEqual(MIN_WEBP_BYTES);
      expect(statSync(e.file!).size).toBe(e.bytes);
    }
    expect(firstLog.some((l) => /dusk\.png/.test(l))).toBe(true);
  });

  it('every thumbnail decodes to its master resized by the rule, pixel for pixel, colour under alpha 0 included', async () => {
    const plan = first;
    for (const e of plan.entries.filter((x) => x.kind !== 'none')) {
      const ref = await referenceThumb(join(pub, e.rel), e.rel);
      const got = await pixelsOf(readFileSync(e.file!));
      expect(got, e.rel).toMatchObject({ width: ref.width, height: ref.height, hash: ref.hash });
      expect(e.rgba, e.rel).toBe(ref.hash);
      expect(ref.reduced).toBe(true);
    }
  });

  it('is deterministic and cached: a second plan encodes nothing, a cold cache makes the same bytes, and the masters are never written', async () => {
    const before = sha256(readFileSync(join(pub, 'art/characters/boss/idle.png')));
    const log: string[] = [];
    const again = await planThumbs({ publicDir: pub, cacheDir: warm, listFile, jobs: 2, log: (m) => log.push(m) });
    expect(log).toEqual([]); // every entry came from the cache
    expect(again.entries.map((e) => [e.rel, e.kind, e.bytes, e.rgba])).toEqual(first.entries.map((e) => [e.rel, e.kind, e.bytes, e.rgba]));
    const cold = await planThumbs({ publicDir: pub, cacheDir: cache, listFile, jobs: 2 }); // a cache of this test's own: everything is made again
    for (const [i, e] of cold.entries.entries()) {
      if (e.kind === 'none') continue;
      expect(sha256(readFileSync(e.file!)), e.rel).toBe(sha256(readFileSync(first.entries[i]!.file!)));
    }
    expect(sha256(readFileSync(join(pub, 'art/characters/boss/idle.png')))).toBe(before);
    expect(existsSync(join(pub, 'art/backdrops/dusk.thumb.webp'))).toBe(false);
  }, 60_000);

  it('keeps the cache per rule: the cache folder is named after the spec, the encoders and the libraries', () => {
    expect(thumbCacheTag()).toContain(THUMB_SPEC.id);
    expect(thumbCacheTag()).toContain(`s${THUMB_SPEC.sceneWidth}`);
    expect(thumbCacheTag()).toContain(`f${THUMB_SPEC.figureHeight}`);
    expect(thumbCacheTag()).toMatch(/sharp\d+\.\d+/);
  });

  it('names the file by the rule, and makes none when told to', async () => {
    expect(thumbName('art/backdrops/gagazet.png', 'webp')).toBe('art/backdrops/gagazet.thumb.webp');
    expect(thumbName('art/characters/trema/idle.png', 'png')).toBe('art/characters/trema/idle.thumb.png');
    const off = await planThumbs({ publicDir: pub, cacheDir: cache, listFile, off: true });
    expect(off.off).toMatch(/PYREFLY_ART_THUMBS=off/);
    expect(off.entries).toEqual([]);
    expect(thumbMap(off)).toEqual({});
    expect(thumbReport(off)).toEqual({ enabled: false, reason: off.off });
    expect(applyThumbs(join(root, 'out'), off)).toEqual({ written: 0, bytes: 0 });
  });
});

describe('what the build ships and records', () => {
  it('the map the bundle reads names exactly the thumbnails that are written, and the record lists each with the hash of its pixels', async () => {
    const plan = first;
    expect(thumbMap(plan)).toEqual({
      'art/backdrops/dusk.png': 'art/backdrops/dusk.thumb.webp',
      'art/backdrops/wide.png': 'art/backdrops/wide.thumb.webp',
      'art/characters/boss/idle.png': 'art/characters/boss/idle.thumb.png',
    });
    const out = join(root, 'out');
    expect(applyThumbs(out, plan)).toMatchObject({ written: 3 });
    for (const rel of Object.values(thumbMap(plan))) expect(existsSync(join(out, rel)), rel).toBe(true);
    const report = thumbReport(plan);
    expect(report).toMatchObject({ enabled: true, spec: THUMB_SPEC, counts: { webp: 2, png: 1, none: 3 } });
    expect(report.files!.map((f) => f.path)).toEqual([...STRIP_FIXTURE_LIST]);
    expect(report.files!.find((f) => f.path === 'art/backdrops/dusk.png')).toMatchObject({ kind: 'webp', thumb: 'art/backdrops/dusk.thumb.webp', width: 768, height: 432 });
    expect(report.files!.find((f) => f.path === 'art/backdrops/gamma.png')).toMatchObject({ kind: 'none' });
    expect(JSON.stringify(report)).toBe(JSON.stringify(thumbReport(plan))); // no clock: the same plan is the same bytes
  });

  it('applyPlan writes them beside the masters and lists them in art/derived.json; a plan with no thumbnails records none, as before r44', async () => {
    const out = freshBuild();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'off', jobs: 2 });
    expect(applyPlan(out, plan)).toMatchObject({ webp: 0, png: 0, skipped: [] });
    expect(JSON.parse(readFileSync(join(out, DERIVED_REPORT), 'utf8')).thumbs).toBeUndefined();
    plan.thumbs = first;
    const done = applyPlan(out, plan);
    expect(done.thumbs).toMatchObject({ written: 3 });
    const record = JSON.parse(readFileSync(join(out, DERIVED_REPORT), 'utf8'));
    expect(record.thumbs).toMatchObject({ enabled: true, counts: { webp: 2, png: 1, none: 3 } });
    expect(existsSync(join(out, 'art/characters/boss/idle.thumb.png'))).toBe(true);
    expect(existsSync(join(out, 'art/characters/boss/idle.png'))).toBe(true); // the master ships as it did
    expect(existsSync(join(pub, 'art/characters/boss/idle.thumb.png'))).toBe(false); // and public/art is never written
  });

  it('refuses to copy a thumbnail that is not in the cache, or whose size changed on the way', async () => {
    const plan = await planThumbs({ publicDir: pub, cacheDir: cache, listFile, jobs: 2 }); // its own cold cache: the file it tampers with is its own
    const e = plan.entries.find((x) => x.kind === 'webp')!;
    writeFileSync(e.file!, Buffer.from('not the cached file'));
    expect(() => applyThumbs(join(root, 'out'), plan)).toThrow(/not the cached file/);
    e.file = join(root, 'nowhere.webp');
    expect(() => applyThumbs(join(root, 'out2'), plan)).toThrow(/not in the cache/);
  }, 60_000);
});

describe('the Vite plugin', () => {
  type Plugin = {
    config(user: { root: string }): Promise<{ define: Record<string, string> }>;
    configResolved(c: { root: string; build: { outDir: string } }): void;
    closeBundle(): void;
  };

  it('puts the map in the bundle, writes the thumbnails to the output and lists them; the page and the masters are as they were', async () => {
    const plugin = pyreflyArtDerive({ scope: 'exact', cacheDir: warm, jobs: 2 }) as unknown as Plugin;
    const cfg = await plugin.config({ root });
    expect(JSON.parse(cfg.define['__PYREFLY_ART_THUMBS__']!)).toEqual({
      'art/backdrops/dusk.png': 'art/backdrops/dusk.thumb.webp',
      'art/backdrops/wide.png': 'art/backdrops/wide.thumb.webp',
      'art/characters/boss/idle.png': 'art/characters/boss/idle.thumb.png',
    });
    const out = freshBuild({ 'index.html': '<link href="/art/backdrops/dusk.png">' });
    plugin.configResolved({ root, build: { outDir: 'out' } });
    plugin.closeBundle();
    for (const rel of ['art/backdrops/dusk.thumb.webp', 'art/backdrops/wide.thumb.webp', 'art/characters/boss/idle.thumb.png']) expect(existsSync(join(out, rel)), rel).toBe(true);
    const record = JSON.parse(readFileSync(join(out, DERIVED_REPORT), 'utf8'));
    expect(record.thumbs.enabled).toBe(true);
    expect(record.thumbs.files.filter((f: { kind: string }) => f.kind !== 'none')).toHaveLength(3);
    expect(readFileSync(join(out, 'index.html'), 'utf8')).toBe('<link href="/art/backdrops/dusk.webp">'); // the page names the served master, not a thumbnail
  }, 120_000);

  it('ships none with PYREFLY_ART_THUMBS=off, or with the art switched off, or with no list: an empty map, a record that says so', async () => {
    for (const [options, reason] of [[{ thumbs: 'off' }, /PYREFLY_ART_THUMBS=off/], [{ thumbList: join(root, 'no-such.json') }, /no strip list/]] as const) {
      const plugin = pyreflyArtDerive({ scope: 'exact', cacheDir: warm, jobs: 2, ...options }) as unknown as Plugin;
      expect((await plugin.config({ root })).define['__PYREFLY_ART_THUMBS__']).toBe('{}');
      const out = freshBuild();
      plugin.configResolved({ root, build: { outDir: 'out' } });
      plugin.closeBundle();
      expect(existsSync(join(out, 'art/backdrops/dusk.thumb.webp'))).toBe(false);
      const record = JSON.parse(readFileSync(join(out, DERIVED_REPORT), 'utf8'));
      expect(record.thumbs).toMatchObject({ enabled: false });
      expect(record.thumbs.reason).toMatch(reason);
    }
    const off = pyreflyArtDerive({ scope: 'off', cacheDir: cache }) as unknown as Plugin;
    expect((await off.config({ root })).define['__PYREFLY_ART_THUMBS__']).toBe('{}');
  }, 120_000);
});
