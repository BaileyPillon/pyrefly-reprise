"""Living-portrait v3.3: give every layer that touches the canvas border a
reflected margin past it, so the mesh warp and the sway never pull in a
smeared edge.

Why: the approved plate is cut by the canvas on the right (the pink side hair
and the hair clip reach x 831) and at the top, and the body at three sides.
The warp program's answer past a border was to repeat the layer's edge texel
(`uExt` in gl-layer.ts), so at -20 degrees, where the frontal's right side is
pulled about 20 px left (35 px at the swap), the side hair became horizontal
streaks; the sway (head +-13 px, chest +-10 px) did the same along the top and
the body's sides. A reflection continues the painting's own strands across the
border without a seam; nothing on the canvas changes, so the rest pose is still
the plate to the bit.

Idempotent: a side is extended only while the layer's box still ends exactly
at the border. Run it last (after rig-lids / rig-underfill, whose canvases
assume boxes inside y >= 0).

    python -s tools/gen/rig-margins.py
    python -s tools/gen/rig-margins.py edgeprep              # the plate's right side hair, for an outpaint
    python -s tools/gen/rig-margins.py edgemerge <pick.full.png>
"""
from __future__ import annotations

import importlib.util
import pathlib

import numpy as np

_spec = importlib.util.spec_from_file_location("riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)

CW, CH = 832, 1216
MARGIN = {"left": 48, "top": 48, "right": 64, "bottom": 48}  # right: the frontal is pulled furthest there


def extend(meta):
    x, y, w, h = [int(round(v)) for v in meta["box"]]
    img = L.load_rgba(L.ART / meta["file"])
    h, w = img.shape[:2]
    sides = {
        "left": x == 0,
        "top": y == 0,
        "right": x + w == CW,
        "bottom": y + h == CH,
    }
    pad = [(MARGIN["top"] if sides["top"] else 0, MARGIN["bottom"] if sides["bottom"] else 0),
           (MARGIN["left"] if sides["left"] else 0, MARGIN["right"] if sides["right"] else 0), (0, 0)]
    if not any(p for pair in pad[:2] for p in pair):
        return None
    out = np.pad(img, pad, mode="symmetric")
    L.save_rgba(out, L.ART / meta["file"])
    meta["box"] = [x - pad[1][0], y - pad[0][0], out.shape[1], out.shape[0]]
    return [s for s, on in sides.items() if on]


def main():
    rig = L.read_json(L.ART / "rig.json")
    v3 = rig["artMeta"]["v3"]
    live = {k["id"] for k in rig["keys"]}
    report = {}
    for meta in v3["frontal"]["layers"]:
        got = extend(meta)
        if got:
            report[meta["name"]] = got
    if v3["frontal"].get("bodyTurned"):
        got = extend(v3["frontal"]["bodyTurned"])
        if got:
            report["bodyTurned"] = got
    for kid, k in v3["keys"].items():
        if kid not in live:
            continue
        for part in ("back", "front"):
            got = extend(k[part])
            if got:
                report[f"{kid}.{part}"] = got
    # the keys' own files point at the same art; keep rig.keys[].file boxes untouched (they carry no box)
    L.write_json(rig, L.ART / "rig.json")
    print(report)


EDGE = L.V3 / "jobs/edge"
EW = CW + MARGIN["right"]


def cmd_edgeprep():
    """The plate on a canvas 64 px wider, the new strip prefilled with a
    BLURRED reflection (colour and light only: a sharp one came back as mirror
    chevrons), masked with a 16 px overlap, for an outpaint of the side hair."""
    from scipy import ndimage as ndi
    EDGE.mkdir(parents=True, exist_ok=True)
    plate = L.load_rgba(L.ART / "rest-composite.png").astype(np.float32)
    bg = np.array([0.03, 0.02, 0.03], np.float32) * 255
    a = plate[..., 3:4] / 255.0
    rgb = plate[..., :3] * a + bg * (1 - a)
    wide = np.pad(rgb, [(0, 0), (0, MARGIN["right"]), (0, 0)], mode="symmetric")
    blur = np.stack([ndi.gaussian_filter(wide[..., ch], 6) for ch in range(3)], -1)
    wide[:, CW:] = blur[:, CW:]
    mask = np.zeros((CH, EW), np.float32)
    rows = plate[:, CW - 1, 3] > 8  # only where the plate's own paint reaches the border
    mask[:, CW - 16:] = rows[:, None]
    from PIL import Image
    Image.fromarray(np.clip(wide, 0, 255).astype(np.uint8)).save(EDGE / "right.src.png")
    L.save_l(ndi.gaussian_filter(mask, 2), EDGE / "right.mask.png")
    print("edge rows", int(rows.sum()))


def cmd_edgemerge(pick):
    """The picked outpaint's colour into hairBack's right margin (canvas columns >= 832 only)."""
    from PIL import Image
    rig = L.read_json(L.ART / "rig.json")
    meta = next(l for l in rig["artMeta"]["v3"]["frontal"]["layers"] if l["name"] == "hairBack")
    img = L.load_rgba(L.ART / meta["file"])
    x, y = int(meta["box"][0]), int(meta["box"][1])
    if x + img.shape[1] <= CW:
        raise SystemExit("hairBack has no right margin yet: run rig-margins.py first")
    p = np.asarray(Image.open(pick).convert("RGB")).astype(np.float32)
    c0 = CW - x
    ys = slice(max(0, -y), min(img.shape[0], CH - y))
    img[ys, c0:, :3] = p[max(0, y):max(0, y) + (ys.stop - ys.start), CW:CW + img.shape[1] - c0]
    L.save_rgba(img, L.ART / meta["file"])
    prov = L.ART / "v3/jobs/edge/right.merge.json"
    L.write_json({"pick": L.rel(pick), "layer": meta["file"], "columns": [CW, x + img.shape[1]],
                  "why": "the plate's side hair ends at the canvas border; a turn or the sway pulls up to ~30 px of what lies past it into view"}, prov)
    print("merged", pick)


def cmd_edgeflow():
    """hairBack's right margin continued ALONG the painting's own strands: per
    row, the strand direction at the border (structure tensor over the last
    48 px, smoothed along y) and each margin pixel sampled back along that
    direction from the border column. A strand that crosses the border keeps
    going; there is no mirror axis (the reflection read as chevrons) and no
    sharpness step (the outpaint came back as a blur with a hard line at the
    border)."""
    from scipy import ndimage as ndi
    rig = L.read_json(L.ART / "rig.json")
    meta = next(l for l in rig["artMeta"]["v3"]["frontal"]["layers"] if l["name"] == "hairBack")
    img = L.load_rgba(L.ART / meta["file"]).astype(np.float32)
    x, y = int(meta["box"][0]), int(meta["box"][1])
    c0 = CW - x  # first margin column in the file
    band = img[:, c0 - 48:c0, :3].mean(-1)
    gy = ndi.sobel(band, 0)
    gx = ndi.sobel(band, 1)
    jxx = ndi.gaussian_filter((gx * gx).mean(1), 10)
    jyy = ndi.gaussian_filter((gy * gy).mean(1), 10)
    jxy = ndi.gaussian_filter((gx * gy).mean(1), 10)
    # strand direction = the eigenvector with the SMALLER eigenvalue (along the stripes)
    theta = 0.5 * np.arctan2(2 * jxy, jxx - jyy) + np.pi / 2
    dx, dy = np.cos(theta), np.sin(theta)
    dx = np.where(np.abs(dx) < 0.25, 0.25 * np.sign(dx + 1e-9), dx)
    slope = np.clip(dy / dx, -3, 3)  # rows per column along the strand
    H_, W_ = img.shape[:2]
    rows = np.arange(H_, dtype=np.float32)
    border = img[:, c0 - 1]
    for d in range(1, W_ - c0 + 1):
        src = np.clip(rows - d * slope, 0, H_ - 1)
        i0 = np.floor(src).astype(int)
        i1 = np.minimum(i0 + 1, H_ - 1)
        f = (src - i0)[:, None]
        col = border[i0] * (1 - f) + border[i1] * f
        # softened with distance (sigma d/6 along the column): a long straight run of one border
        # texel (the clip, near-horizontal strands) reads as a streak; the first pixels stay crisp
        if d > 3:
            col = ndi.gaussian_filter1d(col, d / 6.0, axis=0, mode="nearest")
        img[:, c0 - 1 + d] = col
    L.save_rgba(img, L.ART / meta["file"])
    L.write_json({"method": "edgeflow: continued along the strand direction from the border column (tools/gen/rig-margins.py)",
                  "layer": meta["file"], "columns": [CW, x + W_], "slopeRange": [float(slope.min()), float(slope.max())]},
                 L.ART / "v3/jobs/edge/right.merge.json")
    print("edgeflow", meta["file"], "slope", float(slope.min()), float(slope.max()))


if __name__ == "__main__":
    import sys as _s
    if len(_s.argv) > 1 and _s.argv[1] == "edgeflow":
        cmd_edgeflow()
        raise SystemExit

    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "edgeprep":
        cmd_edgeprep()
    elif len(sys.argv) > 2 and sys.argv[1] == "edgemerge":
        cmd_edgemerge(sys.argv[2])
    else:
        main()
