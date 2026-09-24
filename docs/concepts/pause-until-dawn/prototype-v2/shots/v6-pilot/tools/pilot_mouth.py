"""Living portrait v6 pilot (both), step 3 of the plan: the mouth against its paintings.

  - mouth-box MAD at w = 1 against the painted target (smile = open + smile lattice; press)
  - the plan's literal test too: one 7 x 5 lattice straight from DIS flow neutral -> target,
    warp only, no interior (what approach A would be without the `open` stage)
  - det(J) of the backward map (the gap excluded: there the interior is compressed on purpose)
  - the frame-to-frame step over w = 0..1 in 0.05 steps, max over median
  - the slight smile as a low weight of the smile against its own painting

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY pilot_mouth.py   # writes WORK/pilot-mouth.json
"""
import json

import cv2
import numpy as np

import common as C
import expr_fit
import mouth
import rig6

MB = (362, 588, 616, 683)     # the painted patches' mouth box
CORE = (430, 605, 560, 665)   # the lips only


def crop(img, b):
    x0, y0, x1, y1 = b
    return img[y0:y1, x0:x1, :3]


def mad(a, b, box):
    return round(float(np.abs(crop(a, box) - crop(b, box)).mean() * 255), 2)


def detj(mx, my, valid=None):
    jx = np.gradient(mx, axis=1), np.gradient(mx, axis=0)
    jy = np.gradient(my, axis=1), np.gradient(my, axis=0)
    d = jx[0] * jy[1] - jx[1] * jy[0]
    if valid is not None:
        d = d[valid]
    return round(float(d.min()), 3), round(float(d.max()), 3)


def main():
    R = rig6.Rig()
    M = R.mouth
    P = C.rig()["artMeta"]["v3"]["patches"]["mouth"]
    base = C.over(R.iris, C.over(R.hc, R.below))
    tg = {n: C.over(R.top, C.over(C.placed(C.load_rgba(P[n]["file"]), P[n]["box"]), base)) for n in P}
    plate = R.render({})
    out = {}
    cases = {"smile": ("smile", {"open": 1.0, "smile": 1.0}), "press": ("pressed", {"press": 1.0})}
    for name, (target, p) in cases.items():
        img = R.render(p)
        out[name] = {"boxMAD_w1": mad(img, tg[target], MB), "boxMAD_neutral": mad(plate, tg[target], MB),
                     "coreMAD_w1": mad(img, tg[target], CORE), "coreMAD_neutral": mad(plate, tg[target], CORE)}
        frames = [crop(R.render({k: v * w for k, v in p.items()}), MB) for w in np.linspace(0, 1, 21)]
        st = np.array([np.abs(frames[i + 1] - frames[i]).mean() * 255 for i in range(20)])
        out[name]["step"] = {"median": round(float(np.median(st)), 3), "max": round(float(st.max()), 3),
                             "maxOverMedian": round(float(st.max() / max(np.median(st), 1e-9)), 2)}
        # det(J) of the backward map over the mouth region, the open gap excluded
        x0, y0, x1, y1 = M.reg
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        g = M.lattice(p)
        X, Y = xx + g[..., 0], yy + g[..., 1]
        wo = p.get("open", 0.0)
        valid = np.ones(X.shape, bool)
        if wo:
            xr = X - x0
            s, dU, H = (M._col(n, xr) for n in ("s", "dU", "H"))
            top = s + y0 + wo * dU
            bot = top + wo * H
            ys_up = Y - wo * dU * np.clip(1 - (top - Y) / 18.0, 0, 1) ** 2 * (3 - 2 * np.clip(1 - (top - Y) / 18.0, 0, 1))
            f = np.clip(1 - (Y - bot) / mouth.D_DN, 0, 1)
            ys_dn = Y - wo * (dU + H) * f * f * (3 - 2 * f)
            Y = np.where(Y <= top, ys_up, np.where(Y >= bot, ys_dn, Y))
            valid = (yy < top - 2) | (yy > bot + 2)  # the 1 px region switch at the gap edges is not a fold
        out[name]["detJ"] = detj(X, Y, valid)
    # the plan's literal test: warp only, one lattice neutral -> painting, no interior
    hc = R.hc
    x0, y0, x1, y1 = expr_fit.REG
    d = expr_fit.dis()
    N = hc[y0:y1, x0:x1]
    lit = {}
    for target in ("smile", "pressed"):
        T = C.over(C.placed(C.load_rgba(P[target]["file"]), P[target]["box"]), hc)[y0:y1, x0:x1]
        F = d.calc(expr_fit.gray(T), expr_fit.gray(N), None)
        B = d.calc(expr_fit.gray(N), expr_fit.gray(T), None)
        nodes = expr_fit.fit_lattice(F, expr_fit.flow_weight(T, N, F, B))
        G = expr_fit.raster(nodes, y1 - y0, x1 - x0)
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        W = C.remap(hc, xx + G[..., 0], yy + G[..., 1])
        img = plate.copy()
        img[y0:y1, x0:x1] = C.over(R.top[y0:y1, x0:x1], C.over(W, R.below[y0:y1, x0:x1]))
        lit[target] = {"boxMAD_w1": mad(img, tg[target], MB), "coreMAD_w1": mad(img, tg[target], CORE),
                       "detJ": detj(xx + G[..., 0], yy + G[..., 1]), "maxNodePx": round(float(np.abs(nodes).max()), 2)}
    out["literalWarpOnly"] = lit
    out["slightSmile"] = {f"w{w:.2f}": mad(R.render({"open": w, "smile": w}), tg["slightSmile"], MB) for w in (0.0, 0.2, 0.35, 0.5)}
    out["slightSmile"]["ownLattice"] = mad(R.render({"slight": 1.0}), tg["slightSmile"], MB)
    (C.WORK / "pilot-mouth.json").write_text(json.dumps(out, indent=1))
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
