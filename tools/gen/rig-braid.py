"""Living-portrait v3.2: the braid on the right side of her head in turn-r45.

turn-r45 is turn-l45 mirrored, so its braid hangs on her LEFT (behind the far
cheek, viewer's right), while the plate hangs it on her RIGHT (viewer's left,
the frontal tassel). Across a 0 -> +45 turn the braid jumped sides (the v3.1
check saw both at once at +20: "a duplicate braid").

  prep   r45's composite (back + body + front) and a mask of its braid, clasp
         and earring (vivid red / blue / gold pixels in the far-side band),
         for an inpaint that paints the hair and neck behind them
  (ComfyUI) node tools/gen/inpaint.mjs --image <..>/braid/r45.src.png --mask <..>/r45.mask.png ...
  merge  the inpainted pixels go back into r45: hair above the far jaw line
         into front + back, hair below it into back only, neck/backdrop made
         transparent (the pinned body shows); then turn-l45's OWN braid
         (unmirrored: it hangs at x 325-390, which on r45 is the near side, her
         right) is laid into r45's front at the same canvas pixels

    python -s tools/gen/rig-braid.py prep
    python -s tools/gen/rig-braid.py merge --pick <full.png>
"""
from __future__ import annotations

import argparse
import importlib.util
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

_spec = importlib.util.spec_from_file_location("riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)

W, H = 832, 1216
BG = np.array([0.03, 0.02, 0.03], np.float32) * 255
DIR = L.V3 / "layers/braid"
KEYS = L.V3 / "layers/turns"
# far-side band of r45 where its mirrored braid hangs, and l45's own braid band
FAR = (585, 690, 420, 880)   # x0, x1, y0, y1
NEAR = (270, 400, 440, 880)
JAW = ((540, 748), (670, 628))  # r45's far jaw line, chin -> jaw_L
FAR_BRUSHES = [
    {"pts": [[672, 506], [661, 545], [653, 630], [643, 700], [636, 770], [631, 840], [629, 884]], "r": 27},
]
# turn-l45's own braid (red, the blue clasp, the tassel), hand-placed at 2x
NEAR_BRUSHES = [
    {"pts": [[328, 598], [333, 640], [339, 685], [344, 725], [349, 760], [357, 800], [366, 845]], "r": 13},
    {"pts": [[350, 767]], "r": 19},
]


def placed(key, part):
    meta = L.read_json(KEYS / key / "provenance.json")["layers"][part]
    img = L.load_rgba(L.ART / meta["file"])
    c = np.zeros((H, W, 4), np.float32)
    x, y = meta["box"][:2]
    h, w = img.shape[:2]
    xa, xb = max(0, x), min(W, x + w)
    c[y:y + h, xa:xb] = img[:, xa - x:xb - x]
    return c, meta


def composite(*layers):
    out = np.zeros((H, W, 3), np.float32) + BG
    for lay in layers:
        a = lay[..., 3:4] / 255.0
        out = out * (1 - a) + lay[..., :3] * a
    return out


def body():
    v3 = L.read_json(L.ART / "rig.json")["artMeta"]["v3"]
    b = v3["frontal"]["bodyTurned"]
    img = L.load_rgba(L.ART / b["file"])
    c = np.zeros((H, W, 4), np.float32)
    x, y = b["box"][0], b["box"][1]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + img.shape[1]), min(H, y + img.shape[0])
    c[y0:y1, x0:x1] = img[y0 - y:y1 - y, x0 - x:x1 - x]  # clipped: rig-margins.py adds margins past the canvas
    return c


def braid_mask(c, band):
    x0, x1, y0, y1 = band
    rgb = c[..., :3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1); mn = rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    red = (r > 120) & (r > g * 1.6) & (r > b * 1.4) & (sat > 0.45)
    blue = (b > r + 40) & (b > g + 20) & (sat > 0.4)
    gold = (r > 180) & (g > 110) & (b < 110) & (sat > 0.45)
    m = (red | blue | gold) & (c[..., 3] > 64)
    zone = np.zeros(m.shape, bool); zone[y0:y1, x0:x1] = True
    m &= zone
    m = ndi.binary_closing(m, iterations=3)
    lab, n = ndi.label(m)
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1)) if n else []
    m = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 40])
    return ndi.binary_fill_holes(m)


def cmd_prep(_a):
    DIR.mkdir(parents=True, exist_ok=True)
    back, _ = placed("turn-r45", "back")
    front, _ = placed("turn-r45", "front")
    comp = composite(back, body(), front)
    # hand-placed at 1:1 on r45's composite (the colour test also caught the blush and the iris)
    m = L.poly_mask((H, W), [], FAR_BRUSHES)
    Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8)).save(DIR / "r45.src.png")
    L.save_l(m.astype(np.float32), DIR / "r45.mask.png")
    ov = comp.copy(); ov[m] = ov[m] * 0.5 + L.MAGENTA * 0.5
    Image.fromarray(np.clip(ov, 0, 255).astype(np.uint8)).save(DIR / "r45.mask-overlay.png")
    print("braid mask px", int(m.sum()))


def below_jaw(shape):
    (xa, ya), (xb, yb) = JAW
    yy, xx = np.mgrid[: shape[0], : shape[1]]
    yline = ya + (xx - xa) * (yb - ya) / (xb - xa)
    return yy > yline


def cmd_merge(a):
    pick = np.asarray(Image.open(a.pick).convert("RGB")).astype(np.float32)[:H, :W]
    m = L.load_l(DIR / "r45.mask.png") > 0.5
    bod = body()
    lum = L.luminance(pick)
    # what the model painted: backdrop (dark) or hair and cheek; above the far
    # jaw line it is the head's front, below it hair behind the neck (the body covers the neck)
    hair = m & (lum > 0.08)
    soft = np.clip(ndi.gaussian_filter(hair.astype(np.float32), 0.8), 0, 1)
    out = {}
    for part in ("back", "front"):
        c, meta = placed("turn-r45", part)
        # the pick was painted over the whole composite (body included), so inside
        # the mask it is laid in as painted, in both halves: its cheek, jaw
        # contour and the neck just under it meet the untouched pixels around
        a_new = soft
        c[m, :3] = pick[m]
        c[m, 3] = 255 * a_new[m]
        if part == "front":
            # l45's own braid, unmirrored: on r45 that is her right side, the near side
            # the braid below the jaw lives in l45's back layer (it hangs beside the neck, over the backdrop)
            lf, _ = placed("turn-l45", "front")
            lb, _ = placed("turn-l45", "back")
            af = lf[..., 3:4] / 255.0
            l45 = lb.copy()
            l45[..., :3] = lf[..., :3] * af + lb[..., :3] * (1 - af)
            l45[..., 3] = np.maximum(lf[..., 3], lb[..., 3])
            rgb = l45[..., :3]
            r_, g_, b_ = rgb[..., 0], rgb[..., 1], rgb[..., 2]
            braidish = ((r_ > g_ + 55) & (r_ > 70)) | ((b_ > r_ + 30) & (b_ > g_ + 10))
            bm = L.poly_mask((H, W), [], NEAR_BRUSHES) & braidish
            bm = ndi.binary_fill_holes(ndi.binary_closing(bm, iterations=2)) & (l45[..., 3] > 0)
            ba = np.clip(ndi.gaussian_filter(bm.astype(np.float32), 0.7), 0, 1) * l45[..., 3] / 255.0
            c[..., :3] = np.where(ba[..., None] > 0, (c[..., :3] * (c[..., 3:4] / 255.0) * (1 - ba[..., None]) + l45[..., :3] * ba[..., None]) / np.maximum(c[..., 3:4] / 255.0 * (1 - ba[..., None]) + ba[..., None], 1e-6), c[..., :3])
            c[..., 3] = 255 * (c[..., 3] / 255.0 * (1 - ba) + ba)
            out["nearBraidPx"] = int(bm.sum())
        x, y, w, h = meta["box"][0], meta["box"][1], meta["box"][2], meta["box"][3]
        xa, xb = max(0, x), min(W, x + w)
        img = L.load_rgba(L.ART / meta["file"])
        img[:, xa - x:xb - x] = c[y:y + h, xa:xb]
        L.save_rgba(img, L.ART / meta["file"])
    prov = L.read_json(KEYS / "turn-r45" / "provenance.json")
    prov["braid"] = {"pick": L.rel(a.pick), "farBraidRemovedPx": int(m.sum()), **out,
                     "why": "the mirror put the braid on her left; the plate hangs it on her right (tools/gen/rig-braid.py)"}
    L.write_json(prov, KEYS / "turn-r45" / "provenance.json")
    fb, _ = placed("turn-r45", "back"); ff, _ = placed("turn-r45", "front")
    Image.fromarray(np.clip(composite(fb, bod, ff), 0, 255).astype(np.uint8)).save(DIR / "r45.check.png")
    print(prov["braid"])


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("prep")
    mm = sub.add_parser("merge")
    mm.add_argument("--pick", required=True)
    a = ap.parse_args()
    {"prep": cmd_prep, "merge": cmd_merge}[a.cmd](a)
