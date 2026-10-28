/**
 * **The identity measure** (PR-0517; method check 3.5; `tools/posescale/pose-identity-lib.mjs`): the colour distance per body region against the idle, the attack as the ceiling.
 * Synthetic figures only (a head, a body and legs of one flat colour each): the measure has to see a costume change in the region it is in, ignore a figure standing somewhere else or
 * larger, floor the ceiling, and refuse to fail a painting it could only cut coarsely.
 */
import { describe, expect, it } from 'vitest';
import {
  FAIL_RATIO,
  MIN_CEILING,
  WATCH_RATIO,
  identityDistance,
  judgeIdentity,
  readRegions,
  regionRows,
  rgbToLab,
  verticalExtent,
} from '../../../tools/posescale/pose-identity-lib.mjs';

type Rgb = [number, number, number];
const BLACK: Rgb = [20, 20, 24];
const WHITE: Rgb = [235, 235, 240];
const RED: Rgb = [190, 40, 40];
const SKIN: Rgb = [230, 180, 150];

interface Fig {
  head?: Rgb;
  body?: Rgb;
  legs?: Rgb;
  /** Top row of the figure and its height (the canvas is 120 x 200). */
  top?: number;
  height?: number;
  /** The left edge and width of the figure's column. */
  x?: number;
  width?: number;
}

/** A figure of three flat bands (head 20 percent, body 35, legs 45 of its height) on a transparent 120 x 200 canvas. */
function figure(f: Fig = {}): { data: Uint8ClampedArray; w: number; h: number; geometry: { head: number[]; feetRow: number } } {
  const w = 120, h = 200;
  const { head = SKIN, body = BLACK, legs = BLACK, top = 10, height = 180, x = 30, width = 60 } = f;
  const data = new Uint8ClampedArray(w * h * 4);
  const hh = height * 0.2, bh = height * 0.35;
  for (let y = top; y < top + height; y++) {
    const c = y < top + hh ? head : y < top + hh + bh ? body : legs;
    for (let xx = x; xx < x + width; xx++) {
      const i = (y * w + xx) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
    }
  }
  // the registered head: inside the top fifth, and the feet row
  return { data, w, h, geometry: { head: [x + 15, top + hh * 0.25, x + width - 15, top + hh * 0.85], feetRow: top + height - 1 } };
}

const read = (f: Fig, registered = true) => {
  const img = figure(f);
  return readRegions(img, registered ? img.geometry : null);
};

describe('the colour space', () => {
  it('reads white and black where CIE L*a*b* has them', () => {
    const [Lw, aw, bw] = rgbToLab(255, 255, 255);
    expect(Lw).toBeCloseTo(100, 0);
    expect(Math.abs(aw)).toBeLessThan(0.1);
    expect(Math.abs(bw)).toBeLessThan(0.1);
    expect(rgbToLab(0, 0, 0)[0]).toBeCloseTo(0, 5);
    expect(rgbToLab(255, 0, 0)[1]).toBeGreaterThan(70);
  });
});

describe('the regions', () => {
  it('finds the silhouette extent from the solid pixels and ignores a lone speck above it', () => {
    const img = figure();
    expect(verticalExtent(img)).toEqual({ top: 10, base: 189 });
    img.data[(2 * img.w + 5) * 4 + 3] = 255; // one stray solid pixel
    expect(verticalExtent(img)).toEqual({ top: 10, base: 189 });
    expect(verticalExtent({ data: new Uint8ClampedArray(40 * 40 * 4), w: 40, h: 40 })).toBeNull();
  });

  it('cuts by the registration when it has one and by the silhouette height when it has not', () => {
    const img = figure();
    expect(regionRows(img, img.geometry)?.by).toBe('registration');
    expect(regionRows(img, null)?.by).toBe('silhouette');
    const rows = regionRows(img, null)!;
    expect(rows.head[0]).toBe(10);
    expect(rows.head[1]).toBeCloseTo(46, 0); // 10 + 0.2 of 180
    expect(rows.legs[1]).toBe(190);
  });
});

describe('the distance', () => {
  it('is zero for a painting against itself and nearly zero for the same figure standing elsewhere and larger', () => {
    const a = read({});
    expect(identityDistance(a, a).worst).toBe(0);
    const moved = read({ x: 10, width: 80, top: 5, height: 190 });
    expect(identityDistance(a, moved).worst ?? 99).toBeLessThan(1.5);
  });

  it('puts a changed costume in the region it is in and leaves the others alone', () => {
    const d = identityDistance(read({ body: BLACK }), read({ body: WHITE })).per;
    expect(d['body']!).toBeGreaterThan(30); // a sliced distance: about 0.4 of the delta E black to white
    expect(d['head']!).toBeLessThan(1);
    expect(d['legs']!).toBeLessThan(1);
  });

  it('sees a white top over black boots that a whole-figure mean would blur (the same colours, put elsewhere)', () => {
    const a = read({ body: BLACK, legs: WHITE });
    const b = read({ body: WHITE, legs: BLACK });
    const d = identityDistance(a, b);
    expect(d.per['whole']!).toBeLessThan(10); // the figure as a whole holds nearly the same colours (the body and legs differ in height, so not exactly)
    expect(d.worst!).toBeGreaterThan(30); // the regions do not
  });
});

describe('the judgement', () => {
  const idle = read({});
  const attack = read({ body: [40, 40, 46] }); // a little lighter: motion, a sleeve fold

  it('floors the ceiling at the noise of the measure, so an attack that is the idle does not make every ready a failure', () => {
    const j = judgeIdentity({ idle, pose: read({}), attack: read({}) });
    expect(j.ceiling).toEqual({ head: MIN_CEILING, body: MIN_CEILING, legs: MIN_CEILING });
    expect(j.verdict).toBe('pass');
    expect(j.ratio).toBe(0);
  });

  it('passes a ready as close to the idle as the attack is, and watches one between the two ratios', () => {
    const near = judgeIdentity({ idle, pose: read({ body: [50, 50, 56] }), attack });
    expect(near.verdict).toBe('pass');
    const mid = judgeIdentity({ idle, pose: read({ body: [70, 70, 76] }), attack });
    expect(mid.ratio!).toBeGreaterThanOrEqual(WATCH_RATIO);
    expect(mid.ratio!).toBeLessThan(FAIL_RATIO);
    expect(mid.verdict).toBe('watch');
    expect(mid.pass).toBe(true); // a watch is reported, never held
    expect(mid.over).toEqual(['body']);
  });

  it('fails a ready whose body is another costume (Paine Warrior\'s white top over a black jacket)', () => {
    const j = judgeIdentity({ idle, pose: read({ body: WHITE }), attack });
    expect(j.verdict).toBe('fail');
    expect(j.pass).toBe(false);
    expect(j.over).toContain('body');
    expect(j.ratio!).toBeGreaterThanOrEqual(FAIL_RATIO);
  });

  it('fails a ready whose head is another colour (a hood down against a hood up) and names the head', () => {
    const j = judgeIdentity({ idle: read({ head: WHITE }), pose: read({ head: [90, 60, 40] }), attack: read({ head: WHITE }) });
    expect(j.verdict).toBe('fail');
    expect(j.over).toEqual(['head']);
  });

  it('never fails what it could only cut by the silhouette (the hidden chapter copies): the worst it says is watch', () => {
    const j = judgeIdentity({ idle: read({}, false), pose: read({ body: WHITE }, false), attack: read({}, false) });
    expect(j.ratio!).toBeGreaterThanOrEqual(FAIL_RATIO);
    expect(j.verdict).toBe('watch');
  });

  it('reports the figure\'s other poses as a second ceiling without judging by them', () => {
    const wide = read({ body: RED });
    const j = judgeIdentity({ idle, pose: read({ body: WHITE }), attack, others: [wide] });
    expect(j.ceilingAny['body']!).toBeGreaterThan(j.ceiling['body']!);
    expect(j.verdict).toBe('fail'); // a wandering pose does not excuse the ready
  });

  it('reads nothing from an empty painting and says so', () => {
    const empty = readRegions({ data: new Uint8ClampedArray(40 * 40 * 4), w: 40, h: 40 }, null);
    const j = judgeIdentity({ idle, pose: empty, attack });
    expect(j.verdict).toBe('unread');
    expect(j.unread).toBe(true);
    expect(j.pass).toBe(false);
  });

  it('does not count a region the pose does not reach (too few solid pixels)', () => {
    const solid = Uint8ClampedArray.from({ length: 30 * 30 * 4 }, (_, i) => (i % 4 === 3 ? 255 : 100));
    const tiny = readRegions({ data: solid, w: 30, h: 30 }, null);
    expect(tiny.regions['head']).toBeNull(); // 30 x 30 px split in three: a region of 180 px is under the floor of 300
  });
});
