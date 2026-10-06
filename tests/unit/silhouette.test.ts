import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BANDS, FULL_BOX, MIN_ROW_PX, alphaMaskOf, frontClearance, profileOf, profileOfActor, type AlphaMask, type Profile, type Shape } from '../../src/engine/motion/Silhouette.ts';

/**
 * A painted figure as rows (r391-reach, both games): the strike is solved against where the painted FRONT is, row by row, read from the alpha of the pose on
 * screen, not against the painted box, which overlaps by 150 px while the pixels are still apart.
 */

const W = 128;
const H = 192;
/** A 128 x 192 alpha mask from a painter: `at(x, y)` is the alpha byte. */
function mask(at: (x: number, y: number) => number): AlphaMask {
  const a = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) a[y * W + x] = at(x, y);
  return { w: W, h: H, a };
}

describe('profileOf: a mask cut into rows', () => {
  it('reads where the first and the last painted pixel of each band are, as fractions of the box width', () => {
    const p = profileOf(mask((x, y) => (x >= 32 && x < 96 && y >= 0 ? 255 : 0)));
    expect(p.left).toHaveLength(BANDS);
    for (let b = 0; b < BANDS; b++) {
      expect(p.left[b]).toBeCloseTo(32 / 128, 6);
      expect(p.right[b]).toBeCloseTo(96 / 128, 6); // the cell after the last painted one
    }
  });

  it('keeps a thin front: a sword that sticks out of one band reaches only in that band', () => {
    const band = 10;
    const rows = H / BANDS; // 4.8 mask rows a band
    const sword = Math.floor(band * rows + 1);
    const p = profileOf(mask((x, y) => (x >= 20 && x < 70 ? 255 : y === sword && x < 128 && x >= 70 ? 255 : 0)));
    expect(p.right[band]).toBeCloseTo(1, 6);
    expect(p.right[band - 2]).toBeCloseTo(70 / 128, 6);
    expect(p.right[band + 2]).toBeCloseTo(70 / 128, 6);
  });

  it('leaves a band with nothing painted NaN, and cuts at the critic harness\'s alpha (0.35 of 255 is 89)', () => {
    const p = profileOf(mask((x, y) => (y < 96 ? (x < 60 ? 89 : 88) : 0)));
    expect(Number.isNaN(p.left[BANDS - 1]!)).toBe(true); // the bottom half is empty
    expect(Number.isNaN(p.right[BANDS - 1]!)).toBe(true);
    expect(p.right[0]).toBeCloseTo(60 / 128, 6); // 89 counts, 88 does not
  });
});

describe('frontClearance: the lateral gap between an attacker\'s painted front and a target\'s near side, over the rows they share', () => {
  const box = (x: number, y: number, w = 100, h = 200): Shape => ({ rect: { x, y, w, h } });
  /** A profile: every band spans [l, r] except the ones in `at`. */
  const rows = (l: number, r: number, at: Record<number, [number, number] | null> = {}): Profile => {
    const left = new Float32Array(BANDS).fill(l);
    const right = new Float32Array(BANDS).fill(r);
    for (const [k, v] of Object.entries(at)) {
      left[Number(k)] = v ? v[0] : Number.NaN;
      right[Number(k)] = v ? v[1] : Number.NaN;
    }
    return { left, right };
  };

  it('is the gap between the boxes where nothing is known of the paintings (a box is all painted)', () => {
    expect(frontClearance(1, box(0, 0), box(150, 0))!.gap).toBeCloseTo(50, 6);
    expect(frontClearance(1, box(80, 0), box(150, 0))!.gap).toBeCloseTo(-30, 6); // carried 80: the boxes overlap by 30
    expect(frontClearance(-1, box(150, 0), box(0, 0))!.gap).toBeCloseTo(50, 6); // a fiend facing -x
    expect(frontClearance(-1, box(60, 0), box(0, 0))!.gap).toBeCloseTo(-40, 6);
  });

  it('measures the painted fronts, not the boxes: a sword tip on one row, a boss whose near side is further in on that row', () => {
    const a: Shape = { rect: { x: 0, y: 0, w: 100, h: 200 }, profile: rows(0, 0.5, { 20: [0, 1] }) }; // the body ends at 50 px, the sword at 100 px, row 20
    const t: Shape = { rect: { x: 120, y: 0, w: 200, h: 200 }, profile: rows(0.3, 1, { 20: [0.2, 1] }) }; // near side at 180 px, 160 px on row 20
    expect(frontClearance(1, a, t)!.gap).toBeCloseTo(60, 3); // sword (100) against 160 on row 20; body (50) against 180 elsewhere would be 130
  });

  it('takes only the rows both figures fill: the target above the attacker\'s rows is out of reach of a lateral lunge (null)', () => {
    const a = box(0, 300, 100, 100);
    const t = box(150, 0, 100, 200);
    expect(frontClearance(1, a, t)).toBeNull();
    const sliver = box(150, 300 - 200 + (MIN_ROW_PX - 1), 100, 200); // its bottom edge one pixel into the attacker's rows: a graze, not a reach
    expect(frontClearance(1, a, sliver)).toBeNull();
    const rowsShared = box(150, 350, 100, 200); // its rows start 50 px into the attacker's
    const c = frontClearance(1, a, rowsShared)!;
    expect(c.shared).toBeCloseTo(50, 6);
  });

  it('is linear in where the attacker stands (a search can solve it) and ignores bands that hold nothing', () => {
    const t: Shape = { rect: { x: 300, y: 0, w: 100, h: 200 }, profile: rows(0, 1, { 0: null, 1: null }) };
    const at = (x: number): number => frontClearance(1, box(x, 0), t)!.gap;
    expect(at(0) - at(40)).toBeCloseTo(40, 6);
    expect(at(40) - at(100)).toBeCloseTo(60, 6);
    const full: Profile = FULL_BOX;
    expect(full.left).toHaveLength(BANDS);
  });
});

// ------------------------------------------------------------------ the reader, with a stand-in DOM

interface Call {
  args: unknown[];
}
const draws: Call[] = [];
const transforms: unknown[][] = [];
let alphaByte = 255;

/** A tiny canvas: records the draw and hands back an image of one alpha. */
function fakeDocument(): unknown {
  return {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({
        setTransform: (...a: unknown[]) => void transforms.push(a),
        clearRect: () => undefined,
        drawImage: (...a: unknown[]) => void draws.push({ args: a }),
        getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4).map((_, i) => (i % 4 === 3 ? alphaByte : 0)) }),
      }),
    }),
  };
}

const actorWith = (opts: { sx?: number; image?: unknown }): object => {
  const tex = { image: opts.image ?? { width: 1000, height: 2000 } };
  return {
    active: 1,
    slots: [
      { mesh: { scale: { x: 9, y: 9 } }, material: { uniforms: { map: { value: { image: { width: 1, height: 1 } } } } }, scale: { contentBox: { x0: 0, x1: 1, y0: 0, y1: 1 }, offsetY: 0 } },
      { mesh: { scale: { x: opts.sx ?? 1, y: 1 } }, material: { uniforms: { map: { value: tex } } }, scale: { contentBox: { x0: -0.25, x1: 0.25, y0: 0, y1: 0.8 }, offsetY: 0.4 } },
    ],
  };
};

describe('alphaMaskOf: the alpha of the pose a painted actor shows, over its painted box', () => {
  const had = (globalThis as { document?: unknown }).document;
  beforeAll(() => {
    (globalThis as { document?: unknown }).document = fakeDocument();
  });
  afterAll(() => {
    (globalThis as { document?: unknown }).document = had;
  });

  it('draws the painted box of the ACTIVE slot (the content box in the image\'s own pixels, v up) and reads its alpha', () => {
    draws.length = 0;
    alphaByte = 255;
    const a = actorWith({});
    const m = alphaMaskOf(a)!;
    expect(m.w).toBe(128);
    expect(m.h).toBe(192);
    expect(m.a[0]).toBe(255);
    // content box: u 0.25..0.75, v 0.1..0.9 of a 1000 x 2000 image -> x 250..750, y (1 - 0.9) * 2000 = 200 .. (1 - 0.1) * 2000 = 1800
    expect(draws[0]!.args.slice(1).map((v) => Math.round(v as number))).toEqual([250, 200, 500, 1600, 0, 0, 128, 192]);
  });

  it('flips a mirrored painting (the mask is as drawn on screen) and caches per texture and box', () => {
    draws.length = 0;
    transforms.length = 0;
    const a = actorWith({ sx: -1 });
    const m1 = alphaMaskOf(a)!;
    expect(transforms.some((t) => t[0] === -1 && t[4] === 128)).toBe(true);
    const n = draws.length;
    const m2 = alphaMaskOf(a)!;
    expect(m2).toBe(m1); // the same read, not another draw
    expect(draws.length).toBe(n);
    // a profile of it is cut once as well
    expect(profileOfActor(a)).toBe(profileOfActor(a));
  });

  it('gives up quietly where it cannot read: an actor with no slots, an image with no size', () => {
    expect(alphaMaskOf({})).toBeUndefined();
    expect(alphaMaskOf(actorWith({ image: { width: 0, height: 0 } }))).toBeUndefined();
    expect(profileOfActor({})).toBeUndefined();
  });
});
