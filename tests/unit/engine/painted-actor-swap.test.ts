/**
 * W5 (pose motion, 2026-10-17; both games): the REAL `PaintedActor` under the switches of `PoseSwap.ts` (`PoseAlign.ts`).
 *
 * Tidus is built as the stage builds him (the party faces +x, every pose a real record's painting with its real registration, heads included) and each painting is
 * given a stand-in silhouette: a body box under its registered head (what the loader reads from the pixels). The heads are read the way the harness reads them: the
 * head box's centre through the plane the engine drew. What is pinned:
 *
 * - by default (the aligned dissolve is OFF) no plane drifts: every change is a plain cross-fade, never a one-frame change, and the lunge is on the velocity-continuous curve;
 * - `?motion=classic` puts the lunge back on cubic-out, and touches nothing else;
 * - `?swap=aligned` brings the two heads to one point at the crossing, starts the incoming plane at the meeting point, and ends with every plane at home;
 * - the lunge's first frame is small, and the strike reaches the same distance at the same moment as on cubic-out.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { PaintedActor, cameraAt, painting, reset, slotOf, slotsOf, viewOf, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { coarseMask } from '../../../src/engine/PoseAlign.ts';
import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import { setAlignedSwap, setMotionMode } from '../../../src/engine/PoseSwap.ts';

const FRAME = 1 / 60;
const cam = cameraAt(3);

beforeEach(() => {
  setPaceGame('other');
  setPace('current');
});
afterEach(() => {
  reset();
  setMotionMode(null);
  setAlignedSwap(null);
  setPaceGame('other');
});

/** A stand-in silhouette under a head box: the body from the top of the head to near the soles, `half` of the picture either side of the head. */
function bodyUnder(head: readonly [number, number, number, number], size: [number, number], half: number): ReturnType<typeof coarseMask> {
  const [w, h] = [96, Math.max(8, Math.round((96 * size[1]) / size[0]))];
  const d = new Uint8ClampedArray(w * h * 4);
  const cx = (head[0] + head[2]) / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y / h >= head[1] && y / h < 0.98 && Math.abs(x / w - cx) <= half) d[(y * w + x) * 4 + 3] = 255;
    }
  }
  return coarseMask(d, w, h, 90);
}

const WIDE = 0.34; // half-width of a broad body, as a share of the picture

/** Tidus with the poses given, each with a stand-in silhouette `half` wide. */
function tidus(poses: string[], half: Record<string, number> = {}, over: { crossfadeMs?: number } = {}): Actor {
  const a = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false, ...over });
  const map: Record<string, ReturnType<typeof painting>> = {};
  for (const p of poses) {
    const tex = painting('tidus', p);
    const sil = bodyUnder(tex.meta.head!, [tex.meta.width, tex.meta.height], half[p] ?? WIDE);
    map[p] = { ...tex, meta: { ...tex.meta, ...(sil ? { silhouette: sil } : {}) } };
  }
  a.adoptPoses(map, 'idle');
  a.position.set(-2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}

/** One stage frame: the actor moves, the stage hands it the camera, the world is composed. */
function step(a: Actor, fieldDt = FRAME, realDt = FRAME): void {
  a.update(fieldDt, realDt);
  a.holdHead(viewOf(cam));
  a.updateMatrixWorld(true);
}

/** Where a pose's head box centre is in the actor's frame (the inner group's own motion, a lean or a hop, is not in it), through the plane that holds the pose. */
function headX(a: Actor, pose: string): number {
  const s = slotOf(a, pose);
  const h = s.meta.head!;
  return new Vector3((h[0] + h[2]) / 2 - 0.5, 0.5 - (h[1] + h[3]) / 2, 0).applyMatrix4((s.mesh as unknown as { matrix: import('three').Matrix4 }).matrix).x;
}
const live = (a: Actor): string[] => slotsOf(a).filter((s) => s.fade > 0.02).map((s) => s.pose);
const slotFade = (a: Actor, pose: string): number => slotsOf(a).filter((s) => s.pose === pose).reduce((n, s) => n + s.fade, 0);
const policyOf = (a: Actor): string | null => (a as unknown as { swapPolicyLast: string | null }).swapPolicyLast;

/** Run a blend to its end and return the head x of `pose` at each frame. */
function run(a: Actor, pose: string, frames: number): number[] {
  const xs: number[] = [];
  for (let f = 0; f < frames; f++) {
    step(a);
    xs.push(headX(a, pose));
  }
  return xs;
}

describe('by default (the aligned dissolve off) nothing drifts', () => {
  it('no plane drifts during a change of pose, and no policy is recorded', () => {
    const a = tidus(['idle', 'ready']);
    step(a);
    const homeIdle = headX(a, 'idle');
    a.setPose('ready');
    step(a);
    const homeReady = headX(a, 'ready');
    const xs = run(a, 'ready', 12);
    for (const x of xs) expect(x).toBeCloseTo(homeReady, 4); // (the head lock's factor moves the plane by a hair as the camera sees it)
    expect(headX(a, 'idle')).toBeCloseTo(homeIdle, 4);
    expect(policyOf(a)).toBeNull();
  });
});

describe('the aligned dissolve (?swap=aligned)', () => {
  beforeEach(() => setAlignedSwap(true));

  it('brings the two heads to one point at the crossing, starts the incoming plane at the meeting point, and ends with the incoming plane at home', () => {
    // home positions, read with the switch off
    setAlignedSwap(false);
    const base = tidus(['idle', 'ready']);
    step(base);
    base.setPose('ready');
    for (let f = 0; f < 14; f++) step(base);
    const homeIdle = headX(base, 'idle');
    const homeReady = headX(base, 'ready');
    expect(Math.abs(homeReady - homeIdle)).toBeGreaterThan(0.2); // the pair's heads really are apart, or the test proves nothing

    setAlignedSwap(true);
    const a = tidus(['idle', 'ready']);
    step(a);
    expect(headX(a, 'idle')).toBeCloseTo(homeIdle, 6);
    a.setPose('ready');
    expect(policyOf(a)).toBe('aligned');
    const mid = (homeIdle + homeReady) / 2;
    expect(headX(a, 'idle')).toBeCloseTo(homeIdle, 6); // the outgoing plane starts at home...
    a.updateMatrixWorld(true);
    expect(headX(a, 'ready')).toBeCloseTo(mid, 3); // ...the incoming plane at the meeting point

    const natural = Math.abs(homeReady - homeIdle);
    let shared = 0;
    let gap = Infinity;
    for (let f = 0; f < 14; f++) {
      step(a);
      const fi = slotFade(a, 'ready');
      const fo = slotFade(a, 'idle');
      if (fi > 0.3 && fo > 0.3) {
        shared++;
        gap = Math.min(gap, Math.abs(headX(a, 'ready') - headX(a, 'idle')));
      }
    }
    expect(shared).toBeGreaterThan(0);
    // while both paintings share the screen the heads are closer than the pair's natural separation, to a quarter of it at the closest frame (a plain dissolve keeps all of it)
    expect(natural).toBeGreaterThan(0.2);
    expect(gap).toBeLessThan(0.25 * natural);
    // the blend is over: the incoming plane is at home, nothing keeps a drift
    expect(headX(a, 'ready')).toBeCloseTo(homeReady, 5);
    for (const s of slotsOf(a)) expect((s as unknown as { align: number; meet: number }).align).toBe(0);
    for (const s of slotsOf(a)) expect((s as unknown as { align: number; meet: number }).meet).toBe(0);
  });

  it('the drift is only sideways: every plane keeps the height it has under today (to a hair of head lock), frame for frame, so the feet stay on the floor line', () => {
    const trajectory = (on: boolean): number[][] => {
      setAlignedSwap(on);
      const act = tidus(['idle', 'ready']);
      step(act);
      act.setPose('ready');
      const rows: number[][] = [];
      for (let f = 0; f < 14; f++) {
        step(act);
        rows.push(slotsOf(act).map((sl) => (sl.mesh as unknown as { position: { y: number } }).position.y));
      }
      return rows;
    };
    const today = trajectory(false);
    const smooth = trajectory(true);
    expect(smooth.length).toBe(today.length);
    // the head lock rescales a plane about its feet as the camera sees the plane (a yawed plane that slides sideways changes depth): under 1 percent of its height, never the drift itself
    for (let f = 0; f < today.length; f++) for (let i = 0; i < 2; i++) expect(Math.abs(smooth[f]![i]! - today[f]![i]!)).toBeLessThan(0.012);
  });

  it('is deterministic and never shows a third painting', () => {
    const a = tidus(['idle', 'ready', 'follow']);
    step(a);
    a.setPose('ready');
    for (let f = 0; f < 14; f++) {
      step(a);
      expect(live(a).length).toBeLessThanOrEqual(2);
    }
  });
});

describe('the aligned dissolve must not pull overlapping bodies apart (?swap=aligned)', () => {
  beforeEach(() => setAlignedSwap(true));

  /** Bodies drawn on the stance (where the feet are, which the registration puts at the same place in every pose), whatever the head does. */
  function onStance(poses: string[]): Actor {
    const a = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
    const map: Record<string, ReturnType<typeof painting>> = {};
    for (const p of poses) {
      const tex = painting('tidus', p);
      const w = 96;
      const h = Math.max(8, Math.round((96 * tex.meta.height) / tex.meta.width));
      const d = new Uint8ClampedArray(w * h * 4);
      const cx = (tex.meta.stanceX ?? tex.meta.width / 2) / tex.meta.width;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (y / h >= 0.1 && y / h < 0.98 && Math.abs(x / w - cx) <= 0.34) d[(y * w + x) * 4 + 3] = 255;
      const sil = coarseMask(d, w, h, 90);
      map[p] = { ...tex, meta: { ...tex.meta, ...(sil ? { silhouette: sil } : {}) } };
    }
    a.adoptPoses(map, 'idle');
    a.position.set(-2, 0, 0);
    a.setPose('idle', { immediate: true, force: true });
    return a;
  }

  it('Tidus idle to hurt, bodies on the same feet and heads far apart: the plain dissolve, no drift', () => {
    const a = onStance(['idle', 'hurt']);
    for (let f = 0; f < 5; f++) step(a);
    a.setPose('hurt');
    expect(policyOf(a)).toBe('dissolve');
    for (let f = 0; f < 10; f++) {
      step(a);
      for (const s of slotsOf(a)) expect((s as unknown as { align: number }).align).toBe(0);
    }
  });
});

describe('no pose change is ever made in one frame (the held-frame cut was removed)', () => {
  /** Two paintings that barely overlap, at a figure that holds still: the case the cut used to take. */
  it.each([false, true])('a narrow pair at rest still cross-fades over several frames (aligned dissolve %s)', (on) => {
    setAlignedSwap(on);
    const a = tidus(['idle', 'cast'], { idle: 0.012, cast: 0.012 });
    for (let f = 0; f < 5; f++) step(a);
    a.setPose('cast');
    expect(slotFade(a, 'cast')).toBeLessThan(1);
    expect(a.blending).toBe(true);
    step(a);
    expect(live(a).length).toBe(2);
    for (let f = 0; f < 14; f++) step(a);
    expect(live(a)).toEqual(['cast']);
  });

  it('the aligned dissolve records the plain dissolve or the alignment for a narrow pair, never a cut', () => {
    setAlignedSwap(true);
    const a = tidus(['idle', 'cast'], { idle: 0.012, cast: 0.012 });
    for (let f = 0; f < 5; f++) step(a);
    a.setPose('cast');
    expect(['aligned', 'dissolve']).toContain(policyOf(a));
  });
});

describe('the lunge (the first frame is on by default; ?motion=classic restores cubic-out)', () => {
  /** The lunge offset after `frames` frames of a 440 ms strike of 1.4 units. */
  function lungeAfter(frames: number): number {
    const a = tidus(['idle']);
    step(a);
    void a.lunge(1.4, 440);
    for (let f = 0; f < frames; f++) step(a);
    return (a as unknown as { lungeOffset: number }).lungeOffset;
  }

  it('classic: the first moving frame covers over a quarter of the distance from a standing start', () => {
    setMotionMode('classic');
    expect(lungeAfter(1)).toBeGreaterThan(0.25 * 1.4);
  });

  it('by default, with no switch set: the first moving frame is small, as under smooth', () => {
    expect(lungeAfter(1)).toBeLessThan(0.1 * 1.4);
  });

  it('smooth: the velocity grows from a standing start, and the step reaches the same place as classic at the same moment', () => {
    setMotionMode('smooth');
    const first = lungeAfter(1);
    expect(first).toBeLessThan(0.1 * 1.4);
    // steps grow from a standing start: no frame of the first three covers more than the frame after it
    const s = [lungeAfter(1), lungeAfter(2), lungeAfter(3), lungeAfter(4)];
    expect(s[1]! - s[0]!).toBeGreaterThan(s[0]!);
    expect(s[2]! - s[1]!).toBeGreaterThan(s[1]! - s[0]!);
    // the end of the step beat (0.26 of the move = 114 ms, 7 frames) and the apex are the same distance as on cubic-out
    const apex = Math.round((440 * ATTACK_IMPACT) / (1000 / 60));
    setMotionMode('classic');
    const classicApex = lungeAfter(apex);
    setMotionMode('smooth');
    const smoothApex = lungeAfter(apex);
    expect(smoothApex).toBeCloseTo(classicApex, 1);
    expect(smoothApex).toBeLessThanOrEqual(1.4 + 1e-9);
  });

  it('the lunge and the aligned dissolve are separate switches: classic with the dissolve on still drifts, smooth with it off does not', () => {
    setMotionMode('classic');
    setAlignedSwap(true);
    const a = tidus(['idle', 'ready']);
    step(a);
    a.setPose('ready');
    expect(policyOf(a)).toBe('aligned');
    setMotionMode('smooth');
    setAlignedSwap(false);
    const b = tidus(['idle', 'ready']);
    step(b);
    b.setPose('ready');
    expect(policyOf(b)).toBeNull();
  });
});
