"""Step 3b, variants: parts' other images, cut from OTHER paintings of the same figure (format v2; both games, shared plumbing; the rig-expressive lane, 2026-10-19).

    python rig.py variants --subject S        after `fit-keys` (or a keys file copied to <work>/fit/keys.json) and before `export`

A key that bends the idle's body leans it; the painting of that pose has its own head, neck and wing shapes (a lunge, a thrown-back head). A variant brings those shapes in: the part's pixels
for that key are CUT from the pose's own painting and registered to the key's bone, so the key draws the painting's expressive piece on the rig's body at the idle's scale.

  build.variants.<part>.<name>.from_painting = {
      "pose": "attack",                  the painting `characters/<id>/<pose>@Nx.png` the piece is cut from
      "poly": [[x, y], ...],             the cut, in master px of the IDLE frame (the frame a key of that pose is drawn in: the painting registered as the gate registers it; `tools/rig/lane` gridview shows it)
      "mask": "<png>", "mask_pad": 600,  INSTEAD of "poly": an 8-bit mask image (a partition made by a tool: the label of each painting pixel, dilated into its neighbours for the underlap) in master px of the idle frame
                                         with `mask_pad` px of margin on every side (the idle frame's top-left corner is at (mask_pad, mask_pad)); the painting's alpha is kept where the mask is set, the cut has no feather
      "cutline": [[[x, y], ...], ...],   the stretches of the polygon's edge that run THROUGH the figure: alpha fades to nothing toward them over `feather` px (the part under shows through the seam)
      "feather": 14,
      "register": "attack",              the fitted key whose pose of the part's bone places the cut where the painting has it (a key that shows the variant must keep that pose)
      "scale": 1.0                       the piece is drawn `scale` times the painting's size about `anchor` (default: the middle of the cutline) ...
      "scaleArea": 1.0                   ... or the scale that makes the piece's mesh area this fraction of the part's own (the head's size never jumps between keys)
      "opaqueArea": 1.0                  ... or the scale that makes the piece's OPAQUE pixels (alpha > 127) this fraction of the part's own opaque pixels: the size the player sees. The gate's head reading (CHK-026,
                                         `critic/runner/lib/continuity-rig.mjs`) is the MESH area, which is the opaque pixels plus a margin of transparent mesh whose width depends on the piece's shape; with `meshArea` as well
                                         the margin is chosen (the mesh's `grow`, searched) so that the mesh area is also this fraction of the part's mesh area: both readings of the head are then one number
      "meshArea": 1.0                    (with "opaqueArea") the mesh area, as a fraction of the part's own, to reach by choosing the mesh's grow (whole px, 0 to "growMax" 80); the smallest grow that reaches it, or the nearer of
                                         the two either side. The piece's pixels are not touched, only the transparent margin the mesh keeps round them
      "bone": "wingRA",                  the bone the piece is rigid on (default: the part's own rigid bone) ...
      "skin": "chain",                   ... or skinned along the part's own chain (`build.skin.<part>`, weights from the rest positions): a wing's variant bends at its joints as the part does
      "tex": 0.5,                        the PNG's resolution as a fraction of the master (a big sheet fits the texel budget at half); the mesh is still in master px
      "fill_joints": 40,                 (or {bone: radius}): fill discs of this radius (master px) at the posed places of the chain's bone joints (a rigid piece: its bone's pivot) under the register key (what the joints' hole test watches),
                                         added to "fill": a limb whose joint the painting draws at the edge of the limb, or a shoulder the cut leaves open
      "fill": [[x, y, r], ...]           discs (master px of the idle frame) whose transparent pixels the cut fills with the painting's own colours around them, classically extended (`rig_geom.extend_fill`): where
                                         the painting has a gap (the sky inside a neck loop) that a joint's hole test needs solid, because the part it used to cover is now the variant
      "mesh": {"edge": 18, "inner": 34, "grow": 10}}

  build.normals = {"dir": "D:/pyrefly-art-maps", "scale": 0.5}   (the build's, `rig_normals.py`): every variant also writes `<part>.<name>.normal.png`, the same window of the pose painting's normal map, and names it `normal`

The record written into build.json is the part's variant record of format v2 with its own mesh: `png`, `rim`, `box`, `verts` (REST px: the registered cut mapped back through the key's bone), `uvs`, `triangles`;
it is rigid on a bone or skinned along the part's chain (the box only says the PNG's size and sits inside the image: the mesh and uvs place it). Re-run this step after any refit of the key's bones (the registration reads them). `fit.keys.<pose>.image: {part: name}` makes the key show it (rig_v2.py).
"""
from __future__ import annotations

import math

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

import rig_geom as R
import rig_normals
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


def fit_grow(mesh_at, want: float, hi: int = 80) -> int:
    """The whole-px mesh margin whose mesh area (`mesh_at(g)[2]`, never smaller for a bigger `g`) is nearest `want`: the smallest margin that reaches it, or the nearer of that one and the one below it. 0 when a margin
    of 0 is already over `want` (the margin cannot be negative); `hi` when `hi` is not enough."""
    lo = 0
    if mesh_at(lo)[2] >= want:
        return lo
    if mesh_at(hi)[2] < want:
        return hi
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if mesh_at(mid)[2] < want:
            lo = mid
        else:
            hi = mid
    return hi if abs(mesh_at(hi)[2] - want) <= abs(mesh_at(lo)[2] - want) else lo


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
    painting_wh = (rgba.shape[1], rgba.shape[0])
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
    ncfg = rig_normals.settings(sub)
    nrm = rig_normals.register(rig_normals.load_map(sub, ncfg, spec["pose"], painting_wh), ax, ay) if ncfg else None
    to_p = lambda pts: [(x - ox, y - oy) for x, y in pts]  # noqa: E731
    if spec.get("mask"):
        mk = np.asarray(Image.open(sub.rel(spec["mask"])).convert("L"), np.float32) / 255.0
        pad = int(spec.get("mask_pad", 0))
        h0, w0 = rgba.shape[:2]
        yy, xx = np.mgrid[0:h0, 0:w0]
        my, mx = yy + oy + pad, xx + ox + pad
        ok = (my >= 0) & (my < mk.shape[0]) & (mx >= 0) & (mx < mk.shape[1])
        inside = np.where(ok, mk[np.clip(my, 0, mk.shape[0] - 1), np.clip(mx, 0, mk.shape[1] - 1)], 0.0)
        a_cut = rgba[..., 3].astype(np.float32) * inside
    else:
        a_cut = cut_alpha(rgba[..., 3], to_p(spec["poly"]), [to_p(c) for c in spec.get("cutline", [])], float(spec.get("feather", 14)))
    joint_q: list = []  # (post-scale target centre, radius) of the fill_joints discs: where the hole test looks, under the key's pose, AFTER the piece is scaled
    if spec.get("fill_joints"):
        fj = spec["fill_joints"]
        model.pose(**key_pose_args(keys[spec["register"]]))
        if spec.get("skin") == "chain":
            names, joints, _ = chain_spec(sub, part, build)
        else:  # a rigid piece: the joint the hole test watches is its bone's own pivot
            bone = spec.get("bone") or part.get("bone")
            if not isinstance(bone, str):
                raise SystemExit("rig variants: fill_joints on a piece that is neither chain-skinned nor rigid on one bone")
            at = {b["name"]: (b["x"], b["y"]) for b in build["bones"]}
            names, joints = [bone], [list(at[bone])]
        for nm, jt in zip(names, joints):
            rr = float(fj.get(nm, 0) if isinstance(fj, dict) else fj)
            if rr <= 0:
                continue
            q = bone_matrix(model, nm) @ np.array([jt[0], jt[1], 1.0])
            joint_q.append((float(q[0]), float(q[1]), rr))
            say(f"    fill_joints: {nm} at ({q[0]:.0f}, {q[1]:.0f}) r {rr:.0f}")
    part_area = mesh_area(np.array(part["verts"], np.float64).reshape(-1, 2), np.array(part["triangles"]).reshape(-1, 3))
    part_opaque = None  # opaqueArea: the part's own opaque pixels (alpha > 127 of its PNG, the idle's piece at the master's scale): what the player sees of it
    if "opaqueArea" in spec:
        part_opaque = float((np.asarray(Image.open(build_dir / part["png"]).convert("RGBA"))[..., 3] > 127).sum())
        if "scaleArea" in spec:
            raise SystemExit(f"rig variants: {part['name']}:{name} names both scaleArea and opaqueArea")
    if "meshArea" in spec and part_opaque is None:
        raise SystemExit(f"rig variants: {part['name']}:{name} names meshArea without opaqueArea")
    mc = spec.get("mesh", {"edge": 18, "inner": 34, "grow": 10})
    m = float(spec.get("scale", 1.0))
    anchor = np.array(spec["anchor"], np.float64) if spec.get("anchor") else (np.mean([p for c in spec.get("cutline", []) for p in c], 0) if spec.get("cutline") else None)
    for _pass in range(6):  # the piece is scaled about its anchor AFTER it is cut and filled, and a scaleArea piece's scale depends on what the fill added: the discs are placed in the painting's frame (before the scale) from the post-scale targets, and the scale re-measured until it settles
        img = rgba.copy()
        a_pass = a_cut
        fills = [list(f) for f in spec.get("fill", [])]
        for qx, qy, rr in joint_q:
            if anchor is not None and m != 1.0:
                fills.append([anchor[0] + (qx - anchor[0]) / m, anchor[1] + (qy - anchor[1]) / m, rr / m])
            else:
                fills.append([qx, qy, rr])
        if fills:
            yy, xx = np.mgrid[0:a_cut.shape[0], 0:a_cut.shape[1]]
            zone = np.zeros(a_cut.shape, bool)
            for fx, fy, fr in fills:
                zone |= (xx + ox - fx) ** 2 + (yy + oy - fy) ** 2 <= fr * fr
            known = a_cut >= 128
            need = zone & ~known
            img[..., :3] = np.where(need[..., None], np.clip(R.extend_fill(rgba[..., :3], known, zone), 0, 255), rgba[..., :3]).astype(np.uint8)
            a_pass = np.where(need, 255.0, a_cut)
        ys, xs = np.nonzero(a_pass > 8)
        x0, x1, y0, y1 = max(0, xs.min() - 4), xs.max() + 5, max(0, ys.min() - 4), ys.max() + 5
        img[..., 3] = np.clip(a_pass, 0, 255).astype(np.uint8)
        crop = R.dilate_rgb(img[y0:y1, x0:x1], 8)
        rim = (R.outer_edge_mask(rgba[..., 3])[y0:y1, x0:x1] * (crop[..., 3] > 8) * 255).astype(np.uint8)
        P, tris = R.build_mesh(crop[..., 3] > 8, edge_step=mc.get("edge", 18.0), inner_step=mc.get("inner", 34.0), domain_grow=mc.get("grow", 10), seed=1)
        M = P + np.array([x0 + ox, y0 + oy], np.float64)  # the piece in master px of the idle frame, as the painting has it
        anchor_used = anchor if anchor is not None else np.mean(M, 0)
        if part_opaque is not None:
            m_new = math.sqrt(spec["opaqueArea"] * part_opaque / max(1.0, float((crop[..., 3] > 127).sum())))
        else:
            m_new = math.sqrt(spec["scaleArea"] * part_area / mesh_area(M, tris)) if "scaleArea" in spec else m
        settled = abs(m_new - m) < 5e-4 and (anchor is not None or _pass > 0)
        m = m_new
        if anchor is None:
            anchor = anchor_used
        if settled or not (joint_q and ("scaleArea" in spec or part_opaque is not None)):
            break
    grown = None
    if "meshArea" in spec:  # the mesh's margin, chosen so that the MESH area (the gate's head reading) is also the wanted fraction of the part's, at the scale the opaque pixels asked for
        want = spec["meshArea"] * part_area / (m * m)
        dom = crop[..., 3] > 8
        cache: dict = {}

        def mesh_at(g: int):
            if g not in cache:
                P_, T_ = R.build_mesh(dom, edge_step=mc.get("edge", 18.0), inner_step=mc.get("inner", 34.0), domain_grow=g, seed=1)
                cache[g] = (P_, T_, mesh_area(P_, T_))
            return cache[g]

        g = fit_grow(mesh_at, want, int(spec.get("growMax", 80)))
        P, tris, a_g = mesh_at(g)
        M = P + np.array([x0 + ox, y0 + oy], np.float64)
        grown = g
        say(f"    meshArea {spec['meshArea']}: grow {g} gives {a_g * m * m / part_area:.4f} of the part's mesh (opaque scale {m:.4f})")
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
        small = np.asarray(Image.fromarray(pm.astype(np.uint8), "RGBA").resize((tw, th), Image.HAMMING if spec.get("filter", "hamming") == "hamming" else Image.LANCZOS), np.float32)  # HAMMING: Lanczos rings at a mask's hard edge and the un-premultiply turns it into a pale line (Shiva-x)
        small[..., :3] = np.where(small[..., 3:4] > 0, small[..., :3] * 255.0 / np.maximum(small[..., 3:4], 1.0), 0)
        crop = R.dilate_rgb(np.clip(small, 0, 255).astype(np.uint8), 4)
        rim = np.asarray(Image.fromarray(rim, "L").resize((tw, th), Image.BOX))
    Image.fromarray(crop, "RGBA").save(build_dir / f"{fn}.png")
    Image.fromarray(rim, "L").save(build_dir / f"{fn}.rim.png")
    normal = {}
    if nrm is not None:  # the same window of the pose painting's normal map (no rotation or flip anywhere in the cut), opaque RGB at the master's half or the colour's own scale when smaller
        nw = rig_normals.window(nrm, y0, y1, x0, x1)
        rig_normals.save_piece(build_dir / f"{fn}.normal.png", nw, rig_normals.piece_size((w, h), ncfg, f))
        normal = {"normal": f"{fn}.normal.png"}
    bw, bh = crop.shape[1], crop.shape[0]
    say(f"  variant {part['name']}:{name}: cut of {spec['pose']} {w}x{h} (png {bw}x{bh}), {len(P)} verts, scale {m:.3f} (mesh area {mesh_area(M, tris) / part_area:.3f} of the part's{f', mesh grow {grown}' if grown is not None else ''}), registered to the {spec['register']} key's {bone}")
    return {"png": f"{fn}.png", "rim": f"{fn}.rim.png", **normal, "box": [int(min(max(0, rest[:, 0].min()), max(0, build["image"]["w"] - bw))), int(min(max(0, rest[:, 1].min()), max(0, build["image"]["h"] - bh))), int(bw), int(bh)], **skin,
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
