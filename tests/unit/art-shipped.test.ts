/**
 * Release 38 ("r38-bytes"): the painted art ships as lossless WebP, derived from the PNG masters at build time.
 * `src/engine/ArtShipped.ts` is the one place a master's name becomes the file the site serves, and the functions that read an
 * art URL back apart take either form. Both games: shared build plumbing, no game content.
 *
 * Every check here runs with a pinned set of "derived" masters (`setShippedArt`), the way a production build runs, because the
 * dev server and the rest of the unit suite run with none, where every URL maps to itself and these functions are inert.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { hasPause2xArt, hasTitle2xArt, manifestKnowsAssetNow, parseArtManifest, pause2xUrlFor, pauseStemOf, resetArtManifest, setArtManifest, title2xUrlFor, titleStemOf } from '../../src/engine/ArtManifest.ts';
import { hiResUrl } from '../../src/engine/ArtTier.ts';
import { isShippedAsWebp, logicalArtUrl, setShippedArt, shippedArtUrl, sidecarUrlOf } from '../../src/engine/ArtShipped.ts';
import { lacksKoPainting } from '../../src/engine/KoFallback.ts';
import { poseScaleFor } from '../../src/engine/KoPoseScale.ts';
import { artUrl } from '../../src/engine/PaintedArt.ts';
import { portraitIdFromSrc } from '../../src/ui/common/portrait.ts';
import { heroArtCandidates } from '../../src/ui/common/chapterPanel.ts';
import type { ChapterMeta } from '../../src/data/chapter-meta.ts';

/** What a build that derived everything below would hand the bundle. */
const DERIVED = [
  'art/backdrops/gagazet.png',
  'art/backdrops/cavern-stolen-fayth/sakura.png',
  'art/characters/tidus/idle.png',
  'art/characters/tidus/idle@2x.png',
  'art/characters/yuna/ko.png',
  'art/characters/tidus/ko.png',
  'art/pause/ch1-seymour-flux.png',
  'art/title/keyart.png',
  'art/portraits/lulu.png',
  'art/portrait-parts/kimahri/1x/eyeL-iris.png',
];

const BASE = '/pyrefly-reprise/';

beforeEach(() => setShippedArt(DERIVED));
afterEach(() => {
  setShippedArt(undefined);
  resetArtManifest();
});

describe('the mapping from a master to the file the site serves', () => {
  it('maps a derived master to its .webp, behind any base path, keeping the query', () => {
    expect(shippedArtUrl(`${BASE}art/characters/tidus/idle.png`)).toBe(`${BASE}art/characters/tidus/idle.webp`);
    expect(shippedArtUrl('/art/backdrops/gagazet.png')).toBe('/art/backdrops/gagazet.webp');
    expect(shippedArtUrl('art/backdrops/gagazet.png')).toBe('art/backdrops/gagazet.webp');
    expect(shippedArtUrl('https://example.test/pyrefly-reprise/art/portraits/lulu.png?v=7#x')).toBe('https://example.test/pyrefly-reprise/art/portraits/lulu.webp?v=7#x');
    expect(shippedArtUrl(`${BASE}art/backdrops/cavern-stolen-fayth/sakura.png`)).toBe(`${BASE}art/backdrops/cavern-stolen-fayth/sakura.webp`);
    expect(shippedArtUrl(`${BASE}art/characters/tidus/idle@2x.png`)).toBe(`${BASE}art/characters/tidus/idle@2x.webp`);
    expect(shippedArtUrl(`${BASE}art/portrait-parts/kimahri/1x/eyeL-iris.png`)).toBe(`${BASE}art/portrait-parts/kimahri/1x/eyeL-iris.webp`);
  });

  it('leaves everything else exactly as it was', () => {
    for (const u of [
      `${BASE}art/characters/auron/idle.png`, // a master that stayed PNG (not in the list)
      `${BASE}art/pause/ch1-seymour-flux.2x.webp`, // the lossy 2x master of a plate: its own file
      `${BASE}fx/gagazet/depth.png`, // not under art/
      `${BASE}audio/music/title.mp3`,
      `${BASE}art/characters/tidus/idle.json`,
      `${BASE}assets/index-x.js`,
      `${BASE}martart/backdrops/gagazet.png`, // "art/" inside another word is not the art folder
      `${BASE}index.html?next=/art/backdrops/gagazet.png`, // only the path of a URL is read as a file name, never its query
      `${BASE}index.html#/art/backdrops/gagazet.png`,
    ]) {
      expect(shippedArtUrl(u), u).toBe(u);
      expect(logicalArtUrl(u), u).toBe(u);
    }
  });

  it('is idempotent, and logicalArtUrl is its inverse for every derived master', () => {
    for (const master of DERIVED) {
      const url = `${BASE}${master}`;
      const served = shippedArtUrl(url);
      expect(served.endsWith('.webp'), master).toBe(true);
      expect(shippedArtUrl(served), master).toBe(served);
      expect(logicalArtUrl(served), master).toBe(url);
      expect(logicalArtUrl(url), master).toBe(url);
      expect(isShippedAsWebp(master), master).toBe(true);
    }
    expect(isShippedAsWebp('art/characters/auron/idle.png')).toBe(false);
  });

  it('maps every URL to itself when no build list is in force (dev, tests, the switch off)', () => {
    setShippedArt(null);
    expect(shippedArtUrl(`${BASE}art/characters/tidus/idle.png`)).toBe(`${BASE}art/characters/tidus/idle.png`);
    expect(logicalArtUrl(`${BASE}art/characters/tidus/idle.webp`)).toBe(`${BASE}art/characters/tidus/idle.webp`);
    setShippedArt(undefined); // back to the build's own list: none in a test run
    expect(shippedArtUrl(`${BASE}art/characters/tidus/idle.png`)).toBe(`${BASE}art/characters/tidus/idle.png`);
  });

  it('artUrl hands the browser the file the site serves', () => {
    expect(artUrl('art/characters/tidus/idle.png')).toMatch(/\/art\/characters\/tidus\/idle\.webp$/);
    expect(artUrl('/art/backdrops/gagazet.png')).toMatch(/\/art\/backdrops\/gagazet\.webp$/);
    expect(artUrl('art/characters/auron/idle.png')).toMatch(/\/art\/characters\/auron\/idle\.png$/);
    expect(artUrl('fx/gagazet/depth.png')).toMatch(/\/fx\/gagazet\/depth\.png$/);
    setShippedArt(null);
    expect(artUrl('art/characters/tidus/idle.png')).toMatch(/\/art\/characters\/tidus\/idle\.png$/);
  });

  it('names the sidecar after the master, from either form', () => {
    expect(sidecarUrlOf(`${BASE}art/characters/tidus/idle.webp`)).toBe(`${BASE}art/characters/tidus/idle.json`);
    expect(sidecarUrlOf(`${BASE}art/characters/tidus/idle.png`)).toBe(`${BASE}art/characters/tidus/idle.json`);
    expect(sidecarUrlOf(`${BASE}art/pause/ch1-seymour-flux.webp`)).toBe(`${BASE}art/pause/ch1-seymour-flux.json`);
  });
});

describe('what reads an art URL apart sees the master, whichever form it is given', () => {
  const MANIFEST = parseArtManifest({
    version: 1,
    generatedAt: 'x',
    subjects: { tidus: { states: ['idle', 'ko'], portrait: true, states2x: ['idle'] }, yuna: { states: ['idle', 'ko'], portrait: true } },
    portraits: ['lulu'],
    backdrops: ['gagazet'],
    pause: ['ch1-seymour-flux'],
    pause2x: ['ch1-seymour-flux'],
    title: ['keyart'],
    title2x: ['keyart'],
  });

  it('the art manifest judges a derived .webp as the painting it is', () => {
    setArtManifest(MANIFEST);
    for (const path of ['art/characters/tidus/idle.png', 'art/backdrops/gagazet.png', 'art/portraits/lulu.png', 'art/pause/ch1-seymour-flux.png', 'art/title/keyart.png', 'art/characters/tidus/idle@2x.png']) {
      expect(manifestKnowsAssetNow(artUrl(path)), `${path} as served`).toBe(true);
      expect(manifestKnowsAssetNow(artUrl(path).replace(/\.webp$/, '.png')), `${path} as named`).toBe(true);
    }
    // A painting the manifest does not list is still absent, in either form.
    expect(manifestKnowsAssetNow(artUrl('art/backdrops/nowhere.png'))).toBe(false);
    expect(manifestKnowsAssetNow(artUrl('art/characters/tidus/cast.png'))).toBe(false);
  });

  it('a .webp that is not a derived master is still "an encoding nobody produced"', () => {
    setArtManifest(MANIFEST);
    expect(manifestKnowsAssetNow(`${BASE}art/backdrops/other.webp`)).toBe(false);
    // The pause and title 2x masters are dotted stems the manifest does not judge, as before.
    expect(manifestKnowsAssetNow(`${BASE}art/pause/ch1-seymour-flux.2x.webp`)).toBeNull();
  });

  it('the pause and title plates find their own 2x master from the served 1x file', () => {
    setArtManifest(MANIFEST);
    const pause = artUrl('art/pause/ch1-seymour-flux.png');
    expect(pause).toMatch(/ch1-seymour-flux\.webp$/);
    expect(pauseStemOf(pause)).toBe('ch1-seymour-flux');
    expect(hasPause2xArt('ch1-seymour-flux')).toBe(true);
    expect(pause2xUrlFor(pause)).toMatch(/\/art\/pause\/ch1-seymour-flux\.2x\.webp$/);
    const title = artUrl('art/title/keyart.png');
    expect(title).toMatch(/keyart\.webp$/);
    expect(titleStemOf(title)).toBe('keyart');
    expect(hasTitle2xArt('keyart')).toBe(true);
    expect(title2xUrlFor(title)).toMatch(/\/art\/title\/keyart\.2x\.webp$/);
    // Never the 1x file offered as its own 2x master.
    expect(pause2xUrlFor(pause)).not.toBe(pause);
    expect(title2xUrlFor(title)).not.toBe(title);
  });

  it('the 2x tier names the 2x master as the site serves it', () => {
    setArtManifest(MANIFEST);
    expect(hiResUrl(artUrl('art/characters/tidus/idle.png'))).toMatch(/\/art\/characters\/tidus\/idle@2x\.webp$/);
    expect(hiResUrl(`${BASE}art/characters/tidus/idle.png`)).toBe(`${BASE}art/characters/tidus/idle@2x.webp`);
    // Release 39: a backdrop has masters too (`backdrops/<key>@2x.png`); the other art folders do not.
    expect(hiResUrl(`${BASE}art/backdrops/gagazet.webp`)).toBe(`${BASE}art/backdrops/gagazet@2x.png`);
    expect(hiResUrl(`${BASE}art/portraits/tidus.png`)).toBeNull();
    expect(hiResUrl(`${BASE}art/pause/ch1-seymour-flux.png`)).toBeNull();
    setShippedArt(['art/characters/tidus/idle.png']); // the 2x master stayed PNG
    expect(hiResUrl(`${BASE}art/characters/tidus/idle.webp`)).toBe(`${BASE}art/characters/tidus/idle@2x.png`);
  });

  it('a KO painting is still the KO painting, and keeps its corrected scale', () => {
    expect(lacksKoPainting({ poseUrls: { ko: artUrl('art/characters/yuna/ko.png') } })).toBe(false);
    expect(lacksKoPainting({ poseUrls: { ko: artUrl('art/characters/yuna/idle.png') } })).toBe(true);
    expect(lacksKoPainting({ poseUrls: { ko: `${BASE}art/characters/yuna/ko.webp` } })).toBe(false);
    expect(poseScaleFor(artUrl('art/characters/yuna/ko.png'), undefined)).toBe(0.52);
    expect(poseScaleFor(`${BASE}art/characters/yuna/ko.png`, undefined)).toBe(0.52);
    expect(poseScaleFor(artUrl('art/characters/tidus/ko.png'), 0.8)).toBe(0.8); // not in the table: the sidecar's own
  });

  it('a portrait <img> is still known by its id', () => {
    expect(portraitIdFromSrc(artUrl('art/portraits/lulu.png'))).toBe('lulu');
    expect(portraitIdFromSrc(`${BASE}art/portraits/lulu.png?x=1`)).toBe('lulu');
    expect(portraitIdFromSrc(`${BASE}art/characters/lulu/idle.png`)).toBeNull();
  });

  it('the chapter panel does not ask for the same plate twice', () => {
    setArtManifest(MANIFEST);
    const meta = { heroArt: 'pause/ch1-seymour-flux', heroArtFallback: 'portraits/lulu.png' } as unknown as ChapterMeta;
    const list = heroArtCandidates(meta);
    expect(list).toHaveLength(2);
    expect(list[0]).toMatch(/\/art\/pause\/ch1-seymour-flux\.webp$/);
    expect(list[1]).toMatch(/\/art\/portraits\/lulu\.webp$/);
    expect(new Set(list).size).toBe(list.length);
  });
});
