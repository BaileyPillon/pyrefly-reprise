#!/usr/bin/env python
"""Round-4 independent judge: own numpy pass over both A/B arms (raw frames and the
post tool's colour-matched frames). Does not reuse video-post.py or tone-series.py code.

Usage: python judge-measure.py <armDir> <cmDir> <T> <plate> <floor> <out.json>
"""
import sys, glob, json, os
import numpy as np
from PIL import Image

BOXES = {
    "face": (420, 20, 760, 400), "eyes": (460, 140, 635, 285),
    "greenEye": (468, 203, 546, 278), "blueEye": (548, 145, 626, 220),
    "mouth": (548, 252, 642, 308), "braid": (468, 278, 542, 402),
    "hairline": (436, 18, 724, 122), "body": (560, 400, 900, 690),
    "bgLeft": (0, 120, 330, 560), "bgRight": (950, 0, 1280, 500),
    "full": (0, 0, 1280, 704),
}


def load(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float32)


def crop(a, b):
    x0, y0, x1, y1 = b
    return a[y0:y1, x0:x1]


def mad(a, b, box):
    return float(np.mean(np.abs(crop(a, box) - crop(b, box))))


def sat(a):
    mx = a.max(-1); mn = a.min(-1)
    return float(np.mean(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)))


def phase_shift(a, b):
    """Sub-pixel translation between a and b by phase correlation (grey, Hann window)."""
    ga = a.mean(-1); gb = b.mean(-1)
    h, w = ga.shape
    win = np.outer(np.hanning(h), np.hanning(w))
    A = np.fft.fft2((ga - ga.mean()) * win); B = np.fft.fft2((gb - gb.mean()) * win)
    R = A * np.conj(B); R /= np.maximum(np.abs(R), 1e-9)
    r = np.real(np.fft.ifft2(R))
    iy, ix = np.unravel_index(np.argmax(r), r.shape)

    def sub(i, n, axis):
        if axis == 0:
            im1, i0, ip1 = r[(i - 1) % n, ix], r[iy, ix], r[(i + 1) % n, ix]
        else:
            im1, i0, ip1 = r[iy, (i - 1) % n], r[iy, ix], r[iy, (i + 1) % n]
        d = im1 - 2 * i0 + ip1
        off = 0.5 * (im1 - ip1) / d if d != 0 else 0.0
        v = i + off
        return v - n if v > n / 2 else v
    return sub(iy, h, 0), sub(ix, w, 1)


def edge_rows(a, box):
    """Row profile of vertical-gradient magnitude (horizontal edges: collar, neckline, clasp)."""
    g = crop(a, box).mean(-1)
    gy = np.abs(np.diff(g, axis=0)).mean(1)
    return gy - gy.mean()


def profile_dy(p0, p1, maxs=6):
    best = None
    xs = np.arange(len(p0))
    for s in np.arange(-maxs, maxs + 0.001, 0.05):
        q = np.interp(xs + s, xs, p1)
        e = float(np.mean((p0[maxs:-maxs] - q[maxs:-maxs]) ** 2))
        if best is None or e < best[0]:
            best = (e, s)
    return float(best[1])


def main():
    arm, cmdir, T, plate_p, floor_p, out = sys.argv[1:7]
    T = int(T)
    raw = [load(p) for p in sorted(glob.glob(os.path.join(arm, "frame_*.png")))]
    cm = [load(p) for p in sorted(glob.glob(os.path.join(cmdir, "frame_*.png")))]
    plate = load(plate_p); floor = load(floor_p)
    N = len(raw)
    fl = {b: mad(floor, plate, BOXES[b]) for b in BOXES}
    res = {"N": N, "Ncm": len(cm), "T": T, "floor": fl}

    def jb(a, b):
        return {x: {"mad": round(mad(a, b, BOXES[x]), 3), "xFloor": round(mad(a, b, BOXES[x]) / fl[x], 3)} for x in BOXES}

    res["raw_f1"] = jb(raw[0], plate); res["raw_fN"] = jb(raw[-1], plate)
    res["cm_f1"] = jb(cm[0], plate); res["cm_fT"] = jb(cm[T - 1], plate); res["cm_fN"] = jb(cm[-1], plate)

    ser = {k: [] for k in ["satRaw", "satCm", "bodyVsF1Raw", "bodyVsF1Cm", "faceVsPlateRaw", "faceVsPlateCm",
                           "mouthVsPlateCm", "stepHeadRaw", "stepHeadCm", "stepFullCm"]}
    for i in range(N):
        ser["satRaw"].append(round(sat(raw[i]), 4)); ser["satCm"].append(round(sat(cm[i]), 4))
        ser["bodyVsF1Raw"].append(round(mad(raw[i], raw[0], BOXES["body"]), 3))
        ser["bodyVsF1Cm"].append(round(mad(cm[i], cm[0], BOXES["body"]), 3))
        ser["faceVsPlateRaw"].append(round(mad(raw[i], plate, BOXES["face"]), 3))
        ser["faceVsPlateCm"].append(round(mad(cm[i], plate, BOXES["face"]), 3))
        ser["mouthVsPlateCm"].append(round(mad(cm[i], plate, BOXES["mouth"]), 3))
        if i:
            ser["stepHeadRaw"].append(round(mad(raw[i], raw[i - 1], BOXES["face"]), 3))
            ser["stepHeadCm"].append(round(mad(cm[i], cm[i - 1], BOXES["face"]), 3))
            ser["stepFullCm"].append(round(mad(cm[i], cm[i - 1], BOXES["full"]), 3))
    res["series"] = ser

    # joins of the colour-matched ping-pong (1..T, T-1..2, then wrap back to 1)
    res["join_entry_plate_to_cmf1"] = res["cm_f1"]
    res["join_reversal_cm"] = jb(cm[T - 1], cm[T - 2])
    res["join_wrap_cm_f2_to_f1"] = jb(cm[1], cm[0])
    res["hardcut_forward_cm_fN_to_f1"] = jb(cm[-1], cm[0])
    res["hardcut_forward_raw_fN_to_f1"] = jb(raw[-1], raw[0])
    sh = np.array(ser["stepHeadCm"])
    res["stepHeadCm_median"] = float(np.median(sh)); res["stepHeadCm_max"] = float(sh.max())
    res["stepHeadCm_argmax_to_f"] = int(np.argmax(sh)) + 2
    shT = sh[:T - 1]
    res["stepHeadCm_used_median"] = float(np.median(shT)); res["stepHeadCm_used_max"] = float(shT.max())
    res["stepHeadCm_used_argmax_to_f"] = int(np.argmax(shT)) + 2
    for k in ["satRaw", "satCm", "bodyVsF1Raw", "bodyVsF1Cm"]:
        a = np.array(ser[k][:T]); b = np.array(ser[k])
        res[k + "_usedMinMax"] = [float(a.min()), float(a.max())]
        res[k + "_allMinMax"] = [float(b.min()), float(b.max())]

    # motion: head and chest displacement vs frame 1 (raw frames)
    chest = (560, 400, 900, 690)
    collar = (540, 360, 860, 620)
    head = (420, 20, 760, 400)
    mot = {"headDy": [], "headDx": [], "chestDy": [], "chestDx": [], "collarProfileDy": []}
    p0 = edge_rows(raw[0], collar)
    for i in range(N):
        dy, dx = phase_shift(crop(raw[0], head), crop(raw[i], head)); mot["headDy"].append(round(dy, 3)); mot["headDx"].append(round(dx, 3))
        dy, dx = phase_shift(crop(raw[0], chest), crop(raw[i], chest)); mot["chestDy"].append(round(dy, 3)); mot["chestDx"].append(round(dx, 3))
        mot["collarProfileDy"].append(round(profile_dy(p0, edge_rows(raw[i], collar)), 3))
    for k in list(mot):
        a = np.array(mot[k]); mot[k + "_range"] = round(float(a.max() - a.min()), 3)
    stack = np.stack([c.mean(-1) for c in cm[:T]])
    sd = stack.std(0)
    mot["temporalStd"] = {b: round(float(crop(sd, BOXES[b]).mean()), 3) for b in BOXES}
    H, W = sd.shape; tiles = []
    for y in range(0, H - 31, 32):
        for x in range(0, W - 31, 32):
            tiles.append((float(sd[y:y + 32, x:x + 32].mean()), x, y))
    tiles.sort(reverse=True)
    mot["topTiles"] = [{"std": round(t[0], 2), "x": t[1], "y": t[2]} for t in tiles[:8]]
    res["motion"] = mot
    Image.fromarray(np.clip(sd * 12, 0, 255).astype(np.uint8)).save(out.replace(".json", "-motion-std.png"))

    def iris(a):
        g = crop(a, BOXES["greenEye"]); b = crop(a, BOXES["blueEye"])
        def green(x): return int(np.sum((x[..., 1] > x[..., 0] + 40) & (x[..., 1] > x[..., 2] + 20)))
        def blue(x): return int(np.sum((x[..., 2] > x[..., 0] + 60) & (x[..., 2] > x[..., 1] + 30)))
        return {"greenInGreenBox": green(g), "blueInBlueBox": blue(b), "blueInGreenBox": blue(g), "greenInBlueBox": green(b)}
    res["identity"] = {"plate": iris(plate)}
    for f in sorted(set([1, 20, 40, 60, T, N])):
        res["identity"][f"cm_f{f}"] = iris(cm[f - 1])
        res["identity"][f"raw_f{f}"] = iris(raw[f - 1])
    res["identity"]["braidMeanPlate"] = [round(float(v), 1) for v in crop(plate, BOXES["braid"]).reshape(-1, 3).mean(0)]
    res["identity"]["braidMeanCmT"] = [round(float(v), 1) for v in crop(cm[T - 1], BOXES["braid"]).reshape(-1, 3).mean(0)]
    json.dump(res, open(out, "w"), indent=1)


if __name__ == "__main__":
    main()
