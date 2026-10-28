// @vitest-environment jsdom
/**
 * The living paintings' breathing rig is found by the PICTURE a texture was made from (lane "perf-trim", 2026-10-23; both games, shared plumbing): a painting's alpha field is the same in every battle, each
 * battle makes new textures from the cached pictures, so a rig read once (or read ahead behind the title by the demo's warm-up) serves every texture of that picture and nothing is read at the pose's first
 * sight in the fight. jsdom has no 2D canvas and no `createImageBitmap`, so every read answers "nothing to read" (the flat rig): the sharing, not the pixels, is what is checked.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Texture } from 'three';
import { breathRigFor, flatBreathRig, hasBreathRig, prewarmBreathRig, releaseBreathRigs } from '../../../src/engine/fx/mix/breathRig.ts';
import { BREATH_THUMB, notePending, storeThumb } from '../../../src/engine/look/AlphaThumb.ts';

const picture = (): { width: number; height: number } => ({ width: 64, height: 96 });
const texOf = (img: object): Texture => {
  const t = new Texture();
  (t as unknown as { image: object }).image = img;
  return t;
};

afterEach(() => {
  releaseBreathRigs();
  vi.restoreAllMocks();
});

describe('a rig is found by the picture', () => {
  it('two textures of one picture get the very same rig, and the second reads nothing', () => {
    const img = picture();
    const spy = vi.spyOn(document, 'createElement');
    const a = breathRigFor(texOf(img));
    const reads = spy.mock.calls.filter((c) => c[0] === 'canvas').length;
    const b = breathRigFor(texOf(img));
    expect(b).toBe(a);
    expect(spy.mock.calls.filter((c) => c[0] === 'canvas').length).toBe(reads); // no second read
  });

  it('a battle ending forgets the textures\' cache but not the pictures\' rigs: the next battle\'s textures find them', () => {
    const img = picture();
    const a = breathRigFor(texOf(img));
    releaseBreathRigs();
    const spy = vi.spyOn(document, 'createElement');
    const b = breathRigFor(texOf(img));
    expect(b).toBe(a);
    expect(spy.mock.calls.filter((c) => c[0] === 'canvas').length).toBe(0);
  });

  it('a rig read ahead (the warm-up) is what the first texture of that picture gets', async () => {
    const img = picture();
    await prewarmBreathRig(img as never);
    const spy = vi.spyOn(document, 'createElement');
    const rig = breathRigFor(texOf(img));
    expect(spy.mock.calls.filter((c) => c[0] === 'canvas').length).toBe(0);
    expect(rig).toBeDefined();
    await prewarmBreathRig(img as never); // a second ask is a no-op
    expect(breathRigFor(texOf(img))).toBe(rig);
  });

  it('a picture that is not decoded yet (no width) is not read ahead and is asked for again later', async () => {
    const img = { width: 0, height: 0 };
    await prewarmBreathRig(img as never);
    const spy = vi.spyOn(document, 'createElement');
    breathRigFor(texOf(img));
    expect(spy.mock.calls.filter((c) => c[0] === 'canvas').length).toBe(0); // "not decoded yet: ask again next frame"
  });
});

describe('the field of the worker (MF-02)', () => {
  it('while the worker is making the field of a picture the flat rig stands in and the page starts no read of its own', () => {
    const img = picture();
    notePending(img, BREATH_THUMB);
    const spy = vi.spyOn(document, 'createElement');
    const cib = vi.fn();
    vi.stubGlobal('createImageBitmap', cib);
    expect(breathRigFor(texOf(img))).toBe(flatBreathRig());
    expect(cib).not.toHaveBeenCalled();
    expect(spy.mock.calls.filter((c) => c[0] === 'canvas').length).toBe(0);
    vi.unstubAllGlobals();
  });

  it('once the field has landed the rig is made from it and kept for the picture: no read at all, and the next texture of the picture finds it', () => {
    const img = picture();
    const field = new Uint8Array(32 * 48);
    for (let y = 10; y < 40; y++) for (let x = 8; x < 24; x++) field[y * 32 + x] = 255; // a body
    storeThumb(img, BREATH_THUMB, field);
    const spy = vi.spyOn(document, 'createElement');
    const rig = breathRigFor(texOf(img));
    expect(rig.source).toBe('runtime');
    expect(hasBreathRig(img)).toBe(true);
    expect(breathRigFor(texOf(img))).toBe(rig);
    expect(spy.mock.calls.filter((c) => c[0] === 'canvas').length).toBe(0);
  });
});
