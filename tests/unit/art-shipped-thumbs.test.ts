/**
 * r44-thumbs (both games, shared build plumbing): `thumbArtUrl` (`src/engine/ArtShipped.ts`) maps a master's URL to the small copy the build
 * derived for it, and to the FULL picture the site serves when there is none: dev, the unit suite, `PYREFLY_ART_THUMBS=off`, a master
 * the tool refused, a master the build forgot. A missing thumbnail must never be a missing picture.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { logicalArtUrl, hasThumbArt, setShippedArt, setThumbArt, shippedArtUrl, thumbArtUrl } from '../../src/engine/ArtShipped.ts';
import { manifestKnowsAssetNow, resetArtManifest, setArtManifest, type ArtManifest } from '../../src/engine/ArtManifest.ts';
import { artThumbUrl, artUrl } from '../../src/engine/PaintedArt.ts';

const MAP = {
  'art/backdrops/gagazet.png': 'art/backdrops/gagazet.thumb.webp',
  'art/characters/trema/idle.png': 'art/characters/trema/idle.thumb.png',
} as const;

afterEach(() => {
  setThumbArt(undefined);
  setShippedArt(undefined);
  resetArtManifest();
});

describe('a master with a thumbnail in the build', () => {
  it('maps to the thumbnail, keeping the base path, the query and the hash', () => {
    setThumbArt(MAP);
    setShippedArt(['art/backdrops/gagazet.png']);
    expect(thumbArtUrl('/art/backdrops/gagazet.png')).toBe('/art/backdrops/gagazet.thumb.webp');
    expect(thumbArtUrl('/pyrefly-reprise/art/backdrops/gagazet.png')).toBe('/pyrefly-reprise/art/backdrops/gagazet.thumb.webp');
    expect(thumbArtUrl('https://echoesofspira.com/art/characters/trema/idle.png?v=3#x')).toBe('https://echoesofspira.com/art/characters/trema/idle.thumb.png?v=3#x');
    expect(thumbArtUrl('art/characters/trema/idle.png')).toBe('art/characters/trema/idle.thumb.png');
    expect(hasThumbArt('art/backdrops/gagazet.png')).toBe(true);
  });

  it('reads either form of the master\'s name: the PNG, or the WebP the build ships it as', () => {
    setThumbArt(MAP);
    setShippedArt(['art/backdrops/gagazet.png']);
    expect(shippedArtUrl('/art/backdrops/gagazet.png')).toBe('/art/backdrops/gagazet.webp'); // what artUrl hands out for the full picture
    expect(thumbArtUrl('/art/backdrops/gagazet.webp')).toBe('/art/backdrops/gagazet.thumb.webp');
    expect(thumbArtUrl(shippedArtUrl('/art/backdrops/gagazet.png'))).toBe('/art/backdrops/gagazet.thumb.webp');
  });

  it('is idempotent, and a thumbnail\'s name is nobody\'s master: nothing else maps it', () => {
    setThumbArt(MAP);
    setShippedArt(['art/backdrops/gagazet.png']);
    const once = thumbArtUrl('/art/backdrops/gagazet.png');
    expect(thumbArtUrl(once)).toBe(once);
    expect(logicalArtUrl(once)).toBe(once);
    expect(shippedArtUrl(once)).toBe(once);
  });
});

describe('a master without one: the full picture, never a missing file', () => {
  it('maps to what artUrl maps to: the WebP when the build ships the master as one, the PNG when it does not', () => {
    setThumbArt(MAP);
    setShippedArt(['art/backdrops/dreams-end.png']);
    expect(thumbArtUrl('/art/backdrops/dreams-end.png')).toBe('/art/backdrops/dreams-end.webp'); // derived WebP master, no thumbnail
    expect(thumbArtUrl('/art/characters/yunalesca-1/idle.png')).toBe('/art/characters/yunalesca-1/idle.png'); // PNG master, no thumbnail
    expect(thumbArtUrl('/art/characters/trema/idle@2x.png')).toBe('/art/characters/trema/idle%402x.png'); // a 2x master has none; the wire form of its @
    expect(thumbArtUrl('/assets/index-abc.png')).toBe('/assets/index-abc.png'); // not art
    expect(hasThumbArt('art/backdrops/dreams-end.png')).toBe(false);
  });

  it('is the full picture everywhere when the build has no map at all (dev, the unit suite, PYREFLY_ART_THUMBS=off)', () => {
    const urls = ['/art/backdrops/gagazet.png', '/art/characters/trema/idle.png', '/art/characters/trema/idle@2x.png', '/art/backdrops/gagazet.webp', '/x/y.png'];
    for (const map of [undefined, null, {}]) {
      setThumbArt(map);
      setShippedArt(['art/backdrops/gagazet.png']);
      for (const url of urls) expect(thumbArtUrl(url), `${JSON.stringify(map)} ${url}`).toBe(shippedArtUrl(url));
      expect(hasThumbArt('art/backdrops/gagazet.png')).toBe(false);
    }
  });
});

describe('artThumbUrl: the board\'s own call', () => {
  it('builds the URL the way artUrl does, then asks for the thumbnail; with none it IS artUrl', () => {
    setShippedArt(['art/backdrops/gagazet.png']);
    setThumbArt(MAP);
    expect(artUrl('art/backdrops/gagazet.png')).toBe('/art/backdrops/gagazet.webp');
    expect(artThumbUrl('art/backdrops/gagazet.png')).toBe('/art/backdrops/gagazet.thumb.webp');
    expect(artThumbUrl('/art/characters/trema/idle.png')).toBe('/art/characters/trema/idle.thumb.png');
    setThumbArt(null);
    expect(artThumbUrl('art/backdrops/gagazet.png')).toBe(artUrl('art/backdrops/gagazet.png'));
    expect(artThumbUrl('art/characters/trema/idle.png')).toBe(artUrl('art/characters/trema/idle.png'));
  });
});

describe('the art manifest has no opinion on a thumbnail', () => {
  it('judges nothing (null: cannot say), so a warm of it is never skipped and never blamed', () => {
    const manifest: ArtManifest = { version: 1, generatedAt: 't', subjects: {}, portraits: [], backdrops: ['gagazet'], pause: [], pause2x: [], title: [], title2x: [] };
    setArtManifest(manifest);
    expect(manifestKnowsAssetNow('/art/backdrops/gagazet.png')).toBe(true);
    expect(manifestKnowsAssetNow('/art/backdrops/gagazet.thumb.webp')).toBeNull();
    expect(manifestKnowsAssetNow('/art/backdrops/not-listed.thumb.webp')).toBeNull();
    expect(manifestKnowsAssetNow('/art/characters/trema/idle.thumb.png')).toBeNull();
  });
});
