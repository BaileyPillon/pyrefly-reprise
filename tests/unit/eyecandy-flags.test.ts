/**
 * The eye-candy options round switch (`src/engine/fx/EyeCandy.ts`): URL parsing, tier
 * resolution, the dials and the frame probe. Game case: both (shared plumbing). Option D is the
 * default look (Bailey's pick, 2026-09-29); `?fx=off` gives the look before it.
 */
import { describe, expect, it } from 'vitest';
import { EyeCandyState, FrameProbe, overlapBalance, parseFxDials, parseFxQuery, resolveFxTier } from '../../src/engine/fx/EyeCandy.ts';

describe('parseFxQuery', () => {
  it('is option D (A + B + C) with no parameter: the game look since Bailey picked it', () => {
    const q = parseFxQuery('');
    expect(q.on).toEqual({ a: true, b: true, c: true });
    expect(parseFxQuery('?seed=3').on).toEqual({ a: true, b: true, c: true });
    expect(parseFxQuery('?fx=').on).toEqual({ a: true, b: true, c: true });
    expect(q.tier).toBeNull();
    expect(q.subOff.size).toBe(0);
    expect(q.dials).toEqual({});
  });

  it('reads options, all and off', () => {
    expect(parseFxQuery('?fx=a').on).toEqual({ a: true, b: false, c: false });
    expect(parseFxQuery('?fx=a,c').on).toEqual({ a: true, b: false, c: true });
    expect(parseFxQuery('?fx=all').on).toEqual({ a: true, b: true, c: true });
    expect(parseFxQuery('?fx=d').on).toEqual({ a: true, b: true, c: true }); // option D = A + B + C together
    expect(parseFxQuery('?fx=all,off').on).toEqual({ a: false, b: false, c: false });
    expect(parseFxQuery('?fx=off').on).toEqual({ a: false, b: false, c: false }); // today's look, for comparison and tests
    expect(parseFxQuery('?fx=zz').on).toEqual({ a: true, b: true, c: true }); // nothing recognised: the default
  });

  it('reads sub-effects switched off and a forced tier', () => {
    const q = parseFxQuery('?fx=a&fxsub=-shafts,-flare,halo&fxtier=phone');
    expect([...q.subOff].sort()).toEqual(['flare', 'shafts']);
    expect(q.tier).toBe('phone');
    expect(parseFxQuery('?fxtier=ultra').tier).toBeNull();
  });

  it('reads and clamps the dials, ignoring unknown names and non-numbers', () => {
    expect(parseFxDials('bloom:1.4,shafts:0.5,nope:2,look:x,all:9,rim:-1')).toEqual({ bloom: 1.4, shafts: 0.5, all: 3, rim: 0 });
    expect(parseFxQuery('?fx=a&fxdial=haze:0').dials).toEqual({ haze: 0 });
  });
});

describe('resolveFxTier', () => {
  it('is phone under a 600 px short side, else full', () => {
    expect(resolveFxTier({ lowEffects: false, width: 1600, height: 900 })).toBe('full');
    expect(resolveFxTier({ lowEffects: false, width: 390, height: 844 })).toBe('phone');
  });

  it('lets Low effects win over everything, and a forced tier over the size', () => {
    expect(resolveFxTier({ lowEffects: true, width: 1600, height: 900 }, 'full')).toBe('low');
    expect(resolveFxTier({ lowEffects: false, width: 390, height: 844 }, 'full')).toBe('full');
    expect(resolveFxTier({ lowEffects: false, width: 1600, height: 900 }, 'phone')).toBe('phone');
  });
});

describe('EyeCandyState', () => {
  it('scales every dial by all, and sub-effects follow their option', () => {
    const s = new EyeCandyState(parseFxQuery('?fx=a&fxdial=all:0.5,bloom:2&fxsub=-rim'));
    expect(s.dial('bloom')).toBe(1);
    expect(s.dial('shafts')).toBe(0.5);
    expect(s.dial('all')).toBe(0.5);
    expect(s.sub('a', 'bloom')).toBe(true);
    expect(s.sub('a', 'rim')).toBe(false);
    expect(s.sub('b', 'bloom')).toBe(false);
    s.setDial('shafts', 7);
    expect(s.dials.shafts).toBe(3);
  });

  it('tells listeners when a switch changes, and the tier reads the live environment', () => {
    const s = new EyeCandyState(parseFxQuery('?fx=off'));
    let n = 0;
    s.onChange(() => n++);
    s.set('a', true);
    s.set('a', true);
    s.setSub('flare', false);
    expect(n).toBe(2);
    s.env = () => ({ lowEffects: false, reduceMotion: true, reduceFlashes: false, width: 390, height: 844 });
    expect(s.tier).toBe('phone');
    expect(s.reduceMotion).toBe(true);
  });
});

describe('FrameProbe', () => {
  it('gives nearest-rank percentiles over a ring', () => {
    const p = new FrameProbe(4);
    for (const ms of [10, 20, 30, 40, 50]) p.push(ms);
    expect(p.count).toBe(4);
    expect(p.percentile(50)).toBe(30);
    expect(p.stats().p95).toBe(50);
    p.push(Number.NaN);
    p.push(-1);
    expect(p.count).toBe(4);
    p.reset();
    expect(p.stats()).toMatchObject({ frames: 0, p50: 0 });
  });
});

describe('option D balance (A + B + C together)', () => {
  it('leaves each option alone unchanged and damps only the effects two options both light', () => {
    for (const q of ['?fx=a', '?fx=b', '?fx=c']) {
      const s = new EyeCandyState(parseFxQuery(q));
      for (const d of ['bloom', 'lamps', 'haze', 'shafts', 'flare'] as const) expect(s.dial(d)).toBe(1);
    }
    const d = new EyeCandyState(parseFxQuery('?fx=d&fxdial=bloom:2'));
    expect(d.dial('bloom')).toBeCloseTo(1.2); // 2 x 0.6 (A + B, D-final tuning)
    expect(d.dial('lamps')).toBeCloseTo(0.3);
    expect(d.dial('flare')).toBeCloseTo(0.55);
    expect(d.dial('sparks')).toBe(1);
    expect(overlapBalance({ a: true, b: false, c: true }, 'lamps')).toBe(1);
    expect(overlapBalance({ a: true, b: false, c: true }, 'flare')).toBeCloseTo(0.55);
  });
});
