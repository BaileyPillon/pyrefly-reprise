"""Art method r3 pilot, P3 helpers (FFX-2 only, chapter 6 Leblanc): the seam band, its crop, and the merge.

    python seam.py prep  --src p2-matched --out p3 [--regions obi,choker] [--grow 10] [--shrink 4]
    python seam.py merge --src p2-matched --out p3 --region obi --cands p3/obi.c1.png,... [--base cast.r2.2.png]
    python seam.py combine --out p3 --pick obi=<file>,choker=<file> --name cast.p3.png
    python seam.py prepmask --img p4v2/bake.png --mask p4v2/holes.png --grow 10 --name holes --out p4r [--ctx x0,y0,x1,y1]
    python seam.py mergemask --img p4v2/bake.png --name holes --out p4r --cands p4r/holes.c1.png,...

(D:/Tools/sd-scripts/.venv/Scripts/python.exe, OpenCV.)

prep: per region, M = the pasted parts plus the fill of the removed old parts;
P = the pasted parts only. The repaint band is dilate(M, 10) minus erode(P, 4)
inside the figure (METHOD-CHECK step 2.5). The crop is the band's box plus 25 %
margin, upscaled with Lanczos to a 1024 short side (sides rounded to 8) and
flattened on white; the band mask is upscaled the same way.
merge: each candidate comes back down with Lanczos and is composited in the
band only (2 px feather inside the band); the interior erode(P, 4) is then
re-pasted from the transplant exactly (--repaste 1, the P6 re-run: the whole part with a
2 px ramp at its edge, because on a 13 px choker erode(P, 4) left the model most of the part), and everything outside dilate(M, 10)
is the base file's pixels exactly. Cast alpha is never changed.
"""
from __future__ import annotations

import argparse
import pathlib
import sys

import cv2
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import r3lib as R  # noqa: E402

REGIONS = {"obi": ["tassel", "obi"], "choker": ["choker"]}
SPLIT_Y = 500  # fill pixels above belong to the choker region, below to the obi region


def k(r):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def dil(m, r):
    return cv2.dilate(m.astype(np.uint8), k(r)).astype(bool) if r > 0 else m.copy()


def ero(m, r):
    return cv2.erode(m.astype(np.uint8), k(r)).astype(bool) if r > 0 else m.copy()


def region_masks(src: pathlib.Path, region: str, grow: int, shrink: int, alpha: np.ndarray):
    P = np.zeros(alpha.shape, bool)
    for part in REGIONS[region]:
        P |= R.load_mask(src / f"mask.{part}.png")
    fill = R.load_mask(src / "fill.png")
    yy = np.arange(alpha.shape[0])[:, None]
    fill &= (yy < SPLIT_Y) if region == "choker" else (yy >= SPLIT_Y)
    M = P | fill
    band = dil(M, grow) & ~ero(P, shrink) & (alpha > 0)
    return M, P, fill, band


def cmd_prep(a):
    src = R.SCR / a.src; out = R.SCR / a.out; out.mkdir(parents=True, exist_ok=True)
    work = R.load_rgba(src / "cast.png")
    al = work[..., 3:4] / 255.0
    flat = work[..., :3] * al + 255 * (1 - al)
    H, W = work.shape[:2]
    for region in a.regions.split(","):
        M, P, fill, band = region_masks(src, region, a.grow, a.shrink, work[..., 3])
        ys, xs = np.nonzero(band)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        mx, my = int(round((x1 - x0) * 0.25)), int(round((y1 - y0) * 0.25))
        x0, x1, y0, y1 = max(0, x0 - mx), min(W, x1 + mx), max(0, y0 - my), min(H, y1 + my)
        cw, ch = x1 - x0, y1 - y0
        s = 1024 / min(cw, ch)
        UW, UH = int(round(cw * s / 8)) * 8, int(round(ch * s / 8)) * 8
        crop = Image.fromarray(np.clip(np.rint(flat[y0:y1, x0:x1]), 0, 255).astype(np.uint8))
        crop.resize((UW, UH), Image.LANCZOS).save(out / f"{region}.init.png")
        bm = Image.fromarray((band[y0:y1, x0:x1] * 255).astype(np.uint8)).resize((UW, UH), Image.BILINEAR)
        bm.save(out / f"{region}.mask.png")
        for n, m in (("M", M), ("P", P), ("fill", fill), ("band", band)):
            R.save_l(m, out / f"{region}.{n}.png")
        meta = {"region": region, "box": [int(x0), int(y0), int(x1), int(y1)], "up": [UW, UH], "scale": round(s, 4),
                "bandPx": int(band.sum()), "MPx": int(M.sum()), "PPx": int(P.sum()), "fillPx": int(fill.sum()), "src": a.src,
                "grow": a.grow, "shrink": a.shrink}
        R.write_json(meta, out / f"{region}.meta.json")
        print(region, meta, flush=True)


def merge_one(base, work, cand_up, meta, M, P, band, layer_rgba):
    x0, y0, x1, y1 = meta["box"]
    cand = np.asarray(Image.open(cand_up).convert("RGB").resize((x1 - x0, y1 - y0), Image.LANCZOS)).astype(np.float32)
    out = work.copy()
    # 2 px ramp inside the band at both of its edges (toward the base outside, toward the transplant inside)
    d = cv2.distanceTransform(band.astype(np.uint8), cv2.DIST_L2, 5)
    w = np.clip(d / 2.0, 0, 1).astype(np.float32)
    sub = w[y0:y1, x0:x1, None]
    out[y0:y1, x0:x1, :3] = out[y0:y1, x0:x1, :3] * (1 - sub) + cand * sub
    rp = meta.get("repaste", a_shrink(meta))
    interior = ero(P, rp) if rp > 0 else P.copy()
    if rp <= 1:
        # the whole part is the idle's, with a 1 px ramp at its edge so the model's seam meets it softly
        din = cv2.distanceTransform(P.astype(np.uint8), cv2.DIST_L2, 5)
        wi = np.clip(din / 2.0, 0, 1)[..., None]
        out[..., :3] = out[..., :3] * (1 - wi) + work[..., :3] * wi
    else:
        out[interior, :3] = work[interior, :3]  # the transplant, exactly (the model owns only the seam)
    grown = dil(M, meta["grow"])
    out[~grown] = base[~grown]  # outside mask + band: the base, exactly
    out[base[..., 3] == 0] = base[base[..., 3] == 0]  # transparent pixels keep the base's colour too
    out[..., 3] = base[..., 3]
    return out


def a_shrink(meta):
    return int(meta.get("shrink", 4))


def cmd_merge(a):
    src = R.SCR / a.src; out = R.SCR / a.out
    base = R.load_rgba(R.SCR / a.base); work = R.load_rgba(src / "cast.png")
    meta = R.read_json(out / f"{a.region}.meta.json")
    if a.repaste is not None:
        meta["repaste"] = a.repaste
    M = R.load_mask(out / f"{a.region}.M.png"); P = R.load_mask(out / f"{a.region}.P.png"); band = R.load_mask(out / f"{a.region}.band.png")
    for c in a.cands.split(","):
        c = pathlib.Path(c) if pathlib.Path(c).is_absolute() else R.SCR / c
        res = merge_one(base, work, c, meta, M, P, band, None)
        dst = out / "merged" / f"{c.stem}.png"
        R.save_rgba(res, dst)
        print(dst, flush=True)


def cmd_combine(a):
    """Several merged region candidates into one file: each contributes its own grown region."""
    out = R.SCR / a.out
    base = R.load_rgba(R.SCR / a.base)
    res = base.copy()
    for kv in a.pick.split(","):
        region, f = kv.split("=")
        meta = R.read_json(out / f"{region}.meta.json")
        grown = dil(R.load_mask(out / f"{region}.M.png"), meta["grow"])
        img = R.load_rgba(out / "merged" / f if not pathlib.Path(f).is_absolute() else f)
        res[grown] = img[grown]
    res[base[..., 3] == 0] = base[base[..., 3] == 0]
    res[..., 3] = base[..., 3]
    R.save_rgba(res, out / a.name)
    print(out / a.name)


def cmd_prepmask(a):
    """Generic crop for a mask on any image (the hurt bake's holes and eye box): box = --ctx or the mask box + 25 %."""
    out = R.SCR / a.out; out.mkdir(parents=True, exist_ok=True)
    img = R.load_rgba(R.SCR / a.img)
    al = img[..., 3:4] / 255.0
    flat = img[..., :3] * al + 255 * (1 - al)
    H, W = img.shape[:2]
    m = R.load_mask(R.SCR / a.mask)
    if a.grow:
        m = dil(m, a.grow)
    m &= img[..., 3] > 0
    if a.ctx:
        x0, y0, x1, y1 = map(int, a.ctx.split(","))
    else:
        ys, xs = np.nonzero(m)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        mx, my = int(round((x1 - x0) * 0.25)), int(round((y1 - y0) * 0.25))
        x0, x1, y0, y1 = max(0, x0 - mx), min(W, x1 + mx), max(0, y0 - my), min(H, y1 + my)
    cw, ch = x1 - x0, y1 - y0
    s = 1024 / min(cw, ch)
    UW, UH = int(round(cw * s / 8)) * 8, int(round(ch * s / 8)) * 8
    Image.fromarray(np.clip(np.rint(flat[y0:y1, x0:x1]), 0, 255).astype(np.uint8)).resize((UW, UH), Image.LANCZOS).save(out / f"{a.name}.init.png")
    Image.fromarray((m[y0:y1, x0:x1] * 255).astype(np.uint8)).resize((UW, UH), Image.BILINEAR).save(out / f"{a.name}.mask.png")
    R.save_l(m, out / f"{a.name}.band.png")
    meta = {"name": a.name, "img": a.img, "mask": a.mask, "grow": a.grow, "box": [int(x0), int(y0), int(x1), int(y1)], "up": [UW, UH],
            "scale": round(float(s), 4), "maskPx": int(m.sum())}
    R.write_json(meta, out / f"{a.name}.meta.json")
    print(meta)


def cmd_mergemask(a):
    """Composite candidates in the mask only (2 px ramp inside its edge); every other pixel is --img exactly."""
    out = R.SCR / a.out
    img = R.load_rgba(R.SCR / a.img)
    meta = R.read_json(out / f"{a.name}.meta.json")
    m = R.load_mask(out / f"{a.name}.band.png")
    x0, y0, x1, y1 = meta["box"]
    d = cv2.distanceTransform(m.astype(np.uint8), cv2.DIST_L2, 5)
    w = np.clip(d / 2.0, 0, 1).astype(np.float32)[y0:y1, x0:x1, None]
    for c in a.cands.split(","):
        c = pathlib.Path(c) if pathlib.Path(c).is_absolute() else R.SCR / c
        cand = np.asarray(Image.open(c).convert("RGB").resize((x1 - x0, y1 - y0), Image.LANCZOS)).astype(np.float32)
        res = img.copy()
        res[y0:y1, x0:x1, :3] = img[y0:y1, x0:x1, :3] * (1 - w) + cand * w
        res[~m] = img[~m]
        dst = out / "merged" / f"{c.stem}.png"
        R.save_rgba(res, dst)
        print(dst, flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["prep", "merge", "combine", "prepmask", "mergemask"])
    ap.add_argument("--img", default="")
    ap.add_argument("--mask", default="")
    ap.add_argument("--ctx", default="")
    ap.add_argument("--src", default="p2-matched")
    ap.add_argument("--out", default="p3")
    ap.add_argument("--regions", default="obi,choker")
    ap.add_argument("--region", default="obi")
    ap.add_argument("--cands", default="")
    ap.add_argument("--pick", default="")
    ap.add_argument("--name", default="cast.p3.png")
    ap.add_argument("--base", default="cast.r2.2.png")
    ap.add_argument("--grow", type=int, default=10)
    ap.add_argument("--shrink", type=int, default=4)
    ap.add_argument("--repaste", type=int, default=None, help="interior re-paste erosion (default = shrink; P6: 1 = the whole part, 2 px ramp)")
    a = ap.parse_args()
    {"prep": cmd_prep, "merge": cmd_merge, "combine": cmd_combine, "prepmask": cmd_prepmask, "mergemask": cmd_mergemask}[a.cmd](a)


if __name__ == "__main__":
    main()
