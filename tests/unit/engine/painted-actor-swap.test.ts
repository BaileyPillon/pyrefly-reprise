/**
 * W5 (pose swap smoothing, 2026-10-17; both games): the REAL `PaintedActor` under `?swap=smooth` (`PoseSwap.ts`, `PoseAlign.ts`).
 *
 * Tidus is built as the stage builds him (the party faces +x, every pose a real record's painting with its real registration, heads included) and each painting is
 * given a stand-in silhouette: a body box under its registered head (what the loader reads from the pixels). The heads are read the way the harness reads them: the
 * head box's centre through the plane the engine drew. What is pinned:
 *
 * - `today` (the default) moves no plane: no drift, every change a plain cross-fade, the lunge on cubic-out;
 * - an aligned dissolve brings the two heads to one point at the crossing, starts the incoming plane at the meeting point, and ends with every plane at home;
 * - a pair that overlaps by under 0.30 is cut in ONE frame where the game holds still (never two paintings at once), and is not cut while it moves or while another blend runs;
 * - the lunge's first frame is on the velocity-continuous curve, and the strike reaches the same distance at the same moment.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { PaintedActor, cameraAt, painting, reset, slotOf, slotsOf, viewOf, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { coarseMask } from '../../../src/engine/PoseAlign.ts';
import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import { setPoseSwapMode, setPoseSwapParts } from '../../../src/engine/PoseSwap.ts';

const FRAME = 1 / 60;
const cam = cameraAt(3);

beforeEach(() => {
  setPaceGame('other');
  setPace('current');
});
afterEach(() => {
  reset();
  setPoseSwapMode(null);
  setPoseSwapParts(null);
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

describe('today (the default) moves nothing', () => {
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

describe('the aligned dissolve (smooth)', () => {
  beforeEach(() => setPoseSwapMode('smooth'));

  it('brings the two heads to one point at the crossing, starts the incoming plane at the meeting point, and ends with the incoming plane at home', () => {
    // home positions, read with the switch off
    setPoseSwapMode('today');
    const base = tidus(['idle', 'ready']);
    step(base);
    base.setPose('ready');
    for (let f = 0; f < 14; f++) step(base);
    const homeIdle = headX(base, 'idle');
    const homeReady = headX(base, 'ready');
    expect(Math.abs(homeReady - homeIdle)).toBeGreaterThan(0.2); // the pair's heads really are apart, or the test proves nothing

    setPoseSwapMode('smooth');
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
    const trajectory = (mode: 'today' | 'smooth'): number[][] => {
      setPoseSwapMode(mode);
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
    const today = trajectory('today');
    const smooth = trajectory('smooth');
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

describe('the held-frame cut (smooth; the mechanics, on the cutany ablation: a cut at any head distance, the first version)', () => {
  beforeEach(() => {
    setPoseSwapMode('smooth');
    setPoseSwapParts(['cutany', 'align']);
  });

  /** Two paintings that barely overlap: idle's body is narrow, and so is the pose it changes to, whose head sits far to one side. */
  const NARROW = { idle: 0.05, hurt: 0.05, follow: 0.05, attack: 0.05, ready: 0.05 };

  it('a pair under 0.30 at a figure that holds still is changed in ONE frame: the new painting at full, the old at nothing, never both', () => {
    const a = tidus(['idle', 'hurt'], NARROW);
    for (let f = 0; f < 5; f++) step(a);
    a.setPose('hurt');
    expect(policyOf(a)).toBe('cut');
    expect(slotFade(a, 'hurt')).toBe(1);
    expect(slotFade(a, 'idle')).toBe(0);
    expect(a.blending).toBe(false);
    step(a);
    expect(live(a)).toEqual(['hurt']);
  });

  it('a hit-stop (the field frozen while the real clock runs) is a hold too', () => {
    const a = tidus(['idle', 'hurt'], NARROW);
    step(a);
    step(a, 0, FRAME); // the field is frozen
    a.setPose('hurt');
    expect(policyOf(a)).toBe('cut');
  });

  it('is not made while the figure moves: the same pair on a lunge in its step dissolves, aligned', () => {
    const a = tidus(['idle', 'hurt'], NARROW);
    for (let f = 0; f < 3; f++) step(a);
    void a.lunge(1.4, 440);
    for (let f = 0; f < 3; f++) step(a); // the step beat is under way: the figure moves several centimetres a frame
    a.setPose('hurt');
    expect(policyOf(a)).not.toBe('cut');
    expect(a.blending).toBe(true);
  });

  it('is not made while another blend runs (two paintings are on screen already)', () => {
    const a = tidus(['idle', 'hurt', 'follow'], NARROW);
    for (let f = 0; f < 5; f++) step(a);
    a.setPose('hurt'); // a cut: the figure is at rest
    expect(policyOf(a)).toBe('cut');
    a.setPose('follow', { force: true });
    expect(policyOf(a)).toBe('cut'); // still at rest, nothing blending: another cut
    const b = tidus(['idle', 'ready', 'attack']);
    for (let f = 0; f < 5; f++) step(b);
    b.setPose('ready'); // overlaps well: an aligned dissolve
    expect(b.blending).toBe(true);
    expect(policyOf(b)).toBe('aligned');
    step(b);
    b.setPose('attack'); // asked in mid-blend: held by PoseBlend rule 2 or re-pointed, but never cut
    for (let f = 0; f < 20; f++) {
      step(b);
      expect(live(b).length).toBeLessThanOrEqual(2);
    }
    expect(policyOf(b)).not.toBe('cut');
  });
});

describe('the cut and the distance between the heads (smooth, the default parts)', () => {
  beforeEach(() => setPoseSwapMode('smooth'));

  it('a pair under 0.30 whose heads are far apart is not cut (a cut would jump the head the whole distance in one frame): the aligned dissolve', () => {
    const a = tidus(['idle', 'hurt'], { idle: 0.05, hurt: 0.05 });
    for (let f = 0; f < 5; f++) step(a);
    a.setPose('hurt');
    expect(policyOf(a)).toBe('aligned');
    expect(a.blending).toBe(true);
  });

  it('a pair under 0.30 whose heads are close is cut in one frame at a figure that holds still', () => {
    const a = tidus(['idle', 'cast'], { idle: 0.012, cast: 0.012 });
    for (let f = 0; f < 5; f++) step(a);
    a.setPose('cast');
    expect(policyOf(a)).toBe('cut');
    expect(slotFade(a, 'cast')).toBe(1);
    expect(slotFade(a, 'idle')).toBe(0);
    expect(a.blending).toBe(false);
  });
});

describe('the lunge (smooth)', () => {
  /** The lunge offset after `frames` frames of a 440 ms strike of 1.4 units. */
  function lungeAfter(frames: number): number {
    const a = tidus(['idle']);
    step(a);
    void a.lunge(1.4, 440);
    for (let f = 0; f < frames; f++) step(a);
    return (a as unknown as { lungeOffset: number }).lungeOffset;
  }

  it('today: the first moving frame covers over a quarter of the distance from a standing start', () => {
    setPoseSwapMode('today');
    expect(lungeAfter(1)).toBeGreaterThan(0.25 * 1.4);
  });

  it('smooth: the first moving frame is small, the velocity grows, and the step reaches the same place as today at the same moment', () => {
    setPoseSwapMode('smooth');
    const first = lungeAfter(1);
    expect(first).toBeLessThan(0.1 * 1.4);
    // steps grow from a standing start: no frame of the first three covers more than the frame after it
    const s = [lungeAfter(1), lungeAfter(2), lungeAfter(3), lungeAfter(4)];
    expect(s[1]! - s[0]!).toBeGreaterThan(s[0]!);
    expect(s[2]! - s[1]!).toBeGreaterThan(s[1]! - s[0]!);
    // the end of the step beat (0.26 of the move = 114 ms, 7 frames) and the apex are the same distance as on cubic-out
    const apex = Math.round((440 * ATTACK_IMPACT) / (1000 / 60));
    setPoseSwapMode('today');
    const todayApex = lungeAfter(apex);
    setPoseSwapMode('smooth');
    const smoothApex = lungeAfter(apex);
    expect(smoothApex).toBeCloseTo(todayApex, 1);
    expect(smoothApex).toBeLessThanOrEqual(1.4 + 1e-9);
  });
});
