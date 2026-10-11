/**
 * **The per-axis stepper**: how FFX's camera blends one number (an x, a y, a z, a yaw, a pitch, a length, a roll, a lens) from where it was to where a script said it should go
 * (`D:\Tools\ffx-parity\camera\programs\evrae\SPEC.md` section 4.4; CAMERA.md 2.3).
 *
 * A **move record** is armed by a `Move` call and then stepped once per logic step by the solver (`./solver.ts`): `t` runs 0..n, the value at each `t` is one of three curves, and once `t` has passed
 * `n` the record clears (so a move armed with `n` steps is evaluated n + 1 times, and the last evaluation lands exactly on the destination).
 *
 * - **kind 1, linear** (`camMove(n)`): `start + (dest - start) * t / n`.
 * - **kind 2, trapezoid** (`camMoveAcc(a, b, c, d)`, n = a + b + c): the velocity ramps from `v0` over `a` steps, holds for `b`, ramps back over `c`; the ramp slope is solved so the displacements add up to
 *   exactly `dest - start`. `d` is a constant base velocity `(dest - start) / d` (0 gives 0), and a = c with d = 0 is a symmetric S curve.
 * - **kind 3, cosine** (`camMoveCos(n)`): `start + (dest - start) * (1 - cos(pi t / n)) / 2`. (The engine's cosine argument is not visible in the decompile, SPEC 4.4 marks it Read; it is the ease that
 *   starts and ends at rest.)
 *
 * An axis that wraps (a yaw, a pitch, a roll) first maps the destination to the equivalent angle within half a turn of the start, so a move from -170 degrees to +170 sweeps 20, not 340: the short way.
 *
 * Pure numbers, no DOM, no `three`. Game case: FFX only (the curves are FFX's).
 */

export type MoveKind = 1 | 2 | 3;

/** One axis's move. `n` is the total steps (0 = nothing armed); `kind` is 0 only on an empty record. */
export interface MoveRecord {
  kind: 0 | MoveKind;
  n: number;
  t: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

export const emptyMove = (): MoveRecord => ({ kind: 0, n: 0, t: 0, a: 0, b: 0, c: 0, d: 0 });

/** What a `Move*` call asks for. `n` is the length of a linear or cosine move; a trapezoid is `a + b + c` long. */
export interface MoveShape {
  readonly kind: MoveKind;
  readonly n?: number;
  readonly a?: number;
  readonly b?: number;
  readonly c?: number;
  readonly d?: number;
  /** A polar move interpolates the eye's yaw, pitch and length about the look-at (an arc); the other interpolates x, y and z (a straight line). */
  readonly polar: boolean;
}

const whole = (v: number | undefined): number => (v !== undefined && Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0);

/** A fresh, armed record for `shape`; with no steps it is empty (an armed move of zero steps moves nothing). */
export function armedRecord(shape: MoveShape): MoveRecord {
  if (shape.kind === 2) {
    const a = whole(shape.a);
    const b = whole(shape.b);
    const c = whole(shape.c);
    const n = a + b + c;
    return n === 0 ? emptyMove() : { kind: 2, n, t: 0, a, b, c, d: whole(shape.d) };
  }
  const n = whole(shape.n);
  return n === 0 ? emptyMove() : { kind: shape.kind, n, t: 0, a: 0, b: 0, c: 0, d: 0 };
}

/** The angle equivalent to `target` that lies within half a turn of `start`: where a short-way move aims. */
export function nearestAngle(start: number, target: number): number {
  let d = (target - start) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  else if (d < -Math.PI) d += 2 * Math.PI;
  return start + d;
}

/**
 * The value of one axis for this logic step, and the record advanced by one step (cleared after its last). With no move armed the destination is returned untouched, so a point whose axes are not
 * moving simply sits on its destination.
 */
export function stepAxis(wrap: boolean, destination: number, start: number, rec: MoveRecord): number {
  if (rec.n === 0) return destination;
  const dest = wrap ? nearestAngle(start, destination) : destination;
  const { t, n } = rec;
  let v: number;
  if (rec.kind === 1) {
    v = ((dest - start) * t) / n + start;
  } else if (rec.kind === 3) {
    v = (1 - Math.cos((Math.PI * t) / n)) * (dest - start) * 0.5 + start;
  } else {
    const { a, b, c, d } = rec;
    const v0 = d === 0 ? 0 : (dest - start) / d;
    const q = (a - Math.trunc(c / 2)) * c + (Math.trunc(a / 2) + b) * a;
    const k = q !== 0 ? (dest - start - n * v0) / q : 0;
    const v1 = v0 + k * a;
    const p1 = start + (k * a * 0.5 + v0) * a;
    if (t < a) v = start + t * (k * t * 0.5 + v0);
    else if (a + b < t) {
      if (t < n) {
        const s = t - a - b;
        v = p1 + b * v1 + s * (v1 - s * k * 0.5);
      } else v = dest;
    } else v = (t - a) * v1 + p1;
  }
  rec.t += 1;
  if (rec.t > rec.n) rec.n = 0; // the record is cleared once t has passed n
  return v;
}
