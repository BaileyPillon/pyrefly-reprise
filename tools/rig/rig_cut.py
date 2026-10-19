"""Step 1, cut: the costume painting -> part images, by a label map and a list of classical operations (no generative model).

    python rig.py cut --subject kimahri [--sam] [--only head,torso] [--cpu]

Parts are cut from the subject's COSTUME painting, the one approved master (`characters/<id>/<pose>@<scale>x.png`), never from a second painting. config["cut"]:

  "polys":    { name: [[x, y], ...] }                                   polygons, 1x painting px, for the predicates (see rig_pred.py)
  "order":    [part, ...]                                               back to front: the draw order
  "parts":    { part: { "sam": [names] | "include": [pred, ...], "exclude": [pred, ...] } }
  "priority": [part, ...]                                               who claims a pixel first (default: front to back, the reverse of order)
  "nearest":  { "maxdist": 40, "never": [part, ...] }                   a leftover opaque pixel joins the nearest part within maxdist px (1x); `never` parts take no strangers
  "clean":    { "min_island": 120, "close": 2, "<part>": false | {...} }
  "ops":      [ ...applied in order to the part images... ]
     {"op": "skirt", "back": p, "front": q, "px": 8, "zone": pred}       p gains q's own pixels within px of its edge (a copy: the front part hides it exactly at rest)
     {"op": "extend", "part": p, "zone": pred, "src": pred, "sigmas": [5, 14, 36, 90], "hidden_only": true}
                                                                          p gains the pixels of zone it lacks, coloured by extending its own colours (normalised convolution)
     {"op": "smooth_fill", "part": p, "zone": pred, "from": q, "sigma": 14}   zone of p gets q colours, smoothed (sigma in master px)
     {"op": "shade", "part": p, "zone": pred, "gradient": {"y": 0.14, "x": 0.16}, "soft": {"px": 22, "mul": 0.8}, "ink": {"px": 5, "mul": 0.42}}
                                                                          darken a fill the way the painting's own forms are: along the fill, a soft band and an ink line on its exposed edge
  "hooks":    in the subject's hook module: cut_labels(state) after the label map (state.M, boolean masks by part), cut_parts(state) after the ops (state.cut, state.full)

Every new pixel (a skirt, a fill) is a copy or a classical extension of the painting's own colours: provisional art that Bailey approves, never a model's guess.
Writes <work>/parts/part_<name>.png (full master canvas), cut_<name>.png, rest_composite.png, rest_diff.png, labels_overlay.png and cut.json.
"""
from __future__ import annotations

import types

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

import rig_geom as R
from rig_common import BG, Subject, load_rgba, say, write_json
from rig_pred import Pred

COLORS = [(255, 80, 80), (80, 200, 255), (255, 220, 60), (200, 120, 255), (90, 255, 120), (255, 150, 60), (255, 100, 220), (255, 255, 255), (120, 255, 255), (255, 170, 170), (170, 255, 170), (170, 170, 255), (60, 220, 90), (190, 110, 255)]


def _poly_masks(cfg, H, W, S):
    return {n: R.poly_mask((H, W), [pts], S) for n, pts in (cfg.get("polys") or {}).items()}


def _sam_masks(sub: Subject, H, W):
    out = {}
    d = sub.work / "sam"
    if d.exists():
        for f in sorted(d.glob("*.png")):
            if f.stem.startswith("_"):
                continue
            out[f.stem] = R.upsample_mask(np.array(Image.open(f)) > 127, (W, H))
    return out


def _label(cfg, pred: Pred, alpha, order):
    idx = {n: i + 1 for i, n in enumerate(order)}
    priority = cfg.get("priority") or order[::-1]
    L = np.zeros(alpha.shape, np.uint8)
    for n in priority:
        spec = cfg["parts"][n]
        inc = spec.get("include") or [{"sam": s} for s in spec.get("sam", [])]
        m = pred.any_of(inc) & ~pred.any_of(spec.get("exclude")) & alpha
        L[m & (L == 0)] = idx[n]
        pred.parts[n] = L == idx[n]
    return L, idx


def _clean(cfg, name, m):
    c = cfg.get("clean", {})
    spec = c.get(name, {})
    if spec is False:
        return m
    return R.clean_mask(m, min_island=spec.get("min_island", c.get("min_island", 120)), close=spec.get("close", c.get("close", 2)))


def run(sub: Subject, only_sam=None, cpu=False, with_sam=False) -> None:
    cfg = sub.cfg["cut"]
    S = sub.scale
    if with_sam:
        import rig_sam
        rig_sam.run(sub, only=only_sam, cpu=cpu)
    src = load_rgba(sub.costume_master)
    H, W = src.shape[:2]
    rgba = R.defringe_alpha(src)  # the grey matte ring of the outer edge goes; interior pixels are untouched
    alpha = rgba[..., 3] > 24
    order = list(cfg["order"])
    polys = _poly_masks(cfg, H, W, S)
    sam = _sam_masks(sub, H, W)
    pred = Pred((H, W), S, rgba, sam, polys)
    L, idx = _label(cfg, pred, alpha, order)
    nr = cfg.get("nearest", {})
    never = set(nr.get("never", []))
    keep = {n: (L == idx[n]) for n in never if n in idx}
    L2 = L.copy()
    for n in keep:
        L2[keep[n]] = 0
    L2 = R.nearest_label(L2, alpha, maxdist=nr.get("maxdist", 40) * S, sources=[idx[n] for n in order if n not in never])
    for n, m in keep.items():
        L2[m] = idx[n]
    M = {n: L2 == idx[n] for n in order}
    hooks = sub.hooks()
    state = types.SimpleNamespace(sub=sub, cfg=cfg, S=S, H=H, W=W, rgba=rgba, src=src, alpha=alpha, order=order, M=M, sam=sam, polys=polys, pred=pred, R=R)
    if hooks and hasattr(hooks, "cut_labels"):
        hooks.cut_labels(state)
    for n in order:
        M[n] = _clean(cfg, n, M[n])
    lab = np.zeros((H, W), np.uint8)
    for n in order[::-1]:
        lab[M[n]] = idx[n]
    holes = alpha & (lab == 0)
    filled = R.nearest_label(lab, holes, maxdist=nr.get("hole", 30) * S, sources=[idx[n] for n in order if n not in never])
    for n in order:
        if n not in never:
            M[n] = M[n] | ((filled == idx[n]) & holes)
    cut = dict(M)
    pred.parts = cut

    def part_image(mask):
        out = np.zeros((H, W, 4), np.uint8)
        out[..., :3] = rgba[..., :3]
        out[..., 3] = np.where(mask, rgba[..., 3], 0)
        return out

    full = {n: part_image(cut[n]) for n in order}
    state.cut, state.full = cut, full
    for op in cfg.get("ops", []):
        _apply(op, state, pred)
    if hooks and hasattr(hooks, "cut_parts"):
        hooks.cut_parts(state)
    _write(sub, state, rgba, alpha)


def _hidden_by_front(state, part):
    h = np.zeros((state.H, state.W), bool)
    for f in state.order[state.order.index(part) + 1:]:
        h |= state.cut[f]
    return h


def _apply(op, state, pred):
    S, cut, full, rgba = state.S, state.cut, state.full, state.rgba
    kind = op["op"]
    if kind == "skirt":
        add = R.grow(cut[op["back"]], op["px"] * S) & cut[op["front"]] & ~cut[op["back"]]
        if op.get("zone"):
            add &= pred.ev(op["zone"] if isinstance(op["zone"], dict) else {"poly": op["zone"]})
        cut[op["back"]] = cut[op["back"]] | add
        full[op["back"]][add] = rgba[add]
    elif kind == "extend":
        p = op["part"]
        zone = pred.ev(op["zone"])
        if op.get("hidden_only", True):
            zone &= _hidden_by_front(state, p)
        known = cut[p] if not op.get("src") else (cut[p] & pred.ev(op["src"]))
        rgb = R.extend_fill(full[p][..., :3], known, zone | known, tuple(op.get("sigmas", (5, 14, 36, 90))))
        add = zone & ~cut[p]
        full[p][add, :3] = np.clip(rgb[add], 0, 255).astype(np.uint8)
        full[p][add, 3] = op.get("alpha", 255)
        cut[p] = cut[p] | add
    elif kind == "smooth_fill":
        p, q = op["part"], op["from"]
        zone = pred.ev(op["zone"])
        known = cut[q] & (pred.ev(op["from_region"]) if op.get("from_region") else True)
        kf = known.astype(np.float32)
        den = np.maximum(ndi.gaussian_filter(kf, op.get("sigma", 14)), 1e-3)
        sm = np.stack([ndi.gaussian_filter(full[q][..., c].astype(np.float32) * kf, op.get("sigma", 14)) / den for c in range(3)], -1).clip(0, 255).astype(np.uint8)
        full[p][zone, :3] = sm[zone]
        full[p][zone, 3] = 255
        cut[p] = cut[p] | zone
        state.__dict__.setdefault("filled", {}).setdefault(p, np.zeros_like(zone))
        state.filled[p] |= zone
    elif kind == "shade":
        p = op["part"]
        zone = pred.ev(op["zone"]) & cut[p]
        ys, xs = np.nonzero(zone)
        if not len(ys):
            return
        y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
        g = op.get("gradient", {})
        gy = ((np.arange(state.H) - y0) / max(1, y1 - y0)).clip(0, 1)[:, None] * np.ones((1, state.W))
        gx = ((x1 - np.arange(state.W)) / max(1, x1 - x0)).clip(0, 1)[None, :] * np.ones((state.H, 1))
        shade = 1.0 - g.get("y", 0) * gy - g.get("x", 0) * gx
        base = full[p][..., :3].astype(np.float32)
        full[p][zone, :3] = (base[zone] * shade[zone][:, None]).clip(0, 255).astype(np.uint8)
        inner = R.shrink(cut[p], op.get("ink", {}).get("px", 5))
        soft = R.shrink(cut[p], op.get("soft", {}).get("px", 22))
        edge = zone & ~inner
        softb = zone & ~soft & ~edge
        if "soft" in op:
            full[p][softb, :3] = (full[p][softb, :3].astype(np.float32) * op["soft"].get("mul", 0.8)).astype(np.uint8)
        if "ink" in op:
            full[p][edge, :3] = (full[p][edge, :3].astype(np.float32) * op["ink"].get("mul", 0.42)).astype(np.uint8)
    else:
        raise SystemExit(f"rig: unknown cut op {kind!r}")


def _write(sub: Subject, state, rgba, alpha):
    S, H, W, order, cut, full = state.S, state.H, state.W, state.order, state.cut, state.full
    parts = sub.sub("parts")
    for n in order:
        img = full[n].copy()
        img[..., 3] = np.where(cut[n], img[..., 3], 0)
        full[n] = img
        R.save_rgba(img, parts / f"part_{n}.png")
        R.save_mask(cut[n], parts / f"cut_{n}.png")
    comp = np.zeros((H, W, 4), np.float32)
    for n in order:
        p = full[n].astype(np.float32)
        a = p[..., 3:4] / 255.0
        comp[..., :3] = comp[..., :3] * (1 - a) + p[..., :3] * a
        comp[..., 3:4] = comp[..., 3:4] * (1 - a) + 255.0 * a
    comp8 = comp.clip(0, 255).astype(np.uint8)
    R.save_rgba(comp8, parts / "rest_composite.png")
    bg = np.array(BG, np.int32)
    over = lambda im: (im[..., :3].astype(np.int32) * (im[..., 3:4] / 255.0) + bg * (1 - im[..., 3:4] / 255.0))  # noqa: E731
    diff = np.abs(over(comp8) - over(rgba)).sum(-1)
    d30, d90 = int((diff > 30).sum()), int((diff > 90).sum())
    Image.fromarray(np.clip(diff * 3, 0, 255).astype(np.uint8), "L").resize((W // 2, H // 2)).save(parts / "rest_diff.png")
    base = Image.new("RGBA", (W, H), BG + (255,))
    base.alpha_composite(Image.fromarray(state.src, "RGBA"))
    ov = np.array(base.convert("RGB")).astype(np.float32)
    for i, n in enumerate(order):
        ov[cut[n]] = ov[cut[n]] * 0.5 + np.array(COLORS[i % len(COLORS)], np.float32) * 0.5
    im = Image.fromarray(ov.clip(0, 255).astype(np.uint8)).resize((W // 2, H // 2), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    f = ImageFont.load_default()
    for n in order:
        ys, xs = np.nonzero(cut[n])
        if len(xs):
            d.text((float(xs.mean()) / S - 18, float(ys.mean()) / S), n, fill=(0, 0, 0), font=f)
    im.save(parts / "labels_overlay.png")
    stats = {"order": order, "areas": {n: int(cut[n].sum()) for n in order}, "rest_diff_over_30": d30, "rest_diff_over_90": d90, "opaque": int(alpha.sum()), "size": [W, H], "scale": S}
    write_json(parts / "cut.json", stats, indent=1)
    say(f"rig cut: {len(order)} parts; the rest composite differs from the painting in {d30} pixels by more than 30 and {d90} by more than 90 (of {int(alpha.sum())} opaque)")
    say("  ", {n: int(cut[n].sum()) for n in order})
