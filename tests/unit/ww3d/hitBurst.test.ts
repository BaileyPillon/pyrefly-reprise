/**
 * **A Wind Waker hit, in numbers** (`src/engine/ww3d/hitBurst.ts`; the hidden Wind Waker chapter, FFX-2 only): the star's timing and size curve, its shape, how big it is for a figure, the smoke's layout and life, and that
 * every colour stays under the game's bloom threshold. Pure: no browser.
 */
import { describe, expect, it } from 'vitest';
import {
  HEAVY_SCALE,
  HIT_COLOURS,
  LATER_SCALE,
  PUFF_LIFE,
  PUFF_LOBES,
  STAR_HEIGHT_CAP,
  STAR_INNER,
  STAR_LAYERS,
  STAR_LIFE,
  STAR_MAX_FRAME_SHARE,
  STAR_OVERSHOOT,
  STAR_POP,
  STAR_SHARE,
  STAR_SPIN,
  STAR_START,
  burstLife,
  curlSpiral,
  hitPlan,
  luminanceOf,
  puffLayout,
  puffState,
  starAngle,
  starCapRadius,
  starPoints,
  starScale,
  unit,
} from '../../../src/engine/ww3d/hitBurst.ts';
import { BOSS_HEIGHT, PARTY_HEIGHT } from '../../../src/engine/ww3d/layout.ts';
import { RIGS, TARGET_FOV } from '../../../src/engine/ww3d/camera.ts';

describe('the star: a flat burst that pops and shrinks over about a quarter of a second', () => {
  it('lives a quarter of a second, pops in under a tenth of it, and is nothing before it begins and after it ends', () => {
    expect(STAR_LIFE).toBeGreaterThanOrEqual(0.2);
    expect(STAR_LIFE).toBeLessThanOrEqual(0.3);
    expect(STAR_POP).toBeLessThan(STAR_LIFE / 3);
    expect(starScale(-0.01)).toBe(0);
    expect(starScale(Number.NaN)).toBe(0);
    expect(starScale(STAR_LIFE)).toBe(0);
    expect(starScale(STAR_LIFE + 1)).toBe(0);
  });

  it('starts at its start size, pops to just over its nominal size by the end of the pop, and only ever shrinks after that', () => {
    expect(starScale(0)).toBeCloseTo(STAR_START, 6);
    expect(starScale(STAR_POP)).toBeCloseTo(STAR_OVERSHOOT, 6);
    expect(STAR_OVERSHOOT).toBeGreaterThan(1);
    expect(STAR_OVERSHOOT).toBeLessThanOrEqual(1.3); // a pop, not a blow-up
    let prev = starScale(STAR_POP);
    for (let t = STAR_POP + 0.005; t < STAR_LIFE; t += 0.005) {
      const s = starScale(t);
      expect(s).toBeLessThanOrEqual(prev + 1e-9);
      prev = s;
    }
    expect(starScale(STAR_LIFE - 0.001)).toBeLessThan(0.1); // collapsed by the end
  });

  it('grows monotonically through the pop', () => {
    let prev = starScale(0);
    for (let t = 0.005; t <= STAR_POP; t += 0.005) {
      const s = starScale(t);
      expect(s).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = s;
    }
  });

  it('is at least half its nominal size for most of the first half of its life (it holds, then collapses at the end)', () => {
    expect(starScale(STAR_LIFE * 0.5)).toBeGreaterThan(0.7);
    expect(starScale(STAR_LIFE * 0.9)).toBeLessThan(0.4);
  });

  it('turns at STAR_SPIN radians a second from its base angle, and does not turn backward before it begins', () => {
    expect(starAngle(0.5, 0)).toBeCloseTo(0.5, 9);
    expect(starAngle(0.5, 0.25)).toBeCloseTo(0.5 + STAR_SPIN * 0.25, 9);
    expect(starAngle(0.5, -1)).toBeCloseTo(0.5, 9);
  });

  it('is three nested flat layers: the outline is the whole star, the yellow body and the white core nest inside it', () => {
    expect(STAR_LAYERS.outline).toBe(1);
    expect(STAR_LAYERS.body).toBeLessThan(STAR_LAYERS.outline);
    expect(STAR_LAYERS.core).toBeLessThan(STAR_LAYERS.body);
    expect(STAR_LAYERS.core).toBeGreaterThan(0.3);
  });
});

describe('the star shape', () => {
  it('has twice as many vertices as points, alternating the point and the notch, with the notch inside the point', () => {
    for (const n of [4, 5, 6]) {
      const pts = starPoints(n, 1);
      expect(pts).toHaveLength(n * 2);
      pts.forEach(([x, y], i) => expect(Math.hypot(x, y)).toBeCloseTo(i % 2 === 0 ? 1 : STAR_INNER[n]!, 9));
      expect(STAR_INNER[n]).toBeGreaterThan(0.3);
      expect(STAR_INNER[n]).toBeLessThan(0.6);
    }
  });

  it('points straight up at no rotation and turns with the rotation, and scales with the outer radius', () => {
    const [x, y] = starPoints(5, 2)[0]!;
    expect(x).toBeCloseTo(0, 9);
    expect(y).toBeCloseTo(2, 9);
    const [rx, ry] = starPoints(5, 2, Math.PI / 2)[0]!;
    expect(rx).toBeCloseTo(-2, 9);
    expect(ry).toBeCloseTo(0, 9);
  });

  it('is symmetric: the points of a five-point star are 72 degrees apart', () => {
    const outer = starPoints(5, 1).filter((_p, i) => i % 2 === 0).map(([x, y]) => Math.atan2(y, x));
    for (let i = 0; i < 5; i++) expect((outer[(i + 1) % 5]! - outer[i]! + Math.PI * 4) % (Math.PI * 2)).toBeCloseTo((Math.PI * 2) / 5, 6);
  });

});

describe('how big a hit is, and how many puffs it throws', () => {
  it('is a four- to six-point star and three to five puffs for every kind of blow', () => {
    for (const heavy of [false, true]) {
      for (const hitIndex of [0, 1, 5]) {
        const p = hitPlan(1.5, { heavy, hitIndex });
        expect(p.points).toBeGreaterThanOrEqual(4);
        expect(p.points).toBeLessThanOrEqual(6);
        expect(p.puffs).toBeGreaterThanOrEqual(3);
        expect(p.puffs).toBeLessThanOrEqual(5);
      }
    }
  });

  it('gives a plain blow five points and four puffs, a heavy one six and five and a bigger star, a later hit of a multi-hit action four and three and a smaller one', () => {
    const plain = hitPlan(1.5, { heavy: false, hitIndex: 0 });
    const heavy = hitPlan(1.5, { heavy: true, hitIndex: 0 });
    const later = hitPlan(1.5, { heavy: false, hitIndex: 2 });
    expect([plain.points, plain.puffs]).toEqual([5, 4]);
    expect([heavy.points, heavy.puffs]).toEqual([6, 5]);
    expect([later.points, later.puffs]).toEqual([4, 3]);
    expect(heavy.radius).toBeCloseTo(plain.radius * HEAVY_SCALE, 9);
    expect(later.radius).toBeCloseTo(plain.radius * LATER_SCALE, 9);
  });

  it('sizes the star to the figure it lands on, and stops growing for a very tall one (Valefor\'s star is a girl-sized one plus a little)', () => {
    const girl = hitPlan(PARTY_HEIGHT, { heavy: false, hitIndex: 0 });
    const boss = hitPlan(BOSS_HEIGHT, { heavy: false, hitIndex: 0 });
    expect(girl.radius).toBeCloseTo(STAR_SHARE * PARTY_HEIGHT, 9);
    expect(boss.radius).toBeCloseTo(STAR_SHARE * STAR_HEIGHT_CAP, 9);
    expect(boss.radius).toBeGreaterThan(girl.radius);
    expect(hitPlan(10, { heavy: false, hitIndex: 0 }).radius).toBe(boss.radius);
    expect(hitPlan(-1, { heavy: false, hitIndex: 0 }).radius).toBe(0);
  });

  it('is no more than the cap allows for a plain blow on the nearest girl at the target shot (and on the other two, with room to spare)', () => {
    const girl = hitPlan(PARTY_HEIGHT, { heavy: false, hitIndex: 0 });
    const cap = starCapRadius(Math.hypot(1.0 - -0.34, 3.2 - 0.89), TARGET_FOV); // Yuna, the nearest
    expect(girl.radius).toBeLessThanOrEqual(cap * 1.1);
    const paine = hitPlan(PARTY_HEIGHT, { heavy: false, hitIndex: 0 });
    expect(paine.radius).toBeLessThan(starCapRadius(Math.hypot(1.0 - 0.69, 3.2 - -1.28), TARGET_FOV) * 0.6);
    expect(STAR_MAX_FRAME_SHARE).toBeLessThanOrEqual(0.3);
  });

  it('is capped to its share of the frame by the lens, nearer is smaller and a wider lens allows more at one distance', () => {
    expect(starCapRadius(5, 49)).toBeCloseTo((2 * 5 * Math.tan((49 * Math.PI) / 360) * STAR_MAX_FRAME_SHARE) / 2, 9);
    expect(starCapRadius(2, 49)).toBeLessThan(starCapRadius(5, 49));
    expect(starCapRadius(5, 60)).toBeGreaterThan(starCapRadius(5, 40));
    expect(starCapRadius(0, 49)).toBe(0);
    // the closest rig of the chapter still leaves a girl-sized star under the cap at the girls' distance
    const party = RIGS['party']!;
    const d = Math.hypot(party.position[0] - -0.05, party.position[2] - -0.16);
    expect(hitPlan(PARTY_HEIGHT, { heavy: true, hitIndex: 0 }).radius).toBeLessThanOrEqual(starCapRadius(d, party.fov) * 1.5);
  });
});

describe('the smoke', () => {
  it('lays out the number of puffs asked for, each different, the same way for the same seed and another way for another', () => {
    for (const n of [3, 4, 5]) expect(puffLayout(n, 7)).toHaveLength(n);
    expect(puffLayout(4, 7)).toEqual(puffLayout(4, 7));
    expect(puffLayout(4, 7)).not.toEqual(puffLayout(4, 8));
    const p = puffLayout(5, 3);
    expect(new Set(p.map((x) => x.dx)).size).toBe(5);
    for (let i = 1; i < p.length; i++) expect(p[i]!.dx).toBeGreaterThan(p[i - 1]!.dx); // spread left to right across the star
    for (const x of p) {
      expect(x.life).toBeGreaterThanOrEqual(PUFF_LIFE.min);
      expect(x.life).toBeLessThanOrEqual(PUFF_LIFE.max);
      expect(x.size).toBeGreaterThan(0.2);
      expect(x.size).toBeLessThan(0.5);
      expect(x.rise).toBeGreaterThan(0.5);
      expect(Math.abs(x.spin)).toBeGreaterThan(0.5);
    }
  });

  it('hashes a seed to a number in [0, 1) the same way every time', () => {
    for (let s = 0; s < 50; s++) for (let k = 0; k < 8; k++) {
      const v = unit(s, k);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(unit(s, k)).toBe(v);
    }
    expect(unit(1, 1)).not.toBe(unit(2, 1));
    expect(unit(1, 1)).not.toBe(unit(1, 2));
  });

  it('is not there before its delay, drifts up while it lives, and is gone, fully faded, at the end of its life', () => {
    const [p] = puffLayout(1, 11);
    expect(puffState(p!, p!.delay - 0.01).live).toBe(false);
    expect(puffState(p!, p!.delay - 0.01).alpha).toBe(0);
    const early = puffState(p!, p!.delay + 0.05);
    const mid = puffState(p!, p!.delay + p!.life * 0.5);
    const late = puffState(p!, p!.delay + p!.life * 0.9);
    expect(early.live && mid.live && late.live).toBe(true);
    expect(mid.y).toBeGreaterThan(early.y);
    expect(late.y).toBeGreaterThan(mid.y); // it keeps rising ...
    expect(late.y - mid.y).toBeLessThan(mid.y - early.y + 0.2); // ... slower and slower
    expect(early.alpha).toBe(1);
    expect(mid.alpha).toBeLessThanOrEqual(1);
    expect(late.alpha).toBeLessThan(0.5);
    expect(late.alpha).toBeGreaterThan(0);
    const done = puffState(p!, p!.delay + p!.life);
    expect(done.done).toBe(true);
    expect(done.alpha).toBe(0);
    expect(done.live).toBe(false);
  });

  it('grows from half its size to its full size over the first part of its life and stays there', () => {
    const [p] = puffLayout(1, 5);
    expect(puffState(p!, p!.delay).scale).toBeCloseTo(0.5, 6);
    expect(puffState(p!, p!.delay + p!.life * 0.4).scale).toBeCloseTo(1, 6);
    expect(puffState(p!, p!.delay + p!.life * 0.8).scale).toBe(1);
  });

  it('turns a little as it goes (the puff and its curl), and a burst lives until the latest puff ends, never less than the star', () => {
    const [p] = puffLayout(1, 9);
    expect(puffState(p!, p!.delay + 0.2).angle).not.toBe(puffState(p!, p!.delay).angle);
    const puffs = puffLayout(5, 4);
    expect(burstLife(puffs)).toBeCloseTo(Math.max(...puffs.map((x) => x.delay + x.life)), 9);
    expect(burstLife(puffs)).toBeGreaterThan(STAR_LIFE);
    expect(burstLife([])).toBe(STAR_LIFE);
    expect(burstLife(puffs)).toBeLessThan(1.1); // about seven tenths of a second, not a lingering cloud
  });

  it('is a cloud of round lobes that overlap into one shape, and a curl that winds out from near its middle', () => {
    expect(PUFF_LOBES.length).toBeGreaterThanOrEqual(3);
    const big = PUFF_LOBES[0]!;
    for (const [x, y, r] of PUFF_LOBES.slice(1)) expect(Math.hypot(x - big[0], y - big[1])).toBeLessThan(big[2] + r); // every lobe touches the first
    const curl = curlSpiral(1.5, 0.5, 20);
    expect(curl).toHaveLength(20);
    expect(Math.hypot(...curl[0]!)).toBeLessThan(0.1);
    expect(Math.hypot(...curl[19]!)).toBeCloseTo(0.5, 6);
    const radii = curl.map(([x, y]) => Math.hypot(x, y));
    for (let i = 1; i < radii.length; i++) expect(radii[i]).toBeGreaterThan(radii[i - 1]!);
  });
});

describe('under the bloom', () => {
  it('keeps every colour of the star and the smoke under 1.0 in luminance, so the game\'s bloom has nothing to spread', () => {
    for (const [name, hex] of Object.entries(HIT_COLOURS)) {
      const l = luminanceOf(hex);
      expect(l, name).toBeLessThan(1);
      expect(l, name).toBeGreaterThan(0.05);
    }
  });

  it('is white at the core, yellow in the body and orange at the outline, in that order of brightness', () => {
    expect(luminanceOf(HIT_COLOURS.core)).toBeGreaterThan(luminanceOf(HIT_COLOURS.body));
    expect(luminanceOf(HIT_COLOURS.body)).toBeGreaterThan(luminanceOf(HIT_COLOURS.outline));
    expect(luminanceOf(HIT_COLOURS.puff)).toBeGreaterThan(luminanceOf(HIT_COLOURS.puffLine));
  });

  it('measures luminance as Rec. 709 of the linear colour (white is 1, black is 0)', () => {
    expect(luminanceOf('#ffffff')).toBeCloseTo(1, 6);
    expect(luminanceOf('#000000')).toBe(0);
    expect(luminanceOf('#ff0000')).toBeCloseTo(0.2126, 4);
  });

});
