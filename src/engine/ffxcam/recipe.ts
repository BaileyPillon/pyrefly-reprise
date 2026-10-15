/**
 * **Character-relative framing** (`SPEC.md` 4.6): most of FFX's spell, item and cast shots are not fixed points but recipes around live characters: "the targets, raised by 122 percent of their
 * height, then this far round them". The scripts call `refSetBtl` / `refSetBtlPolar` / `camSetBtlPolar2` / `camSetChrPolar2` with two selectors and four numbers; the solver (`./solver.ts`) keeps the
 * recipe and re-solves it EVERY step against the characters' current frames, so a shot follows an actor that moves.
 *
 * A recipe has two groups of characters (selector A and selector B; B is usually "none"). Each step, for the groups that have anyone on the field:
 *
 * - the point is the mean over the groups of the group's mean aim position, **raised by `hfac` times the mean height** (Y is down, so it subtracts);
 * - kinds 1 and 3 add a polar offset of radius `rfac * meanWidth`, kinds 2 and 4 one of `rfac * 10 + meanWidth` (the `...2` calls), at yaw `theta0 + heading` and pitch `phi0`;
 * - `heading` is the groups' mean heading, or, with two different groups, the direction from the first group to the second;
 * - kinds 1 and 2 are Cartesian (the offset is added to the point); kinds 3 and 4 are polar (the same triple is a yaw, pitch and length about the OTHER point);
 * - with nobody on the field the recipe has no answer and the point keeps its previous destination.
 *
 * `hfac` and `rfac` are the script's percentages divided by 100; `theta0` and `phi0` are the script's degrees in radians.
 *
 * Pure. Game case: FFX only.
 */

import type { WorldView } from './host.ts';
import type { Vec3 } from './ir.ts';
import { D2R, polarToCart } from './geometry.ts';

export interface Recipe {
  /** 0: the centroid only (`refSetBtl`); 1/2: Cartesian with the offset; 3/4: polar about the other point (`camSetChrPolar`, `camSetChrPolar2`). */
  readonly kind: 0 | 1 | 2 | 3 | 4;
  readonly maskA: readonly number[];
  readonly maskB: readonly number[];
  readonly hfac: number;
  readonly theta0: number;
  readonly phi0: number;
  readonly rfac: number;
}

/** What a recipe resolves to this step: a Cartesian destination, or a (yaw, pitch, length) triple about the other point. */
export type RecipeSolution = { readonly cart: Vec3 } | { readonly polar: Vec3 };

/** A recipe from a call's arguments (the script's units): the selectors are resolved NOW, to character masks, and kept. */
export function makeRecipe(kind: Recipe['kind'], selA: number, selB: number, a3: number, a4Deg: number, a5Deg: number, a6: number, world: WorldView): Recipe {
  return { kind, maskA: world.select(selA), maskB: world.select(selB), hfac: a3 / 100, theta0: a4Deg * D2R, phi0: a5Deg * D2R, rfac: a6 / 100 };
}

interface Group {
  readonly pos: Vec3;
  readonly height: number;
  readonly width: number;
  readonly heading: number;
}

/** The mean frame of the characters of `mask` that are on the field, or null when none is. */
function groupOf(mask: readonly number[], world: WorldView): Group | null {
  let n = 0;
  let x = 0;
  let y = 0;
  let z = 0;
  let height = 0;
  let width = 0;
  let heading = 0;
  for (const chr of mask) {
    const f = world.actor(chr);
    if (!f) continue;
    n++;
    x += f.pos[0];
    y += f.pos[1];
    z += f.pos[2];
    height += f.height;
    width += f.width;
    heading += f.heading;
  }
  return n === 0 ? null : { pos: [x / n, y / n, z / n], height: height / n, width: width / n, heading: heading / n };
}

/** The recipe's destination for this step against the world as it stands, or null when nobody is on the field. */
export function solveRecipe(r: Recipe, world: WorldView): RecipeSolution | null {
  const groups = [groupOf(r.maskA, world), groupOf(r.maskB, world)].filter((g): g is Group => g !== null);
  const n = groups.length;
  if (n === 0) return null;
  let x = 0;
  let y = 0;
  let z = 0;
  let height = 0;
  let width = 0;
  let heading = 0;
  for (const g of groups) {
    x += g.pos[0];
    y += g.pos[1];
    z += g.pos[2];
    height += g.height;
    width += g.width;
    heading += g.heading;
  }
  x /= n;
  y = y / n - r.hfac * (height / n);
  z /= n;
  width /= n;
  heading /= n;
  const first = groups[0];
  const second = groups[1];
  if (first && second && r.maskA.join() !== r.maskB.join()) heading = Math.atan2(second.pos[2] - first.pos[2], second.pos[0] - first.pos[0]);
  if (r.kind === 0) return { cart: [x, y, z] };
  const radius = r.kind === 2 || r.kind === 4 ? r.rfac * 10 + width : r.rfac * width;
  if (r.kind >= 3) return { polar: [r.theta0 + heading, r.phi0, radius] };
  return { cart: polarToCart([x, y, z], r.theta0 + heading, r.phi0, radius) };
}
