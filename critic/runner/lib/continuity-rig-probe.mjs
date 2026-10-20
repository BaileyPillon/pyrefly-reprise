// Continuity harness: the in-page reader of a RIGGED figure (CHK-026 size continuity, CHK-027 continuity of motion; R57-002 of the release 57 focused review).
//
// A rigged figure (`src/engine/rig/RigActor.ts`) is a `PaintedActor` that draws no plane: its parts hang under the actor and move with the bones, and the plane the probe
// reads is the idle painting, mapped but never drawn. Read as a painted figure it never changes pose (the carrier stays on its idle), has no swap, and its plane carries only the
// stage's own motion, so a rigged knock-out, a rigged hurt and every bone move read as nothing: stature null, 0 px everywhere, a PASS that measured nothing (the lane kit's
// `tools/rig/lane/track.mjs` says the same of the Kimahri and Lulu handoffs). This reader gives the probe what a viewer sees move instead, from the running build's own public
// surface (no engine hook, so it also reads a build that is already live): `rigInfo()` (is it a rig), `pose` (the key shown or moved to) and `blending` (a move between keys is
// in flight), `landmark(name)` (a landmark of the posed rig in the actor's local space), `feetPoint()` (the lowest foot of the shape the gate stamped for the key, blended
// through a move), `contentQuad()` (the painted box of that shape) and `figure.plane.children` (the part meshes, skinned every frame).
//
// What it returns for one frame (`sample`), all in CSS px on the canvas unless it says otherwise:
//   key, busy       the key being shown and whether a move between two keys is in flight
//   q               the painted box of the key (top-left, top-right, bottom-right, bottom-left), in the same order as a plane's corners: the strips crop to it, the jerk candidate reads its bottom
//   rg.h, f, c      the head, the feet and the centroid; rg.cs how far the camera alone moved each of them since the last frame (only while the camera moves)
//   rg.hu, fu, cu   the same three in the idle plane's own coordinates (u across from the left, t down from the top, 0..1: the master's pixels over its size), where neither the stage's
//                   motion (a lunge, a recoil, a hop) nor the camera is: what the pose itself moved, as a painted swap reads its two planes in one frame
//   rg.ha, ma       the area of the `head` part's mesh and of every drawn part, in the plane's own units (a head the rig resizes shows in `ha`; the rig's gate keeps it at 1.0000)
//   rg.hv           (only when present) the name of a head VARIANT part drawn at a real size in this key: another part that carries a head, which the key brings in over the head part (Lulu's front-view
//                   upper body: `front` in format v2; `fdef` and `fod` in version 1, where the part is stored as a speck that is always visible and is told apart by its area, `variantMinArea` of the plane)
//   rg.bh, bw       the key's painted box as a fraction of the idle plane's height (a stature against the idle's; a lying figure's length)
//   rg.pw, ph       the idle plane's size on screen (CSS px), to turn a fraction of the plane into px
//
// The three landmark names (head, centroid, and the soles when the gate stamped no foot) are the first of each list in `cfg` that the rig has; rigs name them as the author did
// (`headCenter` and `pelvisCenter` on the people, `head` and `bodyCenter` on the aeons).
//
// `createRigReader` is stringified and run inside the game's page with the probe (continuity.mjs `attachProbe`): it must stay self-contained, nothing outside its body is in scope.
// `tests/unit/critic-continuity-rig.test.ts` runs it in node against a fake rig actor, and `critic-continuity-contract.test.ts` pins every engine name it reads.
// Game case: both (shared critic plumbing; the rigs it reads today are FFX's Kimahri, Lulu and the aeons, and Valefor, which the FFX-2 Besaid chapter shares).
export function createRigReader(cfg) {
  const R1 = (v) => Math.round(v * 10) / 10, R4 = (v) => Math.round(v * 10000) / 10000, R7 = (v) => Math.round(v * 1e7) / 1e7;
  const CORNERS = [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]; // top-left, top-right, bottom-right, bottom-left of a plane's unit quad
  const found = new Map(); // rig name -> the landmark names that resolved, so a missing name is tried once
  const variants = Array.isArray(cfg.headVariants) ? cfg.headVariants : []; // parts, other than the head part, that carry a head when a key brings them in
  const variantMin = Number.isFinite(cfg.variantMinArea) ? cfg.variantMinArea : 0.02; // smallest share of the idle plane's area at which such a part counts as drawn

  const is = (a) => Boolean(a) && typeof a.rigInfo === 'function' && typeof a.landmark === 'function' && typeof a.feetPoint === 'function' && typeof a.contentQuad === 'function';

  /** The inverse of a column-major affine 4x4, as `{ r: 3x3 row-major, t }`, or null for a singular one. */
  const invert = (m) => {
    const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    if (!det) return null;
    const k = 1 / det;
    const r = [(e * i - f * h) * k, (c * h - b * i) * k, (b * f - c * e) * k, (f * g - d * i) * k, (a * i - c * g) * k, (c * d - a * f) * k, (d * h - e * g) * k, (b * g - a * h) * k, (a * e - b * d) * k];
    const x = m[12], y = m[13], z = m[14];
    return { r, t: [-(r[0] * x + r[1] * y + r[2] * z), -(r[3] * x + r[4] * y + r[5] * z), -(r[6] * x + r[7] * y + r[8] * z)] };
  };
  const apply = (iv, p) => [iv.r[0] * p[0] + iv.r[1] * p[1] + iv.r[2] * p[2] + iv.t[0], iv.r[3] * p[0] + iv.r[4] * p[1] + iv.r[5] * p[2] + iv.t[1], iv.r[6] * p[0] + iv.r[7] * p[1] + iv.r[8] * p[2] + iv.t[2]];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

  /** The area of a mesh's triangles in its own plane (x, y), by what the skinning left in its position attribute this frame; null when it cannot be read. */
  const areaOf = (mesh) => {
    try {
      const g = mesh.geometry, pos = g.getAttribute('position').array, idx = g.index ? g.index.array : null;
      const T = idx ? idx.length / 3 : pos.length / 9;
      let area = 0;
      for (let t = 0; t < T; t++) {
        const i0 = idx ? idx[t * 3] : t * 3, i1 = idx ? idx[t * 3 + 1] : t * 3 + 1, i2 = idx ? idx[t * 3 + 2] : t * 3 + 2;
        area += Math.abs((pos[i1 * 3] - pos[i0 * 3]) * (pos[i2 * 3 + 1] - pos[i0 * 3 + 1]) - (pos[i1 * 3 + 1] - pos[i0 * 3 + 1]) * (pos[i2 * 3] - pos[i0 * 3])) / 2;
      }
      return area;
    } catch { return null; }
  };

  /**
   * One frame of a rigged figure. `P(point)` projects a world point to CSS px on the canvas, `Pp(point)` the same under the PREVIOUS frame's camera (null while the camera is still):
   * the probe's own projections, so the points read here and the planes it reads elsewhere share one camera. Null when the rig is not built yet or nothing could be read.
   */
  const sample = (a, P, Pp) => {
    let info;
    try { info = a.rigInfo(); } catch { return null; }
    const slot = a.slots && a.slots[a.active | 0];
    if (!info || !slot || !slot.mesh || !a.matrixWorld) return null;
    const M = slot.mesh.matrixWorld.elements, Am = a.matrixWorld.elements;
    const iv = invert(M);
    if (!iv) return null;
    const name = info.name || '';
    const world = (l) => (l ? [Am[0] * l.x + Am[4] * l.y + Am[12], Am[1] * l.x + Am[5] * l.y + Am[13], Am[2] * l.x + Am[6] * l.y + Am[14]] : null);
    const lm = (n) => { try { return world(a.landmark(n)); } catch { return null; } };
    let names = found.get(name);
    if (!names) {
      const first = (list) => (list || []).find((n) => lm(n) !== null) ?? null;
      names = { head: first(cfg.head), centroid: first(cfg.centroid) };
      found.set(name, names);
    }
    const head = names.head ? lm(names.head) : null, cen = names.centroid ? lm(names.centroid) : null;
    let feet = null;
    try { const f = a.feetPoint(); if (f) feet = [f.x, f.y, f.z]; } catch { feet = null; }
    if (!feet) {
      const ps = (cfg.feet || []).map(lm).filter(Boolean);
      if (ps.length) feet = [0, 1, 2].map((i) => ps.reduce((s, p) => s + p[i], 0) / ps.length);
    }
    let box = null;
    try { const q = a.contentQuad(); if (q && q.length === 4) box = [q[3], q[2], q[1], q[0]].map((v) => [v.x, v.y, v.z]); } catch { box = null; }
    // the idle plane, the frame every number below is a fraction of
    const plane = CORNERS.map(([lx, ly]) => [M[0] * lx + M[4] * ly + M[12], M[1] * lx + M[5] * ly + M[13], M[2] * lx + M[6] * ly + M[14]]);
    const pp = plane.map((p) => P(p));
    const uv = (p) => { if (!p) return null; const q = apply(iv, p); return [R4(q[0] + 0.5), R4(0.5 - q[1])]; };
    const scr = (p) => (p ? P(p) : null);
    const shift = (p) => { if (!p || !Pp) return [0, 0]; const s = P(p), o = Pp(p); return [s[0] - o[0], s[1] - o[1]]; };
    const r1 = (xy) => (xy ? [R1(xy[0]), R1(xy[1])] : null);
    const q = box ? box.flatMap((p) => { const s = P(p); return [R1(s[0]), R1(s[1])]; }) : null;
    const planeH = Math.hypot(M[4], M[5], M[6]) || 1;
    let ha = null, ma = null, hv = null;
    try {
      const kids = a.figure.plane.children;
      let sum = 0, any = false;
      for (const m of kids) {
        if (!m.visible) continue;
        const ar = areaOf(m);
        if (ar === null) continue;
        sum += ar; any = true;
        if (m.name === (cfg.headPart || 'head')) ha = ar;
        // R59 (decision 146): a key may bring in ANOTHER part that carries a head (Lulu's front-view upper body); a version 1 rig stores it as a speck that is always visible, so it counts as drawn only at a real size
        else if (hv === null && variants.indexOf(m.name) >= 0 && ar >= variantMin) hv = m.name;
      }
      ma = any ? sum : null;
    } catch { ha = null; ma = null; hv = null; }
    const rg = {
      b: a.blending ? 1 : 0, h: r1(scr(head)), f: r1(scr(feet)), c: r1(scr(cen)),
      hu: uv(head), fu: uv(feet), cu: uv(cen),
      ha: ha === null ? null : R7(ha), ma: ma === null ? null : R7(ma), ...(hv === null ? {} : { hv }),
      bh: box ? R4(dist2(box[0], box[3]) / planeH) : null, bw: box ? R4(dist2(box[0], box[1]) / planeH) : null,
      pw: R1(dist(pp[0], pp[1])), ph: R1(dist(pp[0], pp[3])),
    };
    if (Pp) {
      const cs = [shift(head), shift(feet), shift(cen)].flat().map(R1);
      if (cs.some((v) => Math.abs(v) >= 0.05)) rg.cs = cs;
    }
    return { name, key: String(a.pose), busy: Boolean(a.blending), q, rg };
  };
  return { is, sample };
}
