/**
 * Motion pass, lane "core", step 2 (SMEAR): the pure parts. The switch (default OFF, `?smear=` / `?pack=demo`, demo chapters only), the planner (a big change on a moving figure is a cut inside a
 * 2 to 4 frame window; everything else keeps its blend), the window's amount, the log the continuity harness reads, the per-figure state, and the uniform writer. Game case: both (shared
 * plumbing); which pairs are big is read from each game's own paintings, so there is no per-game number here.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setCurvesChapter } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setSmearStyle, smearOn, smearStyle, smearStyleFromSearch, smearStyleNow } from '../../../src/engine/motion/SmearSwitch.ts';
import {
  BIG_ANCHOR,
  BIG_OVERLAP,
  CUT,
  CUT_AT,
  CUT_MS_MAX,
  CUT_MS_MIN,
  FRAMES_MIN,
  LENGTH,
  MIN_SPEED,
  RIG_BIG_SHARE,
  WINDOW_CAP_MS,
  flashInto,
  isBigChange,
  rigSmearPlan,
  smearAmount,
  smearPlan,
  type SmearInput,
} from '../../../src/engine/motion/SmearPlan.ts';
import { ActorSmear, figureVector, TAU_MS } from '../../../src/engine/motion/ActorSmear.ts';
import { noteSmear, resetSmearLog, smearLog } from '../../../src/engine/motion/SmearLog.ts';
import { applySmear } from '../../../src/engine/motion/SmearApply.ts';

afterEach(() => {
  setSmearStyle(null);
  setCurvesChapter(undefined);
  resetSmearLog();
});

describe('the switch', () => {
  it('is OFF for no page and for ?pack=off, and the painted streak with no word at all since r64 (item 200b)', () => {
    expect(smearStyleFromSearch(undefined)).toBe('off');
    expect(smearStyleFromSearch('?pack=off')).toBe('off');
    expect(smearStyleFromSearch('?pack=off&curves=new')).toBe('off');
    expect(smearStyleFromSearch('')).toBe('paint');
    expect(smearStyleFromSearch('?curves=new')).toBe('paint');
  });
  it('?smear= picks a style and wins over the pack; ?pack=demo alone is the painted streak', () => {
    expect(smearStyleFromSearch('?smear=blur')).toBe('blur');
    expect(smearStyleFromSearch('?smear=paint')).toBe('paint');
    expect(smearStyleFromSearch('?pack=demo')).toBe('paint');
    expect(smearStyleFromSearch('?pack=demo&smear=blur')).toBe('blur');
    expect(smearStyleFromSearch('?pack=demo&smear=off')).toBe('off');
    expect(smearStyleFromSearch('?pack=off&smear=banana')).toBe('off');
    expect(smearStyleFromSearch('?smear=banana')).toBe('paint'); // an unknown style names nothing: the default decides
    expect(smearStyleFromSearch('?pack=off&SMEAR=Blur')).toBe('off'); // the key is lower case; the value is not case sensitive
    expect(smearStyleFromSearch('?smear=BLUR')).toBe('blur');
  });
  it('plays only in the two demo chapters', () => {
    setSmearStyle('paint');
    expect(smearStyle()).toBe('paint');
    expect(smearOn()).toBe(false); // no chapter named
    setCurvesChapter('hidden-chapter');
    expect(smearStyleNow()).toBe('off');
    setCurvesChapter('seymour-flux');
    expect(smearStyleNow()).toBe('paint');
    setCurvesChapter('ffx2-bahamut');
    expect(smearOn()).toBe(true);
    setSmearStyle('off');
    expect(smearOn()).toBe(false);
  });
});

describe('what is a big change', () => {
  it('a low overlap or far-apart heads; an unknown pair is not', () => {
    expect(isBigChange(BIG_OVERLAP - 0.01, null)).toBe(true);
    expect(isBigChange(BIG_OVERLAP, null)).toBe(false);
    expect(isBigChange(0.9, BIG_ANCHOR)).toBe(true);
    expect(isBigChange(0.9, BIG_ANCHOR - 0.01)).toBe(false);
    expect(isBigChange(null, null)).toBe(false);
    expect(isBigChange(Number.NaN, Number.NaN)).toBe(false);
    expect(isBigChange(null, 0.3)).toBe(true);
  });
});

const input = (over: Partial<SmearInput> = {}): SmearInput => ({ from: 'ready', to: 'attack', overlap: 0.14, anchorDistance: 0.2, speed: 4, frameMs: 1000 / 120, style: 'paint', ...over });

describe('the plan', () => {
  it('a big change on a moving figure is a cut in a window of 24 to 34 ms (2 to 4 frames at 120 Hz) with a flash into the attack painting', () => {
    const p = smearPlan(input())!;
    expect(p).not.toBeNull();
    expect(p.cutMs).toBeGreaterThanOrEqual(CUT_MS_MIN);
    expect(p.cutMs).toBeLessThanOrEqual(CUT_MS_MAX);
    expect(p.cutMs / (1000 / 120)).toBeGreaterThanOrEqual(FRAMES_MIN);
    expect(p.style).toBe('paint');
    expect(p.length).toBe(LENGTH.paint);
    expect(p.flash).toBe(true);
    expect(p.strength).toBeGreaterThan(0.5);
    expect(p.strength).toBeLessThanOrEqual(1);
  });
  it('a pair that nearly agrees gets the short window, one that shares nothing the long one', () => {
    expect(smearPlan(input({ overlap: 0.49, anchorDistance: null }))!.cutMs).toBeLessThan(smearPlan(input({ overlap: 0.05 }))!.cutMs);
    expect(smearPlan(input({ overlap: 0.05 }))!.cutMs).toBe(CUT_MS_MAX);
  });
  it('the window is never fewer than 2.25 frames of a slow display, and never longer than the cap', () => {
    const at60 = smearPlan(input({ frameMs: 1000 / 60 }))!;
    expect(at60.cutMs).toBeGreaterThanOrEqual(Math.round(FRAMES_MIN * (1000 / 60)));
    const at30 = smearPlan(input({ frameMs: 1000 / 30 }))!;
    expect(at30.cutMs).toBe(WINDOW_CAP_MS);
    expect(smearPlan(input({ frameMs: 0 }))!.cutMs).toBeLessThanOrEqual(CUT_MS_MAX);
  });
  it('a small change, a figure at rest, a knock-out and a twirl keep the blend', () => {
    expect(smearPlan(input({ overlap: 0.7, anchorDistance: 0.02 }))).toBeNull();
    expect(smearPlan(input({ speed: MIN_SPEED - 0.01 }))).toBeNull();
    expect(smearPlan(input({ speed: 0 }))).toBeNull();
    expect(smearPlan(input({ to: 'ko' }))).toBeNull();
    expect(smearPlan(input({ from: 'ko', to: 'idle' }))).toBeNull();
    expect(smearPlan(input({ to: 'twirl-mid' }))).toBeNull();
    expect(smearPlan(input({ overlap: null, anchorDistance: null }))).toBeNull();
  });
  it('the strength follows the speed; the style picks the streak length', () => {
    const slow = smearPlan(input({ speed: 0.6 }))!;
    const fast = smearPlan(input({ speed: 6 }))!;
    expect(fast.strength).toBeGreaterThan(slow.strength);
    expect(smearPlan(input({ style: 'blur' }))!.length).toBe(LENGTH.blur);
    expect(LENGTH.paint).toBeGreaterThan(LENGTH.blur);
  });
  it('the flash is for a cut into an action painting: not the struck figure\'s hurt, not a return to idle', () => {
    expect(flashInto('attack')).toBe(true);
    expect(flashInto('cast')).toBe(true);
    expect(flashInto('od-energy-rain')).toBe(true);
    expect(flashInto('hurt')).toBe(false);
    expect(flashInto('idle')).toBe(false);
    expect(flashInto('follow')).toBe(false);
    expect(smearPlan(input({ to: 'hurt', from: 'idle', speed: 1.2 }))!.flash).toBe(false);
    expect(smearPlan(input({ to: 'idle', from: 'follow' }))!.flash).toBe(false);
  });
});

describe('the cut and the amount over the window', () => {
  it('the old painting is whole until the cut and the new one from it: no frame shows both', () => {
    for (let i = 0; i <= 100; i++) {
      const u = i / 100;
      const o = CUT.out(u);
      const n = CUT.inn(u);
      expect(o + n).toBe(1);
      expect(o === 0 || o === 1).toBe(true);
    }
    expect(CUT.out(CUT_AT - 0.001)).toBe(1);
    expect(CUT.inn(CUT_AT)).toBe(1);
  });
  it('the smear is nothing at either end and full AT the cut', () => {
    expect(smearAmount(0)).toBe(0);
    expect(smearAmount(1)).toBeLessThan(1e-9);
    expect(smearAmount(CUT_AT)).toBeCloseTo(1, 10);
    expect(smearAmount(0.25)).toBeGreaterThan(0.5);
    expect(smearAmount(0.25)).toBeCloseTo(smearAmount(0.75), 10);
    expect(smearAmount(-1)).toBe(0);
    expect(smearAmount(2)).toBeLessThan(1e-9);
  });
  it('at 60 Hz the old painting is smeared for a frame and the new one arrives smeared (the cut is not on the first frame)', () => {
    const p = smearPlan(input({ frameMs: 1000 / 60 }))!;
    const frame = 1000 / 60;
    const u1 = frame / p.cutMs;
    const u2 = (2 * frame) / p.cutMs;
    expect(CUT.out(u1)).toBe(1); // frame 1: still the old painting...
    expect(smearAmount(u1) * p.strength).toBeGreaterThan(0.4); // ...streaked
    expect(CUT.inn(Math.min(1, u2))).toBe(1); // frame 2: the new one
    expect(smearAmount(Math.min(1, u2))).toBeLessThan(0.9);
  });
});

describe('the rig plan', () => {
  it('a whole-figure image change is a cut with no speed gate; a small one, a knock-out and a twirl are not', () => {
    const p = rigSmearPlan({ from: 'idle', to: 'attack', share: 1, frameMs: 1000 / 120, style: 'blur' })!;
    expect(p.cutMs).toBe(CUT_MS_MAX);
    expect(p.style).toBe('blur');
    expect(p.flash).toBe(true);
    expect(rigSmearPlan({ from: 'idle', to: 'attack', share: RIG_BIG_SHARE, frameMs: 8, style: 'paint' })!.cutMs).toBe(CUT_MS_MIN);
    expect(rigSmearPlan({ from: 'idle', to: 'attack', share: 0.3, frameMs: 8, style: 'paint' })).toBeNull();
    expect(rigSmearPlan({ from: 'idle', to: 'ko', share: 1, frameMs: 8, style: 'paint' })).toBeNull();
    expect(rigSmearPlan({ from: 'idle', to: 'hurt', share: 1, frameMs: 8, style: 'paint' })!.flash).toBe(false);
  });
});

describe('the log the continuity harness reads', () => {
  it('keeps who, from, to, style and when the cut falls; copies; resets; stays bounded', () => {
    const e = noteSmear({ at: 1000, actor: 'tidus', from: 'ready', to: 'attack', style: 'paint', cutMs: 30, overlap: 0.2, anchorDistance: 0.1, speed: 4, strength: 0.9, flash: true, kind: 'plane' });
    expect(e.cutAt).toBe(1000 + 30 * CUT_AT);
    const a = smearLog();
    expect(a).toHaveLength(1);
    a.length = 0;
    expect(smearLog()).toHaveLength(1); // a copy
    expect(smearLog(true)).toHaveLength(1);
    expect(smearLog()).toHaveLength(0);
    for (let i = 0; i < 4500; i++) noteSmear({ at: i, actor: 'x', from: 'a', to: 'b', style: 'blur', cutMs: 24, overlap: null, anchorDistance: null, speed: 1, strength: 1, flash: false, kind: 'rig' });
    expect(smearLog().length).toBeLessThanOrEqual(4000); // the fluidity pass raised the cap from 400: a ten-minute fight plans about 420 cuts (SmearLog.ts)
    expect(smearLog().at(-1)!.at).toBe(4499);
  });
});

describe('one figure\'s state', () => {
  it('measures the speed in body heights a second, smoothed, and holds through a hit-stop', () => {
    const s = new ActorSmear();
    const dt = 1 / 120;
    for (let i = 0; i < 120; i++) s.track(i * 0.05 * dt * 120, 0, dt, dt); // 0.05 world units a frame = 6 units a second
    expect(s.speed(1.82)).toBeGreaterThan(3);
    expect(s.speed(1.82)).toBeLessThan(3.6);
    const before = s.speed(1.82);
    s.track(99, 0, 0, dt); // a hit-stop: no field time
    expect(s.speed(1.82)).toBe(before);
    for (let i = 0; i < Math.ceil((TAU_MS * 12) / (dt * 1000)); i++) s.track(5, 0, dt, dt); // at rest again
    expect(s.speed(1.82)).toBeLessThan(0.05);
  });
  it('averages the frame time', () => {
    const s = new ActorSmear();
    for (let i = 0; i < 100; i++) s.track(0, 0, 1 / 60, 1 / 60);
    expect(s.frameMs).toBeCloseTo(1000 / 60, 1);
  });
  it('a hint stands in for a move that has not started: its direction and speed, for its time only', () => {
    const s = new ActorSmear();
    s.hint(-1, 2, 50);
    expect(s.speed(1.82)).toBe(2);
    expect(s.direction(1.82)).toEqual({ x: -1, y: 0 });
    s.track(0, 0, 1 / 60, 0.06); // 60 ms of real time: the hint is over
    expect(s.speed(1.82)).toBe(0);
  });
  it('the direction is the measured velocity\'s unit vector, else along the stage', () => {
    const s = new ActorSmear();
    const dt = 1 / 120;
    for (let i = 0; i < 60; i++) s.track(-i * 0.03, i * 0.04, dt, dt);
    const d = s.direction(1.82);
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1, 6);
    expect(d.x).toBeLessThan(0);
    expect(d.y).toBeGreaterThan(0);
    expect(new ActorSmear().direction(1.82)).toEqual({ x: 1, y: 0 });
  });
  it('samples the window: the plan\'s strength times the amount, off when no plan runs', () => {
    const s = new ActorSmear();
    expect(s.sample(0.5).amount).toBe(0);
    const plan = smearPlan(input())!;
    s.begin(plan, -1, 0);
    expect(s.active).toBe(true);
    const f = s.sample(CUT_AT);
    expect(f.amount).toBeCloseTo(plan.strength, 10);
    expect(f.dirX).toBe(-1);
    expect(f.length).toBe(plan.length);
    s.end();
    expect(s.active).toBe(false);
    expect(s.sample(CUT_AT).amount).toBe(0);
  });
  it('the streak vector is in the plane\'s own coordinates: flipped on a mirrored plane, scaled by the aspect upward', () => {
    const out = { x: 0, y: 0 };
    figureVector({ dirX: 1, dirY: 0, length: 0.3 }, 1.2, 1.8, 1, out);
    expect(out).toEqual({ x: 0.3, y: 0 });
    figureVector({ dirX: 1, dirY: 0, length: 0.3 }, 1.2, 1.8, -1, out);
    expect(out.x).toBe(-0.3);
    figureVector({ dirX: 0, dirY: 1, length: 0.3 }, 1.2, 1.8, 1, out);
    expect(out.y).toBeCloseTo((0.3 * 1.2) / 1.8, 10);
  });
});

describe('the uniform writer', () => {
  const cells = () => ({ smearAmt: { value: 0 }, smearStyle: { value: 1 }, smearVec: { value: { x: 0, y: 0, set(x: number, y: number) { this.x = x; this.y = y; } } } });
  const plane = (sx: number, sy: number) => ({ mesh: { scale: { x: sx, y: sy } }, material: { uniforms: { smearVec: { value: { x: 0, y: 0, set(x: number, y: number) { this.x = x; this.y = y; } } } } } });
  it('writes the amount and style on the shared cells, a vector per plane, and the shared vector from the showing plane', () => {
    const c = cells();
    const a = plane(1.2, 1.8);
    const b = plane(-1.6, 1.8);
    applySmear({ amount: 0.8, dirX: 1, dirY: 0, style: 'blur', length: 0.16 }, [a, b], c, 1);
    expect(c.smearAmt.value).toBe(0.8);
    expect(c.smearStyle.value).toBe(0);
    expect(a.material.uniforms.smearVec.value.x).toBeCloseTo(0.16, 10);
    expect(b.material.uniforms.smearVec.value.x).toBeCloseTo(-0.16, 10); // mirrored
    expect(c.smearVec.value.x).toBeCloseTo(-0.16, 10); // follows plane 1
  });
  it('amount 0 turns it off and leaves the vectors alone', () => {
    const c = cells();
    const a = plane(1, 1);
    applySmear({ amount: 0.5, dirX: 1, dirY: 0, style: 'paint', length: 0.34 }, [a], c, 0);
    applySmear({ amount: 0, dirX: 1, dirY: 0, style: 'paint', length: 0.34 }, [a], c, 0);
    expect(c.smearAmt.value).toBe(0);
    expect(c.smearStyle.value).toBe(1);
  });
});
