"""Living portrait v6 pilot (both), step 3 of the plan: the mouth's fit targets.

The four painted mouths are targets, not frames. Two kinds of geometry come out of them:

  open    per column of the mouth (like the lid unroll): s(x) = the bottom of the plate's
          closed-mouth stroke, u(x) / l(x) = the top / bottom of the smile painting's open
          interior. `open` moves the upper lip s -> u and the lower lip down by H = l - u,
          and the gap shows the smile painting's own interior (compressed into the gap, the
          lips move off it; it is never faded in).
  lattice a 7 x 5 control lattice per target (Catmull-Rom, border nodes pinned to 0), fitted
          by robust least squares to DIS flow (OpenCV, rig-flow.py's settings) from the
          target to the plate (smile: to the plate already opened, so the lattice carries
          only the corners and the lip line), with a smoothness penalty against folds.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY expr_fit.py        # writes WORK/mouth.npz
"""
import cv2
import numpy as np

import common as C

REG = (330, 560, 650, 720)   # the region the mouth geometry lives in (x0, y0, x1, y1)
NX, NY = 7, 5                # the plan's lattice
LAM = 0.02                   # smoothness weight (second differences of the node values)


def catmull(n, length):
    """(length x n) interpolation weights; nodes at linspace(0, length - 1, n), ends clamped."""
    s = np.arange(length) / (length - 1) * (n - 1)
    i = np.clip(np.floor(s).astype(int), 0, n - 2)
    t = s - i
    wts = np.stack([(-t ** 3 + 2 * t ** 2 - t) / 2, (3 * t ** 3 - 5 * t ** 2 + 2) / 2,
                    (-3 * t ** 3 + 4 * t ** 2 + t) / 2, (t ** 3 - t ** 2) / 2], 1)
    B = np.zeros((length, n))
    for k, off in enumerate((-1, 0, 1, 2)):
        np.add.at(B, (np.arange(length), np.clip(i + off, 0, n - 1)), wts[:, k])
    return B


def fit_lattice(flow, weight):
    """Robust (IRLS, Huber) least squares for the interior nodes of both components."""
    h, w = flow.shape[:2]
    By, Bx = catmull(NY, h), catmull(NX, w)
    free = [(j, i) for j in range(1, NY - 1) for i in range(1, NX - 1)]
    step = 3
    ys, xs = np.mgrid[0:h:step, 0:w:step]
    ys, xs = ys.ravel(), xs.ravel()
    A = np.stack([By[ys, j] * Bx[xs, i] for j, i in free], 1)
    # smoothness: second differences over the full lattice (pinned border = 0)
    rows = []
    idx = {p: k for k, p in enumerate(free)}
    for j in range(NY):
        for i in range(NX):
            for dj, di in ((0, 1), (1, 0)):
                trip = [(j - dj, i - di), (j, i), (j + dj, i + di)]
                if not all(0 <= a < NY and 0 <= b < NX for a, b in trip):
                    continue
                r = np.zeros(len(free))
                for (a, b), c in zip(trip, (1, -2, 1)):
                    if (a, b) in idx:
                        r[idx[(a, b)]] += c
                rows.append(r)
    S = np.array(rows)
    nodes = np.zeros((NY, NX, 2))
    for c in range(2):
        f = flow[ys, xs, c]
        wv = weight[ys, xs].astype(np.float64)
        for _ in range(4):
            Aw = A * np.sqrt(wv)[:, None]
            Sw = S * np.sqrt(LAM * wv.sum() / max(len(S), 1))
            sol = np.linalg.lstsq(np.vstack([Aw, Sw]), np.concatenate([f * np.sqrt(wv), np.zeros(len(S))]), rcond=None)[0]
            res = np.abs(A @ sol - f)
            wv = weight[ys, xs] * np.minimum(1.0, 1.5 / np.maximum(res, 1e-6))
        for (j, i), v in zip(free, sol):
            nodes[j, i, c] = v
    return nodes


def raster(nodes, h, w):
    By, Bx = catmull(NY, h), catmull(NX, w)
    return np.stack([By @ nodes[..., c] @ Bx.T for c in range(2)], -1).astype(np.float32)


def dis():
    d = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    d.setFinestScale(0)
    d.setPatchSize(8)
    d.setPatchStride(3)
    d.setGradientDescentIterations(25)
    d.setVariationalRefinementIterations(10)
    return d


def gray(im):
    return C.to_u8(C.lum(im[..., :3]))


def flow_weight(T, N, F, B, extra=None):
    h, w = F.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    fb = np.linalg.norm(F + cv2.remap(B, xx + F[..., 0], yy + F[..., 1], cv2.INTER_LINEAR), axis=2)
    g = cv2.GaussianBlur(np.hypot(cv2.Sobel(C.lum(T[..., :3]), cv2.CV_32F, 1, 0), cv2.Sobel(C.lum(T[..., :3]), cv2.CV_32F, 0, 1)), (0, 0), 2)
    wt = (fb < 1.5) * (0.05 + g / max(g.max(), 1e-6))
    if extra is not None:
        wt = wt * extra
    return wt.astype(np.float32)


def columns(N, T):
    """Per column of REG: the plate's stroke bottom s, the smile painting's interior top u and bottom l
    (the interior lies between the painting's upper lip line and its lower lip line: red or dark,
    i.e. green channel under 125; where the lower line is not painted, the fitted curve carries it)."""
    h, w = N.shape[:2]
    xs_all = np.arange(w, dtype=np.float64)
    dn = C.lum(N[..., :3]) < 0.45
    s = np.full(w, np.nan)
    for x in range(w):
        r = np.nonzero(dn[40:110, x])[0]
        if len(r):
            s[x] = 40 + r.max() + 1
    ok_s = ~np.isnan(s)
    s = np.interp(xs_all, xs_all[ok_s], s[ok_s])
    s = cv2.GaussianBlur(s.reshape(1, -1).astype(np.float32), (0, 0), 2).ravel()
    line = T[..., 1] < 125 / 255
    u = np.full(w, np.nan)
    l = np.full(w, np.nan)
    for x in range(w):
        y0 = int(s[x]) - 10
        col = line[max(0, y0):min(h, y0 + 40), x]
        runs, start = [], None
        for i, v in enumerate(np.append(col, False)):
            if v and start is None:
                start = i
            if not v and start is not None:
                runs.append((start + y0, i + y0))
                start = None
        if len(runs) >= 2 and 3 <= runs[1][0] - runs[0][1] <= 30:
            u[x], l[x] = runs[0][1], runs[1][0]
    ok = ~np.isnan(l)
    xa, xb = xs_all[ok].min(), xs_all[ok].max()

    def robust_quad(v):
        m = ~np.isnan(v)
        x, y = xs_all[m], v[m]
        for _ in range(4):
            p = np.polyfit(x, y, 2)
            res = np.abs(np.polyval(p, x) - y)
            keep = res < max(1.5, np.percentile(res, 75))
            x, y = x[keep], y[keep]
        return np.polyval(np.polyfit(x, y, 2), xs_all)
    return s, robust_quad(u), robust_quad(l), (xs_all >= xa) & (xs_all <= xb), (xa, xb)


def main():
    r = C.rig()
    Lr = {l["name"]: l for l in r["artMeta"]["v3"]["frontal"]["layers"]}
    P = r["artMeta"]["v3"]["patches"]["mouth"]
    hc = C.placed(C.load_rgba(Lr["headCore"]["file"]), Lr["headCore"]["box"])
    x0, y0, x1, y1 = REG
    N = hc[y0:y1, x0:x1]
    tg = {n: C.over(C.placed(C.load_rgba(P[n]["file"]), P[n]["box"]), hc)[y0:y1, x0:x1] for n in P}
    s, u, l, ok, (xa, xb) = columns(N, tg["smile"])
    xi = np.arange(len(s), dtype=np.float64)
    taper = np.clip(np.minimum(xi - xa + 1, xb - xi + 1) / 10.0, 0, 1)
    taper = taper * taper * (3 - 2 * taper)
    H = np.clip(l - u, 0, None) * taper
    dU = np.clip(cv2.GaussianBlur((u - s).reshape(1, -1).astype(np.float32), (0, 0), 3).ravel(), -4, 4) * taper
    out = {"reg": np.array(REG), "s": s.astype(np.float32), "u": u.astype(np.float32), "l": l.astype(np.float32),
           "H": H.astype(np.float32), "dU": dU.astype(np.float32), "Tsmile": tg["smile"].astype(np.float32)}
    np.savez_compressed(C.WORK / "mouth.npz", **out)  # the open stage first (the smile lattice needs it)
    import mouth
    M = mouth.Mouth(None, hc_full=hc)
    d = dis()
    for name in ("smile", "pressed", "slightSmile"):
        T = tg[name]
        base = M.region(hc, {"open": 1.0} if name == "smile" else {}, lattice=False)
        F = d.calc(gray(T), gray(base), None)
        B = d.calc(gray(base), gray(T), None)
        wt = flow_weight(T, base, F, B, extra=None if name != "smile" else (1 - M.gap_mask(1.0)))
        nodes = fit_lattice(F, wt)
        out["nodes_" + name] = nodes.astype(np.float32)
        print(name, "node |max| %.2f px" % np.abs(nodes).max())
    out["x_cols"] = np.arange(x0, x1).astype(np.float32)
    print("interior columns", int(ok.sum()), "x", int(xa + x0), int(xb + x0), "H max %.1f" % H.max(), "dU range %.1f..%.1f" % (dU.min(), dU.max()))
    np.savez_compressed(C.WORK / "mouth.npz", **out)


if __name__ == "__main__":
    main()
