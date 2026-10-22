/**
 * Motion pass, lane "core", step 2 (SMEAR) on the REAL `PaintedActor`: a big pose change on a moving figure is a CUT inside a 2 to 4 frame smear window; the same change at rest, a small change,
 * the switch off, and every chapter but the two demo chapters keep today's blend. Also the way out of a strike, swapped on the `settlePeak` mark, and the victim's hurt swap on the recoil's first frame.
 * Game case: both (shared plumbing; FFX in Chapter I, FFX-2 in Chapter IV only by chapter id). Stepped frame by frame the way the game steps it, at 60, 120 and 240 Hz.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { resetSmearLog, smearLog } from '../../../src/engine/motion/SmearLog.ts';
import { CUT_MS_MAX, CUT_MS_MIN } from '../../../src/engine/motion/SmearPlan.ts';
import { clearMarksSwaps, impactAtApex, settleSwap } from '../../../src/engine/KeyPoses.ts';
import { startAttackMove } from '../../../src/engine/motion/CurveBeats.ts';
import { setDemoMotion } from '../../../src/engine/motion/DemoMotion.ts';
import type { CoarseMask } from '../../../src/engine/PoseAlign.ts';

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
});
afterEach(() => {
  setSmearStyle(null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setDemoMotion(null);
  setPaceGame('other');
  resetSmearLog();
  reset();
});

const N = 48;
const mask = (solid: (col: number, row: number) => boolean): CoarseMask => {
  const bits = new Uint8Array(N * N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) bits[r * N + c] = solid(c, r) ? 1 : 0;
  return { w: N, h: N, bits };
};
const LEFT = mask((c) => c < N / 2);
const RIGHT = mask((c) => c >= N / 2);
const ALL = mask(() => true);

/** Yuna with `idle`, `hurt` and `attack` paintings whose silhouettes are the given masks; she faces +x. */
function yuna(idle: CoarseMask, other: CoarseMask, opts: { name?: string } = {}): Actor {
  const a = new PaintedActor({ name: opts.name ?? 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  a.adoptPoses(
    {
      idle: painting('yuna', 'idle', { silhouette: idle }),
      hurt: painting('yuna', 'hurt', { silhouette: other }),
      attack: painting('yuna', 'attack', { silhouette: other }),
      ko: painting('yuna', 'ko', { silhouette: other }),
    },
    'idle',
  );
  a.position.set(-2, 0, 0);
  return a;
}
const cellsOf = (a: Actor): { smearAmt: { value: number }; smearStyle: { value: number }; smearVec: { value: { x: number; y: number } } } => (a as unknown as { u: ReturnType<typeof cellsOf> }).u;
const flashOf = (a: Actor): number => (a as unknown as { u: { flashAmount: { value: number } } }).u.flashAmount.value;
const vecOf = (a: Actor, i: number): { x: number; y: number } => (slotsOf(a)[i] as unknown as { material: { uniforms: { smearVec: { value: { x: number; y: number } } } } }).material.uniforms.smearVec.value;

/** Start the strike and step `ms` so the figure is moving at about its peak speed. */
function moving(a: Actor, frame = 1000 / 120, ms = 250): void {
  void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
  const n = Math.round(ms / frame);
  for (let i = 0; i < n; i++) a.update(frame / 1000);
}

interface Rec {
  t: number;
  f0: number;
  f1: number;
  amt: number;
  showing: string;
}
/** Ask for `pose` and step `frame` ms until the blend ends: one record per frame (the fades, the smear amount, the pose that dominates). */
function playSwap(a: Actor, pose: string, frame = 1000 / 120): Rec[] {
  const recs: Rec[] = [];
  a.setPose(pose);
  for (let i = 1; i <= 60; i++) {
    a.update(frame / 1000);
    const [p, q] = slotsOf(a);
    recs.push({ t: i * frame, f0: p.fade, f1: q.fade, amt: cellsOf(a).smearAmt.value, showing: p.fade >= q.fade ? p.pose : q.pose });
    if (!a.blending && i > 3) break;
  }
  return recs;
}
const both = (r: Rec[]): number => r.filter((x) => x.f0 > 1e-6 && x.f1 > 1e-6).length;

describe('with the switch off (the default) or outside the demo chapters', () => {
  it('a big change on a moving figure is today\'s blend: no smear, no log, the two paintings share frames', () => {
    setCurvesChapter('seymour-flux'); // a demo chapter, but the style is off
    const a = yuna(LEFT, RIGHT);
    moving(a);
    const r = playSwap(a, 'hurt');
    expect(smearLog()).toHaveLength(0);
    expect(Math.max(...r.map((x) => x.amt))).toBe(0);
    expect(both(r)).toBeGreaterThan(5);
  });
  it('another chapter never smears, whatever the style says', () => {
    setSmearStyle('paint');
    setCurvesChapter('tourist-trap');
    const a = yuna(LEFT, RIGHT);
    moving(a);
    playSwap(a, 'hurt');
    expect(smearLog()).toHaveLength(0);
  });
  it('no chapter named (a unit test, the title screen) never smears', () => {
    setSmearStyle('blur');
    const a = yuna(LEFT, RIGHT);
    moving(a);
    playSwap(a, 'hurt');
    expect(smearLog()).toHaveLength(0);
  });
});

describe('a big change on a moving figure, in a demo chapter, with the smear on', () => {
  for (const hz of [60, 120, 240]) {
    it(`is a cut inside a window of a few frames at ${hz} Hz: one flip, no frame with both paintings, the old painting streaked and the new one arriving streaked`, () => {
      setSmearStyle('paint');
      setCurvesChapter('seymour-flux');
      const frame = 1000 / hz;
      const a = yuna(LEFT, RIGHT);
      moving(a, frame);
      const r = playSwap(a, 'attack', frame);
      expect(both(r)).toBe(0);
      const flips = r.filter((x, i) => i > 0 && x.showing !== r[i - 1]!.showing).length;
      expect(flips).toBe(1);
      const cut = r.findIndex((x, i) => i > 0 && x.showing !== r[i - 1]!.showing);
      expect(r[cut - 1]!.amt).toBeGreaterThan(0.3); // the old painting leaves streaked
      expect(r[cut]!.amt).toBeGreaterThan(0.2); // the new one arrives streaked
      expect(r.at(-1)!.amt).toBe(0);
      expect(Math.max(r.at(-1)!.f0, r.at(-1)!.f1)).toBe(1);
      const log = smearLog();
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({ actor: 'yuna', from: 'idle', to: 'attack', style: 'paint', kind: 'plane' });
      expect(log[0]!.cutMs).toBeGreaterThanOrEqual(CUT_MS_MIN);
      expect(log[0]!.cutMs).toBeLessThanOrEqual(Math.max(CUT_MS_MAX, 2.25 * frame + 1));
      const windowMs = r.length * frame;
      expect(windowMs).toBeLessThanOrEqual(log[0]!.cutMs + 2 * frame);
    });
  }

  it('the cut falls at the same time at any frame rate (the window is the blend, on the real clock)', () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    const at: number[] = [];
    for (const hz of [120, 240]) {
      resetSmearLog();
      const a = yuna(LEFT, RIGHT);
      moving(a, 1000 / hz);
      const r = playSwap(a, 'attack', 1000 / hz);
      at.push(r.findIndex((x, i) => i > 0 && x.showing !== r[i - 1]!.showing) * (1000 / hz));
    }
    expect(Math.abs(at[0]! - at[1]!)).toBeLessThanOrEqual(1000 / 120 + 0.5);
  });

  it('both styles write the shader\'s cells: the style, the amount and a streak along the travel (flipped on a mirrored plane)', () => {
    setCurvesChapter('ffx2-bahamut');
    for (const [style, v] of [['paint', 1], ['blur', 0]] as const) {
      setSmearStyle(style);
      resetSmearLog();
      const a = yuna(LEFT, RIGHT);
      moving(a);
      a.setPose('attack');
      a.update(1 / 120);
      expect(cellsOf(a).smearStyle.value).toBe(v);
      expect(cellsOf(a).smearAmt.value).toBeGreaterThan(0);
      const vx = vecOf(a, 0).x + vecOf(a, 1).x;
      expect(Math.abs(vx)).toBeGreaterThan(0.05); // along the stage
      expect(smearLog()[0]!.style).toBe(style);
    }
  });

  it('the cut carries the light flash into an attack painting, not into hurt, and not under REDUCE FLASHES', () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    let a = yuna(LEFT, RIGHT);
    moving(a);
    a.setPose('attack');
    a.update(1 / 120);
    expect(flashOf(a)).toBeGreaterThan(0.1);
    expect(flashOf(a)).toBeLessThanOrEqual(0.3);
    a = yuna(LEFT, RIGHT);
    moving(a);
    a.setPose('hurt');
    a.update(1 / 120);
    expect(smearLog().at(-1)!.to).toBe('hurt');
    expect(flashOf(a)).toBe(0);
    a = yuna(LEFT, RIGHT);
    a.softFlash = () => true;
    moving(a);
    a.setPose('attack');
    a.update(1 / 120);
    expect(smearLog().at(-1)!.to).toBe('attack'); // the cut still happens...
    expect(flashOf(a)).toBe(0); // ...without the flash
  });

  it('the flash does not stack on a flash already running (the struck figure\'s hit flash)', () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    const a = yuna(LEFT, RIGHT);
    moving(a);
    a.flash(0xffffff, 80, 0.9);
    const before = flashOf(a);
    a.setPose('attack');
    expect(flashOf(a)).toBe(before);
  });

  it('is a cut for a hurt swap on the victim\'s first recoil frame, which the recoil hints', () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    const a = yuna(LEFT, RIGHT); // at rest: only the hint says she is about to move
    for (let i = 0; i < 12; i++) a.update(1 / 120);
    void a.recoil(360, 0.22);
    for (let i = 0; i < 40; i++) a.update(1 / 120);
    const e = smearLog().find((x) => x.to === 'hurt')!;
    expect(e).toBeDefined();
    expect(e.speed).toBeGreaterThan(1);
    expect(e.flash).toBe(false);
  });
});

describe('the strike marks are the fast frames: the smear fires on travelPeak and on settlePeak', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    for (const [label, height, hz] of [['a party figure', 1.82, 120], ['a party figure', 1.82, 60], ['a boss', 4.1, 120]] as const) {
      it(`${game}, ${label}, ${hz} Hz: ready to attack on travelPeak and attack to idle on settlePeak are both planned cuts`, async () => {
        setSmearStyle('paint');
        setCurvesChapter(game === 'ffx' ? 'seymour-flux' : 'ffx2-bahamut');
        setCurvesMode('new');
        const a = new PaintedActor({ name: 'yuna', worldHeight: height, side: height > 3 ? 'enemy' : 'party', breathe: false, sway: false, shadow: false });
        a.adoptPoses({ idle: painting('yuna', 'idle', { silhouette: LEFT }), attack: painting('yuna', 'attack', { silhouette: RIGHT }), hurt: painting('yuna', 'hurt', { silhouette: RIGHT }) }, 'idle');
        a.position.set(-2, 0, 0);
        const frame = 1000 / hz;
        const at: Record<string, number> = {};
        let t = 0;
        void a.strike({
          distance: 1.4,
          game,
          timeScale: 1,
          arc: true,
          contact: { hold: Promise.resolve(), reached: () => (at['contact'] = t) },
          marks: { travelPeak: () => { at['travelPeak'] = t; a.setPose('attack'); }, settlePeak: () => { at['settlePeak'] = t; a.setPose('idle'); } },
        });
        for (let i = 0; i < Math.round(1800 / frame); i++) {
          a.update(frame / 1000);
          t = (i + 1) * frame;
          await Promise.resolve(); // the contact's hold is a promise: the release runs between frames
          await Promise.resolve();
        }
        const log = smearLog();
        expect(log.map((e) => `${e.from}>${e.to}`)).toEqual(['idle>attack', 'attack>idle']);
        expect(log[0]!.speed).toBeGreaterThan(0.9); // well over the 0.45 gate (a boss is 4.1 tall, so its body heights a second are fewer)
        expect(log[1]!.speed).toBeGreaterThan(0.9);
        expect(at['settlePeak']! - at['contact']!).toBeGreaterThan(200); // after the 0.2 s hold
      });
    }
  }
});

describe('what stays a plain blend', () => {
  it('the same big change at rest', () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    const a = yuna(LEFT, RIGHT);
    for (let i = 0; i < 60; i++) a.update(1 / 120);
    const r = playSwap(a, 'attack');
    expect(smearLog()).toHaveLength(0);
    expect(both(r)).toBeGreaterThan(5);
  });
  it('a small change on a moving figure (the paintings share their outline)', () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    const a = yuna(ALL, ALL);
    moving(a);
    const r = playSwap(a, 'attack');
    expect(smearLog()).toHaveLength(0);
    expect(Math.max(...r.map((x) => x.amt))).toBe(0);
  });
  it('a knock-out (its own cut, step 3)', () => {
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    const a = yuna(LEFT, RIGHT);
    moving(a);
    a.setPose('ko');
    for (let i = 0; i < 30; i++) a.update(1 / 120);
    expect(smearLog().filter((x) => x.to === 'ko')).toHaveLength(0);
  });
  it('the demo blend (?motion=demo) still runs when the planner says no', () => {
    setDemoMotion(true);
    setSmearStyle('paint');
    setCurvesChapter('seymour-flux');
    const a = yuna(ALL, ALL);
    moving(a);
    const r = playSwap(a, 'attack');
    expect(smearLog()).toHaveLength(0);
    expect(r.length * (1000 / 120)).toBeGreaterThan(100); // 120 to 160 ms, not a cut
  });
});

describe('the way out of a strike is swapped on the settlePeak mark', () => {
  const poses: string[] = [];
  const ctx = (over: Record<string, unknown> = {}): never =>
    ({ actingId: 'tidus', moments: { reducedMotion: false }, stage: { actor: () => ({ setPose: (p: string) => poses.push(p) }), paints: (_id: string, p: string) => p === 'follow' || p === 'ready' }, ...over }) as never;
  it('with the new curves on, the impact painting is held through the blow and goes to the follow-through on the mark; the blow no longer swaps it', async () => {
    setCurvesMode('new');
    setCurvesChapter('seymour-flux');
    poses.length = 0;
    const c = ctx();
    const contact = impactAtApex(c, 'tidus' as never, { hold: Promise.resolve(), reached: () => poses.push('reached') });
    expect(typeof contact.settle).toBe('function');
    const { followThrough } = await import('../../../src/engine/KeyPoses.ts');
    expect(followThrough(c, 'tidus' as never)).toBe(0); // the blow puts nothing up
    expect(poses).toEqual([]);
    const plans: Array<Record<string, unknown>> = [];
    startAttackMove({ speed: () => 'normal', deps: {} } as never, { strike: (p: Record<string, unknown>) => (plans.push(p), Promise.resolve()) } as never, { distance: 1.4, house: 1.4 }, contact, false);
    const marks = plans[0]!['marks'] as { travelPeak: () => void; settlePeak: () => void };
    marks.travelPeak();
    marks.settlePeak();
    expect(poses).toEqual(['attack', 'follow']);
  });
  it('a figure with no follow-through painting goes to the idle there; one whose action ended, or whose move has its own key painting, is left alone', () => {
    setCurvesMode('new');
    setCurvesChapter('seymour-flux');
    poses.length = 0;
    settleSwap(ctx({ stage: { actor: () => ({ setPose: (p: string) => poses.push(p) }), paints: () => false } }), 'tidus' as never);
    expect(poses).toEqual(['idle']);
    poses.length = 0;
    settleSwap(ctx({ actingId: null }), 'tidus' as never);
    expect(poses).toEqual([]);
  });
  it('actionEnd clears the pending marks, so the next attack\'s blow is today\'s', async () => {
    setCurvesMode('new');
    setCurvesChapter('seymour-flux');
    const { followThrough } = await import('../../../src/engine/KeyPoses.ts');
    poses.length = 0;
    const c = ctx();
    impactAtApex(c, 'tidus' as never, { hold: Promise.resolve(), reached: () => {} });
    clearMarksSwaps(c);
    expect(followThrough(c, 'tidus' as never)).toBe(180);
    expect(poses).toEqual(['follow']);
  });
  it('with the new curves off, nothing changes: the apex puts the impact painting up and the blow the follow-through', async () => {
    setCurvesChapter('seymour-flux');
    poses.length = 0;
    const c = ctx();
    const contact = impactAtApex(c, 'tidus' as never, { hold: Promise.resolve(), reached: () => {} });
    expect(contact.settle).toBeUndefined();
    contact.reached();
    expect(poses).toEqual(['attack']);
    const { followThrough } = await import('../../../src/engine/KeyPoses.ts');
    expect(followThrough(c, 'tidus' as never)).toBe(180);
  });
});
