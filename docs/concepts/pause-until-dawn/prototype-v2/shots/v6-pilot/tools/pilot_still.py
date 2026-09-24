"""Living portrait v6 pilot, part 2 (both): the 'never still' numbers, measured the way the spec measured them.

The motion spec's region table (section 7: mouth 3.5-7.6x the rigid nose, brow ~0.4x the mouth) comes from
`D:/Tools/pyrefly-ref/until-dawn-character-screen/analyse.py`: the head is tracked by phase correlation of
the face box against frame 0, every region is cropped at the head-aligned (rounded) offset, and a region's
number is its mean absolute grey difference against frame 0, averaged over the window. The part-1 numbers
(`pilot_clips.py`) were fixed boxes, frame to frame: the head sway itself was counted as face motion, and
the nose (the rigid baseline) was never rigid. This script measures the page the viewer sees, three ways:

  tracked      head-tracked, against frame 0 (the method behind the 3.5x target), on part 1's boxes
  trackedSpec  the same on spec-shaped boxes: the reference's regions are the mouth with the chin, the nose
               from the eyes' level to the nostrils, and both brows with the skin round them (boxes.py); part
               1's boxes are tight on the lips and on one brow crossed by hair strands, which is mostly ink
  fixed        part 1's number (fixed boxes, frame to frame), for continuity

and 'never freezes': the share of frames in which the mouth, the brow, the lids or the chest do not change
at all on the rig (head motion off), and the longest such run.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY pilot_still.py [A B C] [--folds] [--reference]     # needs WORK/gray-<name>.npz (make_clips.py), writes WORK/pilot-still.json
"""
import json
import sys

import numpy as np

import common as C

S = 512 / 832.0  # canvas -> page
PX, PY_ = 104, 228
FACE = (250, 300, 710, 700)       # the tracked box (canvas px), as analyse.py's 'face'
MOUTH = (400, 595, 590, 670)      # part 1's boxes, unchanged
NOSE = (440, 515, 510, 575)
BROW = (262, 318, 390, 352)
SPEC = {"mouth": (385, 588, 605, 700), "nose": (425, 470, 525, 580), "brow": (255, 312, 705, 362)}
CROP = (220, 260, 740, 740)       # what make_clips.py stores per frame (canvas px), a margin round FACE
EPS = 0.02                        # levels: a region 'changes' in a frame when its mean abs change exceeds this


def page_box(b):
    return tuple(int(round(v)) for v in (PX + b[0] * S, PY_ + b[1] * S, PX + b[2] * S, PY_ + b[3] * S))


def rel(b):
    """A canvas box as page px relative to the stored crop."""
    c, p = page_box(CROP), page_box(b)
    return (p[0] - c[0], p[1] - c[1], p[2] - c[0], p[3] - c[1])


def crop(a, b, dx=0.0, dy=0.0):  # analyse.py's crop: rounded offset
    x0, y0, x1, y1 = b
    x0, x1 = int(round(x0 + dx)), int(round(x1 + dx))
    y0, y1 = int(round(y0 + dy)), int(round(y1 + dy))
    return a[max(0, y0):y1, max(0, x0):x1]


def win(a):
    h, w = a.shape
    return (a - a.mean()) * np.hanning(h)[:, None] * np.hanning(w)[None, :]


def phase_corr(ref_w, img_w, maxshift=22):  # analyse.py's phase_corr, sub-pixel peak
    R = np.fft.rfft2(img_w) * np.conj(np.fft.rfft2(ref_w))
    R /= np.abs(R) + 1e-9
    r = np.fft.irfft2(R, img_w.shape)
    h, w = r.shape
    m = int(maxshift)
    mask = np.zeros_like(r, dtype=bool)
    mask[:m + 1, :m + 1] = mask[:m + 1, -m:] = mask[-m:, :m + 1] = mask[-m:, -m:] = True
    iy, ix = np.unravel_index(int(np.argmax(np.where(mask, r, -np.inf))), r.shape)

    def sub(i, n, a, b, c):
        d = a - 2 * b + c
        v = i + (0.0 if abs(d) < 1e-9 else 0.5 * (a - c) / d)
        return v - n if v > n / 2 else v
    return (sub(iy, h, r[(iy - 1) % h, ix], r[iy, ix], r[(iy + 1) % h, ix]),
            sub(ix, w, r[iy, (ix - 1) % w], r[iy, ix], r[iy, (ix + 1) % w]))


def _grad(a):
    gy, gx = np.gradient(a)
    return float(np.hypot(gx, gy).mean())


def measure(frames, face, box_sets):
    """analyse.py's method on (n, h, w) grey frames (levels): track `face` against frame 0, crop every box at
    the rounded offset, mean abs difference against frame 0. Per region also its contrast (mean grey gradient
    of frame 0's crop) and the change over the contrast ('effective px': how far the region's content moved,
    comparable between a painting with ink lines and a photoreal render). 'fixed' (part 1's number) uses the
    first box set, untracked, frame to frame."""
    ref_face = win(crop(frames[0], face))
    ref = {m: {k: crop(frames[0], b) for k, b in bx.items()} for m, bx in box_sets.items()}
    first = next(iter(box_sets))
    acc = {m: {k: [] for k in bx} for m, bx in box_sets.items()}
    acc["fixed"] = {k: [] for k in box_sets[first]}
    prev = None
    for a in frames:
        dy, dx = phase_corr(ref_face, win(crop(a, face)))
        for m, bx in box_sets.items():
            for k, b in bx.items():
                c = crop(a, b, dx, dy)
                if c.shape == ref[m][k].shape:
                    acc[m][k].append(np.abs(c - ref[m][k]).mean())
        if prev is not None:
            for k, b in box_sets[first].items():
                acc["fixed"][k].append(np.abs(crop(a, b) - crop(prev, b)).mean())
        prev = a
    out = {}
    for name, d in acc.items():
        lv = {k: float(np.mean(v)) for k, v in d.items()}
        res = {"mouthOverNose": round(lv["mouth"] / max(lv["nose"], 1e-9), 2),
               "browOverMouth": round(lv["brow"] / max(lv["mouth"], 1e-9), 2),
               "levels": {k: round(v, 3) for k, v in lv.items()}}
        if name != "fixed":
            g = {k: _grad(ref[name][k]) for k in lv}
            px = {k: lv[k] / max(g[k], 1e-9) for k in lv}
            res["contrast"] = {k: round(v, 2) for k, v in g.items()}
            res["px"] = {"mouthOverNose": round(px["mouth"] / max(px["nose"], 1e-9), 2),
                         "browOverMouth": round(px["brow"] / max(px["mouth"], 1e-9), 2)}
        out[name] = res
    return out


def regions(frames):
    """Our page crops: part 1's boxes and the spec-shaped ones."""
    return measure(frames, rel(FACE), {"tracked": {"mouth": rel(MOUTH), "nose": rel(NOSE), "brow": rel(BROW)},
                                       "trackedSpec": {k: rel(b) for k, b in SPEC.items()}})


REF = "D:/Tools/pyrefly-ref/until-dawn-character-screen"
REF_WINDOWS = {"Sam": ("frames/sam1", "sam", 6.0, 11.49, (155, 300, 430, 352)), "Mike": ("frames/mike", "mike", 52.0, 58.19, None)}


def reference():
    """The spec's own windows (read-only), through the same code: reproduces section 7's levels and adds the
    contrast-normalised ratios."""
    import glob
    import os
    from PIL import Image
    sys.path.insert(0, REF)
    from boxes import BOXES
    out = {}
    for who, (d, key, lo, hi, brows) in REF_WINDOWS.items():
        B = dict(BOXES[key])
        if brows:
            B["brows"] = brows
        files = [f for f in sorted(glob.glob(os.path.join(REF, d, "*.jpg"))) if lo <= int(os.path.basename(f)[1:-4]) / 1000.0 <= hi]
        fr = np.stack([np.asarray(Image.open(f).convert("L"), np.float32) for f in files])
        r = measure(fr, B["face"], {"tracked": {"mouth": B["mouth"], "nose": B["nose"], "brow": B["brows"]}})
        r["frames"] = len(files)
        out[who] = r
        print(who, json.dumps(r))
    return out


def freezes(steps):
    """steps: per-frame mean abs change (levels). Share of frames at or below EPS and the longest run (frames)."""
    still = np.asarray(steps) <= EPS
    run = best = 0
    for s in still:
        run = run + 1 if s else 0
        best = max(best, run)
    return {"stillShare": round(float(still.mean()), 4), "longestStillRun": int(best), "minStep": round(float(np.min(steps)), 5)}


def brow_folds(n=11):
    """det(J) of the summed brow field (as rig6.render clips it) over an n x n grid of (browRaise, browDraw)."""
    import rig6
    R = rig6.Rig()
    F = {k: (gx, gy) for k, gx, gy in R.fields}
    lo, hi = R.brow_limits
    worst, corners = [9.0, 0.0], {}
    for wr in np.linspace(0, 1, n):
        for wd in np.linspace(0, 1, n):
            gx = wr * F["browRaise"][0] + wd * F["browDraw"][0]
            gy = np.clip(wr * F["browRaise"][1] + wd * F["browDraw"][1], lo, hi)
            D = (1 + np.gradient(gx, axis=1)) * (1 + np.gradient(gy, axis=0)) - np.gradient(gx, axis=0) * np.gradient(gy, axis=1)
            worst = [min(worst[0], float(D.min())), max(worst[1], float(D.max()))]
            if wr in (0, 1) and wd in (0, 1):
                corners[f"raise{wr:.0f}_draw{wd:.0f}"] = [round(float(D.min()), 3), round(float(D.max()), 3)]
    return {"grid": [round(v, 3) for v in worst], "corners": corners, "raiseMaxLiftPx": round(float(F["browRaise"][1].max()), 2),
            "sigma": rig6.BROW_SMOOTH}


def main(names):
    out = {}
    for name in names:
        Z = np.load(C.WORK / f"gray-{name}.npz")
        res = regions(Z["page"].astype(np.float32))
        res["freeze"] = {k[5:]: freezes(Z[k]) for k in Z.files if k.startswith("rigs_")}
        out[name] = res
        print(name, json.dumps(res))
    p = C.WORK / "pilot-still.json"
    old = json.loads(p.read_text()) if p.exists() else {}
    old.update(out)
    if "--reference" in sys.argv:
        old["reference"] = reference()
    if "--folds" in sys.argv:
        old["browFolds"] = brow_folds()
        print("browFolds", old["browFolds"])
    p.write_text(json.dumps(old, indent=1))


if __name__ == "__main__":
    main([a for a in sys.argv[1:] if not a.startswith("--")] or ["A", "B", "C"])
