/**
 * **The camera state and its solver**: the rig FFX's battle camera scripts drive, replayed (`D:\Tools\ffx-parity\camera\programs\evrae\SPEC.md` sections 3 and 4, which this follows closely;
 * CAMERA.md for the decompile).
 *
 * The rig is two **points**, the look-at (`REF`) and the eye (`EYE`), a **roll** and a **lens** (`scrDpt`). A script never moves the camera by itself: it writes a **destination** (`Set*`), may
 * **arm a move** (`Move*`), and the solver, once per logic step (1/29.97 s) after the scripts have run, turns destination and moves into this step's position.
 *
 * - **Destinations** are Cartesian (`refSetPos`), polar about the other point (`camSetPolar`: the eye is `len` from the look-at at a yaw and pitch) or a character-relative recipe
 *   (`./recipe.ts`, re-solved every step against the live actors). A `Set*` also lands in the point's working vector, and for every axis with no move armed the point is there at once: that is a
 *   **hard cut**. A `Set*` never touches the start or the records, so while a move is armed it only changes where that move is heading.
 * - **A blend** is `Set K0; Move(n); Set K1`: arming latches the CURRENT destination as the start, then the next `Set*` is the end. The move interpolates x, y and z (a straight line, what
 *   `camMove`, `camMoveCos` and `camMoveAcc` do) or, for the `Polar` variants, yaw, pitch and length about the look-at (an arc). Yaw, pitch and roll take the short way round.
 *   `camMove*` also arms the roll and the lens, which is how a script blends a zoom; `refMove*` arms only the look-at.
 * - **`camResetMove`/`refResetMove` freeze the point where it is** (they clear the records and re-set the destination to the working position); they do not jump to the destination.
 * - **Order in a step**: the look-at first, then the eye (whose polar base is the look-at's working vector, as updated this step), then roll and lens.
 * - **Output**: eye and look-at in FFX units (Y down), the roll in radians, the lens, and the vertical field of view `2 * atan(240 / scrDpt)` degrees at 4:3.
 *
 * Time is not here: the VM (`./vm.ts`) runs scripts and calls {@link CameraSolver.step} once per logic step. Pure: no DOM, no `three`. Game case: FFX only.
 */

import { cartToPolar, D2R, polarToCart, R2D, vfovDeg } from './geometry.ts';
import type { WorldView } from './host.ts';
import type { Vec3 } from './ir.ts';
import { makeRecipe, solveRecipe, type Recipe } from './recipe.ts';
import { armedRecord, emptyMove, stepAxis, type MoveRecord, type MoveShape } from './stepper.ts';

export const REF = 0;
export const EYE = 1;
export type PointId = 0 | 1;

/** The camera's state for one step, in FFX units (Y down); `roll` in radians, `fovDeg` the vertical field of view. */
export interface CameraPose {
  readonly eye: Vec3;
  readonly ref: Vec3;
  readonly roll: number;
  readonly scrDpt: number;
  readonly fovDeg: number;
}

type Destination =
  | { readonly kind: 'pos'; readonly v: Vec3 }
  | { readonly kind: 'polar'; readonly v: Vec3 }
  | { readonly kind: 'recipe'; readonly recipe: Recipe; last: Vec3 };

class Point {
  dest: Destination = { kind: 'pos', v: [0, 0, 0] };
  /** The working vector: what the stepper writes, what the other point reads as its polar base, and what the point is at. */
  work: Vec3 = [0, 0, 0];
  workPolar: Vec3 = [0, 0, 1];
  start: Vec3 = [0, 0, 0];
  startPolar: Vec3 = [0, 0, 1];
  polarMove = false;
  rec: [MoveRecord, MoveRecord, MoveRecord] = [emptyMove(), emptyMove(), emptyMove()];
  /** The solved position this point is rendered at. */
  val: Vec3 = [0, 0, 0];

  get armed(): boolean {
    return this.rec.some((r) => r.n !== 0);
  }
  /** The destination is a (yaw, pitch, length) about the other point. */
  get polarDest(): boolean {
    return this.dest.kind === 'polar' || (this.dest.kind === 'recipe' && this.dest.recipe.kind >= 3);
  }
}

/** The roll or the lens: one number with a destination, a start and a record. */
class Scalar {
  dest: number;
  work: number;
  start: number;
  val: number;
  rec: MoveRecord = emptyMove();
  constructor(
    initial: number,
    readonly wrap: boolean,
  ) {
    this.dest = this.work = this.start = this.val = initial;
  }
  set(v: number): void {
    this.dest = this.work = v;
    if (this.rec.n === 0) this.val = v;
  }
  arm(shape: MoveShape): void {
    this.rec = armedRecord(shape);
    this.start = this.work;
  }
  step(): void {
    this.work = stepAxis(this.wrap, this.dest, this.start, this.rec);
    this.val = this.work;
  }
  /** Cancel the record and stay at the working value. */
  freeze(): void {
    this.rec.n = 0;
    this.dest = this.val = this.work;
  }
}

export class CameraSolver {
  private readonly refP = new Point();
  private readonly eyeP = new Point();
  private readonly rollS = new Scalar(0, true);
  private readonly lensS = new Scalar(1024, false); // 1024: the default screen depth of every controller slot, 26.38 degrees

  constructor(private readonly world: WorldView) {}

  private point(p: PointId): Point {
    return p === REF ? this.refP : this.eyeP;
  }

  // ------------------------------------------------------------------ Set*

  setPos(p: PointId, x: number, y: number, z: number): void {
    const P = this.point(p);
    P.dest = { kind: 'pos', v: [x, y, z] };
    this.commit(p);
  }

  /** `camSetPolar` / `refSetPolar`: degrees in, radians kept. */
  setPolar(p: PointId, thetaDeg: number, phiDeg: number, len: number): void {
    const P = this.point(p);
    P.dest = { kind: 'polar', v: [thetaDeg * D2R, phiDeg * D2R, len] };
    this.commit(p);
  }

  /** `camSetRoll`: degrees in, radians kept. */
  setRoll(deg: number): void {
    this.rollS.set(deg * D2R);
  }

  setScrDpt(v: number): void {
    this.lensS.set(v);
  }

  /** The character-relative calls (`kind` 0..4, see `./recipe.ts`); the selectors are resolved now. */
  setRecipe(p: PointId, kind: Recipe['kind'], selA: number, selB: number, a3: number, a4Deg: number, a5Deg: number, a6: number): void {
    this.point(p).dest = { kind: 'recipe', recipe: makeRecipe(kind, selA, selB, a3, a4Deg, a5Deg, a6, this.world), last: [0, 0, 0] };
    this.commit(p);
  }

  // ------------------------------------------------------------------ Move*

  /** `Move*`: replace the point's records (t = 0), latch the start from its CURRENT working destination; `camMove*` also arms the roll and the lens. */
  armMove(p: PointId, shape: MoveShape): void {
    const P = this.point(p);
    const O = this.point(p === REF ? EYE : REF);
    P.rec = [armedRecord(shape), armedRecord(shape), armedRecord(shape)];
    P.polarMove = shape.polar;
    if (P.polarDest) {
      P.startPolar = P.workPolar;
      P.start = polarToCart(O.work, P.workPolar[0], P.workPolar[1], P.workPolar[2]);
    } else {
      P.start = P.work;
      P.startPolar = cartToPolar(P.work, O.work);
    }
    if (p === EYE) {
      this.rollS.arm(shape);
      this.lensS.arm(shape);
    }
  }

  /** `camResetMove` / `refResetMove`: cancel the records and freeze where the point is (the eye also freezes its roll and lens). */
  resetMove(p: PointId): void {
    const P = this.point(p);
    for (const r of P.rec) {
      r.n = 0;
      r.t = 0;
    }
    const w = P.work;
    if (p === EYE) {
      this.rollS.rec.n = 0;
      this.lensS.rec.n = 0;
    }
    this.setPos(p, w[0], w[1], w[2]);
    if (p === EYE) {
      this.lensS.freeze();
      this.rollS.freeze();
    }
  }

  /** `camWait` / `refWait` poll this: is a move still armed on the point (the eye: or on its roll or lens)? */
  busy(p: PointId): boolean {
    return this.point(p).armed || (p === EYE && (this.rollS.rec.n !== 0 || this.lensS.rec.n !== 0));
  }

  // ------------------------------------------------------------------- step

  /** One logic step, after the scripts: the look-at, then the eye, then roll and lens. */
  step(): void {
    for (const p of [REF, EYE] as const) {
      const P = this.point(p);
      const O = this.point(p === REF ? EYE : REF);
      this.resolve(p);
      if (!P.armed) {
        P.val = P.work;
        continue;
      }
      if (P.polarMove) {
        const wp = P.polarDest ? P.workPolar : cartToPolar(P.work, O.work);
        const s = P.startPolar;
        const stepped: Vec3 = [stepAxis(true, wp[0], s[0], P.rec[0]), stepAxis(true, wp[1], s[1], P.rec[1]), stepAxis(false, wp[2], s[2], P.rec[2])];
        P.workPolar = stepped;
        P.work = polarToCart(O.work, stepped[0], stepped[1], stepped[2]);
      } else {
        P.work = [stepAxis(false, P.work[0], P.start[0], P.rec[0]), stepAxis(false, P.work[1], P.start[1], P.rec[1]), stepAxis(false, P.work[2], P.start[2], P.rec[2])];
      }
      P.val = P.work;
    }
    this.rollS.step();
    this.lensS.step();
  }

  // ----------------------------------------------------------------- output

  pose(): CameraPose {
    const lens = this.lensS.val;
    return { eye: this.eyeP.val, ref: this.refP.val, roll: this.rollS.val, scrDpt: lens, fovDeg: vfovDeg(lens) };
  }

  /** The roll in degrees, as `camGetRoll` returns it. */
  get rollDeg(): number {
    return this.rollS.val * R2D;
  }

  get scrDpt(): number {
    return this.lensS.val;
  }

  // -------------------------------------------------------------- internals

  /** Write the point's destination into its working vector against the world as it stands. */
  private resolve(p: PointId): void {
    const P = this.point(p);
    const O = this.point(p === REF ? EYE : REF);
    const d = P.dest;
    if (d.kind === 'pos') {
      P.work = d.v;
    } else if (d.kind === 'polar') {
      P.workPolar = d.v;
      P.work = polarToCart(O.work, d.v[0], d.v[1], d.v[2]);
    } else {
      const s = solveRecipe(d.recipe, this.world);
      if (!s) P.work = d.last;
      else if ('cart' in s) P.work = s.cart;
      else {
        P.workPolar = s.polar;
        P.work = polarToCart(O.work, s.polar[0], s.polar[1], s.polar[2]);
      }
      d.last = P.work;
    }
  }

  /** `FUN_007C0790`: after a `Set*`, every axis with no armed move is at the new destination at once. */
  private commit(p: PointId): void {
    const P = this.point(p);
    this.resolve(p);
    P.val = [P.rec[0].n === 0 ? P.work[0] : P.val[0], P.rec[1].n === 0 ? P.work[1] : P.val[1], P.rec[2].n === 0 ? P.work[2] : P.val[2]];
  }
}
