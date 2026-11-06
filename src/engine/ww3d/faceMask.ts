/**
 * **The face mask** (the hidden anime chapter; FFX-2 only): ported from the look lab's `meshy.mjs` `processHead`. A Meshy girl is one skinned mesh with one baked colour map, so the face is found, not painted: the head
 * bones' skin weights times an ellipse round the face in head space (the origin is the `Head` bone in the bind pose, +y up, +z forward, lengths in fractions of `H`, the distance from `Head` to `head_end`).
 *
 * - **`aFace`** (0..1 per vertex, `./cel.ts`): the face is shadow-free, rim-free and lit evenly, so a face has no blotches, no nose shadow and no line across the eyes.
 * - **Smoothed normals on the head**: pulled toward the sphere about the skull (strongly on the face, lightly on the hair), so the face has no nose or lip relief shading.
 * - **Outline weights** (`./outline.ts`): zero inside the face, full elsewhere, a thin contour round its edge by `faceThin`.
 *
 * The maths are pure functions on arrays ({@link faceMaskOf}, {@link smoothHeadNormals}, {@link hullWeights}), pinned by `tests/unit/ww3d/face-mask.test.ts` without a renderer; {@link measureFace} is the three.js adapter
 * that reads a loaded girl. The per-girl ellipse ({@link FACE_FIT}) was read off point-cloud previews of the skin disc of each face with a margin for the falloff; **it is for the girls as exported, and a pass that changes the head's
 * SHAPE must re-fit it**. The anime chapter's part-2 proportion pass (`tools/anime/proportion.mjs`) scales the head UNIFORMLY about its joint, which keeps the face in the same head-relative box: the vertices under the ellipse
 * read 132 / 193 / 204 (Yuna, Rikku, Paine) before it and 130 / 193 / 204 after it, so the fit stands (`anime-files.test.ts` pins the counts). Game case: FFX-2 only.
 */

import { BufferAttribute, Vector3, type Bone, type BufferGeometry, type Object3D, type SkinnedMesh } from 'three';

/** The face ellipse in head space: `cy` centre height, `rx`/`ry` half width and height, `dmin` the depth (forward of the `Head` bone) where the face begins, `inner` the share of the ellipse that is fully face. */
export interface FaceFit {
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly dmin: number;
  readonly inner: number;
}

export const FACE_FIT: Readonly<Record<'yuna' | 'rikku' | 'paine', FaceFit>> = {
  yuna: { cy: 0.25, rx: 0.36, ry: 0.31, dmin: 0.06, inner: 0.6 },
  rikku: { cy: 0.36, rx: 0.42, ry: 0.42, dmin: 0.06, inner: 0.6 },
  paine: { cy: 0.26, rx: 0.27, ry: 0.32, dmin: 0.06, inner: 0.6 },
};

/** The fit for a figure id, or Yuna's for an id with none. */
export function fitFor(id: string): FaceFit {
  return Object.prototype.hasOwnProperty.call(FACE_FIT, id) ? FACE_FIT[id as keyof typeof FACE_FIT] : FACE_FIT.yuna;
}

/** A smoothstep from `a` to `b`. */
export const sstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * The face mask of every vertex. `rel` is the vertices' positions in head space (x y z per vertex, metres: world minus the `Head` bone's origin), `hw` their head-bone weights (0..1), `H` the head's length,
 * `fit` the ellipse. A vertex under 0.05 of head weight is 0; the rest are the ellipse's falloff (1 inside `inner`, 0 at the edge) times the depth gate times the weight's own gate.
 */
export function faceMaskOf(rel: ArrayLike<number>, hw: ArrayLike<number>, H: number, fit: FaceFit): Float32Array {
  const n = hw.length;
  const mask = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (hw[i]! < 0.05) continue;
    const x = rel[i * 3]!;
    const y = rel[i * 3 + 1]!;
    const z = rel[i * 3 + 2]!;
    const e = Math.hypot(x / (fit.rx * H), (y - fit.cy * H) / (fit.ry * H));
    const ell = 1 - sstep(fit.inner, 1.0, e);
    const dep = sstep((fit.dmin - 0.06) * H, (fit.dmin + 0.06) * H, z);
    mask[i] = ell * dep * sstep(0.35, 0.75, hw[i]!);
  }
  return mask;
}

/**
 * The head's normals pulled toward the sphere about the skull `centre` (strong on the face: no nose or lip relief; light on the hair), in the vertices' own space. `pos` and `nor` are x y z per vertex; returns new
 * normals (the input is not changed); a vertex under 0.05 of head weight keeps its own. `stats` counts the head vertices and the face vertices (mask over 0.5).
 */
export function smoothHeadNormals(
  pos: ArrayLike<number>,
  nor: ArrayLike<number>,
  hw: ArrayLike<number>,
  mask: ArrayLike<number>,
  centre: readonly [number, number, number],
  faceNormals = 0.9,
  hairNormals = 0.45,
): { normals: Float32Array; headVerts: number; faceVerts: number } {
  const n = hw.length;
  const out = new Float32Array(nor.length);
  for (let i = 0; i < nor.length; i++) out[i] = nor[i]!;
  let headVerts = 0;
  let faceVerts = 0;
  for (let i = 0; i < n; i++) {
    if (hw[i]! < 0.05) continue;
    const k = hw[i]! * (hairNormals + (faceNormals - hairNormals) * mask[i]!);
    let ex = pos[i * 3]! - centre[0];
    let ey = (pos[i * 3 + 1]! - centre[1]) / 1.15;
    let ez = pos[i * 3 + 2]! - centre[2];
    const el = Math.hypot(ex, ey, ez) || 1;
    ex /= el;
    ey /= el;
    ez /= el;
    const nx = nor[i * 3]! + (ex - nor[i * 3]!) * k;
    const ny = nor[i * 3 + 1]! + (ey - nor[i * 3 + 1]!) * k;
    const nz = nor[i * 3 + 2]! + (ez - nor[i * 3 + 2]!) * k;
    const l = Math.hypot(nx, ny, nz) || 1;
    out[i * 3] = nx / l;
    out[i * 3 + 1] = ny / l;
    out[i * 3 + 2] = nz / l;
    headVerts++;
    if (mask[i]! > 0.5) faceVerts++;
  }
  return { normals: out, headVerts, faceVerts };
}

/** The outline's width weight per vertex: zero inside the face (`faceKill` 1 kills the line there; below 1 `faceThin` of it stays), full elsewhere. */
export function hullWeights(mask: ArrayLike<number>, faceThin: number, faceKill = 1.0): Float32Array {
  const w = new Float32Array(mask.length);
  for (let i = 0; i < w.length; i++) w[i] = 1 - faceKill * sstep(0.3, 0.75, mask[i]!) - (1 - faceKill) * faceThin * mask[i]!;
  return w;
}

/** What {@link measureFace} found about a girl's head. */
export interface FaceMeasure {
  /** The mask per vertex, and the head weight per vertex. */
  readonly mask: Float32Array;
  readonly hw: Float32Array;
  /** The geometry's normals before the head's were smoothed (the outline welds these). */
  readonly originalNormals: Float32Array;
  /** The head's length (Head to head_end) and the Head bone's origin, in the scene's world space at the time. */
  readonly H: number;
  readonly origin: Vector3;
  readonly headVerts: number;
  readonly faceVerts: number;
}

function subtreeBones(node: Object3D): Set<Object3D> {
  const s = new Set<Object3D>();
  node.traverse((o) => {
    if ((o as Partial<Bone>).isBone === true) s.add(o);
  });
  return s;
}

/**
 * Measure a girl's head, make her face mask and smooth her head's normals in place: sets `aFace` on the mesh's geometry. `root` is the model's scene in its bind pose with its world matrices current (nothing above it yet:
 * the measure is in the file's own units). Returns null for a figure with no `Head` and `head_end` bones or no skin (a boss, a weapon), or one already measured (the geometry has `aFace`).
 */
export function measureFace(root: Object3D, mesh: SkinnedMesh, id: string, fitOverride: Partial<FaceFit> = {}): FaceMeasure | null {
  const head = root.getObjectByName('Head');
  const top = root.getObjectByName('head_end');
  const g: BufferGeometry = mesh.geometry;
  const si = g.attributes['skinIndex'];
  const sw = g.attributes['skinWeight'];
  const p = g.attributes['position'];
  const nor = g.attributes['normal'];
  if (!head || !top || !si || !sw || !p || !nor || g.attributes['aFace']) return null;
  root.updateMatrixWorld(true);
  const O = head.getWorldPosition(new Vector3());
  const H = top.getWorldPosition(new Vector3()).sub(O).length();
  const heads = subtreeBones(head);
  const isHead = mesh.skeleton.bones.map((b) => heads.has(b));
  const n = p.count;
  const hw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let c = 0; c < 4; c++) if (isHead[si.getComponent(i, c)]) s += sw.getComponent(i, c);
    hw[i] = Math.min(1, s);
  }
  const rel = new Float32Array(n * 3);
  const v = new Vector3();
  for (let i = 0; i < n; i++) {
    if (hw[i]! < 0.05) continue;
    v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(mesh.matrixWorld).sub(O);
    rel[i * 3] = v.x;
    rel[i * 3 + 1] = v.y;
    rel[i * 3 + 2] = v.z;
  }
  const fit: FaceFit = { ...fitFor(id), ...fitOverride };
  const mask = faceMaskOf(rel, hw, H, fit);
  // the skull centre: the mean bind position of the strongly head-weighted vertices
  const c: [number, number, number] = [0, 0, 0];
  let cn = 0;
  for (let i = 0; i < n; i++) {
    if (hw[i]! <= 0.9) continue;
    c[0] += p.getX(i);
    c[1] += p.getY(i);
    c[2] += p.getZ(i);
    cn++;
  }
  if (cn > 0) for (let k = 0; k < 3; k++) c[k] = c[k]! / cn;
  const originalNormals = new Float32Array(nor.array as ArrayLike<number>);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = p.getX(i);
    pos[i * 3 + 1] = p.getY(i);
    pos[i * 3 + 2] = p.getZ(i);
  }
  const sm = smoothHeadNormals(pos, originalNormals, hw, mask, c);
  for (let i = 0; i < n; i++) nor.setXYZ(i, sm.normals[i * 3]!, sm.normals[i * 3 + 1]!, sm.normals[i * 3 + 2]!);
  nor.needsUpdate = true;
  g.setAttribute('aFace', new BufferAttribute(mask.slice(), 1));
  return { mask, hw, originalNormals, H, origin: O, headVerts: sm.headVerts, faceVerts: sm.faceVerts };
}
