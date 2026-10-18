"""Auron's hooks (the rig program, 2026-10-18; FFX only: Auron is an FFX figure). His long coat is the one thing the declarative config cannot skin: the lower coat hangs from the hips, never from the hem.

The `coat` blends three bones, as Lulu's skirt does: the `pelvis` by how high a vertex sits (above `TOP` (1x rows) a vertex is the pelvis's alone, below `BOT` it has no say, a smoothstep between) and `coatL` / `coatR`, two bones
at the hips (joint (450, 620)) that a key SWINGS (a positive rotation flares the left side out), split by x across a ramp. The `tail` (the trailing red left panel) is blended exactly like the coat's own left side
(`skin_tail`) and hangs from `coatL`, so it can swing or shrink and open no wedge. A vertex keeps its two heaviest influences (the rig file holds two)."""
from __future__ import annotations

import numpy as np

TOP = 620.0  # 1x painting rows: above this a vertex is the pelvis's alone
BOT = 800.0  # below this it is the coat bones' alone
XC = 450.0  # 1x column of the hips: the line between the left and the right of the coat
RAMP = 60.0  # the left/right blend reaches this far to each side of it


def _smooth(t: float) -> float:
    t = float(np.clip(t, 0.0, 1.0))
    return t * t * (3 - 2 * t)


def skin_coat(state):
    S = state.S
    pel, left, right = state.BI["pelvis"], state.BI["coatL"], state.BI["coatR"]

    def fn(verts):
        out = []
        for x, y in verts:
            p = 1.0 - _smooth((y / S - TOP) / (BOT - TOP))
            a = _smooth(((x / S) - (XC - RAMP)) / (2 * RAMP))  # 0 at the far left, 1 at the far right
            w = {pel: p, left: (1.0 - p) * (1.0 - a), right: (1.0 - p) * a}
            top2 = sorted(((wt, b) for b, wt in w.items() if wt > 1e-4), reverse=True)[:2]
            tot = sum(wt for wt, _ in top2)
            out.append([(b, wt / tot) for wt, b in top2])
        return out

    return fn


def skin_tail(state):
    pel, tr = state.BI["pelvis"], state.BI["tail"]

    def fn(verts):
        out = []
        for x, y in verts:
            p = 1.0 - _smooth((y / state.S - TOP) / (BOT - TOP))
            out.append([(pel, p), (tr, 1.0 - p)] if 0.0 < p < 1.0 else [(pel, 1.0)] if p >= 1.0 else [(tr, 1.0)])
        return out

    return fn


def build(state):
    """Format v2, pass 2: cut every `variants_cut` spec of the config from its pose painting (auron_variants.py) and attach it to its part; the marks become landmarks `<mark><Pose>` on the variant's bone."""
    import json
    import pathlib
    import sys

    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
    import auron_variants as V
    from rig_pred import Pred

    sub = state.sub
    specs = sub.cfg.get("variants_cut") or {}
    if not specs:
        return
    T = json.loads((sub.work / "targets" / "targets.json").read_text())
    import copy

    # two parts hidden at rest, `armX` and `swordX`: the limb and the prop a pose brings. Each has a 4 x 4 transparent base look (never drawn: every key that shows it names a variant), so the budget counts only the
    # variants. A key hides the idle's own sword and glove and shows one of these with the variant of its pose. The idle's arm is NOT hidden (see the keys): a joint none of whose rest-shown parts is shown is not
    # watched for holes, but the shoulder and elbow joints meet parts that are always shown, so the arm stays in the key, hung behind the body (`layers`), where the painting hides it.
    from PIL import Image

    for new, base in (("armX", "armR"), ("swordX", "sword")):
        src = next(p for p in state.parts if p["name"] == base)
        for p in state.parts:
            if p["order"] > src["order"]:
                p["order"] += 1
        Image.new("RGBA", (4, 4), (0, 0, 0, 0)).save(state.out / f"{new}.png")
        state.parts.append({"name": new, "order": src["order"] + 1, "hidden": True, "png": f"{new}.png", "box": [0, 0, 4, 4], "verts": [0, 0, 4, 0, 4, 4, 0, 4], "triangles": [0, 1, 2, 0, 2, 3], "bone": "root"})
    by = {p["name"]: p for p in state.parts}
    state.landmarks_extra = getattr(state, "landmarks_extra", {})
    report = {}
    for key, spec in specs.items():
        part, variant = spec["part"], spec["variant"]
        rec, marks, _, info = V.cut_variant(spec, sub.art, T, state.S, state.R, Pred, state.out, f"{part}.{variant}")
        by[part].setdefault("variants", {})[variant] = rec
        for n, (x, y) in marks.items():
            state.landmarks_extra[f"{n}{spec['pose'].capitalize()}"] = {"bone": spec.get("bone", "root"), "x": x, "y": y}
        report[key] = info
        print(f"  variant {key:16s} {info['px'][0]}x{info['px'][1]} px, {info['verts']} verts, {info['tris']} tris, opaque {info['area']}", flush=True)
    (state.out / "variants.json").write_text(json.dumps(report, indent=1))


FAR_LEG_SHADE = 0.62  # the far leg's hidden length is the near leg's own pixels, darker: it stands behind it


def cut_parts(state):
    """Pass 2, the far leg. Pass 1 filled the far leg (`legL`) under the near leg with the boot's navy, extended: a flat dark wedge in every pose that opens the legs. Where the fill lies the painting shows the NEAR leg's own
    trouser (the fill is inside its silhouette, so it is hidden at rest), so the fill takes those pixels, darkened to read as the leg behind. Classical: a copy of the painting's own colours, nothing painted."""
    import numpy as np

    fill = state.cut["legL"] & ~state.M["legL"]
    if not fill.any():
        return
    img = state.full["legL"]
    src = state.rgba[..., :3].astype(np.float32)
    out = np.clip(src * FAR_LEG_SHADE, 0, 255)
    red = (src[..., 0] > src[..., 2] + 40) & (src[..., 0] > src[..., 1] + 40)  # a scrap of the coat's red at the top of the near leg's silhouette: the trouser's own black instead
    out[red] = (28, 28, 36)
    img[fill, :3] = out[fill].astype(np.uint8)
