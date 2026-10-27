// @vitest-environment jsdom
/**
 * MF-02 (lane "mf-l4-freezes", both games): the look's alpha fields come from the loader's worker when it has made them and two downscales of the painting agree on its extents; the previous extents of a texture, or
 * those of another master of the same painting, stand in while a field is on its way; and the page's own read is the last resort. No Worker runs here (jsdom has none): the registry, the guard, the stand-in, the
 * fall-back and the switch are what is pinned. The lane's E2 browser job holds the worker's numbers against the page's (263 paintings).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { Texture } from 'three';
import { BREATH_THUMB, EXTENTS_LOW, EXTENTS_THUMB, alphaThumbOn, extentsAgree, figurePainting, notePainting, notePending, paintingName, requestThumbs, setAlphaThumbSearch, storeThumb, thumbOf, thumbPending, thumbStats, withThumbs } from '../../src/engine/look/AlphaThumb.ts';
import { extentsReads, readExtents } from '../../src/engine/look/AlphaPrime.ts';

/** A 128 x 128 alpha field with a filled box: top 20, bottom 100 (exclusive), left 30, right 90 (exclusive). */
function boxField(top = 20, bottom = 100, left = 30, right = 90): Uint8Array {
  const a = new Uint8Array(128 * 128);
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) a[y * 128 + x] = 255;
  return a;
}

/** Both extents fields of a painting (the 'medium' and the 'low' downscale), as the worker sends them: the guard publishes the first when they agree. */
function storeExtents(image: object, medium: Uint8Array, low: Uint8Array = medium): void {
  storeThumb(image, EXTENTS_THUMB, medium);
  storeThumb(image, EXTENTS_LOW, low);
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
    storeExtents(img, f);
    expect(thumbOf(img, EXTENTS_THUMB)).toBe(f);
    expect(thumbOf(img, BREATH_THUMB)).toBeNull();
    const b = new Uint8Array(32 * 48);
    storeThumb(img, BREATH_THUMB, b); // the breathing rig's field is exact: no guard
    expect(thumbOf(img, BREATH_THUMB)).toBe(b);
    expect(thumbOf({ width: 640, height: 480 }, EXTENTS_THUMB)).toBeNull(); // another image of the same size is another painting
    expect(thumbOf(null, EXTENTS_THUMB)).toBeNull();
    expect(thumbOf('not an image', EXTENTS_THUMB)).toBeNull();
  });

  it('holds the extents field until the second downscale is in, and publishes it when the two agree within a cell', () => {
    const img = { width: 640, height: 480 };
    storeThumb(img, EXTENTS_THUMB, boxField(20, 100, 30, 90));
    expect(thumbOf(img, EXTENTS_THUMB)).toBeNull(); // waiting for the low field
    storeThumb(img, EXTENTS_LOW, boxField(21, 100, 30, 91)); // one cell off on two bounds: agreement
    expect(thumbOf(img, EXTENTS_THUMB)).not.toBeNull();
    expect(extentsAgree(boxField(20, 100, 30, 90), boxField(21, 101, 29, 91))).toBe(true);
    expect(extentsAgree(boxField(20, 100, 30, 90), boxField(22, 100, 30, 90))).toBe(false);
  });

  it('refuses the field when the two downscales disagree by more than a cell, and the reader reads for itself (a thin element near the threshold)', () => {
    const img = { width: 640, height: 480 };
    const before = { ...extentsReads };
    notePending(img, EXTENTS_THUMB);
    storeThumb(img, EXTENTS_THUMB, boxField(20, 100, 30, 90));
    storeThumb(img, EXTENTS_LOW, boxField(20, 100, 30, 100)); // right bound 10 cells apart
    expect(thumbOf(img, EXTENTS_THUMB)).toBeNull();
    expect(thumbPending(img, EXTENTS_THUMB)).toBe(false); // not on its way any more: nothing stands in
    expect(thumbStats().refused).toBeGreaterThanOrEqual(1);
    const tex = textureOf(img);
    expect(readExtents(tex)).toBeNull(); // jsdom has no canvas: the page's own read is the one that runs, and it answers null here
    expect(extentsReads.sync).toBe(before.sync + 1);
  });

  it('readExtents takes the published field: the extents are the box, and no canvas is touched', () => {
    const img = { width: 640, height: 480 };
    storeExtents(img, boxField());
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
    storeExtents(small, boxField(20, 100, 30, 90));
    expect(readExtents(tex)!.top).toBeCloseTo(20 / 128, 6);
    (tex as unknown as { image: object }).image = big; // the art governor swaps the master in
    notePending(big, EXTENTS_THUMB); // its field is on its way
    expect(thumbPending(big, EXTENTS_THUMB)).toBe(true);
    const before = { ...extentsReads };
    expect(readExtents(tex)!.top).toBeCloseTo(20 / 128, 6); // the stand-in
    expect(readExtents(tex)!.top).toBeCloseTo(20 / 128, 6); // and again next frame
    expect(extentsReads.stoodIn).toBe(before.stoodIn + 2);
    expect(extentsReads.sync).toBe(before.sync); // the page read nothing
    storeExtents(big, boxField(22, 102, 31, 91)); // the field lands
    expect(thumbPending(big, EXTENTS_THUMB)).toBe(false);
    expect(readExtents(tex)!.top).toBeCloseTo(22 / 128, 6);
    expect(extentsReads.thumb).toBe(before.thumb + 1);
  });

  it('names a painting with no tier and no extension, so its masters stand in for each other', () => {
    expect(paintingName('/art/characters/tidus/idle%402x.png')).toBe('art/characters/tidus/idle');
    expect(paintingName('https://echoesofspira.com/art/characters/tidus/idle@4x.png?v=3')).toBe('art/characters/tidus/idle');
    expect(paintingName('/art/characters/tidus/idle.webp')).toBe('art/characters/tidus/idle');
    expect(paintingName('/art/characters/tidus/attack.png')).not.toBe(paintingName('/art/characters/tidus/idle.png'));
    expect(paintingName('/art/backdrops/besaid.png')).toBe('');
  });

  it('a texture that never read its painting still has a cover while its own field is on its way: the field of another master of the same painting', () => {
    const two = { width: 1600, height: 1200 };
    const four = { width: 3200, height: 2400 };
    notePainting(two, '/art/characters/yuna/cast%402x.png');
    notePainting(four, '/art/characters/yuna/cast%404x.png');
    storeExtents(two, boxField(10, 110, 20, 100)); // the 2x master's field landed
    const tex = textureOf(four); // a texture whose image is the 4x master, never read
    notePending(four, EXTENTS_THUMB);
    const before = { ...extentsReads };
    const e = readExtents(tex);
    expect(e!.top).toBeCloseTo(10 / 128, 6);
    expect(e!.right).toBeCloseTo(100 / 128, 6);
    expect(extentsReads.stoodIn).toBe(before.stoodIn + 1);
    expect(extentsReads.sync).toBe(before.sync);
    storeExtents(four, boxField(11, 111, 21, 101));
    expect(readExtents(tex)!.top).toBeCloseTo(11 / 128, 6);
  });

  it('with the switch off (?alphathumb=off) nothing is answered and nothing is asked', () => {
    const img = { width: 640, height: 480 };
    storeExtents(img, boxField());
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

  it('asks only for the paintings of figures: a backdrop, a plate or a rig sheet is never decoded a second time', () => {
    expect(figurePainting('/art/characters/tidus/idle%402x.png')).toBe(true);
    expect(figurePainting('https://echoesofspira.com/art/characters/valefor/attack.webp')).toBe(true);
    expect(figurePainting('/art/backdrops/besaid.png')).toBe(false);
    expect(figurePainting('/art/rigs/tidus/body.png')).toBe(false);
    expect(figurePainting('/art/portraits/tidus.png')).toBe(false);
  });
});
