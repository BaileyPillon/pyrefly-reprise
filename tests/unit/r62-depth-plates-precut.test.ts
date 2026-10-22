// @vitest-environment jsdom
/**
 * Release 62, PR-0481 (the conference demo): the CPU half of the depth plates' build can be done before the battle. BOTH games (shared presentation plumbing: Chapter I's Gagazet is FFX, Chapter IV's Bevelle
 * underground is FFX-2; the plates are option B's, `engine/fx/b/DepthPlates.ts`).
 *
 * Round 28's deep review of release 61 saw one 0.65 s task right after the press: the painting and the depth map read back at the cut's size, the feather blur, the cut and the flip. `precutPlates` does exactly
 * that arithmetic behind the picker and `DepthPlates.build` takes the result. This file pins the part that must never change: a build that takes a cut made ahead gives the SAME plates as one that cuts for itself
 * (same pixels, same coverage), the cut is used once, it is only used for the painting and the inputs it was made from, and a cut that failed ahead costs nothing but the old behaviour.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, Texture } from 'three';

import { DepthPlates, hasPrecut, precutPlates, type PlateLayout } from '../../src/engine/fx/b/DepthPlates.ts';

const LAYOUT: PlateLayout = { thresholds: [0.35, 0.7], z: [-4, 6], soft: 0.08, blur: 3, width: 64 };
const URL_A = 'fx/gagazet/depth.png';

interface FakeImage { kind: 'paint' | 'depth'; width: number; naturalWidth: number; src?: string; decoding?: string; decode(): Promise<void> }

let failDepth = false;
let reads = 0;
const realCreate = document.createElement.bind(document);
const RealImage = globalThis.Image;

/** The paint is a diagonal ramp with a bright block, the depth map a left-to-right ramp: any cut of them has structure. */
function pattern(src: FakeImage, w: number, h: number): Uint8ClampedArray {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (src.kind === 'depth') {
        const v = Math.round((x / (w - 1)) * 255);
        d.set([v, v, v, 255], i);
      } else {
        const block = x > w / 2 && y > h / 2;
        d.set([(x * 255) / w, (y * 255) / h, block ? 250 : 40, 255], i);
      }
    }
  }
  return d;
}

beforeEach(() => {
  failDepth = false;
  reads = 0;
  (globalThis as unknown as { Image: unknown }).Image = class {
    kind = 'depth' as const;
    width = 1344;
    naturalWidth = 1344;
    decoding = '';
    src = '';
    decode(): Promise<void> {
      return failDepth ? Promise.reject(new Error('404')) : Promise.resolve();
    }
  };
  (document as unknown as { createElement: (t: string) => unknown }).createElement = (tag: string) => {
    if (tag !== 'canvas') return realCreate(tag);
    let drawn: FakeImage | null = null;
    const c = {
      width: 0,
      height: 0,
      getContext: () => ({
        imageSmoothingQuality: '',
        drawImage: (src: FakeImage) => void (drawn = src),
        getImageData: (_x: number, _y: number, w: number, h: number) => {
          reads++;
          return { data: pattern(drawn!, w, h) };
        },
      }),
    };
    return c;
  };
});

afterEach(() => {
  (document as unknown as { createElement: unknown }).createElement = realCreate;
  (globalThis as unknown as { Image: unknown }).Image = RealImage;
});

/** A backdrop group the way `Backdrop.create` leaves it: the painting plane carries its reference camera. */
function room(): { group: Group; paint: FakeImage; main: Mesh } {
  const paint: FakeImage = { kind: 'paint', width: 2688, naturalWidth: 2688, decode: async () => undefined };
  const map = new Texture(paint as unknown as HTMLImageElement);
  const main = new Mesh(new PlaneGeometry(40, 22.5), new MeshBasicMaterial({ map }));
  main.name = 'backdrop-painting';
  main.position.set(0, 5, -10);
  main.userData['fxRef'] = [0, 3, 30];
  const group = new Group();
  group.name = 'backdrop';
  group.add(main);
  return { group, paint, main };
}

const bytesOf = (t: Texture): Uint8Array => (t.image as { data: Uint8Array }).data;

describe('precutPlates and DepthPlates.build', () => {
  it('a build that takes a cut made ahead gives the same plates as one that cuts for itself', async () => {
    const own = room();
    const direct = (await DepthPlates.build(own.group, URL_A, LAYOUT))!;
    expect(direct.meshes).toHaveLength(3);

    const ahead = room();
    expect(hasPrecut(ahead.group, URL_A, LAYOUT)).toBe(false);
    expect(await precutPlates(ahead.group, URL_A, LAYOUT)).toBe(true);
    expect(hasPrecut(ahead.group, URL_A, LAYOUT)).toBe(true);
    const readsAfterCut = reads;
    const made = (await DepthPlates.build(ahead.group, URL_A, LAYOUT))!;
    expect(reads, 'the build read nothing back: the cut was taken').toBe(readsAfterCut);
    expect(hasPrecut(ahead.group, URL_A, LAYOUT), 'a cut is used once').toBe(false);

    expect(made.coverage).toEqual(direct.coverage);
    expect(made.workWidth).toBe(direct.workWidth);
    expect(made.zs).toEqual(direct.zs);
    for (let i = 0; i < direct.textures.length; i++) {
      expect(Buffer.compare(Buffer.from(bytesOf(made.textures[i]!)), Buffer.from(bytesOf(direct.textures[i]!))), `plate ${i}`).toBe(0);
    }
    // the depth map the plates answer \`plateAt\` from is the same one
    for (const [u, v] of [[0.05, 0.5], [0.5, 0.5], [0.95, 0.2]] as const) expect(made.plateAt(u, v)).toBe(direct.plateAt(u, v));
  });

  it('without a cut ahead the build is what it always was (it reads the painting and the depth map itself)', async () => {
    const r = room();
    await DepthPlates.build(r.group, URL_A, LAYOUT);
    expect(reads).toBe(2);
  });

  it('is held per painting and per input: another layout, another depth map or another painting is another cut', async () => {
    const r = room();
    expect(await precutPlates(r.group, URL_A, LAYOUT)).toBe(true);
    expect(hasPrecut(r.group, URL_A, { ...LAYOUT, thresholds: [0.4, 0.7] })).toBe(false);
    expect(hasPrecut(r.group, URL_A, { ...LAYOUT, soft: 0.1 })).toBe(false);
    expect(hasPrecut(r.group, 'fx/bevelle/depth.png', LAYOUT)).toBe(false);
    // the painting is swapped for its master after the cut was made: the cut belongs to the old image
    const map = (r.main.material as MeshBasicMaterial).map!;
    map.image = { kind: 'paint', width: 2688, naturalWidth: 2688 };
    expect(hasPrecut(r.group, URL_A, LAYOUT)).toBe(false);
    // and a build then simply cuts for itself
    const before = reads;
    expect(await DepthPlates.build(r.group, URL_A, LAYOUT)).not.toBeNull();
    expect(reads - before).toBe(2);
  });

  it('asking twice cuts once', async () => {
    const r = room();
    await precutPlates(r.group, URL_A, LAYOUT);
    const after = reads;
    expect(await precutPlates(r.group, URL_A, LAYOUT)).toBe(true);
    expect(reads).toBe(after);
  });

  it('a cut that failed ahead is not held, says so, and the build then fails or succeeds as it did before', async () => {
    const r = room();
    failDepth = true;
    expect(await precutPlates(r.group, URL_A, LAYOUT)).toBe(false);
    expect(hasPrecut(r.group, URL_A, LAYOUT)).toBe(false);
    await expect(DepthPlates.build(r.group, URL_A, LAYOUT)).rejects.toThrow('404'); // what the build did with a depth map that would not load
    failDepth = false;
    expect(await DepthPlates.build(r.group, URL_A, LAYOUT)).not.toBeNull();
  });

  it('a group with no painting has nothing to cut', async () => {
    expect(await precutPlates(new Group(), URL_A, LAYOUT)).toBe(false);
    expect(await DepthPlates.build(new Group(), URL_A, LAYOUT)).toBeNull();
  });

  it('the cut is made in separate tasks, so the picker keeps painting between them (the build itself is one, as before)', async () => {
    const r = room();
    const ticks: string[] = [];
    const started = precutPlates(r.group, URL_A, LAYOUT).then(() => ticks.push('cut done'));
    setTimeout(() => ticks.push('a timer ran'), 0);
    await started;
    expect(ticks[0], 'a timer scheduled for the next task ran before the cut finished').toBe('a timer ran');
  });
});
