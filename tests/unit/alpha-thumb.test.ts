// @vitest-environment jsdom
/**
 * MF-02 (lane "mf-l4-freezes", both games): the look's alpha fields come from the loader's worker when it has made them, a texture's previous extents stand in while one is on its way, and the page's own read is the
 * last resort. No Worker runs here (jsdom has none): the registry, the stand-in, the fall-back and the switch are what is pinned. The lane's E2 browser job proves the worker's bytes against the page's.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { Texture } from 'three';
import { BREATH_THUMB, EXTENTS_THUMB, GEOMETRY_THUMB, alphaThumbOn, figurePainting, notePending, requestThumbs, setAlphaThumbSearch, storeThumb, thumbOf, thumbPending, thumbStats, withThumbs } from '../../src/engine/look/AlphaThumb.ts';
import { extentsReads, readExtents } from '../../src/engine/look/AlphaPrime.ts';

/** A 128 x 128 alpha field with a filled box: top 20, bottom 100 (exclusive), left 30, right 90 (exclusive). */
function boxField(top = 20, bottom = 100, left = 30, right = 90): Uint8Array {
  const a = new Uint8Array(128 * 128);
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) a[y * 128 + x] = 255;
  return a;
}

function textureOf(image: object): Texture {
  const t = new Texture();
  (t as unknown as { image: object }).image = image;
  return t;
}

describe('alpha thumbnails (MF-02)', () => {
  beforeEach(() => setAlphaThumbSearch(''));

  it('has no field until one is stored, and then answers it for that image and spec only', () => {
    const img = { width: 640, height: 480 };
    expect(thumbOf(img, EXTENTS_THUMB)).toBeNull();
    const f = boxField();
    storeThumb(img, EXTENTS_THUMB, f);
    expect(thumbOf(img, EXTENTS_THUMB)).toBe(f);
    expect(thumbOf(img, GEOMETRY_THUMB)).toBeNull();
    expect(thumbOf(img, BREATH_THUMB)).toBeNull();
    expect(thumbOf({ width: 640, height: 480 }, EXTENTS_THUMB)).toBeNull(); // another image of the same size is another painting
    expect(thumbOf(null, EXTENTS_THUMB)).toBeNull();
    expect(thumbOf('not an image', EXTENTS_THUMB)).toBeNull();
  });

  it('readExtents takes the stored field: the extents are the box, and no canvas is touched', () => {
    const img = { width: 640, height: 480 };
    storeThumb(img, EXTENTS_THUMB, boxField());
    const before = { ...extentsReads };
    const e = readExtents(textureOf(img));
    expect(e).not.toBeNull();
    expect(e!.top).toBeCloseTo(20 / 128, 6);
    expect(e!.bottom).toBeCloseTo(100 / 128, 6);
    expect(e!.left).toBeCloseTo(30 / 128, 6);
    expect(e!.right).toBeCloseTo(90 / 128, 6);
    expect(extentsReads.thumb).toBe(before.thumb + 1);
    expect(extentsReads.sync).toBe(before.sync);
  });

  it('a master swapped in: the previous extents of the texture stand in while the new field is on its way, are not kept, and the field wins once it has landed', () => {
    const small = { width: 800, height: 600 };
    const big = { width: 3200, height: 2400 };
    const tex = textureOf(small);
    storeThumb(small, EXTENTS_THUMB, boxField(20, 100, 30, 90));
    expect(readExtents(tex)!.top).toBeCloseTo(20 / 128, 6);
    (tex as unknown as { image: object }).image = big; // the art governor swaps the master in
    notePending(big, EXTENTS_THUMB); // its field is on its way
    expect(thumbPending(big, EXTENTS_THUMB)).toBe(true);
    const before = { ...extentsReads };
    expect(readExtents(tex)!.top).toBeCloseTo(20 / 128, 6); // the stand-in
    expect(readExtents(tex)!.top).toBeCloseTo(20 / 128, 6); // and again next frame
    expect(extentsReads.stoodIn).toBe(before.stoodIn + 2);
    expect(extentsReads.sync).toBe(before.sync); // the page read nothing
    storeThumb(big, EXTENTS_THUMB, boxField(22, 102, 31, 91)); // the field lands
    expect(thumbPending(big, EXTENTS_THUMB)).toBe(false);
    expect(readExtents(tex)!.top).toBeCloseTo(22 / 128, 6);
    expect(extentsReads.thumb).toBe(before.thumb + 1);
  });

  it('with the switch off (?alphathumb=off) nothing is answered and nothing is asked', () => {
    const img = { width: 640, height: 480 };
    storeThumb(img, EXTENTS_THUMB, boxField());
    setAlphaThumbSearch('?alphathumb=off');
    expect(thumbOf(img, EXTENTS_THUMB)).toBeNull();
    expect(thumbPending(img, EXTENTS_THUMB)).toBe(false);
    const before = thumbStats().waiting;
    requestThumbs(img, '/art/characters/tidus/idle.png');
    expect(thumbStats().waiting).toBe(before);
    expect(alphaThumbOn('?alphathumb=off')).toBe(false);
    expect(alphaThumbOn('?alphathumb=on')).toBe(true);
    expect(alphaThumbOn('')).toBe(true);
  });

  it('with no Worker (jsdom) a request is a no-op, nothing is left pending, and withThumbs hands the image back', () => {
    const img = { width: 8, height: 8 };
    expect(withThumbs(img, '/art/characters/tidus/idle.png')).toBe(img);
    expect(thumbStats().workers).toBe(0);
    expect(thumbOf(img, EXTENTS_THUMB)).toBeNull();
    expect(thumbPending(img, EXTENTS_THUMB)).toBe(false);
  });

  it('asks only for figures\' paintings: a backdrop, a plate or a rig sheet is never decoded a second time', () => {
    expect(figurePainting('/art/characters/tidus/idle%402x.png')).toBe(true);
    expect(figurePainting('https://echoesofspira.com/art/characters/valefor/attack.webp')).toBe(true);
    expect(figurePainting('/art/backdrops/besaid.png')).toBe(false);
    expect(figurePainting('/art/rigs/tidus/body.png')).toBe(false);
    expect(figurePainting('/art/portraits/tidus.png')).toBe(false);
  });
});
