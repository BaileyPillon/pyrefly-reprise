import { Vector3 } from 'three';
import { backToShared, statureOf } from '../../SharedHeight.ts';
import { figOf, type Actor, type Fig } from './geometry.ts';

/**
 * The party as CHAPTER FRAMING and BOSS SCALE plan it: at the shared height, whatever the heroes' own (r3941-heights; FFX only in
 * effect, FFX-2, FF7, the fiends and `?stature=off` carry no stature and come back untouched; the reason and the factor's source are
 * in `engine/SharedHeight.ts`).
 *
 * The planners read the figures' live quads: today's party height, the floor under it (90 % of its mean), the menu clearance's
 * candidates and every colossus's size (a multiple of the party's mean) would all have moved with the party, and with them the camera
 * and the bosses. They are handed each hero scaled back about his feet by his stature, which is the figure they were always handed:
 * the same boxes, the same plan, the same camera, the same boss. Everything that shows the figure still reads the real one: only the
 * plan is blind to the stature. Presentation only (rule 1): pure maths on a copy of the figure.
 */

export { statureOf };

/** `f` scaled about the ground point `g` by `1 / k`: the figure at the shared height (the plane is scaled about its feet row, which stands on `g`). */
export function atSharedHeight(f: Fig, g: Vector3, k: number): Fig {
  if (k === 1) return f;
  const back = (v: Vector3): Vector3 => backToShared(v.clone(), g, k);
  return {
    ...f,
    feet: back(f.feet),
    h: f.h / k,
    halfW: f.halfW / k,
    ...(f.quad ? { quad: f.quad.map(back) } : {}),
    ...(f.down ? { down: f.down.map(back) } : {}),
  };
}

/** One figure as the planners read it: {@link figOf}, with a hero the stage scaled brought back to the shared height. */
export function planFigOf(a: Actor): Fig {
  const f = figOf(a);
  const k = statureOf(a);
  return k === 1 ? f : atSharedHeight(f, a.getWorldPosition(new Vector3()), k);
}
