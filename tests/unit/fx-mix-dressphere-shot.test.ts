/**
 * Round 19, PR-0309 and PR-0311 (FFX-2 only): the DRESSPHERE SHOT keeps every face clear of a panel (the enemy gauge rows ran across
 * Yuna's face at 1600x900), no head in the frame is cut by its top, the girl who changes is not dwarfed by a nearer neighbour, and the
 * close shot may swing to either side so that one steps out. The Overdrive shot (FFX only) keeps its own rules.
 */
import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { closeShot } from '../../src/engine/fx/mix/masters.ts';
import type { Fig, Pose } from '../../src/engine/fx/mix/geometry.ts';
import type { Field } from '../../src/engine/fx/mix/clearance.ts';
import { shotScore } from '../../src/engine/fx/mix/heldShots.ts';

const W = 1600;
const H = 900;
const field = (panels: Field['panels'] = []): Field => ({ W, H, view: { l: 0, r: W, t: 0, b: H }, panels });
const fig = (x: number, z: number, h: number, enemy = false, id = 'f'): Fig => ({ feet: new Vector3(x, 0, z), h, halfW: h * 0.25, enemy, id });
const pose = (z = 12, y = 1.6, ly = 1.2, fov = 32): Pose => ({ pos: new Vector3(0, y, z), look: new Vector3(0, ly, 0), fov });

describe('the DRESSPHERE SHOT (FFX-2 only; PR-0309 and PR-0311)', () => {
  const f = field([{ l: 40, r: 640, t: 100, b: 260 }]); // the enemy gauge rows, top left
  const box = (l: number, t: number, w: number, h: number) => ({ l, r: l + w, t, b: t + h });
  const sub = { subject: 1 };
  const party = (over: { subject?: ReturnType<typeof box>; other?: ReturnType<typeof box> } = {}) => [over.other ?? box(300, 300, 160, 400), over.subject ?? box(700, 200, 260, 600)];
  const figs: Fig[] = [fig(0, 0, 1, false, 'yuna'), fig(1, 0, 1, false, 'rikku')];

  it('passes a clean shot in the strict rules too', () => {
    expect(shotScore(sub.subject, party(), f, figs, true).ok).toBe(true);
    expect(shotScore(sub.subject, party(), f, figs).ok).toBe(true);
  });

  it('a face under the gauge rows fails the dressphere shot (it let up to two cells of the subject through before)', () => {
    const faceUnder = party({ subject: box(300, 80, 260, 600) }); // one gauge row's end sits across her head: one cell of 48
    const rows = field([{ l: 290, r: 340, t: 80, b: 130 }]);
    expect(shotScore(sub.subject, faceUnder, rows, figs, true).ok).toBe(false);
    expect(shotScore(sub.subject, faceUnder, rows, figs).ok).toBe(true); // the Overdrive shot's rule is unchanged (FFX only)
  });

  it('a neighbour\'s head cut by the frame\'s top fails it', () => {
    expect(shotScore(sub.subject, party({ other: box(300, -20, 200, 700) }), f, figs, true).ok).toBe(false);
  });

  it('the girl who changes is not dwarfed: a nearer neighbour a quarter taller on screen fails it, a taller girl standing beside her does not', () => {
    const nearer = party({ other: box(300, 110, 330, 760) }); // the neighbour stands over 1.25 times her height
    expect(shotScore(sub.subject, nearer, f, figs, true).ok).toBe(false);
    expect(shotScore(sub.subject, party({ other: box(1100, 150, 180, 650) }), f, figs, true).ok).toBe(true); // 8 % taller: Yuna beside Rikku
  });

  it('swings the camera to either side when asked, so a nearer neighbour can step out of the frame', () => {
    const master = pose(12, 2, 1.5, 34);
    const girl = fig(0, 0, 1.7, false, 'rikku');
    const straight = closeShot(master, girl, W / H, 0.6, [0.5, 0.5], 0);
    const left = closeShot(master, girl, W / H, 0.6, [0.5, 0.5], 24);
    const right = closeShot(master, girl, W / H, 0.6, [0.5, 0.5], -24);
    expect(left.pos.x).not.toBeCloseTo(straight.pos.x, 2);
    expect(left.pos.x - straight.pos.x).toBeCloseTo(-(right.pos.x - straight.pos.x), 4); // symmetric about the straight shot
    expect(straight.pos.distanceTo(left.pos)).toBeGreaterThan(1);
  });
});
