/**
 * r43-motion2 (round 25's PR-0380, the fan's "after a lunge the attacker does not walk back; it dissolves where it ended and is standing at its seat";
 * both games: the lunge is shared plumbing, FFX's whole approach and FFX-2's after its run-in).
 *
 * The question was why the return leg snaps, and to fix it if the code intends a walk back. It does intend one, and on the REAL `PaintedActor` stepped at 60 fps
 * the walk back is there and does not snap: after the strike's apex (and the contact hold) the figure slides home over 11 to 12 frames (183 to 200 ms, the move's
 * `settle` beat, 42 percent of `LUNGE_MS`), on a smooth ramp, never faster than its own approach. Measured (world units a frame; one unit is about 90 px at
 * 1600 wide in the party's camera):
 *
 *   lunge                          approach, worst step   return, worst step   return length
 *   house 1.4                      0.46                   0.19                 11 frames
 *   solved to 2.9 (REDUCE MOTION)  0.54                   0.39                 12 frames
 *   solved to 4.4 (the cap)        0.74                   0.59 (54 px)         12 frames
 *
 * So there is nothing in the actor to fix, and nothing was changed. What reads as "dissolves and stands again at its seat" is the staging around it, and it is
 * the owner's to judge: the return starts only when the blow lands (the contact hold), and the first hit hard-cuts the camera to the struck figure
 * (`BattleMoments.impact`), so the slide home happens under the other shot; `actionEnd` puts the idle painting up through the 140 ms blend in the same breath, over a
 * pair of paintings that barely overlap (Auron's attack to follow reads 0.20); and a long solved reach (up to 3 units more than the house lunge) is carried home in the
 * same 200 ms, which is a fast slide (54 px a frame at its peak). FFX-2's girls run home with a smear (`BattleScreenRunIn.ts`, three quarters of the run in) unless a menu
 * or REDUCE MOTION closed the gate (D-357: snapped home by design). A slower or longer return, or holding the camera on it, is a look and a timing (the lunge keeps its
 * 440 ms for the ATB's pacing): options first (`docs/handoff/r43-motion2.md`).
 *
 * This file pins what is true today, so that a change that does make the return snap (the first lunge's completion zeroing a second one in flight, a settle that
 * jumps, a return that outruns the approach) fails here.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, cameraAt, painting, reset, viewOf, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { LUNGE_MS } from '../../../src/engine/StrikeBeat.ts';
import { ATTACK_BEATS, attackOffset, reachOffset } from '../../../src/engine/BattlePresenterActors.ts';

const FRAME = 1000 / 60;
const flush = async (): Promise<void> => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

beforeEach(() => {
  setPaceGame('other');
  setPace('steady');
});
afterEach(() => {
  reset();
  setPaceGame('other');
});

function auron(): Actor {
  const a = new PaintedActor({ name: 'auron', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  const poses: Record<string, ReturnType<typeof painting>> = {};
  for (const p of ['idle', 'attack', 'follow']) poses[p] = painting('auron', p);
  a.adoptPoses(poses, 'idle');
  a.position.set(-2, 0, 0);
  return a;
}
const offsetOf = (a: Actor): number => (a as unknown as { inner: { position: { x: number } } }).inner.position.x;

/** One lunge from frame 2, `frames` frames; `script` may act on a frame (release a hold, start another lunge). */
async function lunge(opts: { distance: number; house: number; frames?: number; contact?: { hold: Promise<unknown>; reached: () => void }; script?: (a: Actor, f: number) => void }): Promise<number[]> {
  const a = auron();
  const cam = cameraAt(2, 12);
  const xs: number[] = [];
  for (let f = 0; f < (opts.frames ?? 50); f++) {
    if (f === 2) {
      a.setPose('attack');
      void a.lunge(opts.distance, LUNGE_MS, opts.contact, opts.house);
    }
    opts.script?.(a, f);
    a.update(FRAME / 1000, FRAME / 1000);
    a.holdHead(viewOf(cam));
    a.updateMatrixWorld(true);
    await flush();
    xs.push(offsetOf(a));
  }
  return xs;
}

const steps = (xs: number[]): number[] => xs.map((v, i) => (i ? v - xs[i - 1]! : 0));
const worst = (v: number[]): number => v.reduce((m, s) => Math.max(m, Math.abs(s)), 0);

describe('the move: the strike, then the walk back', () => {
  it('the curve ends at home after a settle beat of 42 percent of the move, for the house part and the carried part alike', () => {
    expect(ATTACK_BEATS.settle).toBeCloseTo(0.42, 9);
    for (const f of [attackOffset, reachOffset]) {
      expect(f(1 - ATTACK_BEATS.settle)).toBeCloseTo(1, 9); // the apex, at the end of the strike beat
      expect(f(1)).toBe(0);
      let prev = 1;
      for (let i = 1; i <= 100; i++) {
        const v = f(1 - ATTACK_BEATS.settle + (ATTACK_BEATS.settle * i) / 100);
        expect(v).toBeLessThanOrEqual(prev + 1e-12); // it only ever goes home
        prev = v;
      }
    }
  });
});

describe('on the real actor at 60 fps: the return is a smooth slide home that never outruns the approach', () => {
  for (const [name, distance, house] of [
    ['the house lunge (1.4)', 1.4, 1.4],
    ['a solved reach of 2.9 (the REDUCE MOTION cap)', 2.9, 1.4],
    ['a solved reach of 4.4 (the cap)', 4.4, 1.4],
  ] as const) {
    it(`${name}: 11 or more frames from the apex to home, no frame steps more than 0.45 of the distance, no step faster than the approach's, and it ends home`, async () => {
      const xs = await lunge({ distance, house });
      const st = steps(xs);
      const apex = xs.indexOf(Math.max(...xs));
      const back = st.slice(apex + 1, apex + 18);
      const home = apex + 1 + back.findIndex((s, i) => i > 3 && Math.abs(s) < 0.01);
      expect(home - apex, 'frames from the apex to home').toBeGreaterThanOrEqual(11);
      expect(worst(back)).toBeLessThan(0.45 * distance);
      expect(worst(back), 'the return never outruns the approach').toBeLessThan(worst(st.slice(2, apex + 1)));
      for (const s of back.slice(0, home - apex)) expect(s).toBeLessThanOrEqual(0.01); // it only goes home (to a hundredth of a unit: the standing pose's lean eases in underneath)
      expect(Math.abs(xs[xs.length - 1]!)).toBeLessThan(0.08); // home (what is left is the standing pose's own lean)
    });
  }

  it('a strike held at its apex for the blow (the contact hold) stays flat while held and then goes home on the same ramp', async () => {
    let release: () => void = () => {};
    const hold = new Promise<void>((r) => (release = r));
    const xs = await lunge({ distance: 1.4, house: 1.4, frames: 70, contact: { hold, reached: () => {} }, script: (_a, f) => void (f === 30 && release()) });
    const held = xs.slice(18, 31);
    expect(worst(steps(held)), 'flat at the apex while held').toBeLessThan(0.05); // (the strike beat's own last frames)
    const back = steps(xs.slice(31, 48));
    expect(worst(back)).toBeLessThan(0.45 * 1.4);
    expect(Math.abs(xs[xs.length - 1]!)).toBeLessThan(0.08);
  });

  it('a second lunge begun while the first is on its way home never drops the figure to home in the middle of it (the first one finishing writes no zero over it)', async () => {
    const xs = await lunge({ distance: 1.4, house: 1.4, frames: 70, script: (a, f) => void (f === 26 && void a.lunge(1.4, LUNGE_MS, undefined, 1.4)) });
    const second = xs.slice(26, 26 + 18); // its step, its hold and the start of its strike
    for (let i = 1; i < second.length; i++) expect(second[i]! - second[i - 1]!, `frame ${26 + i}`).toBeGreaterThanOrEqual(-0.12); // eases on, no frame is a jump home
    expect(second[second.length - 1]!).toBeGreaterThan(second[0]! + 0.5);
  });
});
