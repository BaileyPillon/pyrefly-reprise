"""Step 3b, variants: parts' other images, cut from OTHER paintings of the same figure (format v2; both games, shared plumbing; the rig-expressive lane, 2026-10-19).

    python rig.py variants --subject S        after `fit-keys` (or a keys file copied to <work>/fit/keys.json) and before `export`

A key that bends the idle's body leans it; the painting of that pose has its own head, neck and wing shapes (a lunge, a thrown-back head). A variant brings those shapes in: the part's pixels
for that key are CUT from the pose's own painting and registered to the key's bone, so the key draws the painting's expressive piece on the rig's body at the idle's scale.

  build.variants.<part>.<name>.from_painting = {
      "pose": "attack",                  the painting `characters/<id>/<pose>@Nx.png` the piece is cut from
      "poly": [[x, y], ...],             the cut, in master px of the IDLE frame (the frame a key of that pose is drawn in: the painting registered as the gate registers it; `tools/rig/lane` gridview shows it)
      "cutline": [[[x, y], ...], ...],   the stretches of the polygon's edge that run THROUGH the figure: alpha fades to nothing toward them over `feather` px (the part under shows through the seam)
      "feather": 14,
      "register": "attack",              the fitted key whose pose of the part's bone places the cut where the painting has it (a key that shows the variant must keep that pose)
      "scale": 1.0                       the piece is drawn `scale` times the painting's size about `anchor` (default: the middle of the cutline) ...
      "scaleArea": 1.0                   ... or the scale that makes the piece's mesh area this fraction of the part's own (the head's size never jumps between keys)
      "bone": "wingRA",                  the bone the piece is rigid on (default: the part's own rigid bone) ...
      "skin": "chain",                   ... or skinned along the part's own chain (`build.skin.<part>`, weights from the rest positions): a wing's variant bends at its joints as the part does
      "tex": 0.5,                        the PNG's resolution as a fraction of the master (a big sheet fits the texel budget at half); the mesh is still in master px
      "fill_joints": 40,                 (or {bone: radius}) for a chain-skinned piece: fill discs of this radius (master px) at the posed places of the chain's bone joints under the register key (what the joints' hole test watches),
                                         added to "fill": a limb whose joint the painting draws at the edge of the limb, or a shoulder the cut leaves open
      "fill": [[x, y, r], ...]           discs (master px of the idle frame) whose transparent pixels the cut fills with the painting's own colours around them, classically extended (`rig_geom.extend_fill`): where
                                         the painting has a gap (the sky inside a neck loop) that a joint's hole test needs solid, because the part it used to cover is now the variant
      "mesh": {"edge": 18, "inner": 34, "grow": 10}}

The record written into build.json is the part's variant record of format v2 with its own mesh: `png`, `rim`, `box`, `verts` (REST px: the registered cut mapped back through the key's bone), `uvs`, `triangles`;
it is rigid on a bone or skinned along the part's chain (the box only says the PNG's size and sits inside the image: the mesh and uvs place it). Re-run this step after any refit of the key's bones (the registration reads them). `fit.keys.<pose>.image: {part: name}` makes the key show it (rig_v2.py).
"""
from __future__ import annotations

import math

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

import rig_geom as R
import rig_v2
from rig_common import Subject, load_rgba, read_json, say, write_json


def painting_map(T: dict, pose: str, S: int) -> tuple[float, float, float, float]:
    """`(ax, bx, ay, by)`: master px of the idle frame = a * (the pose painting's @Sx px) + b, from the targets' registration (`rig-targets.mjs`: how the gate places that painting)."""
    c, p = T["costume"], T["poses"][pose]["place"]
    u0, m0 = c["upp"], c["mirror"]
    ax = (p["upp"] * p["mirror"]) / (u0 * m0)
    return ax, S * (c["size"][0] / 2 + ((-p["W"] / 2) * p["upp"] * p["mirror"] + p["shift"] - c["shift"]) / (u0 * m0)), p["upp"] / u0, S * (c["anchor1"] - p["anchor"] * p["upp"] / u0)


def key_pose_args(key: dict) -> dict:
    b = key.get("bones", {})
    r = key.get("root", {})
    return dict(
        rot={n: t.get("rot", 0.0) for n, t in b.items()}, root=(r.get("dx", 0.0), r.get("dy", 0.0), r.get("rot", 0.0)),
        off={n: (t["dx"], t["dy"]) for n, t in b.items() if "dx" in t or "dy" in t},
        scl={n: (t.get("sx", 1.0), t.get("sy", t.get("sx", 1.0))) for n, t in b.items() if "sx" in t or "sy" in t})


def bone_matrix(model, bone: str) -> np.ndarray:
    k = model.k[model.idx[bone]]
    return np.array([[k[0], k[2], k[4]], [k[1], k[3], k[5]], [0, 0, 1]], np.float64)


def mesh_area(verts: np.ndarray, tris: np.ndarray) -> float:
    a, b, c = verts[tris[:, 0]], verts[tris[:, 1]], verts[tris[:, 2]]
    return float(np.abs((b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (c[:, 0] - a[:, 0]) * (b[:, 1] - a[:, 1])).sum() / 2)


def chain_spec(sub: Subject, part: dict, build: dict) -> tuple[list, list, list]:
    """`(bone names, joints in master px, ramps in master px)` of the part's chain skin, as `rig_build.py` reads them."""
    spec = ((sub.cfg.get("build") or {}).get("skin") or {}).get(part["name"])
    if not spec or spec.get("type") != "chain":
        raise SystemExit(f"rig variants: part {part['name']} has no chain skin in build.skin (skin: \"chain\" follows it)")
    S = sub.scale
    at = {b["name"]: (b["x"], b["y"]) for b in build["bones"]}
    joints = [list(at[j[1:]]) if isinstance(j, str) and j.startswith("@") else [j[0] * S, j[1] * S] for j in spec["joints"]]
    names = spec["bones"]
    ramps = [r * S for r in spec.get("ramps", [30])]
    ramps = (ramps + [ramps[-1]] * max(0, len(names) - 1 - len(ramps)))[: max(0, len(names) - 1)] or [30 * S]
    return names, joints, ramps


def skinned_rest(M: np.ndarray, names: list, joints: list, ramps: list, Ks: dict):
    """REST positions whose chain-skinned pose (linear blend of two adjacent bones, `Ks`: bone name -> 3x3, rest -> posed) is exactly `M`. The weights are stored numbers in the file, so they need not be a function
    of the REST position: they are the chain's own weights read at the POSED places (`M` against the chain polyline posed by `Ks`, the same ramps), and each rest position is then the linear solution
    r = B^-1 (M - t) of its own blend B. Returns `(rest, per-vertex [(bone name, weight), ...], worst residual in px)`."""
    k = len(names)
    Kn = np.array([Ks[nm] for nm in names])
    pts = [(Kn[min(i, k - 1)] @ np.array([joints[i][0], joints[i][1], 1.0]))[:2] for i in range(k + 1)]
    local = R.chain_weights(M, [list(p) for p in pts], ramps if k > 1 else [1.0])
    W = np.zeros((len(M), k))
    for v, pairs in enumerate(local):
        for i, w in pairs:
            W[v, i] = w
    B = np.einsum("vk,kij->vij", W, Kn)
    r = np.linalg.solve(B[:, :2, :2], (M - B[:, :2, 2])[..., None])[..., 0]
    resid = float(np.abs(np.einsum("vij,vj->vi", B[:, :2, :2], r) + B[:, :2, 2] - M).max())
    return r, [[(names[i], w) for i, w in pairs] for pairs in local], resid


def cut_alpha(alpha: np.ndarray, poly_px: list, cutlines_px: list, feather: float) -> np.ndarray:
    """The painting's alpha inside the polygon (4x supersampled edge), faded to nothing toward the cut lines."""
    h, w = alpha.shape
    big = Image.new("L", (w * 2, h * 2), 0)
    ImageDraw.Draw(big).polygon([(x * 2, y * 2) for x, y in poly_px], fill=255)
    inside = np.asarray(big.resize((w, h), Image.BOX), np.float32) / 255.0
    out = alpha.astype(np.float32) * inside
    if cutlines_px and feather > 0:
        line = Image.new("L", (w, h), 0)
        d = ImageDraw.Draw(line)
        for pl in cutlines_px:
            d.line([tuple(p) for p in pl], fill=255, width=2)
        dist = ndi.distance_transform_edt(np.asarray(line) == 0)
        t = np.clip(dist / feather, 0, 1)
        out *= t * t * (3 - 2 * t)
    return out


def variant_record(sub: Subject, part: dict, name: str, spec: dict, T: dict, model, keys: dict, build_dir, build: dict) -> dict:
    S = sub.scale
    src = sub.dir_chars / f"{spec['pose']}@{S}x.png"
    rgba = R.defringe_alpha(load_rgba(src))
    ax, bx, ay, by = painting_map(T, spec["pose"], S)
    if ax < 0 or ay < 0:
        raise SystemExit(f"rig variants: {spec['pose']} is registered turned about its stance (mirror); a variant of a turned painting is not built yet")
    if abs(ax - 1) > 1e-6 or abs(ay - 1) > 1e-6:  # a pose the model registered at a slightly different scale (Ifrit's attack 1.011, Shiva's hurt 1.012): the painting is resized into the idle frame first
        h0, w0 = rgba.shape[:2]
        pm = rgba.astype(np.float32)
        pm[..., :3] *= pm[..., 3:4] / 255.0
        size = (max(1, round(w0 * ax)), max(1, round(h0 * ay)))
        small = np.asarray(Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8), "RGBA").resize(size, Image.LANCZOS), np.float32)
        small[..., :3] = np.where(small[..., 3:4] > 0, small[..., :3] * 255.0 / np.maximum(small[..., 3:4], 1.0), 0)
        rgba = np.clip(small, 0, 255).astype(np.uint8)
    ox, oy = int(round(bx)), int(round(by))  # master px = painting px + (ox, oy) (a fraction of a px is dropped)
    to_p = lambda pts: [(x - ox, y - oy) for x, y in pts]  # noqa: E731
    a_cut = cut_alpha(rgba[..., 3], to_p(spec["poly"]), [to_p(c) for c in spec.get("cutline", [])], float(spec.get("feather", 14)))
    img = rgba.copy()
    fills = [list(f) for f in spec.get("fill", [])]
    if spec.get("fill_joints"):
        if spec.get("skin") != "chain":
            raise SystemExit("rig variants: fill_joints needs a chain-skinned piece (\"skin\": \"chain\")")
        names, joints, _ = chain_spec(sub, part, build)
        model.pose(**key_pose_args(keys[spec["register"]]))
        fj = spec["fill_joints"]
        for nm, jt in zip(names, joints):
            rr = float(fj.get(nm, 0) if isinstance(fj, dict) else fj)
            if rr <= 0:
                continue
            q = bone_matrix(model, nm) @ np.array([jt[0], jt[1], 1.0])
            fills.append([float(q[0]), float(q[1]), rr])
            say(f"    fill_joints: {nm} at ({q[0]:.0f}, {q[1]:.0f}) r {rr:.0f}")
    if fills:
        yy, xx = np.mgrid[0:a_cut.shape[0], 0:a_cut.shape[1]]
        zone = np.zeros(a_cut.shape, bool)
        for fx, fy, fr in fills:
            zone |= (xx + ox - fx) ** 2 + (yy + oy - fy) ** 2 <= fr * fr
        known = a_cut >= 128
        need = zone & ~known
        img[..., :3] = np.where(need[..., None], np.clip(R.extend_fill(rgba[..., :3], known, zone), 0, 255), rgba[..., :3]).astype(np.uint8)
        a_cut = np.where(need, 255.0, a_cut)
    ys, xs = np.nonzero(a_cut > 8)
    x0, x1, y0, y1 = max(0, xs.min() - 4), xs.max() + 5, max(0, ys.min() - 4), ys.max() + 5
    img[..., 3] = np.clip(a_cut, 0, 255).astype(np.uint8)
    crop = R.dilate_rgb(img[y0:y1, x0:x1], 8)
    rim = (R.outer_edge_mask(rgba[..., 3])[y0:y1, x0:x1] * (crop[..., 3] > 8) * 255).astype(np.uint8)
    mc = spec.get("mesh", {"edge": 18, "inner": 34, "grow": 10})
    P, tris = R.build_mesh(crop[..., 3] > 8, edge_step=mc.get("edge", 18.0), inner_step=mc.get("inner", 34.0), domain_grow=mc.get("grow", 10), seed=1)
    M = P + np.array([x0 + ox, y0 + oy], np.float64)  # the piece in master px of the idle frame, as the painting has it
    cl = [p for c in spec.get("cutline", []) for p in c] or [tuple(M.mean(0))]
    anchor = np.array(spec.get("anchor") or np.mean(cl, 0), np.float64)
    part_area = mesh_area(np.array(part["verts"], np.float64).reshape(-1, 2), np.array(part["triangles"]).reshape(-1, 3))
    m = float(spec.get("scale", 1.0))
    if "scaleArea" in spec:
        m = math.sqrt(spec["scaleArea"] * part_area / mesh_area(M, tris))
    M = anchor + m * (M - anchor)
    model.pose(**key_pose_args(keys[spec["register"]]))
    skin: dict = {}
    if spec.get("skin") == "chain":
        names, joints, ramps = chain_spec(sub, part, build)
        rest, pairs, resid = skinned_rest(M, names, joints, ramps, {n: bone_matrix(model, n) for n in names})
        bi = {b["name"]: i for i, b in enumerate(build["bones"])}
        flat: list = []
        for ps in pairs:
            (b0, w0), (b1, w1) = (ps + [(None, 0.0)])[:2]
            flat += [bi[b0], round(w0, 4), bi[b1] if b1 is not None else -1, round(w1, 4)]
        skin = {"weights": flat}
        bone = f"chain {'/'.join(names)}, worst residual {resid:.2f} px"
    else:
        bone = spec.get("bone") or part.get("bone")
        if not isinstance(bone, str):
            raise SystemExit(f"rig variants: part {part['name']} is not rigid on one bone: name the bone the variant is rigid on (\"bone\") or skin it along the chain (\"skin\": \"chain\")")
        rest = (np.linalg.inv(bone_matrix(model, bone)) @ np.column_stack([M, np.ones(len(M))]).T).T[:, :2]
        if spec.get("bone"):
            skin = {"bone": bone}
    fn = f"{part['name']}.{name}"
    h, w = crop.shape[:2]
    f = float(spec.get("tex", 1.0))
    if f != 1.0:  # a smaller PNG for the same mesh (uvs are fractions): the box says the PNG's own size, which is what the budget counts
        tw, th = max(1, round(w * f)), max(1, round(h * f))
        pm = crop.astype(np.float32)
        pm[..., :3] *= pm[..., 3:4] / 255.0  # premultiplied while resampling, so a transparent neighbour's colour never bleeds in
        small = np.asarray(Image.fromarray(pm.astype(np.uint8), "RGBA").resize((tw, th), Image.LANCZOS), np.float32)
        small[..., :3] = np.where(small[..., 3:4] > 0, small[..., :3] * 255.0 / np.maximum(small[..., 3:4], 1.0), 0)
        crop = R.dilate_rgb(np.clip(small, 0, 255).astype(np.uint8), 4)
        rim = np.asarray(Image.fromarray(rim, "L").resize((tw, th), Image.BOX))
    Image.fromarray(crop, "RGBA").save(build_dir / f"{fn}.png")
    Image.fromarray(rim, "L").save(build_dir / f"{fn}.rim.png")
    bw, bh = crop.shape[1], crop.shape[0]
    say(f"  variant {part['name']}:{name}: cut of {spec['pose']} {w}x{h} (png {bw}x{bh}), {len(P)} verts, scale {m:.3f} (mesh area {mesh_area(M, tris) / part_area:.3f} of the part's), registered to the {spec['register']} key's {bone}")
    return {"png": f"{fn}.png", "rim": f"{fn}.rim.png", "box": [int(min(max(0, rest[:, 0].min()), max(0, build["image"]["w"] - bw))), int(min(max(0, rest[:, 1].min()), max(0, build["image"]["h"] - bh))), int(bw), int(bh)], **skin,
            "verts": [round(float(v), 2) for v in rest.reshape(-1)], "uvs": [round(float(v), 5) for v in (P / np.array([w, h])).reshape(-1)], "triangles": [int(t) for t in tris.reshape(-1)]}


def run(sub: Subject) -> None:
    from rig_skin import RigModel
    cfg = (sub.cfg.get("build") or {}).get("variants") or {}
    build_dir = sub.work / "build"
    build = read_json(build_dir / "build.json")
    keys = read_json(sub.work / "fit" / "keys.json")
    T = read_json(sub.work / "targets" / "targets.json")
    model = RigModel({**build, "parts": [{k: v for k, v in p.items() if k != "variants"} for p in build["parts"]]}, build_dir)
    by = {p["name"]: p for p in build["parts"]}
    for pname, variants in cfg.items():
        for name, rec in variants.items():
            if "from_painting" in rec:
                by[pname].setdefault("variants", {})[name] = variant_record(sub, by[pname], name, rec["from_painting"], T, model, keys, build_dir, build)
    write_json(build_dir / "build.json", build)
