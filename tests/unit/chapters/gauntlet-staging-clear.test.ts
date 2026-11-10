/**
 * G-1 (2026-11-10, FFX only): the Gauntlet's nine creatures stand clear of the party at the first menu. `src/scenes/gauntlet.ts` stages each creature (a spot and a height); this pins, with no browser and no art, that the
 * painted box of each stand-in, projected the way the battle screen draws it, ends right of Auron's with a gap and left of the turn list's rows, at 1600 x 900 and 1366 x 768.
 *
 * **What is pinned, and where it came from** (a headless Chromium on the GPU, the real battle screen, the first menu of each act, seed 7; `docs/handoff/ch-gauntlet.md`, "G-1 staging fix"):
 * - `BOX`: each stand-in's tight alpha box as `PaintedActor.contentQuad` reads it, in metres per metre of the figure's world height, measured against the painting (`scale.contentBox / worldHeight`); a sheet is drawn
 *   centred on its spot, so the box is only as far left of the spot as `x0` says (the King's winged sheet is lopsided, the rest are centred).
 * - `CAMERA`, `FRAMES`: the first menu's camera and the static lens shift the shared framing plans (`engine/fx/mix`), and Auron's measured right edge, **in the frame the framing plan picks when the boss stands clear of the
 *   party: it steps the party 0.7 m toward the boss** (Auron on x 2.0, not the slot's 1.3). The picks of the plan are near ties (its own comment says so); a change to that code or a stage-table row for the chapter
 *   (no step) moves these frames and this test says so by failing: re-measure with `docs/handoff/ch-gauntlet.md`'s recipe.
 * - The model is a pinhole camera fitted to the run's own rectangles: over the eight bodies and Auron at both sizes (the four edges of each box) it is 1.2 px rms and 3.6 px at worst (the idle drift swings the real camera by
 *   about 0.07 m); the self-check below pins Auron's right edge, the one the gaps are measured from.
 *
 * The Ultima Buster is **not** moved and is the one listed exception: its Head and two Arms flank the party and its body cannot share the column at a size that reads (`docs/handoff/ch-gauntlet.md`, G-1).
 */

import { describe, expect, it } from 'vitest';
import { GAUNTLET_CREATURES, type GauntletCreatureId } from '../../../src/data/ffx/gauntlet-ids.ts';
import { GAUNTLET_HEIGHTS, GAUNTLET_SPOTS } from '../../../src/scenes/gauntlet.ts';

type V3 = readonly [number, number, number];

/** Where the first menu's camera stands once the framing plan has stepped the party, fitted to the measured boxes (metres; the idle drift swings it about 0.07 in x and 0.03 in y, which the gaps asserted allow for). */
const CAMERA = { pos: [0.01, 2.59, 10.23] as V3, dir: [0.03, -0.06, -0.9977] as V3, fovDeg: 32 };

/** The two desktop sizes of the finding. `lens`: the plan's static shift of the picture in CSS px; `auronRight`: Auron's measured right edge (his sword) in that frame; `rail`: where the turn list's rows begin. */
const FRAMES = [
  { size: '1600x900', w: 1600, h: 900, lens: [-64, -36] as const, auronRight: 1061, rail: 1330, minGap: 18 },
  { size: '1366x768', w: 1366, h: 768, lens: [-55, -31] as const, auronRight: 905, rail: 1136, minGap: 15 },
] as const;

/** Auron's painted box (his own `contentBox`, 1.93 m figure) and where he stands in the stepped frame: the slot's x 1.3 plus the plan's 0.7 step. */
const AURON = { x: 2.0, z: -0.75, halfW: 0.625, height: 1.907 };

/** Each stand-in's tight alpha box per metre of world height (x runs right from the spot; y up from the ground). */
const BOX: Readonly<Record<GauntletCreatureId, { x0: number; x1: number; y1: number }>> = {
  'cactuar-king': { x0: -0.6366, x1: 0.9459, y1: 0.9675 },
  'don-tonberry': { x0: -0.4715, x1: 0.4715, y1: 0.9869 },
  jormungand: { x0: -0.544, x1: 0.544, y1: 0.9766 },
  'earth-eater': { x0: -0.7156, x1: 0.7156, y1: 0.9777 },
  'greater-sphere': { x0: -0.5261, x1: 0.5261, y1: 0.9701 },
  catastrophe: { x0: -0.3762, x1: 0.3762, y1: 0.9755 },
  thuban: { x0: -0.4501, x1: 0.4501, y1: 0.9761 },
  neslug: { x0: -0.4741, x1: 0.4741, y1: 0.9824 },
  'ultima-buster': { x0: -0.7555, x1: 0.7555, y1: 0.9794 },
};

/** The staging before G-1 (every body on the Dome's slot, x 2.5, z -4, at the estimates): the values that put the stand-ins on Auron. */
const BEFORE: Readonly<Record<GauntletCreatureId, { spot: V3; height: number }>> = {
  'cactuar-king': { spot: [2.5, 0, -4], height: 2.3 },
  'don-tonberry': { spot: [2.5, 0, -4], height: 2.2 },
  jormungand: { spot: [2.5, 0, -4], height: 3.2 },
  'earth-eater': { spot: [2.5, 0, -4], height: 2.9 },
  'greater-sphere': { spot: [2.5, 0, -4], height: 3.0 },
  catastrophe: { spot: [2.5, 0, -4], height: 3.4 },
  thuban: { spot: [2.5, 0, -4], height: 2.9 },
  neslug: { spot: [2.5, 0, -4], height: 2.8 },
  'ultima-buster': { spot: [2.5, 0, -4], height: 3.4 },
};

const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** The pinhole: a world point to CSS px in a `w` x `h` frame under the first menu's camera and a lens shift. */
function project(p: V3, f: { w: number; h: number; lens: readonly [number, number] }): { x: number; y: number } {
  const fwd = norm(CAMERA.dir);
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const v: V3 = [p[0] - CAMERA.pos[0], p[1] - CAMERA.pos[1], p[2] - CAMERA.pos[2]];
  const t = Math.tan((CAMERA.fovDeg * Math.PI) / 360);
  const d = dot(v, fwd);
  return { x: (dot(v, right) / d / (t * (f.w / f.h)) * 0.5 + 0.5) * f.w + f.lens[0], y: (-(dot(v, up) / d / t) * 0.5 + 0.5) * f.h + f.lens[1] };
}

/** The screen box (x, right, y, bottom) of a plane box standing at `spot`. */
function screenBox(spot: V3, x0: number, x1: number, y1: number, f: { w: number; h: number; lens: readonly [number, number] }): { l: number; r: number; t: number; b: number } {
  const pts = [
    project([spot[0] + x0, spot[1], spot[2]], f),
    project([spot[0] + x1, spot[1], spot[2]], f),
    project([spot[0] + x1, spot[1] + y1, spot[2]], f),
    project([spot[0] + x0, spot[1] + y1, spot[2]], f),
  ];
  return { l: Math.min(...pts.map((p) => p.x)), r: Math.max(...pts.map((p) => p.x)), t: Math.min(...pts.map((p) => p.y)), b: Math.max(...pts.map((p) => p.y)) };
}

/** A creature's screen box from a spot and a height. */
function creatureBox(id: GauntletCreatureId, spot: V3, height: number, f: (typeof FRAMES)[number]) {
  const b = BOX[id];
  return screenBox(spot, b.x0 * height, b.x1 * height, b.y1 * height, f);
}

/** Auron's box in a frame, from the model. */
function auronBox(f: (typeof FRAMES)[number]) {
  return screenBox([AURON.x, 0, AURON.z], -AURON.halfW, AURON.halfW, AURON.height, f);
}

/** The eight bodies G-1 moves; the ninth, the Ultima Buster, is the listed exception. */
const MOVED: readonly GauntletCreatureId[] = GAUNTLET_CREATURES.filter((id) => id !== 'ultima-buster');

describe('the Gauntlet stages every creature clear of the party at the first menu (G-1)', () => {
  it('the model reads Auron where the browser did: his right edge within 2 px at both sizes', () => {
    for (const f of FRAMES) expect(Math.abs(auronBox(f).r - f.auronRight), f.size).toBeLessThanOrEqual(2);
  });

  for (const f of FRAMES) {
    for (const id of MOVED) {
      it(`act ${GAUNTLET_CREATURES.indexOf(id) + 1} (${id}) at ${f.size}: its painted box ends at least ${f.minGap} px right of Auron's and left of the turn list's rows`, () => {
        const auronR = Math.max(auronBox(f).r, f.auronRight); // the measured edge is the stricter of the two when the model is a pixel short
        const b = creatureBox(id, GAUNTLET_SPOTS[id], GAUNTLET_HEIGHTS[id], f);
        expect(b.l - auronR, 'gap to Auron').toBeGreaterThanOrEqual(f.minGap);
        expect(b.r, 'right edge against the turn list').toBeLessThanOrEqual(f.rail);
      });
    }
  }

  it('the staging before G-1 put Don Tonberry and the Cactuar King on Auron at both sizes (the check can fail)', () => {
    for (const f of FRAMES) {
      for (const id of ['cactuar-king', 'don-tonberry'] as const) {
        const old = BEFORE[id];
        const b = creatureBox(id, old.spot, old.height, f);
        expect(b.l - auronBox(f).r, `${id} before, ${f.size}`).toBeLessThan(0);
      }
    }
  });

  it('every one of the nine acts is accounted for: eight are staged clear and the Ultima Buster is the one exception, left as it was', () => {
    expect([...MOVED, 'ultima-buster']).toEqual([...GAUNTLET_CREATURES]);
    expect(GAUNTLET_SPOTS['ultima-buster']).toEqual(BEFORE['ultima-buster'].spot);
    expect(GAUNTLET_HEIGHTS['ultima-buster']).toBe(BEFORE['ultima-buster'].height);
    // The exception really is one: its body, at the spot it keeps, still stands across Auron.
    const f = FRAMES[0];
    expect(creatureBox('ultima-buster', GAUNTLET_SPOTS['ultima-buster'], GAUNTLET_HEIGHTS['ultima-buster'], f).l).toBeLessThan(auronBox(f).r);
  });

  it('G-1 changed the bodies by staging only: the Dome\'s depth, and no body taller than before', () => {
    for (const id of MOVED) {
      expect(GAUNTLET_SPOTS[id][2], `${id} depth`).toBe(BEFORE[id].spot[2]);
      expect(GAUNTLET_SPOTS[id][0], `${id} stands right of where it stood`).toBeGreaterThan(BEFORE[id].spot[0]);
      expect(GAUNTLET_HEIGHTS[id], `${id} height`).toBeLessThanOrEqual(BEFORE[id].height);
      expect(GAUNTLET_HEIGHTS[id], `${id} not below half its estimate`).toBeGreaterThanOrEqual(BEFORE[id].height * 0.5);
    }
    expect(GAUNTLET_HEIGHTS['don-tonberry']).toBe(BEFORE['don-tonberry'].height); // the narrow stand-in needs no shrink: only a move
  });
});
