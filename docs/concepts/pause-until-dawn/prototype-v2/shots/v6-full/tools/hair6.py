"""Living portrait v6 full (both; the rigged plate is Yuna X-2): Fix 2, the far-side hair at +-30..40, on the CPU.

The diagnosis (NOTES, Fix 2): the smear is the chain, not the plate. Each grown key is the one before it pushed 10
degrees and its stretched holes repainted (v5.1 chain_grow.py), so at -40 the far-side hair has been resampled four
times and filled once at denoise 0.45 "with no structure", and the front layer's shoulder hair meets the hair-back
along a straight row (the step at y ~600, from -20 on). Two CPU repairs, no LoRA, no GPU:

  warp   (the left keys' far side, image right): the region is re-drawn from the PLATE through the key's own map back
         to it (cmap.npy), in one resample: the same map every key's face already rides, so the strands sit where the
         chain put them, as crisp as one resample allows, and back and front are one painting (the row step goes).
  clean  (the right keys' far side, image left): the plate's teal rim glow sits beside the tassel at rest; as the
         head turns the tassel moves away from it and the stretched glow floats on the pink hair (the judge's "teal-
         tinged smear"). It fades a quarter per key (r10 0.75 .. r40 0: no cut drops it at once), taken out of the low
         frequencies by inpainting, its high frequencies kept as luminance (the strands survive, the colour goes).
         At +30/+40 the blurred footprint column the tassel leaves (the plate's footprint mask pushed through the key's
         map) gets the key's own strands beside it (a clone per 24 px band, the offset chosen by the mismatch on the
         band's ring), over the inpainted tone.

Everything is inside a fixed soft mask (FEATHER px) that never touches the face's support, the ornament, the neck
rectangle or the silhouette, and is written to the key's back AND front (where the front has paint).

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY hair6.py fix     # after face6.py collar; the collar's output is kept in WORK/hair6/orig (idempotent)
    $PY hair6.py look    # 1:1 before / after crops -> WORK/hair6/look-*.png
"""
import json
import pathlib
import sys

import cv2
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import face6 as F  # noqa: E402
C = F.C

FEATHER = 10
LP = 5.0
LEFT_BOX = (585, 170, 832, 720)
RIGHT_BOX = (40, 420, 425, 810)
FP_MASK = "D:/Tools/pyrefly-lora/yuna-x2/rig-v51/face/fp-mask.png"  # the plate's tassel footprint, pushed per key
REGIONS = {"v5-l20": "warp", "v5-l30": "warp", "v5-l40": "warp", "v5-r10": "clean", "v5-r20": "clean", "v5-r30": "clean", "v5-r40": "clean"}
# the plate's teal rim glow beside the tassel is kept at rest and fades out through the turn (a quarter per key, so no
# cut drops it at once); the footprint column is re-stranded where the tassel leaves it (+30, +40)
TEAL_KEEP = {"v5-r10": 0.75, "v5-r20": 0.5, "v5-r30": 0.25, "v5-r40": 0.0}
FOOT = {"v5-r30", "v5-r40"}
OUT = C.WORK / "hair6"


def rgba(path):
    return np.asarray(Image.open(path).convert("RGBA")).astype(np.float32) / 255.0


def save_rgba(img, path):
    Image.fromarray(np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8)).save(path)


def gblur(x, s):
    return cv2.GaussianBlur(x, (0, 0), s)


def lowpass(rgb, a, s=LP):
    w = gblur(a, s)[..., None]
    return gblur(rgb * a[..., None], s) / np.maximum(w, 1e-4)


def hsv(rgb):
    return cv2.cvtColor(np.clip(rgb, 0, 1).astype(np.float32), cv2.COLOR_RGB2HSV)


def ornament(rgb, grow=9, min_area=250):
    """The hair clip / tassel colours: bright pure red, and blue, in solid pieces (not the dark red-brown ink)."""
    h = hsv(rgb)
    red = ((h[..., 0] < 8) | (h[..., 0] > 350)) & (h[..., 1] > 0.8) & (h[..., 2] > 0.7)
    blue = (h[..., 0] > 180) & (h[..., 0] < 260) & (h[..., 1] > 0.45) & (h[..., 2] > 0.35)
    m = (red | blue).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros(m.shape, bool)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= min_area:
            keep |= lab == i
    return cv2.dilate(keep.astype(np.uint8), np.ones((grow, grow), np.uint8)) > 0


def teal(rgb):
    """The tassel's teal and blue, bled into the hair-back by the footprint fill."""
    h = hsv(rgb)
    return (h[..., 0] > 90) & (h[..., 0] < 260) & (h[..., 1] > 0.1) & (h[..., 2] > 0.3)


def slivers(rgb):
    """Small bright red / blue remnants of the tassel in the hair-back (any size)."""
    h = hsv(rgb)
    red = ((h[..., 0] < 8) | (h[..., 0] > 350)) & (h[..., 1] > 0.8) & (h[..., 2] > 0.6)
    blue = (h[..., 0] > 180) & (h[..., 0] < 260) & (h[..., 1] > 0.45) & (h[..., 2] > 0.35)
    return red | blue


def boxed(m, box):
    x0, y0, x1, y1 = box
    out = np.zeros_like(m)
    out[y0:y1, x0:x1] = m[y0:y1, x0:x1]
    return out


def soft(T, feather=FEATHER):
    d = cv2.distanceTransform(T.astype(np.uint8), cv2.DIST_L2, 5)
    m = np.clip(d / feather, 0, 1)
    return (m * m * (3 - 2 * m)).astype(np.float32)


def face_support(k):
    Mp = np.load(C.WORK / "support.npy")
    cm = F.cmap(k)
    Mk = cv2.remap(Mp, cm[..., 0], cm[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0.02
    return cv2.dilate(Mk.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0


def plate_warped(k):
    pl = C.premul(rgba(F.PROTO / "art" / "v6" / "keys" / "frontal" / "back.png"))
    cm = F.cmap(k)
    return C.remap(pl, cm[..., 0], cm[..., 1])


def neck_rect():
    m = np.zeros((C.H, C.W), bool)
    m[530:, 340:605] = True  # chain_face.py's neck (x 356-636); its right edge from x 605 is shoulder hair
    return m


def repair_warp(k, rgb, a):
    w = plate_warped(k)
    wa = w[..., 3]
    wrgb = w[..., :3] / np.maximum(wa[..., None], 1e-4)
    core = (a > 0.98) & (wa > 0.98) & ~face_support(k) & ~ornament(rgb) & ~ornament(wrgb) & ~neck_rect()
    core = boxed(core, LEFT_BOX)
    core = cv2.morphologyEx(core.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
    m = soft(core)[..., None]
    return m * wrgb + (1 - m) * rgb, m[..., 0], {"mode": "warp", "px": int(core.sum())}


def clone_bands(hp, ok, fm, band=24, need=0.6):
    """The footprint's high frequencies from the key's own strands beside it: per band of rows, the horizontal offset
    whose source is hair (at least `need` of it) and whose ring around the band matches best."""
    out = np.zeros_like(hp)
    got = np.zeros(fm.shape, np.float32)
    ys = np.nonzero(fm.any(1))[0]
    picks = []
    for y0 in range(int(ys.min()), int(ys.max()) + 1, band) if len(ys) else []:
        bm = np.zeros_like(fm)
        bm[y0:y0 + band + 8] = fm[y0:y0 + band + 8]  # 8 px overlap with the next band (feathered)
        if not bm.any():
            continue
        ring = (cv2.dilate(bm.astype(np.uint8), np.ones((17, 17), np.uint8)) > 0) & ~fm & ok
        yy, xx = np.nonzero(bm)
        ry, rx = np.nonzero(ring)
        best = None
        for dx in range(-220, 221, 3):
            if abs(dx) < 30 or xx.min() + dx < 0 or xx.max() + dx >= C.W:
                continue
            v = ok[yy, xx + dx]
            if v.mean() < need:
                continue
            cost = float(((hp[ry, np.clip(rx + dx, 0, C.W - 1)] - hp[ry, rx]) ** 2).mean()) if len(ry) else 0.0
            if best is None or cost < best[0]:
                best = (cost, dx)
        if best is None:
            continue
        dx = best[1]
        wgt = soft(bm, 4) * np.roll(ok, -dx, axis=1)
        out = out * (1 - wgt[..., None]) + np.roll(hp, -dx, axis=1) * wgt[..., None]
        got = np.maximum(got, wgt)
        picks.append({"y0": y0, "dx": int(dx), "ringMse": round(best[0], 5)})
    return out, got, picks


def repair_clean(k, rgb, a):
    inb = boxed((a > 0.98) & ~face_support(k), RIGHT_BOX)
    tm = (inb & (teal(rgb) | slivers(rgb))).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(tm)  # the glow and the slivers, not single-pixel noise
    tm = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 80])
    tm = cv2.dilate(tm.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (29, 29))) > 0  # its soft halo too
    tm &= inb
    fp = np.asarray(Image.open(FP_MASK)).astype(np.float32)  # the plate's tassel footprint (v5.1 chain_face.py)
    cm = F.cmap(k)
    fm = cv2.remap(fp, cm[..., 0], cm[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 127
    fm = cv2.dilate(fm.astype(np.uint8), np.ones((11, 11), np.uint8)) > 0
    fm &= ~face_support(k)
    fm &= a > 0.98
    if k not in FOOT:
        fm[:] = False
    kill = (tm | fm) & (a > 0.98)
    lp = lowpass(rgb, a)
    hp = rgb - lp
    lp8 = np.clip(lp * 255 + 0.5, 0, 255).astype(np.uint8)
    lp2 = cv2.inpaint(lp8, kill.astype(np.uint8), 25, cv2.INPAINT_TELEA).astype(np.float32) / 255.0
    keep = TEAL_KEEP[k]
    lp2 = np.where((tm & ~fm)[..., None], keep * lp + (1 - keep) * lp2, lp2)
    hpl = C.lum(hp)[..., None].repeat(3, -1)  # the strands' light and dark, without the teal's colour
    hp2 = np.where(tm[..., None], keep * hp + (1 - keep) * hpl, hp)
    lpv = hsv(lp)
    skin = (lpv[..., 2] > 0.8) & (lpv[..., 1] < 0.45)
    ok = (a > 0.98) & ~kill & ~face_support(k) & ~skin & ~neck_rect()
    hpc, got, picks = clone_bands(hpl, ok, fm)
    fsoft = (soft(fm, 6) * got)[..., None]
    hp2 = fsoft * hpc + (1 - fsoft) * hp2
    new = np.clip(lp2 + hp2, 0, 1)
    m = soft(kill, 10)[..., None]
    return m * new + (1 - m) * rgb, m[..., 0], {"mode": "clean", "tealKeep": keep, "tealPx": int(tm.sum()), "footprintPx": int(fm.sum()), "bands": picks}


def fix():
    OUT.mkdir(parents=True, exist_ok=True)
    report = {}
    for k, mode in REGIONS.items():
        d = F.PROTO / "art" / "v6" / "keys" / k
        keep = OUT / "orig" / k
        keep.mkdir(parents=True, exist_ok=True)
        for part in ("back", "front"):  # always start from the collar's output (idempotent)
            if not (keep / f"{part}.png").exists():
                Image.open(d / f"{part}.png").save(keep / f"{part}.png")
        back, front = rgba(keep / "back.png"), rgba(keep / "front.png")
        rgb, a = back[..., :3].copy(), back[..., 3]
        new, m, rep = (repair_warp if mode == "warp" else repair_clean)(k, rgb, a)
        save_rgba(np.dstack([new, a]), d / "back.png")
        nf = front.copy()
        nf[..., :3] = np.where(front[..., 3:4] > 0, new, front[..., :3])
        save_rgba(nf, d / "front.png")
        Image.fromarray(C.to_u8(m)).save(OUT / f"mask-{k}.png")
        report[k] = rep
        print(k, rep, flush=True)
    rig = json.loads((F.PROTO / "art" / "rig-v6.json").read_text(encoding="utf-8"))
    rig["artMeta"]["v6full"]["hair"] = "Fix 2 (CPU): far-side hair re-drawn from the plate (l20-l40); tassel teal faded r10-r40, footprint re-stranded r30/r40: hair6.py"
    (F.PROTO / "art" / "rig-v6.json").write_text(json.dumps(rig, indent=1), encoding="utf-8")
    (OUT / "hair6.json").write_text(json.dumps(report, indent=1))


def look():
    for k, mode in REGIONS.items():
        x0, y0, x1, y1 = LEFT_BOX if mode == "warp" else RIGHT_BOX
        tiles = []
        for src in (OUT / "orig" / k / "back.png", F.PROTO / "art" / "v6" / "keys" / k / "back.png"):
            im = rgba(src)
            tiles.append(C.to_u8((im[..., :3] * im[..., 3:4] + (8 / 255) * (1 - im[..., 3:4]))[y0:y1, x0:x1]))
        tiles.insert(1, np.full((y1 - y0, 8, 3), 255, np.uint8))
        Image.fromarray(np.hstack(tiles)).save(OUT / f"look-{k}.png")


if __name__ == "__main__":
    {"fix": fix, "look": look}[sys.argv[1]]()
