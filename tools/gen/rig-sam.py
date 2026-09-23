"""Living-portrait v4 (FFX-2 only): layer masks with SAM 2.1, on the plate AND every v4 key.

    python -s tools/gen/rig-sam.py masks [--keys 0,-20,...] [--src picked|final]
                                  # the plate (0) is scored against the v3 geodesic masks

SAM 2.1 hiera-small (D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt, config
sam2.1_hiera_s.yaml from the repo, the `sam2` package importable from ComfyUI's
embedded python). Prompts are authored per layer from each key's own landmarks
(art/v4/warp/landmarks.json) plus the plate's tassel moved with the ear
(rig-lora-init.py's head model), see `prompts()`: positive points on the part,
negative points on what touches it, and a box. SAM's mask is decoded from its
256 px logits, so its edge is soft to about 4 px; every mask is then SNAPPED to
the painting's ink inside a 6 px band (rig-lib geodesic_labels: the boundary
between inside and outside seeds follows dark lines and colour edges). Both
the raw and the snapped edge are scored (mean colour gradient on the boundary,
and the share of boundary pixels within 1 px of an ink or colour edge) against
the alternative this project already had (the v3 geodesic owner masks on the
plate; on a key, the background flood fill or the plate's own tassel pixels
moved with the ear); the best edge per layer is kept and the choice recorded
in art/v4/masks/choice.json. Feathered 3 to 6 px when the layers are cut
(rig-v4layers.py), not here. Magenta overlays: art/v4/masks/overlays/.

The GPU is shared: SAM small needs about 0.6 GB; it runs on the CPU when the
card has less than 2 GB free. torch.jit.script is bypassed (the embedded
python ships no stdlib sources, which the SAM transforms' scripting needs).
"""
from __future__ import annotations

import importlib.util
import json
import math
import os
import pathlib
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HERE = pathlib.Path(__file__).resolve().parent
_s = importlib.util.spec_from_file_location("riglib", HERE / "rig-lib.py")
L = importlib.util.module_from_spec(_s); _s.loader.exec_module(L)
_v = importlib.util.spec_from_file_location("rigv4", HERE / "rig-v4lib.py")
V = importlib.util.module_from_spec(_v); _v.loader.exec_module(V)
key_rgb, landmarks, tassel_footprint, tassel_visible, tests, hsv = V.key_rgb, V.landmarks, V.tassel_footprint, V.tassel_visible, V.tests, V.hsv

V4 = L.ART / "v4"
MASKS = V4 / "masks"
SAM_REPO = pathlib.Path("D:/Tools/sam2/repo")
CKPT = pathlib.Path("D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt")
NAMES = V.NAMES
BAND = 6


# ---- the model ---------------------------------------------------------------

_PRED = None


def predictor():
    global _PRED
    if _PRED is None:
        import torch
        torch.jit.script = lambda f, *a, **k: f
        cwd = os.getcwd()
        os.chdir(SAM_REPO)  # hydra resolves the config name inside the package
        from sam2.build_sam import build_sam2
        from sam2.sam2_image_predictor import SAM2ImagePredictor
        dev = "cpu"
        if torch.cuda.is_available() and torch.cuda.mem_get_info()[0] > 2 * 1024 ** 3:
            dev = "cuda"
        model = build_sam2("configs/sam2.1/sam2.1_hiera_s.yaml", str(CKPT), device=dev)
        os.chdir(cwd)
        _PRED = SAM2ImagePredictor(model)
        print("SAM 2.1 small on", dev)
    return _PRED


def sam(rgb: np.ndarray, pos, neg, box=None, pick="best", area=(0, 10 ** 9)):
    """Probability map (0..1) of the chosen multimask output and its score."""
    import torch
    p = predictor()
    pts = [list(map(float, q)) for q in pos] + [list(map(float, q)) for q in neg]
    lab = [1] * len(pos) + [0] * len(neg)
    with torch.inference_mode():
        p.set_image(np.clip(rgb, 0, 255).astype(np.uint8))
        logits, scores, _ = p.predict(point_coords=np.array(pts) if pts else None, point_labels=np.array(lab) if pts else None,
                                      box=np.array(box, np.float32) if box is not None else None, multimask_output=True, return_logits=True)
    prob = 1 / (1 + np.exp(-np.clip(logits, -30, 30)))
    areas = (prob > 0.5).reshape(3, -1).sum(1)
    ok = [i for i in range(3) if area[0] <= areas[i] <= area[1]] or list(range(3))
    if pick == "small":
        i = min(ok, key=lambda k: (areas[k], -scores[k]))
    elif pick == "large":
        i = max(ok, key=lambda k: (areas[k], scores[k]))
    else:
        i = max(ok, key=lambda k: scores[k])
    return prob[i].astype(np.float32), float(scores[i])


# ---- edges -------------------------------------------------------------------

def snap(rgb: np.ndarray, m: np.ndarray, band: int = BAND) -> np.ndarray:
    """The mask's edge moved onto the painting's ink/colour edge inside +-band px."""
    inner = L.erode(m, band)
    outer = ~L.dilate(m, band)
    dom = ~(inner | outer)
    if not dom.any() or not inner.any():
        return m
    ys, xs = np.nonzero(L.dilate(dom, 2))
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    seeds = np.full((y1 - y0, x1 - x0), -1, np.int64)
    seeds[inner[y0:y1, x0:x1]] = 1
    seeds[outer[y0:y1, x0:x1]] = 0
    rgba = np.concatenate([rgb[y0:y1, x0:x1], np.full((y1 - y0, x1 - x0, 1), 255.0)], -1)
    labs = L.geodesic_labels(rgba, seeds, np.ones_like(seeds, bool))
    out = m.copy()
    sub = out[y0:y1, x0:x1]
    d = dom[y0:y1, x0:x1]
    sub[d] = labs[d] == 1
    return ndi.binary_fill_holes(out) if m.sum() > 20000 else out


def edge_map(rgb: np.ndarray) -> np.ndarray:
    g = np.zeros(rgb.shape[:2], np.float32)
    for c in range(3):
        gx = ndi.sobel(rgb[..., c], 1)
        gy = ndi.sobel(rgb[..., c], 0)
        g = np.maximum(g, np.hypot(gx, gy) / 8.0)
    return g


def edge_score(rgb: np.ndarray, m: np.ndarray, g: np.ndarray | None = None, clip_box=None) -> dict:
    """How well the mask boundary sits on the painting's edges: the mean colour
    gradient on its boundary (max within 1 px) and the share of boundary px
    within 1 px of an edge above 40 levels. The canvas border is not scored."""
    g = edge_map(rgb) if g is None else g
    b = m & ~L.erode(m, 1)
    b[:2] = b[-2:] = False
    b[:, :2] = b[:, -2:] = False
    if clip_box is not None:
        x0, y0, x1, y1 = clip_box
        keep = np.zeros_like(b); keep[y0:y1, x0:x1] = True
        b &= keep
    if not b.any():
        return {"boundaryPx": 0, "meanGrad": 0.0, "onEdge": 0.0}
    gm = ndi.maximum_filter(g, 3)
    return {"boundaryPx": int(b.sum()), "meanGrad": round(float(gm[b].mean()), 2), "onEdge": round(float((gm[b] > 40).mean()), 3)}


# ---- prompts (authored per layer from the key's own landmarks) ----------------

def at(mask, p):
    x, y = int(round(p[0])), int(round(p[1]))
    return 0 <= x < mask.shape[1] and 0 <= y < mask.shape[0] and bool(mask[y, x])


def spread(mask, n, rng_seed=7, region=None):
    """n points on `mask`, spread out (farthest-point sampling on a 12 px grid)."""
    m = mask.copy()
    if region is not None:
        m &= region
    ys, xs = np.nonzero(m[::12, ::12])
    if len(xs) == 0:
        return []
    pts = np.stack([xs * 12, ys * 12], 1).astype(np.float64)
    out = [pts[len(pts) // 2]]
    d = np.hypot(*(pts - out[0]).T)
    for _ in range(n - 1):
        k = int(np.argmax(d))
        if d[k] < 30:
            break
        out.append(pts[k])
        d = np.minimum(d, np.hypot(*(pts - pts[k]).T))
    return [tuple(p) for p in out]


def add(p, dx, dy):
    return (p[0] + dx, p[1] + dy)


def tassel_spine(yaw):
    fp = tassel_footprint(yaw) > 0.9
    out = []
    for y in (560, 640, 720, 790, 880, 960):
        xs = np.nonzero(fp[y])[0]
        if len(xs):
            out.append((float(xs.mean()), float(y)))
    return out, fp


# authored by eye where the colour search lands on red-brown hair instead (-85's hair is red-toned)
CLIP_AT = {-85: (556, 245, [488, 118, 642, 392])}


def prompts(yaw: int, rgb: np.ndarray, with_tassel: bool = True) -> dict:
    lm = landmarks(yaw)
    skin, hair, white = tests(rgb)
    mid_eyes = ((lm["pupil_R"][0] + lm["pupil_L"][0]) / 2, (lm["pupil_R"][1] + lm["pupil_L"][1]) / 2)
    face_pos = [p for p in (add(mid_eyes, 0, 75), add(mid_eyes, 0, 115), lm["philtrum"],
                            ((lm["lipLower"][0] + lm["chin"][0]) / 2, (lm["lipLower"][1] + lm["chin"][1]) / 2),
                            add(lm["pupil_R"], 10, 70), add(lm["pupil_L"], -10, 70)) if at(skin, p)]
    neck = add(lm["chin"], 0, 70)
    spine, fp = tassel_spine(yaw)
    tas = spine if tassel_visible(yaw) and with_tassel else []
    ring = L.dilate(np.zeros_like(skin), 0)
    hull = np.zeros_like(skin)
    xs = [p[0] for p in lm.values() if p[1] > 300]; ys = [p[1] for p in lm.values() if p[1] > 300]
    hull[int(min(ys)) - 60:int(max(ys)) + 20, int(min(xs)):int(max(xs)) + 1] = True
    ring = L.dilate(hull, 70) & ~L.dilate(hull, 30)
    hair_near = spread(hair & ring & (fp < 0.1), 6)
    face_neg = [p for p in (add(lm["browCenter"], 0, -110),) if at(hair, p)] + hair_near + ([neck] if at(skin, neck) else []) + tas[:3]
    top = rgb.shape[0]
    head_pos = face_pos + spread(hair & (fp < 0.1) & V.repaint_mask(yaw), 16, region=np.pad(np.ones((int(lm["chin"][1]) + 60, 832), bool), ((0, top - int(lm["chin"][1]) - 60), (0, 0))))
    border = np.zeros_like(white); border[:, :6] = border[:, -6:] = True; border[:6] = True
    bg = spread(white & border, 4)
    body_pts = [(416, 1150), (150, 1120), (700, 1120)] + spread(V.body_alpha() > 0.99, 6, region=(np.arange(1216)[:, None] > lm["chin"][1] + 120) & np.ones((1, 832), bool))
    body_pts += [p for p in (add(lm["chin"], -40, 110), add(lm["chin"], 40, 110), add(lm["chin"], 0, 150)) if at(skin, p)]
    head_neg = ([neck] if at(skin, neck) else []) + body_pts + bg + tas
    out = {"face": dict(pos=face_pos, neg=face_neg, pick="best", area=(20000, 200000)),
           "head": dict(pos=head_pos, neg=head_neg, pick="large", area=(150000, 700000))}
    if tas:
        ys_, xs_ = np.nonzero(fp > 0.05)
        side = [add(p, dx, 0) for p in spine for dx in (-50, 50) if at(~L.dilate(fp > 0.05, 8), add(p, dx, 0))]
        out["tassel"] = dict(pos=spine, neg=side[:6], box=[xs_.min() - 6, ys_.min() - 6, xs_.max() + 6, ys_.max() + 6], pick="best", area=(4000, 60000))
    for eye, pupil, outer in (("R", lm["pupil_R"], lm["eyeOuter_R"]), ("L", lm["pupil_L"], lm["eyeOuter_L"])):
        if not at(~skin | True, pupil):
            continue
        out[f"iris{eye}"] = dict(pos=[pupil], neg=[], box=[pupil[0] - 42, pupil[1] - 50, pupil[0] + 42, pupil[1] + 50], pick="best", area=(500, 8000))
        span = abs(pupil[0] - outer[0]) + 30
        x0, x1 = sorted([outer[0] - np.sign(pupil[0] - outer[0]) * 8, pupil[0] + np.sign(pupil[0] - outer[0]) * span])
        out[f"eye{eye}"] = dict(pos=[pupil], neg=[], box=[x0, pupil[1] - 58, x1, pupil[1] + 50], pick="large", area=(800, 18000))
    mc = sorted([lm["mouthCorner_R"], lm["mouthCorner_L"]])
    out["mouth"] = dict(pos=[lm["lipUpper"], lm["lipLower"]], neg=[lm["philtrum"]], box=[mc[0][0] - 12, min(mc[0][1], mc[1][1]) - 16, mc[1][0] + 12, lm["lipLower"][1] + 14], pick="best", area=(150, 12000))
    by = min(lm["pupil_R"][1], lm["pupil_L"][1])
    bx = sorted([lm["eyeOuter_R"][0], lm["eyeOuter_L"][0]])
    out["brows"] = dict(pos=[], neg=[], box=[bx[0] - 10, by - 100, bx[1] + 10, by - 38], pick="small", area=(100, 20000))
    if yaw in CLIP_AT:
        cx, cy, box = CLIP_AT[yaw]
        out["clip"] = dict(pos=[(cx, cy)], neg=[(cx + 90, cy), (cx, cy - 110)], box=box, pick="large", area=(1500, 32000))
    elif yaw <= 0:
        s = hsv(rgb)
        red = (s[..., 1] > 0.6) & ((s[..., 0] * 360 < 12) | (s[..., 0] * 360 > 348)) & (s[..., 2] > 0.45)
        zone = np.zeros_like(red); zone[:470, 440:] = True
        lab, n = ndi.label(red & zone)
        if n:
            k = 1 + int(np.argmax(ndi.sum(np.ones_like(lab), lab, range(1, n + 1))))
            cy, cx = ndi.center_of_mass(lab == k)
            ys_, xs_ = np.nonzero(lab == k)
            out["clip"] = dict(pos=[(cx, cy)], neg=[], box=[xs_.min() - 50, ys_.min() - 30, min(831, xs_.max() + 60), ys_.max() + 90], pick="large", area=(1500, 32000))
    return out


# ---- commands ------------------------------------------------------------------

def overlay(rgb, m, dst, pad=24):
    ys, xs = np.nonzero(m)
    if len(xs) == 0:
        return
    y0, y1 = max(0, ys.min() - pad), min(m.shape[0], ys.max() + pad)
    x0, x1 = max(0, xs.min() - pad), min(m.shape[1], xs.max() + pad)
    c = rgb.copy()
    c[~m] = c[~m] * 0.45 + L.MAGENTA * 0.55
    c[m & ~L.erode(m, 1)] = L.MAGENTA
    Image.fromarray(np.clip(c[y0:y1, x0:x1], 0, 255).astype(np.uint8)).save(pathlib.Path(dst).with_suffix(".jpg"), quality=85)


def v3_masks():
    own = np.load(L.V3 / "masks/owner.npy")
    z = L.read_json(L.V3 / "masks/owners.json")["z"]
    cls = lambda *n: np.isin(own, [z.index(k) for k in n])
    return {"head": cls("hairBack", "headCore", "irisR", "irisL", "eyeApertureR", "eyeApertureL", "hairFront", "strand1", "strand2"),
            "face": cls("headCore", "irisR", "irisL", "eyeApertureR", "eyeApertureL"), "tassel": cls("earring"),
            "irisR": cls("irisR"), "irisL": cls("irisL"), "eyeR": cls("irisR", "eyeApertureR"), "eyeL": cls("irisL", "eyeApertureL"),
            "body": cls("body")}


def moved_tassel(yaw, rgb):
    """The plate's own tassel pixels moved with the ear, where the key still shows them."""
    im, x, y = V.plate_earring()
    x += V.TASSEL_DX[yaw]
    ref = np.full((1216, 832, 3), -999.0, np.float32)
    h, w = im.shape[:2]
    xa, xb = max(0, x), min(832, x + w)
    ref[y:y + h, xa:xb] = np.where(im[:, xa - x:xb - x, 3:4] > 128, im[:, xa - x:xb - x, :3], -999.0)
    close = np.abs(rgb - ref).max(-1) < 40
    return ndi.binary_closing(close, iterations=2) & (tassel_footprint(yaw) > 0.5)


def above_jaw(lm, margin):
    """Everything above the jaw polyline (jaw_R, jawMid_R, chin, jawMid_L, jaw_L) plus `margin` px:
    a turned key's face must not run down the neck (SAM joined them at +60)."""
    pts = [lm[n] for n in ("jaw_R", "jawMid_R", "chin", "jawMid_L", "jaw_L")]
    pts = [(0, pts[0][1])] + [(x, y + margin) for x, y in pts] + [(832, pts[-1][1])]
    return ~L.poly_mask((1216, 832), [pts + [(832, 1216), (0, 1216)]])


def unchanged_body(rgb):
    """Plate body pixels the key did not repaint."""
    own = np.load(L.V3 / "masks/owner.npy")
    z = L.read_json(L.V3 / "masks/owners.json")["z"]
    plate = L.load_rgba(L.PLATE)
    a = plate[..., 3:4] / 255.0
    flat = plate[..., :3] * a + 255 * (1 - a)
    return (own == z.index("body")) & (np.abs(rgb - flat).max(-1) < 10)


def masks(keys: list[int], src: str):
    choice = L.read_json(MASKS / "choice.json") if (MASKS / "choice.json").exists() else {}
    for yaw in keys:
        name = NAMES[yaw]
        rgb = key_rgb(yaw, src)
        g = edge_map(rgb)
        pr = prompts(yaw, rgb, with_tassel=src != "notassel")
        # the picked keys' masks (what rig-v4fix.py fixes) live apart from the finished keys'
        # (what rig-v4layers.py cuts), so a later pass never moves an earlier fix
        sub = pathlib.Path("picked") / name if src == "picked" and yaw != 0 else pathlib.Path(name)
        (MASKS / sub).mkdir(parents=True, exist_ok=True)
        (MASKS / "overlays" / sub).mkdir(parents=True, exist_ok=True)
        rec = {"src": src, "layers": {}}
        alts = v3_masks() if yaw == 0 else {}
        if yaw != 0 and tassel_visible(yaw) and src != "notassel":
            alts["tassel"] = moved_tassel(yaw, rgb)
        if yaw == 0:
            pr["body"] = dict(pos=[(416, 1100), (480, 800), (150, 1000), (700, 980)], neg=[(470, 500), (300, 300), (650, 300)], pick="large", area=(150000, 600000))
        for layer, p in pr.items():
            prob, score = sam(rgb, p["pos"], p["neg"], p.get("box"), p["pick"], p["area"])
            raw = prob > 0.5
            if layer in ("head", "face", "body"):
                raw = ndi.binary_fill_holes(raw)
                lab, n = ndi.label(raw)
                if n > 1:
                    raw = lab == (1 + int(np.argmax(ndi.sum(np.ones_like(lab), lab, range(1, n + 1)))))
            if layer == "face" and yaw != 0:
                raw &= above_jaw(landmarks(yaw), 10)
            if layer == "head" and yaw != 0:
                face = np.asarray(Image.open(MASKS / sub / "face.png")) > 127 if (MASKS / sub / "face.png").exists() else None
                cut = ~L.dilate(V.repaint_mask(yaw), 0) | V.background(rgb)
                if face is not None:
                    cut |= V.neck_mask(rgb, face) & ~face
                raw &= ~cut
                alts["classic"] = V.repaint_mask(yaw) & ~cut & ~(unchanged_body(rgb))
            cands = {"sam": raw, "sam+snap": snap(rgb, raw) if layer not in ("brows",) else raw}
            if layer in alts:
                cands["v3" if yaw == 0 else "platePixels"] = alts[layer]
            if layer == "head" and "classic" in alts:
                cands["classic"] = alts.pop("classic")
            scores = {k: edge_score(rgb, m, g) for k, m in cands.items()}
            best = max(scores, key=lambda k: (scores[k]["onEdge"], scores[k]["meanGrad"]))
            if layer in ("mouth", "brows"):
                best = "sam"  # regions for the patches, not cut edges: a box would do; kept as SAM's own
            m = cands[best]
            L.save_l(m, MASKS / sub / f"{layer}.png")
            overlay(rgb, m, MASKS / "overlays" / sub / f"{layer}.png")
            rec["layers"][layer] = {"kept": best, "samScore": round(score, 3), "areaPx": int(m.sum()), "edges": scores,
                                    "prompts": {k: (np.round(np.array(v, float), 1).tolist() if k in ("pos", "neg", "box") else v) for k, v in p.items()}}
            print(name, layer, best, {k: v["onEdge"] for k, v in scores.items()}, int(m.sum()))
        choice[sub.as_posix()] = rec
        L.write_json(choice, MASKS / "choice.json")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a or a[0] not in ("masks",):
        raise SystemExit(__doc__)
    ks = [int(k) for k in a[a.index("--keys") + 1].split(",")] if "--keys" in a else list(NAMES)
    masks(ks, a[a.index("--src") + 1] if "--src" in a else "final")
