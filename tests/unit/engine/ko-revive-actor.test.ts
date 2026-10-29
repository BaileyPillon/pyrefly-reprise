/**
 * FA-3 (visual-and-feel pass, 2026-10-10; PR-0378; both games): the revive mirrors the fall, on the REAL `PaintedActor` under the REAL `LivingFigure`.
 *
 * A body lies in its KO painting. The revive asks for `idle`: the lying painting crosses to the standing one, which is already toppled where the body
 * lay (the same capped cross, under a smaller puff), then stands up from the floor pivot over 320 ms. 395 ms in all, inside `TIMING.revive` (520), so
 * the presenter's wait and the menu behind it are exactly what they were. Read through the continuity harness's own maths like the fall
 * (`ko-fall-fixture.ts`). The clock is `ko-fall.test.ts`, the geometry `ko-tip.test.ts`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setMoveWord } from '../../../src/engine/motion/MoveSwitch.ts';
import { reset } from './head-lock-fixture.ts';
import { CFG, FRAME, analyzeSwap, anchors, fall, index, lying, revive, rig, slots } from './ko-fall-fixture.ts';
import { detectJerks, figureTrack } from '../../../critic/runner/lib/continuity-pure.mjs';
import { KO_CROSS_PEAK } from '../../../src/engine/PoseBlend.ts';
import { TIMING } from '../../../src/engine/BattlePresenterEvents.ts';
import { REVIVE_MS } from '../../../src/engine/KoFall.ts';
import { TOPPLE_RAD } from '../../../src/engine/KoTip.ts';

// This file's timeline is release 67's (the topple's 14-frame hold, the revive's 395 ms): every test here names `today`, so it keeps guarding that look whichever way `?kotopple`'s default is set
// (release 68 held MF-17 at `today`: the adversarial review's F1, Kimahri's eased fall fails CHK-027 in the harness's maths).
// The eased arm under the same harness maths is `m3-ko-eased-harness.test.ts`; its own timeline is `mf17-ko-eased.test.ts`.
beforeEach(() => setMoveWord('kotopple', 'today'));
afterEach(() => {
  reset();
  setMoveWord('kotopple', null);
});

/** A figure that has fallen and lies there (the fall played through), ready to be revived. */
function downed(subject: string, over: Parameters<typeof rig>[1] = {}): ReturnType<typeof rig> {
  const r = rig(subject, over);
  fall(r, 40);
  return r;
}

const idle = (r: ReturnType<typeof rig>) => slots(r.a).find((s) => s.pose === 'idle')!;

describe('the revive: the lying body crosses to the toppled figure, which stands up', () => {
  for (const [subject, side] of [['tidus', 1], ['yuna', -1]] as const) {
    it(`${subject}: the standing plane starts toppled to the ${side > 0 ? 'right' : 'left'} where the body lay, is upright within ${REVIVE_MS} ms, and the whole thing ends inside TIMING.revive`, () => {
      const r = downed(subject);
      expect(Math.abs(lying(r.a).fade - 1)).toBe(0);
      const rows: number[] = [];
      const fades: Array<[number, number]> = [];
      r.a.setPose('idle');
      expect(r.living.last.rises).toBe(1);
      for (let i = 0; i < 40; i++) {
        r.frame();
        rows.push(idle(r).mesh.rotation.z);
        fades.push([lying(r.a).fade, idle(r).fade]);
      }
      // it begins toppled (the cross runs on the capped curve), then rises
      expect(Math.sign(rows[0]!)).toBe(-side);
      expect(Math.abs(rows[0]!)).toBeGreaterThan(0.9 * TOPPLE_RAD); // toppled where the body lay, a first frame into getting up
      expect(Math.abs(rows[0]!)).toBeLessThanOrEqual(TOPPLE_RAD + 1e-12);
      for (const [from, to] of fades.slice(0, 4)) expect(Math.min(from, to)).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-9);
      // the rise: the rotation only comes back, never past upright
      const sign = -side;
      for (let i = 1; i < rows.length; i++) expect(rows[i]! * sign, `frame ${i}`).toBeLessThanOrEqual(rows[i - 1]! * sign + 1e-12);
      // upright (and the lying painting gone) by 395 ms and one frame
      const upright = rows.findIndex((z) => Math.abs(z) < 1e-12);
      expect(upright * FRAME).toBeGreaterThanOrEqual(REVIVE_MS - FRAME);
      expect(upright * FRAME).toBeLessThan(REVIVE_MS + 2 * FRAME);
      expect(upright * FRAME).toBeLessThan(TIMING.revive);
      expect(fades.at(-1)).toEqual([0, 1]);
    });

    it(`${subject}: read by the harness, the swap from the lying painting to the standing one is no snap, has blend frames, is no ghost over the limit, and no tracked step is 40 px`, () => {
      const r = downed(subject);
      const frames = revive(r, 40).map((fig, n) => ({ n, t: n * FRAME, fig }));
      const an = anchors(r.a);
      const k0 = index(r.a, lying(r.a));
      const k1 = index(r.a, idle(r));
      const at = frames.findIndex((f) => f.fig.s[k1]![1]! >= 0.5);
      expect(at).toBeGreaterThan(0);
      const swap = analyzeSwap({ frames, at, swap: { from: k0, to: k1 }, anchors: an as never, k1600: 1, camCut: false, cfg: CFG });
      expect(swap.snap).toBe(false);
      expect(swap.hardCut).toBe(false);
      expect(swap.blendFrames).toBeGreaterThanOrEqual(2);
      expect(swap.ghost.peak).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-3);
      expect(swap.ghost.severity).toBeLessThan(CFG.motion.ghostSeverityFail);
      expect(swap.failHead).toBe(false);
      const track = frames.map((f) => {
        const t = figureTrack(f.fig, an as never);
        return { n: f.n, t: f.t, feet: t?.feet ?? null, head: t?.head ?? null, cam: [0, 0] as [number, number] };
      });
      expect(detectJerks(track, 1, CFG)).toEqual([]);
      let worst = 0;
      for (let i = 1; i < track.length; i++) for (const part of ['feet', 'head'] as const) {
        const a = track[i - 1]![part];
        const b = track[i]![part];
        if (a && b) worst = Math.max(worst, Math.hypot(b[0] - a[0], b[1] - a[1]));
      }
      expect(worst, `${subject} the biggest single step of the tracked feet or head`).toBeLessThan(CFG.motion.jerkFailPx);
    });
  }

  it('the dust puff is the small one, goes up as the revive begins and is gone within half a second', () => {
    const widest = (r: ReturnType<typeof rig>): number => {
      const g = r.a.children.find((c) => c.name === 'ko-puff');
      if (!g) return 0;
      return Math.max(0, ...(g.children as unknown as Array<{ visible: boolean; scale: { x: number } }>).filter((q) => q.visible).map((q) => q.scale.x));
    };
    // the fall's own puff: how big it gets
    const f = rig('tidus');
    f.a.setPose('ko');
    let fallMost = 0;
    for (let i = 0; i < 60; i++) {
      f.frame();
      fallMost = Math.max(fallMost, widest(f));
    }
    expect(fallMost).toBeGreaterThan(0);
    // the revive's
    const r = downed('tidus');
    for (let i = 0; i < 40; i++) r.frame(); // the fall's puff is long gone
    expect(widest(r)).toBe(0);
    r.a.setPose('idle');
    r.frame();
    expect(widest(r)).toBeGreaterThan(0); // up at once
    let most = 0;
    for (let i = 0; i < 60; i++) {
      r.frame();
      most = Math.max(most, widest(r));
      if (i > 40) expect(widest(r), `frame ${i}`).toBe(0);
    }
    expect(most).toBeGreaterThan(0);
    expect(most).toBeLessThan(fallMost); // 0.6 of the fall's
    expect(most).toBeGreaterThan(0.4 * fallMost);
  });

  it('a hit-stop holds the rise (field clock) and lets the cross run on (real clock)', () => {
    const r = downed('tidus');
    r.a.setPose('idle');
    for (let i = 0; i < 6; i++) r.frame(true); // the field frozen through the whole cross
    expect(Math.abs(lying(r.a).fade)).toBe(0); // the cross finished on the real clock
    const z = idle(r).mesh.rotation.z;
    for (let i = 0; i < 5; i++) {
      r.frame(true);
      expect(idle(r).mesh.rotation.z).toBe(z); // the rise waits
    }
    for (let i = 0; i < 4; i++) r.frame();
    expect(Math.abs(idle(r).mesh.rotation.z)).toBeLessThan(Math.abs(z));
  });
});

describe('what does not travel', () => {
  it('REDUCE MOTION revives as it did before FA-3 (the page never asked about it): the actor\'s own blend, no run of ours, nothing turns, no dust', () => {
    const r = downed('tidus', { rm: true });
    r.a.setPose('idle');
    expect(r.living.last).toMatchObject({ rises: 0, crosses: 0 }); // no run of ours: the fall under REDUCE MOTION was a cut, so no cross has played either
    expect(r.a.blending, 'the actor\'s own blend is the one that runs').toBe(true);
    for (let i = 0; i < 24; i++) {
      r.frame();
      expect(Math.abs(idle(r).mesh.rotation.z), `frame ${i}`).toBe(0);
      expect(r.living.last.buckle).toBe(0);
    }
    expect(r.a.blending).toBe(false);
    expect(Math.abs(lying(r.a).fade)).toBe(0);
    expect(idle(r).fade).toBe(1);
    expect(r.a.children.find((c) => c.name === 'ko-puff')).toBeUndefined();
  });

  it('REDUCE MOTION revive is byte-for-byte the revive of ?kofall=off (the actor\'s own blend, the fades frame by frame)', () => {
    const run = (off: boolean): number[][] => {
      const was = Object.getOwnPropertyDescriptor(globalThis, 'location');
      if (off) Object.defineProperty(globalThis, 'location', { value: { search: '?kofall=off' }, configurable: true });
      try {
        const r = downed('tidus', { rm: true });
        r.a.setPose('idle');
        const rows: number[][] = [];
        for (let i = 0; i < 24; i++) {
          r.frame();
          rows.push([lying(r.a).fade, idle(r).fade]);
        }
        return rows;
      } finally {
        if (was) Object.defineProperty(globalThis, 'location', was);
        else delete (globalThis as { location?: unknown }).location;
      }
    };
    expect(run(false)).toEqual(run(true));
  });

  it('a foe that is revived (or a figure that never topples) crosses without travel: the same cross, no turn, no dust', () => {
    const r = rig('anima', {}, 'enemy');
    r.a.setPose('ko');
    for (let i = 0; i < 40; i++) r.frame();
    expect(r.living.last.topples).toBe(0);
    r.a.setPose('idle');
    const fades: Array<[number, number]> = [];
    for (let i = 0; i < 12; i++) {
      r.frame();
      const s = slots(r.a);
      const k = s.find((x) => x.pose === 'ko')!;
      const n = s.find((x) => x.pose === 'idle')!;
      fades.push([k.fade, n.fade]);
      expect(Math.abs(n.mesh.rotation.z)).toBe(0);
    }
    for (const [a, b] of fades) expect(Math.min(a, b)).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-9);
    expect(fades.at(-1)).toEqual([0, 1]);
    expect(r.a.children.find((c) => c.name === 'ko-puff')).toBeUndefined();
  });

  it('a pose a body on the ground ignores starts nothing, and a figure that is not down is not revived', () => {
    const r = downed('tidus');
    r.a.setPose('hurt'); // a hit landing on someone already down: the actor ignores it
    for (let i = 0; i < 6; i++) r.frame();
    expect(r.living.last.rises).toBe(0);
    expect(lying(r.a).fade).toBe(1);
    const up = rig('tidus');
    up.a.setPose('hurt'); // a hit on a standing figure is no revive
    expect(up.living.last.rises).toBe(0);
  });

  it('?kofall=off revives as before: the actor\'s own blend', () => {
    const r = downed('tidus');
    const was = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', { value: { search: '?kofall=off' }, configurable: true });
    try {
      r.a.setPose('idle');
      expect(r.living.last.rises).toBe(0);
      expect(r.a.blending).toBe(true);
    } finally {
      if (was) Object.defineProperty(globalThis, 'location', was);
      else delete (globalThis as { location?: unknown }).location;
    }
  });

  it('a revive during the fall finishes the fall first (the body is down, then it rises): no half-mix is left and nothing stays tipped', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {}); // the head lock says so once when the steep test camera asks a toppled idle for x1.101
    const r = rig('tidus');
    r.a.setPose('ko');
    for (let i = 0; i < 5; i++) r.frame(); // mid-buckle: the figure is down in the engine's mind, still standing on screen
    r.a.setPose('idle');
    for (let i = 0; i < 60; i++) r.frame();
    expect(idle(r).fade).toBe(1);
    expect(Math.abs(idle(r).mesh.rotation.z)).toBe(0);
    expect(Object.values(slots(r.a)).reduce((sum, x) => sum + x.fade, 0)).toBe(1); // one painting, nothing half-mixed
    expect(r.a.fallGain).toBe(1);
  });

  it('a new KO right after a revive reads the standing plane as it is: the fall plays again', () => {
    const r = downed('tidus');
    r.a.setPose('idle');
    for (let i = 0; i < 30; i++) r.frame(); // up
    r.a.setPose('hurt');
    for (let i = 0; i < 10; i++) r.frame();
    r.a.setPose('ko');
    expect(r.living.last.topples).toBe(2);
    for (let i = 0; i < 40; i++) r.frame();
    expect(lying(r.a).fade).toBe(1);
  });
});
