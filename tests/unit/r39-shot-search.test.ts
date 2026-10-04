/**
 * Round 21, PR-0314 (FFX-2 dressphere shot): the framing search walks from the best grid point when the coarse grid finds no passing frame,
 * because a window the grid steps over (a neighbour's sliver at the frame's edge) is a few percent wide. The rules (`shotScore`) are the same;
 * a frame the walk finds passes them. Plain geometry: no DOM, a pinhole-style camera from the masters' own maths.
 */
import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { Fig, Pose } from '../../src/engine/fx/mix/geometry.ts';
import type { Field } from '../../src/engine/fx/mix/clearance.ts';
import { grid, searchShot, shotScore, WALK_ROUNDS, type SearchIn } from '../../src/engine/fx/mix/shotSearch.ts';
import { cameraAt, figBox } from '../../src/engine/fx/mix/geometry.ts';

const W = 1600;
const H = 900;
const field = (panels: Field['panels'] = []): Field => ({ W, H, view: { l: 0, r: W, t: 0, b: H }, panels });
const fig = (x: number, z: number, h: number, id: string, enemy = false): Fig => ({ feet: new Vector3(x, 0, z), h, halfW: h * 0.28, enemy, id });
const master: Pose = { pos: new Vector3(0, 2.4, 11), look: new Vector3(0.4, 1.3, 0), fov: 32 };
const at = { x: (u: number): number => u, y: (v: number): number => v };

/** Three girls in the shape of the party (a row going back and to the right) and a boss behind; `mid` and `back` are the changer's neighbours. */
function scene(neighbourX: number, neighbourZ: number): { figs: Fig[]; subject: number } {
  const figs = [fig(neighbourX, neighbourZ, 1.7, 'yuna'), fig(0.9, -1.4, 1.7, 'paine'), fig(-1.6, 1.4, 1.7, 'rikku'), fig(4.2, -6, 4.5, 'boss', true)];
  return { figs, subject: 1 };
}

const inputOf = (figs: Fig[], subject: number, o: Partial<SearchIn> = {}, f: Field = field()): SearchIn => ({
  kind: 'sc', master, g: figs[subject]!, facing: 1, aspect: W / H, figs, subject, field: f, lens: [0, 0], at, ...o,
});

describe('the dressphere shot\'s framing search (PR-0314)', () => {
  it('the grid is the one the shot has always used (sizes, places, heights, turns, in that order)', () => {
    const g = grid('sc');
    expect(g.fracs).toEqual([0.6, 0.52, 0.45, 0.68, 0.4]);
    expect(g.xs).toEqual([0.5, 0.42, 0.58, 0.35, 0.65]);
    expect(g.ys).toEqual([0.5, 0.45, 0.55, 0.6]);
    expect(g.turns).toEqual([0, 12, -12, 24, -24]);
    expect(grid('od').turns[0]).toBe(28); // the Overdrive shot's own grid (FFX only) is untouched
  });

  it('a clean scene passes on the first grid point and never walks', () => {
    const { figs, subject } = scene(-3.5, 3); // her neighbour stands well apart
    const r = searchShot(inputOf(figs, subject, { refine: true }));
    expect(r.best?.ok).toBe(true);
    expect(r.evaluated).toBeLessThan(40);
    expect(r.best?.p).toMatchObject({ frac: 0.6, x: 0.5, y: 0.5, turn: 0 });
  });

  it('the walk finds a passing frame in a scene where the grid finds none', () => {
    // Slide a neighbour past the subject until the coarse grid fails and the walk, started from the grid's best point, passes.
    let rescued: { x: number; z: number } | null = null;
    let coarseFails = 0;
    for (let z = 0.2; z <= 3.2 && !rescued; z += 0.4) {
      for (let x = -3.4; x <= 2.4; x += 0.05) {
        const { figs, subject } = scene(x, z);
        const coarse = searchShot(inputOf(figs, subject, { refine: false }));
        if (coarse.best?.ok) continue;
        coarseFails++;
        const walked = searchShot(inputOf(figs, subject, { refine: true }));
        if (walked.best?.ok) {
          rescued = { x, z };
          expect(walked.evaluated).toBeGreaterThan(coarse.evaluated);
          expect(walked.evaluated).toBeLessThanOrEqual(coarse.evaluated + WALK_ROUNDS * 8);
          // the frame it found really passes the rules, measured again from its pose
          const cam = cameraAt(walked.best.pose, W / H);
          const boxes = figs.map((f) => figBox(f, cam, W, H));
          expect(shotScore(subject, boxes, field(), figs, true).ok).toBe(true);
          break;
        }
      }
    }
    expect(coarseFails, 'the sweep must reach scenes the grid fails').toBeGreaterThan(0);
    expect(rescued, 'in some scene the walk rescues a failing grid').not.toBeNull();
  });

  it('never makes a passing grid worse: with refine on or off the same frame is chosen when the grid passes', () => {
    for (let x = -3.4; x <= 2.4; x += 0.2) {
      const { figs, subject } = scene(x, 1.2);
      const a = searchShot(inputOf(figs, subject, { refine: false }));
      const b = searchShot(inputOf(figs, subject, { refine: true }));
      if (a.best?.ok) expect(b.best?.p).toEqual(a.best.p);
      else expect(b.best!.score).toBeGreaterThanOrEqual(a.best!.score - 1e-9); // the walk keeps the best it saw
    }
  });

  it('the Overdrive shot (FFX only) never walks, whatever is asked', () => {
    const { figs, subject } = scene(-0.2, 1.2);
    const walked = searchShot(inputOf(figs, subject, { kind: 'od', refine: true }));
    const plain = searchShot(inputOf(figs, subject, { kind: 'od', refine: false }));
    expect(walked.evaluated).toBe(plain.evaluated);
  });
});
