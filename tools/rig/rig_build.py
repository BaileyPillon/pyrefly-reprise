"""Step 2, build: part images -> bones, triangle meshes, skin weights, landmarks (the bind pose).

    python rig.py build --subject kimahri

config["build"] (every coordinate is a 1x painting pixel; the build scales them to the master):

  "baseline": 1182                                   the ground row in 1x px; rig.baselineY = baseline * scale. Absent: the costume painting's registered anchor, asked of the pose model
  "bones":    [[name, parent | null, [x, y]], ...]   the skeleton; parents first. A bone pivots about its own joint
  "chains":   { prefix: { "part": p, "start": [x, y], "n": 5, "parent": bone, "manual": [[x, y], ...] } }
                                                     bones prefix0..prefix{n-1} laid along the medial path of part p from the skeleton point nearest `start` (tail, mane, sash, hair)
  "skin":     { part: { "type": "rigid", "bone": b, "mesh": M }
                       { "type": "chain", "bones": [b0, b1, ...], "joints": [j0, j1, ..., jn], "ramps": [r01, ...], "mesh": M }   joints: [x, y] or "@bone"; one more joint than bones;
                                                     a vertex takes the bone its place along the chain picks, blended over +-ramp px (1x) across each inner joint
                       { "type": "auto", "chain": prefix, "ramps": [14], "mesh": M }        the same along a `chains` entry
                       { "type": "hook", "name": n, "mesh": M }                             hooks.skin_<n>(state) returns fn(verts) -> [[(bone index, weight), ...] per vertex]
  M =        { "edge": 22, "inner": 44, "grow": 16 } | { "grid": [nx, ny] }               mesh density (master px); `grid` = a plain quad grid (a rigid prop)
  "landmarks": { name: [bone, [x, y]] }              bind points: `head` (required: the bone that carries the head), `feet`, footN, hand, spearTip ...
  "rim":      true                                   write a rim mask per part (white along the painting's own outline only)
  hooks:      build(state) may add parts (state.parts.append(record)) and bones (state.add_bone)

Writes <work>/build/<part>.png (cropped), <part>.rim.png and build.json: bones, parts (the rig file's own part records), landmarks, in master px.
"""
from __future__ import annotations

import types

import numpy as np
from PIL import Image

import rig_geom as R
from rig_common import Subject, costume_anchor, load_rgba, say, write_json


def _sj(state, j):
    if isinstance(j, str) and j.startswith("@"):
        return list(state.bones[state.BI[j[1:]]][2])
    return [j[0] * state.S, j[1] * state.S]


def export_part(state, name, order, rgba_part, mesh_cfg, weights_fn, margin=4, rim=True, rim_everywhere=False):
    """Crop one part to its alpha, write its PNG and rim mask, build its mesh and skin it. Returns the part record of the rig file."""
    mesh_cfg = mesh_cfg or {}
    a = rgba_part[..., 3]
    ys, xs = np.nonzero(a > 8)
    if len(xs) == 0:
        raise SystemExit(f"rig build: part {name} is empty")
    H, W = a.shape
    x0, x1 = max(0, xs.min() - margin), min(W, xs.max() + 1 + margin)
    y0, y1 = max(0, ys.min() - margin), min(H, ys.max() + 1 + margin)
    crop = R.dilate_rgb(rgba_part[y0:y1, x0:x1], 8)
    if mesh_cfg.get("grid"):
        P, T = R.grid_mesh((crop.shape[1], crop.shape[0]), *mesh_cfg["grid"])
    else:
        P, T = R.build_mesh(crop[..., 3] > 8, edge_step=mesh_cfg.get("edge", 22.0), inner_step=mesh_cfg.get("inner", 40.0), domain_grow=mesh_cfg.get("grow", 16), seed=mesh_cfg.get("seed", 1))
    verts = P + np.array([x0, y0], np.float64)
    skin = weights_fn(verts)
    out = state.out
    Image.fromarray(crop, "RGBA").save(out / f"{name}.png")
    rec = {"name": name, "order": order, "png": f"{name}.png", "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)],
           "verts": [round(float(v), 2) for v in verts.reshape(-1)], "triangles": [int(t) for t in T.reshape(-1)]}
    if rim and not rim_everywhere:
        r = (R.outer_edge_mask(state.painting_alpha)[y0:y1, x0:x1] * 255).astype(np.uint8)
        Image.fromarray(r, "L").save(out / f"{name}.rim.png")
        rec["rim"] = f"{name}.rim.png"
    if rim_everywhere:
        rec["rimEverywhere"] = True
    flat_b, flat_w = [], []
    for s in skin:
        b0, w0 = s[0]
        b1, w1 = s[1] if len(s) > 1 else (-1, 0.0)
        flat_b += [int(b0), int(b1) if b1 >= 0 else -1]
        flat_w += [round(float(w0), 4), round(float(w1), 4)]
    if all(b == flat_b[0] for b in flat_b[0::2]) and all(b == -1 for b in flat_b[1::2]):
        rec["bone"] = state.bones[flat_b[0]][0]  # one bone for every vertex: a rigid part
    else:
        rec["bones"], rec["weights"] = flat_b, flat_w
    return rec


def run(sub: Subject) -> None:
    cfg = sub.cfg["build"]
    S = sub.scale
    parts_dir = sub.work / "parts"
    cut_json = parts_dir / "cut.json"
    if not cut_json.exists():
        raise SystemExit("rig build: run `cut` first (no parts/cut.json)")
    order = list(sub.cfg["cut"]["order"])
    master = load_rgba(sub.costume_master)
    H, W = master.shape[:2]
    state = types.SimpleNamespace(sub=sub, cfg=cfg, S=S, H=H, W=W, out=sub.sub("build"), order=order, R=R, parts=[], np=np)
    state.painting_alpha = R.defringe_alpha(master)[..., 3]
    state.bones = [(n, p, tuple(float(c) * S for c in at)) for n, p, at in cfg["bones"]]
    state.BI = {b[0]: i for i, b in enumerate(state.bones)}

    def add_bone(name, parent, at_master):
        state.BI[name] = len(state.bones)
        state.bones.append((name, parent, (float(at_master[0]), float(at_master[1]))))

    state.add_bone = add_bone
    img = lambda n: np.array(Image.open(parts_dir / f"part_{n}.png").convert("RGBA"))  # noqa: E731
    cutm = lambda n: np.array(Image.open(parts_dir / f"cut_{n}.png")) > 0  # noqa: E731
    state.img, state.cutm = img, cutm
    # ---- chains along the medial path of a part
    state.chains = {}
    for prefix, c in (cfg.get("chains") or {}).items():
        mask = cutm(c["part"])
        pts = np.array([[x * S, y * S] for x, y in c["manual"]], np.float64) if c.get("manual") else R.centerline_chain(mask, (c["start"][0] * S, c["start"][1] * S), c["n"], S)
        state.chains[prefix] = pts
        prev = c["parent"]
        for i in range(len(pts) - 1 if c.get("manual") else c["n"]):
            add_bone(f"{prefix}{i}", prev, (pts[i][0], pts[i][1]))
            prev = f"{prefix}{i}"
        say(f"  chain {prefix}: {(pts / S).round(0).tolist()}")
    hooks = sub.hooks()

    def skin_fn(spec):
        t = spec["type"]
        if t == "rigid":
            b = state.BI[spec["bone"]]
            return lambda verts: [[(b, 1.0)] for _ in verts]
        if t in ("chain", "auto"):
            if t == "auto":
                pts = state.chains[spec["chain"]]
                names = [f"{spec['chain']}{i}" for i in range(len(pts) - 1)]
                joints = [list(p) for p in pts]
            else:
                names = spec["bones"]
                joints = [_sj(state, j) for j in spec["joints"]]
                if len(joints) != len(names) + 1:
                    raise SystemExit(f"rig build: skin chain {names} needs {len(names) + 1} joints, has {len(joints)}")
            ramps = [r * S for r in spec.get("ramps", [30])]
            ramps = (ramps + [ramps[-1]] * max(0, len(names) - 1 - len(ramps)))[: max(0, len(names) - 1)] or [30 * S]

            def fn(verts):
                local = R.chain_weights(verts, joints, ramps if len(names) > 1 else [1.0])
                return [[(state.BI[names[i]], wt) for i, wt in pairs] for pairs in local]

            return fn
        if t == "hook":
            return getattr(hooks, f"skin_{spec['name']}")(state)
        raise SystemExit(f"rig build: unknown skin type {t!r}")

    records = []
    for i, n in enumerate(order):
        spec = cfg["skin"].get(n)
        if spec is None:
            raise SystemExit(f"rig build: part {n!r} has no entry in build.skin")
        rec = export_part(state, n, i, img(n), spec.get("mesh"), skin_fn(spec), rim=cfg.get("rim", True), rim_everywhere=spec.get("rimEverywhere", False))
        records.append(rec)
        say(f"  {n:14s} verts {len(rec['verts']) // 2:4d} tris {len(rec['triangles']) // 3:4d} box {rec['box']}")
    state.parts = records
    if hooks and hasattr(hooks, "build"):
        hooks.build(state)
    records = sorted(state.parts, key=lambda r: r["order"])
    BI = state.BI
    lm = {}
    for k, (b, at) in (cfg.get("landmarks") or {}).items():
        lm[k] = {"bone": b, "x": round(float(at[0]) * S, 2), "y": round(float(at[1]) * S, 2)}
    for k, v in (getattr(state, "landmarks_extra", {}) or {}).items():
        lm[k] = v
    for k, v in lm.items():
        if v["bone"] not in BI:
            raise SystemExit(f"rig build: landmark {k} names bone {v['bone']!r}, which does not exist")
    if "head" not in lm:
        raise SystemExit("rig build: the config needs a `head` landmark (the bone that carries the head)")
    bones = [{"name": n, "parent": (BI[p] if p else -1), "x": round(float(x), 2), "y": round(float(y), 2)} for n, p, (x, y) in state.bones]
    verts = sum(len(r["verts"]) // 2 for r in records)
    baseline = cfg.get("baseline") or costume_anchor(sub)
    build = {"scale": S, "image": {"w": int(W), "h": int(H)}, "baselineY": round(float(baseline) * S, 2), "bones": bones, "parts": records, "landmarks": lm}
    write_json(state.out / "build.json", build)
    say(f"rig build: {len(bones)} bones, {len(records)} parts, {verts} vertices -> {state.out / 'build.json'}")
