/**
 * FA-2, option B of the Motion Options page (P1-B; PR-0378; both games): the topple, the cross and the dust puff on the REAL `PaintedActor`, under the
 * REAL `LivingFigure` and the head lock, read the way the continuity harness reads it.
 *
 * Tidus (his KO painting has the head on the right) and Yuna (on the left) stand in their `hurt` painting, the way a figure is when the last blow lands,
 * and are knocked out. Every frame the two planes' fades and projected corners go through the harness's own maths (`critic/runner/lib/continuity-pure.mjs`:
 * `analyzeSwap`, `figureTrack`, `detectJerks`) with the policy's own thresholds. The masks are synthetic (a standing bar and a lying bar: the approved
 * paintings are not in a worktree), at an overlap far below the worst real one, so a pass here is not easier than a pass on the paintings. The pure
 * geometry is `ko-tip.test.ts`, the clock `ko-fall.test.ts`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { reset } from './head-lock-fixture.ts';
import { CFG, FRAME, analyzeSwap, anchors, fall, headX, index, lying, middleX, rig, slots, standing, corners, type Rig } from './ko-fall-fixture.ts';
import { detectJerks, feetPoint, figureTrack, headSizePx, unitSquareToQuad } from '../../../critic/runner/lib/continuity-pure.mjs';
import { KO_CROSS_PEAK } from '../../../src/engine/PoseBlend.ts';
import { TOPPLE_RAD } from '../../../src/engine/KoTip.ts';
import type { Actor } from './head-lock-fixture.ts';

afterEach(reset);

describe('the topple: Tidus falls to the right and Yuna to the left, the side their KO paintings\' heads lie on', () => {
  for (const [subject, side] of [['tidus', 1], ['yuna', -1]] as const) {
    it(`${subject}: the standing plane turns ${side > 0 ? 'clockwise' : 'counter-clockwise'} to ${(TOPPLE_RAD * 180) / Math.PI} degrees over the buckle, its head ends on the same side of its feet as the lying painting's, and the buckle leans the same way`, () => {
      const r = rig(subject);
      const rows: number[] = [];
      let lean = 0;
      let sHead = Number.NaN;
      let kHead = Number.NaN;
      r.a.setPose('ko');
      for (let i = 0; i < 20; i++) {
        r.frame();
        rows.push(standing(r.a).mesh.rotation.z);
        if (i === 12) lean = (standing(r.a).material.uniforms['mlA']!.value as { z: number }).z;
        if (i === 14) {
          // the cross has begun: the standing plane is fully toppled and still showing
          sHead = headX(r, standing(r.a));
          kHead = headX(r, lying(r.a));
        }
      }
      // quadIn: it only turns further, one way, to 80 degrees at the end of the hold (frame 14), then holds through the cross
      const sign = -side;
      for (let i = 1; i < 14; i++) expect(rows[i]! * sign, `frame ${i}`).toBeGreaterThanOrEqual(rows[i - 1]! * sign - 1e-12);
      expect(rows[13]!).toBeCloseTo(-side * TOPPLE_RAD, 6);
      expect(rows[14]!).toBeCloseTo(-side * TOPPLE_RAD, 6); // the cross has begun: the plane stays toppled while it fades
      // the head, at the end of the hold, is on the side of the feet the lying painting's head is
      const kMid = middleX(r, lying(r.a));
      expect(Math.sign(kHead - kMid), 'the lying head is on the fall side of its own painting').toBe(side);
      expect(Math.sign(sHead - kMid), 'the toppled head is on the same side').toBe(side);
      // the shader's buckle leans toward the fall
      expect(lean).toBe(side);
    });
  }
});

describe('the cross under the topple, read by the continuity harness', () => {
  for (const subject of ['tidus', 'yuna']) {
    it(`${subject}: no snap, blend frames, ghost severity under the check's limit, the head held, no jerk of 40 px (CHK-026, CHK-027)`, () => {
      const r = rig(subject);
      const frames = fall(r, 40).map((fig, n) => ({ n, t: n * FRAME, fig }));
      const an = anchors(r.a);
      const k0 = index(r.a, standing(r.a));
      const k1 = index(r.a, lying(r.a));
      const at = frames.findIndex((f) => f.fig.s[k1]![1]! >= 0.5);
      expect(at).toBeGreaterThan(14);
      const swap = analyzeSwap({ frames, at, swap: { from: k0, to: k1 }, anchors: an as never, k1600: 1, camCut: false, cfg: CFG });
      expect(swap.snap).toBe(false);
      expect(swap.hardCut).toBe(false);
      expect(swap.blendFrames).toBeGreaterThanOrEqual(2);
      expect(swap.ghost.peak).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-3);
      expect(swap.ghost.severity).toBeLessThan(CFG.motion.ghostSeverityFail);
      // CHK-026: the head, through the two planes of one frame, within the check's tolerance (the toppled plane is turned, not resized)
      expect(swap.head, subject).not.toBeNull();
      expect(Math.abs(swap.head!.ratio! - 1) * 100, `${subject} head ratio ${swap.head!.ratio}`).toBeLessThan(CFG.size.headTolerancePct);
      expect(swap.failHead).toBe(false);
      // CHK-027: the figure's tracked feet and head step by 40 px or more nowhere in the fall
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

  it('the head stays as big on screen as the idle\'s all through the turn, within 1.5 percent in every frame (measured 1.1; the check\'s tolerance is 3): the plane is turned, never scaled, and the head lock follows the turn', () => {
    for (const subject of ['tidus', 'yuna']) {
      const r = rig(subject);
      const ref = slots(r.a).find((s) => s.pose === 'hurt')!;
      const head = ref.meta.head!;
      const px = (): number => headSizePx(unitSquareToQuad(corners(r.cam, standing(r.a).mesh.matrixWorld)), { u0: head[0], t0: head[1], u1: head[2], t1: head[3] });
      const before = px();
      r.a.setPose('ko');
      let worst = 0;
      for (let i = 0; i < 15; i++) {
        r.frame();
        worst = Math.max(worst, Math.abs(px() / before - 1));
      }
      expect(worst, subject).toBeLessThan(0.015);
    }
  });
});

describe('where the feet go', () => {
  it('the standing figure\'s feet slide by at most 24 px a frame at 1600 wide, in either game\'s tempo (the buckle is 220 ms in FFX and 170 ms in FFX-2)', () => {
    for (const game of ['ffx', 'ffx2'] as const) for (const subject of ['tidus', 'yuna']) {
      const r = rig(subject, { game });
      const an = anchors(r.a);
      const k0 = index(r.a, standing(r.a));
      const feet = (): number[] => {
        const f = feetPoint(unitSquareToQuad(corners(r.cam, standing(r.a).mesh.matrixWorld)), (an[k0] as { stance: { u: number; t: number } }).stance);
        return f as number[];
      };
      const first = feet();
      let prev = first;
      let worst = 0;
      r.a.setPose('ko');
      for (let i = 0; i < 16; i++) {
        r.frame();
        if (standing(r.a).fade <= 0.001) break; // gone: it is put upright again, unseen
        const f = feet();
        worst = Math.max(worst, Math.hypot(f[0]! - prev[0]!, f[1]! - prev[1]!));
        prev = f;
      }
      expect(worst, `${game} ${subject}`).toBeLessThanOrEqual(24);
      expect(Math.hypot(prev[0]! - first[0]!, prev[1]! - first[1]!), `${game} ${subject}: the feet did travel`).toBeGreaterThan(20);
    }
  });
});

describe('what is left behind, and what is not played', () => {
  it('after the run the standing plane is upright and untipped, the KO painting is alone, and the figure\'s own fall tilt is switched off until it is up again', () => {
    const r = rig('tidus');
    fall(r, 40);
    const s = standing(r.a);
    expect(s.fade).toBe(0);
    expect(Math.abs(s.mesh.rotation.z)).toBe(0);
    expect(lying(r.a).fade).toBe(1);
    expect(r.a.fallGain).toBe(0); // the topple was the turn; the tilt would double it
    r.a.setPose('idle', { immediate: true, force: true });
    expect(r.a.fallGain).toBe(1);
  });

  it('the fall\'s own tilt is off for the whole topple: the turn is the rotation, and the old KO\'s extra 0.3 radian forward would add to it', () => {
    const tilt = (r: Rig): number => (r.a as unknown as { inner: { rotation: { z: number } } }).inner.rotation.z;
    const topple = rig('tidus');
    topple.a.setPose('ko');
    const was = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', { value: { search: '?kofall=off' }, configurable: true });
    let old: Rig;
    try {
      old = rig('tidus');
      old.a.setPose('ko');
    } finally {
      if (was) Object.defineProperty(globalThis, 'location', was);
      else delete (globalThis as { location?: unknown }).location;
    }
    let most = 0;
    for (let i = 0; i < 12; i++) {
      topple.frame();
      old.frame();
      most = Math.max(most, Math.abs(tilt(old)) - Math.abs(tilt(topple)));
    }
    expect(topple.a.fallGain).toBe(0);
    expect(old.a.fallGain).toBe(1);
    expect(most, 'the old KO tipped the group more than the topple does').toBeGreaterThan(0.05);
  });

  it('REDUCE MOTION turns and slides nothing: the plane never rotates, the buckle never plays, no dust goes up', () => {
    const r = rig('tidus', { rm: true });
    r.a.setPose('ko');
    for (let i = 0; i < 24; i++) {
      r.frame();
      expect(Math.abs(standing(r.a).mesh.rotation.z), `frame ${i}`).toBe(0);
      expect(r.living.last.buckle).toBe(0);
    }
    expect(r.a.children.find((c) => c.name === 'ko-puff')).toBeUndefined();
    expect(r.living.last).toMatchObject({ topples: 0, crosses: 1, collapses: 0 });
  });

  it('a hit-stop holds the topple where it is (the field clock) and lets the cross run on (the real one)', () => {
    const r = rig('tidus');
    r.a.setPose('ko');
    for (let i = 0; i < 6; i++) r.frame();
    const z = standing(r.a).mesh.rotation.z;
    for (let i = 0; i < 4; i++) {
      r.frame(true);
      expect(standing(r.a).mesh.rotation.z).toBe(z);
    }
    for (let i = 0; i < 8; i++) r.frame();
    expect(Math.abs(standing(r.a).mesh.rotation.z)).toBeGreaterThan(Math.abs(z));
    // the cross: field frozen from the end of the hold, it still finishes
    const q = rig('tidus');
    q.a.setPose('ko');
    for (let i = 0; i < 14; i++) q.frame();
    for (let i = 0; i < 8; i++) q.frame(true);
    expect(lying(q.a).fade).toBe(1);
  });

  it('?kofall=off plays the old KO: the buckle and a cut, no turn, no dust', () => {
    const was = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', { value: { search: '?kofall=off' }, configurable: true });
    try {
      const r = rig('tidus');
      r.a.setPose('ko');
      for (let i = 0; i < 24; i++) {
        r.frame();
        expect(Math.abs(standing(r.a).mesh.rotation.z)).toBe(0);
      }
      expect(r.living.last).toMatchObject({ topples: 0, crosses: 0, collapses: 1 });
      expect(r.a.children.find((c) => c.name === 'ko-puff')).toBeUndefined();
    } finally {
      if (was) Object.defineProperty(globalThis, 'location', was);
      else delete (globalThis as { location?: unknown }).location;
    }
  });
});

describe('the dust puff', () => {
  const puff = (a: Actor): { visible: number; opacity: number } => {
    const g = a.children.find((c) => c.name === 'ko-puff');
    if (!g) return { visible: -1, opacity: 0 };
    const quads = g.children as unknown as Array<{ visible: boolean; material: { opacity: number } }>;
    return { visible: quads.filter((q) => q.visible).length, opacity: Math.max(0, ...quads.filter((q) => q.visible).map((q) => q.material.opacity)) };
  };

  it('goes up as the cross begins, not before, is six soft discs over the floor and is gone within half a second; the figure keeps nothing of it', () => {
    const r = rig('tidus');
    r.a.setPose('ko');
    for (let i = 0; i < 12; i++) {
      r.frame();
      expect(puff(r.a).visible, `frame ${i}`).toBe(-1); // nothing before the body is down
    }
    let first = -1;
    let most = 0;
    for (let i = 12; i < 80; i++) {
      r.frame();
      const p = puff(r.a);
      if (first < 0 && p.visible > 0) first = i;
      most = Math.max(most, p.visible);
      if (i > 60) expect(p.visible, `frame ${i}`).toBe(0);
    }
    expect(first).toBeGreaterThanOrEqual(12);
    expect(first).toBeLessThanOrEqual(15);
    expect(most).toBeGreaterThanOrEqual(4);
    // it sits where the body lies, in front of the planes, over the floor
    const g = r.a.children.find((c) => c.name === 'ko-puff')!;
    for (const q of g.children) {
      expect(q.position.y).toBeGreaterThanOrEqual(0);
      expect(q.position.z).toBeGreaterThan(0);
    }
    r.living.detach();
    expect(r.a.children.find((c) => c.name === 'ko-puff')).toBeUndefined();
  });
});
