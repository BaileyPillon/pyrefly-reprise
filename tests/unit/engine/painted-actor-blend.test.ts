/**
 * FB-1 (visual-and-feel pass, 2026-10-10; PR-0379; both games): the REAL `PaintedActor` through the pose-blend seam (`PoseBlend.ts`).
 *
 * The scene is the attack key chain of the diagnosis: Tidus is at `ready`, the lunge's apex asks for `attack`, and the damage beat's follow-through
 * asks for `follow` 83 ms later, with the FFX light hit-stop (40 ms) holding the field's clock in the middle of it. It is stepped frame by frame at 60 fps
 * the way the game steps it (`PaintedStage.update(fieldDt, realDt)`: the field clock the hit-stop holds, the real one it never does), and every plane is
 * read as the harness reads it: its painting's name and its fade. The head is read through the plane the engine drew (the fixture's `headPx`), so the
 * head lock rides through the chain. The pure properties are `pose-blend.test.ts`.
 *
 * FB-2 (P2-A, both games): every pose change now runs on the stepped dissolve (`STEPPED_DISSOLVE`), and `?poseblend=legacy` restores the plain one. The
 * mechanics under test (one owned blend, the real clock, no third painting, a reversal that moves no fade, the cuts) are the shape's neighbours, not the
 * shape: both describes run under BOTH shapes, and the few numbers that are the shape's own (the first frame of a fresh blend, the per-frame smoothness
 * of a reversal) are told apart by `LEGACY`. The shape's own tests are `pose-blend-stepped.test.ts` and `pose-blend-composite.test.ts`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HELD, PaintedActor, cameraAt, headPx, painting, reset, slotsOf, viewOf, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { STEPPED_CAP, setPoseBlendLegacy } from '../../../src/engine/PoseBlend.ts';
import { stillActor } from '../../../src/engine/fx/mix/geometry.ts';

const FRAME = 1000 / 60;
const POSES = ['idle', 'ready', 'attack', 'follow', 'hurt'] as const;

beforeEach(() => {
  setPaceGame('other');
  setPace('steady');
});
afterEach(() => {
  reset();
  setPaceGame('other');
  setPoseBlendLegacy(null);
});

/** The two shapes an actor's pose changes can run on: the stepped dissolve (the default) and the plain one behind `?poseblend=legacy`. */
const SHAPES = [['stepped', false], ['legacy', true]] as const;

/** Tidus as the stage stages him: the party faces +x; every pose is a real record's painting with its real registration (heads included). */
function tidus(over: { crossfadeMs?: number } = {}): Actor {
  const a = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false, ...over });
  const poses: Record<string, ReturnType<typeof painting>> = {};
  for (const p of POSES) poses[p] = painting('tidus', p);
  a.adoptPoses(poses, 'idle');
  a.position.set(-2, 0, 0);
  a.setPose('ready', { immediate: true, force: true });
  return a;
}

/** What a frame shows: the fade of each painting key, planes that hold one key added up. */
function shown(a: Actor): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of slotsOf(a)) if (s.pose && s.fade > 0) out[s.pose] = (out[s.pose] ?? 0) + s.fade;
  return out;
}
const live = (m: Record<string, number>, min = 0.02): string[] => Object.entries(m).filter(([, f]) => f > min).map(([k]) => k);

/** The field clock under a hit-stop: 0 while `left` ms remain, the remainder of a frame passes (`HitStop.scale`). */
class Clock {
  left = 0;
  freeze(ms: number): void {
    this.left = ms;
  }
  field(frameMs: number): number {
    if (this.left <= 0) return frameMs;
    if (frameMs <= this.left) {
      this.left -= frameMs;
      return 0;
    }
    const pass = frameMs - this.left;
    this.left = 0;
    return pass;
  }
}

/** One stage frame: the actors move (`update(fieldDt, realDt)`), then the stage hands each its camera (`holdHeads`' own call). */
function step(a: Actor, cam: ReturnType<typeof cameraAt>, fieldMs: number, realMs = FRAME): void {
  a.update(fieldMs / 1000, realMs / 1000);
  a.holdHead(viewOf(cam));
  a.updateMatrixWorld(true);
}

describe.each(SHAPES)('the attack key chain on the real PaintedActor, %s shape: ready > attack, then attack > follow 83 ms later, 40 ms hit-stop in the middle', (_name, LEGACY) => {
  beforeEach(() => setPoseBlendLegacy(LEGACY));

  it('frame by frame: never a third painting, follow comes in from 0 (not at a third of the way), attack only fades, and the blend ends 120 ms of REAL time after the follow request', () => {
    const a = tidus();
    const cam = cameraAt(3);
    const clock = new Clock();
    const rows: Array<{ f: number; ms: number; m: Record<string, number> }> = [];
    a.setPose('attack'); // the lunge's apex (KeyPoses.impactAtApex)
    expect(a.blending).toBe(true);
    let followedAt = -1;
    for (let f = 0; f < 30; f++) {
      const ms = f * FRAME;
      if (f === 5 && followedAt < 0) {
        a.setPose('follow'); // the damage beat's meetContact: 83.3 ms after
        followedAt = ms;
        clock.freeze(40); // fxHit's hit-stop holds the field clock from this frame on
      }
      step(a, cam, clock.field(FRAME));
      rows.push({ f, ms, m: shown(a) });
    }

    // no frame shows more than two paintings above 0.02, and ready (the dropped painting) is never on screen together with follow
    for (const r of rows) {
      expect(live(r.m).length, `frame ${r.f}`).toBeLessThanOrEqual(2);
      expect(live(r.m).includes('ready') && live(r.m).includes('follow'), `frame ${r.f}: ready and follow together`).toBe(false);
    }
    // follow's first appearance is the first step of a fresh blend, not a pop at 0.37
    const firstFollow = rows.find((r) => (r.m['follow'] ?? 0) > 0)!;
    expect(firstFollow.m['follow']!).toBeLessThan(LEGACY ? 0.1 : 0.15); // (the stepped dissolve climbs linearly to its cap: 0.10 in the first frame)
    // attack is already the stronger painting when follow is asked for, and from then on it only falls
    const afterAsk = rows.filter((r) => r.f >= 5);
    expect(rows[4]!.m['attack']!).toBeGreaterThan(0.6);
    for (let i = 1; i < afterAsk.length; i++) expect(afterAsk[i]!.m['attack'] ?? 0).toBeLessThanOrEqual(afterAsk[i - 1]!.m['attack'] ?? 0);
    // follow only rises
    const fol = afterAsk.map((r) => r.m['follow'] ?? 0);
    for (let i = 1; i < fol.length; i++) expect(fol[i]!).toBeGreaterThanOrEqual(fol[i - 1]!);
    // the hit-stop did not hold the blend: it is over 120 ms of real time after the request (the frame that crosses it), follow alone at 1
    const done = afterAsk.find((r) => live(r.m).length === 1 && (r.m['follow'] ?? 0) === 1)!;
    const real = (done.f - 5 + 1) * FRAME; // the updates from the one the request landed in, through the one that finished it
    expect(real).toBeGreaterThanOrEqual(120 - 1e-6);
    expect(real).toBeLessThan(120 + FRAME + 1e-6);
    // and no frame in the freeze repeats the one before it: the half-mixed plateau is gone
    for (const f of [6, 7, 8]) expect(rows[f]!.m['follow']).not.toBe(rows[f - 1]!.m['follow']);
  });

  it('the ghost frames of the chain (both paintings at 0.15 or more) are five or fewer, with and without the hit-stop (the old crossfade read eight with it)', () => {
    for (const freeze of [0, 40, 85]) {
      const a = tidus();
      const cam = cameraAt(3);
      const clock = new Clock();
      let ghosts = 0;
      let peak = 0;
      a.setPose('attack');
      for (let f = 0; f < 30; f++) {
        if (f === 5) {
          a.setPose('follow');
          clock.freeze(freeze);
        }
        step(a, cam, clock.field(FRAME));
        const m = shown(a);
        const lo = Math.min(m['attack'] ?? 0, m['follow'] ?? 0);
        if (lo >= 0.15) ghosts++;
        peak = Math.max(peak, lo);
      }
      expect(ghosts, `freeze ${freeze} ms`).toBeLessThanOrEqual(5);
      expect(peak, `freeze ${freeze} ms`).toBeLessThan(0.45);
    }
  });

  it('the head rides through the chain at x1.00 (the head lock holds the plane the blend re-pointed, from the frame it goes up)', () => {
    const a = tidus();
    const cam = cameraAt(3);
    const clock = new Clock();
    a.setPose('attack');
    for (let f = 0; f < 24; f++) {
      if (f === 5) {
        a.setPose('follow');
        clock.freeze(40);
      }
      step(a, cam, clock.field(FRAME));
      const poses = live(shown(a), 0.05);
      if (poses.length === 2) expect(Math.abs(headPx(a, cam, poses[1]!) / headPx(a, cam, poses[0]!) - 1), `frame ${f}: ${poses.join(' & ')}`).toBeLessThan(HELD);
    }
  });

  it('the pacing option does not stretch it: under FFX steady (x1.2) the blend still ends 120 ms after the request, where the old tween took 144', () => {
    setPaceGame('ffx');
    setPace('steady');
    const a = tidus();
    const cam = cameraAt(3);
    a.setPose('attack');
    let t = 0;
    while (t < 400 && shown(a)['attack'] !== 1) {
      step(a, cam, FRAME);
      t += FRAME;
    }
    expect(t).toBeGreaterThanOrEqual(120 - 1e-6);
    expect(t).toBeLessThan(120 + FRAME + 1e-6);
    expect(shown(a)).toEqual({ attack: 1 });
  });

  it('a chain that fires in one frame (ready > attack > follow with no frame between) shows ready > follow and never attack', () => {
    const a = tidus();
    const cam = cameraAt(3);
    a.setPose('attack');
    a.setPose('follow');
    const seen = new Set<string>();
    for (let f = 0; f < 12; f++) {
      step(a, cam, FRAME);
      for (const k of live(shown(a), 0)) seen.add(k);
    }
    expect([...seen].sort()).toEqual(['follow', 'ready']);
    expect(shown(a)).toEqual({ follow: 1 });
  });
});

describe.each(SHAPES)('the seam, %s shape: realDt, the default, reversal, the cuts', (_name, LEGACY) => {
  beforeEach(() => setPoseBlendLegacy(LEGACY));

  it('update(dt) with no second argument runs the blend on dt itself (every scene, portrait and title caller), and a frame of dt 0 then holds it: the default is the old behaviour', () => {
    const a = tidus();
    a.setPose('attack');
    a.update(FRAME / 1000);
    const one = shown(a)['attack']!;
    expect(one).toBeGreaterThan(0);
    a.update(0);
    a.update(0);
    expect(shown(a)['attack']).toBe(one);
    a.update(0, FRAME / 1000); // the stage's hit-stop frame: the field holds, the real clock goes on
    expect(shown(a)['attack']!).toBeGreaterThan(one);
  });

  it('a request that names a painting a plane still holds reverses it without a pop (a flinch that ends mid-fade), and re-points no plane', () => {
    const a = tidus();
    a.setPose('idle', { immediate: true, force: true });
    const cam = cameraAt(3);
    a.setPose('hurt');
    for (let f = 0; f < 3; f++) step(a, cam, FRAME); // 50 ms of 120: hurt 0.35, idle 0.65
    const before = slotsOf(a).map((s) => ({ pose: s.pose, fade: s.fade, painted: (s as unknown as { painted: unknown }).painted }));
    a.setPose('idle');
    const after = slotsOf(a).map((s) => ({ pose: s.pose, fade: s.fade, painted: (s as unknown as { painted: unknown }).painted }));
    expect(after).toEqual(before); // not one fade, not one painting moved at the request
    expect(a.pose).toBe('idle');
    let prev = shown(a);
    for (let f = 0; f < 12; f++) {
      step(a, cam, FRAME);
      const now = shown(a);
      // the plain dissolve moves a plane a little each frame; the stepped one has its one step, and the lesser painting is never above its cap, reversal or not
      if (LEGACY) for (const k of ['idle', 'hurt']) expect(Math.abs((now[k] ?? 0) - (prev[k] ?? 0)), `${k}, frame ${f}`).toBeLessThan(0.2);
      else expect(Math.min(now['idle'] ?? 0, now['hurt'] ?? 0), `frame ${f}`).toBeLessThanOrEqual(STEPPED_CAP + 1e-9);
      prev = now;
    }
    expect(shown(a)).toEqual({ idle: 1 });
  });

  it('asking for the pose already on its way in changes nothing and does not restart the blend (the presenter asks twice)', () => {
    const a = tidus();
    const cam = cameraAt(3);
    a.setPose('attack');
    for (let f = 0; f < 3; f++) step(a, cam, FRAME);
    const pre = JSON.stringify(shown(a));
    a.setPose('attack', { force: true });
    expect(JSON.stringify(shown(a))).toBe(pre);
    for (let f = 0; f < 4; f++) step(a, cam, FRAME); // 7 frames = 117 ms: still not done only if it restarted
    step(a, cam, FRAME);
    expect(shown(a)).toEqual({ attack: 1 });
  });

  it('an immediate or forced cut ends a blend in flight at exactly 1 and 0, and nothing writes the planes again', () => {
    const a = tidus();
    const cam = cameraAt(3);
    a.setPose('attack');
    for (let f = 0; f < 3; f++) step(a, cam, FRAME);
    a.setPose('idle', { immediate: true, force: true });
    expect(a.blending).toBe(false);
    expect(shown(a)).toEqual({ idle: 1 });
    for (let f = 0; f < 10; f++) step(a, cam, FRAME);
    expect(shown(a)).toEqual({ idle: 1 });
  });

  it('FF7\'s hard cut (crossfadeMs 0) is still a cut: no blend, fades at 1 and 0 at once', () => {
    const a = tidus({ crossfadeMs: 0 });
    a.setPose('attack');
    expect(a.blending).toBe(false);
    expect(shown(a)).toEqual({ attack: 1 });
    a.setPose('follow');
    expect(shown(a)).toEqual({ follow: 1 });
  });

  it('the figure counts as busy while the blend runs (`stillActor` read the tween it used to be) and as still after', () => {
    const a = tidus();
    const cam = cameraAt(3);
    expect(stillActor(a as never)).toBe(true);
    a.setPose('idle'); // (an attack or a hurt pose would be busy anyway: its life state is 'act', or it starts tweens of its own)
    expect(stillActor(a as never)).toBe(false);
    for (let f = 0; f < 10; f++) step(a, cam, FRAME);
    expect(a.blending).toBe(false);
    expect(stillActor(a as never)).toBe(true);
  });

  it('a pose with no painting of its own resolves to the one it falls back on, and asking for it on the pose already showing is nothing', () => {
    const a = tidus();
    a.setPose('idle', { immediate: true, force: true });
    a.setPose('critical'); // no critical painting in this set: falls back to idle, which is showing
    expect(a.blending).toBe(false);
    expect(shown(a)).toEqual({ idle: 1 });
  });

  it('disposing a figure with a blend in flight is quiet', () => {
    const a = tidus();
    a.setPose('attack');
    a.dispose();
    expect(a.blending).toBe(false);
  });
});
