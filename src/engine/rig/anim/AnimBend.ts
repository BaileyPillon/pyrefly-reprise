/**
 * A knee for a figure with no legs (pass 3 of the animation prototype, `?anim=proto&style=P3`; FFX Lulu; the maths is plumbing for any rig; erasable TS, no `three`, no DOM).
 *
 * Lulu's rig has no leg bones: a floor-length skirt hangs from her pelvis and the skirt's own skin blends the pelvis into one swing bone down to the hem (at the knee's height it is still half pelvis). A KO that
 * FOLDS needs the lower half of that skirt to behave like what is under it: when the hips drop the knees drop with them to the floor, and the skirt below the knee goes back and lies on the floor behind her. Two
 * things were tried on paper: leg bones in a new rig folder (the skirt's two influences a vertex cannot hold a pelvis, a swing bone and a shin at once, so every key's skirt would change) and this, a deformation of
 * the skirt's own vertices after they are skinned. This one leaves every key, the shipped rig and its gate exactly as they are, and is driven by one number a pose (`bend`, radians), so a clip authors a knee.
 *
 * What it does to a vertex whose bind y is below `y0` (`t` = 0 at `y0` to 1 at `y1`, smoothstep): the more the knee is bent (`a` = bend / `whole`, up to 1), the more the vertex is carried rigidly by the pelvis (the
 * leg is under the pelvis and drops with it) instead of by the skirt's own blend; it is then turned by `bend * t` about the knee (the pelvis-carried hinge point), and flattened toward the floor line as it lies
 * down (a hem lying behind a kneeling woman is a low mound of cloth, not an upright board: the sprite's thickness is scaled by `flat` as it turns).
 * At bend 0 nothing changes: the output is the skin's own, bit for bit.
 */

/** Which parts bend, where, about which point, carried by which bone. */
export interface BendSpec {
  /** The parts that are deformed (by name): the skirt and the train. */
  parts: readonly string[];
  /** The bone whose skin matrix carries the leg: the pelvis (by name). */
  carrier: string;
  /** Bind y (painting px) where the bend begins and where it is whole. */
  y0: number;
  y1: number;
  /** The knee in the bind pose, painting px. */
  hx: number;
  hy: number;
  /** The bend (radians) at which the leg is wholly carried by the pelvis. */
  whole: number;
  /** The share of its thickness a cloth keeps when it lies flat (a quarter turn): 1 keeps it all. */
  flat: number;
  /** Painting px the flattened cloth is lifted by when it lies flat (half its thickness, so it rests on the floor line rather than sinking into it). */
  lift: number;
}

const smooth = (u: number): number => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

/** One part's bend: built once from its bind vertices, `prepare`d every frame with the skeleton's skin matrices and the bend, then asked about each vertex. */
export class PartBend {
  private readonly t: Float32Array;
  private readonly carrier: number;
  private angle = 0;
  private a = 0;
  private hx = 0;
  private hy = 0;
  private k0 = 0;
  private k1 = 0;
  private k2 = 0;
  private k3 = 0;
  private k4 = 0;
  private k5 = 0;
  /** True when the last `prepare` found a bend: the skin's own vertices are then not used as they are. */
  active = false;

  private readonly verts: ArrayLike<number>;
  private readonly spec: BendSpec;

  /** `verts` are the part's bind vertices (x, y pairs, painting px); `carrier` the carrying bone's index. */
  constructor(verts: ArrayLike<number>, spec: BendSpec, carrier: number) {
    this.verts = verts;
    this.spec = spec;
    this.carrier = carrier;
    const n = verts.length / 2;
    this.t = new Float32Array(n);
    for (let i = 0; i < n; i++) this.t[i] = smooth((verts[i * 2 + 1]! - spec.y0) / (spec.y1 - spec.y0));
  }

  /** Read the bend and the carrier's skin matrix (`k`: six numbers a bone: x' = a x + c y + e, y' = b x + d y + f). */
  prepare(k: Float64Array, angle: number): void {
    this.angle = angle;
    this.active = angle !== 0 && Number.isFinite(angle);
    if (!this.active) return;
    const q = this.carrier * 6;
    this.k0 = k[q]!;
    this.k1 = k[q + 1]!;
    this.k2 = k[q + 2]!;
    this.k3 = k[q + 3]!;
    this.k4 = k[q + 4]!;
    this.k5 = k[q + 5]!;
    this.a = Math.min(1, Math.abs(angle) / this.spec.whole);
    this.hx = this.k0 * this.spec.hx + this.k2 * this.spec.hy + this.k4;
    this.hy = this.k1 * this.spec.hx + this.k3 * this.spec.hy + this.k5;
  }

  /** The bent place of vertex `i` whose skin put it at (`x`, `y`), into `out`. */
  at(i: number, x: number, y: number, out: { x: number; y: number }): void {
    const t = this.t[i]!;
    if (!this.active || t <= 0) {
      out.x = x;
      out.y = y;
      return;
    }
    const bx = this.verts[i * 2]!;
    const by = this.verts[i * 2 + 1]!;
    const w = this.a * t; // how much the leg carries it
    const lx = this.k0 * bx + this.k2 * by + this.k4;
    const ly = this.k1 * bx + this.k3 * by + this.k5;
    const px = x + (lx - x) * w - this.hx;
    const py = y + (ly - y) * w - this.hy;
    const th = this.angle * t;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const rx = px * c - py * s;
    let ry = px * s + py * c;
    const lie = Math.abs(Math.sin(th)); // 0 upright, 1 lying
    ry = ry * (1 - (1 - this.spec.flat) * lie) - this.spec.lift * lie;
    out.x = this.hx + rx;
    out.y = this.hy + ry;
  }
}
