// @vitest-environment jsdom
/**
 * The host of the frame-budget governor (lane "perf-trim", 2026-10-23; both games, shared plumbing; Chapter I FFX and Chapter IV FFX-2 only): when it may act (a demo chapter with a pro lane on, or forced;
 * never with `?govern=off`, never in another chapter), that it hands the levers to `govLive` and puts them back at rest the moment it stops, and how the display's budget is read (8.33 ms unless the
 * page's own frame probe shows a slower screen, or `?govbudget=` says).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import { DemoGovernor, governBudget, governMode, snapBudget } from '../../../src/engine/governor/DemoGovernor.ts';
import { govLive, resetGovLive } from '../../../src/engine/governor/GovernorLive.ts';
import { softScaled } from '../../../src/engine/procam/ProBand.ts';
import { eyeCandy } from '../../../src/engine/fx/EyeCandy.ts';

const at = (search: string): void => window.history.pushState({}, '', `/${search}`);
const scene = {};

/** `seconds` of frames, one in `of` taking 16.67 ms instead of 8.33. */
function run(g: DemoGovernor, t0: number, seconds: number, miss: number, of: number, lanes: boolean): number {
  let t = t0;
  const end = t0 + seconds * 1000;
  let n = 0;
  while (t < end) {
    t += miss > 0 && n % of < miss ? 16.67 : 8.33;
    n++;
    g.tick(t, scene, lanes);
  }
  return t;
}

beforeEach(() => {
  resetGovLive();
  at('');
  setDemoChapter('seymour-flux');
  eyeCandy.probe.reset();
});
afterEach(() => {
  resetGovLive();
  setDemoChapter(undefined);
  at('');
});

describe('the display budget', () => {
  it('snaps the probe\'s quarter-percentile to the common refresh intervals and never goes under the 120 Hz budget', () => {
    expect(snapBudget(0)).toBe(8.33);
    expect(snapBudget(2.9)).toBe(8.33);
    expect(snapBudget(6.94)).toBe(8.33);
    expect(snapBudget(8.4)).toBe(8.33);
    expect(snapBudget(11.1)).toBe(11.11);
    expect(snapBudget(13.4)).toBe(13.33);
    expect(snapBudget(16.7)).toBe(16.67);
    expect(snapBudget(Number.NaN)).toBe(8.33);
  });

  it('reads the address: ?govern=on|off|today and ?govbudget=<ms>', () => {
    expect(governMode('')).toBe('auto');
    expect(governMode('?govern=off')).toBe('off');
    expect(governMode('?govern=today')).toBe('off');
    expect(governMode('?govern=on')).toBe('on');
    expect(governBudget('?govbudget=11.1')).toBe(11.1);
    expect(governBudget('?govbudget=2')).toBeNull();
    expect(governBudget('?govbudget=x')).toBeNull();
    expect(governBudget('')).toBeNull();
  });

  it('a 60 Hz page (the probe\'s frames at 16.7 ms) is judged on a 16.67 ms budget: it is not trimmed for missing 120 Hz', () => {
    for (let i = 0; i < 300; i++) eyeCandy.probe.push(16.7);
    const g = new DemoGovernor();
    let t = 1000;
    for (let i = 0; i < 1500; i++) g.tick((t += 16.67), scene, true);
    expect(govLive.level).toBe(0);
    expect(g.report()['governor']).toMatchObject({ budgetMs: 16.67 });
  });
});

describe('when it may act', () => {
  it('not with the lanes off, not in another chapter, not with ?govern=off: the levers stay at rest', () => {
    const lanesOff = new DemoGovernor();
    run(lanesOff, 1000, 12, 3, 20, false);
    expect(govLive).toEqual({ level: 0, soft: 1, particles: 1, heavy: 1 });
    setDemoChapter('sinspawn-gui'); // a hidden chapter the treatment never reaches (Chapter II is treated since release 69)
    const other = new DemoGovernor();
    run(other, 1000, 12, 3, 20, true);
    expect(govLive.level).toBe(0);
    setDemoChapter('seymour-flux');
    at('?govern=off');
    const off = new DemoGovernor();
    run(off, 1000, 12, 3, 20, true);
    expect(govLive).toEqual({ level: 0, soft: 1, particles: 1, heavy: 1 });
  });

  it('in Chapter I with a lane on, a display that misses its refresh takes the extras away one level at a time, and the levers follow', () => {
    const g = new DemoGovernor();
    run(g, 1000, 3, 3, 20, true);
    expect(govLive.level).toBe(0); // the first two seconds are held (a new battle is not a reading)
    const t = run(g, 4000, 14, 3, 20, true);
    expect(govLive.level).toBe(3);
    expect(govLive.soft).toBe(0);
    expect(govLive.particles).toBe(0.5);
    expect(govLive.heavy).toBe(0.8);
    expect(t).toBeGreaterThan(4000);
  });

  it('Chapter IV is the same (a demo chapter)', () => {
    setDemoChapter('ffx2-bahamut');
    const g = new DemoGovernor();
    run(g, 1000, 16, 3, 20, true);
    expect(govLive.level).toBeGreaterThan(0);
  });

  it('?govern=on runs it whatever the lanes say, anywhere', () => {
    at('?govern=on');
    setDemoChapter(undefined);
    const g = new DemoGovernor();
    run(g, 1000, 8, 3, 20, false);
    expect(govLive.level).toBeGreaterThan(0);
  });

  it('the lanes going off puts every lever back at rest at once', () => {
    const g = new DemoGovernor();
    const t = run(g, 1000, 12, 3, 20, true);
    expect(govLive.level).toBeGreaterThan(0);
    g.tick(t + 8, scene, false);
    expect(govLive).toEqual({ level: 0, soft: 1, particles: 1, heavy: 1 });
    expect(g.last).toBeNull();
  });

  it('a new scene is a hold: the same slow frames in a fresh scene do not step it', () => {
    const g = new DemoGovernor();
    let t = run(g, 1000, 6, 3, 20, true);
    const before = govLive.level;
    for (let i = 0; i < 200; i++) g.tick((t += 16.67), {}, true); // a new scene object every frame: a hold every frame
    expect(govLive.level).toBe(before);
  });
});

describe('the soft background\'s lever', () => {
  const shot = { focus: 0.4, width: 0.2, blur: 12, weight: 0.8 };
  const out = { focus: 0, width: 0, blur: 0, weight: 0 };

  it('1 is the very same shot (nothing changes at rest), 0 is no shot, between scales the weight', () => {
    expect(softScaled(shot, 1, out)).toBe(shot);
    expect(softScaled(null, 0.3, out)).toBeNull();
    expect(softScaled(shot, 0, out)).toBeNull();
    const half = softScaled(shot, 0.5, out)!;
    expect(half).toBe(out);
    expect(half).toMatchObject({ focus: 0.4, width: 0.2, blur: 12 });
    expect(half.weight).toBeCloseTo(0.4, 10);
    expect(shot.weight).toBe(0.8); // the camera's own object is never written
  });
});

describe('the particles\' lever reaches the effects\' density without stacking on the effects guard', () => {
  it('density is the run\'s own at rest, the lesser of the guard\'s share and the governor\'s when either thins, and the old scheme\'s exact number at rest', async () => {
    const { configureList } = await import('../../../src/engine/spellfx/SpellFxFreshLayer.ts');
    const out = {} as never as Record<string, number>;
    const r = { fresh: true, dens: 0.9, variant: 0, dir: 1 } as never;
    configureList(out as never, r, { particles: 0.75, trails: 1 }, 1, 7);
    expect(out['dens']).toBe(0.9 * 0.75); // at rest: guard only, bit for bit what it was
    govLive.particles = 0.5;
    configureList(out as never, r, { particles: 0.75, trails: 1 }, 1, 7);
    expect(out['dens']).toBe(0.9 * 0.5);
    configureList(out as never, r, { particles: 0.5, trails: 0 }, 1, 7);
    expect(out['dens']).toBe(0.9 * 0.5); // both at a half: a half, not a quarter
    configureList(out as never, { ...(r as object), fresh: false } as never, { particles: 0.5, trails: 0 }, 1, 7);
    expect(out['dens']).toBe(0.9); // a copy that is not the new effects is untouched
  });
});

describe('leaving the battle', () => {
  it('battleEnded puts every lever back at rest and the next battle starts from a clean window', () => {
    const g = new DemoGovernor();
    let t = run(g, 1000, 12, 3, 20, true);
    expect(govLive.level).toBeGreaterThan(0);
    g.battleEnded(t);
    expect(govLive).toEqual({ level: 0, soft: 1, particles: 1, heavy: 1 });
    expect(g.active).toBe(false);
    // a new battle: the first two seconds are a hold again, so slow frames at its start do not step it at once
    t = run(g, t + 5000, 1.5, 3, 20, true);
    expect(govLive.level).toBe(0);
  });
});
