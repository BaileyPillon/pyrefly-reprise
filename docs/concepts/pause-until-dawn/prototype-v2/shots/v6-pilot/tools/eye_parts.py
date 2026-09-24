"""Living portrait v6 pilot (both): the eyeball as parts, cut once on the plate.

Per eye (R = her right, viewer-left, green; L = blue):
  disc     the iris as painted (the v3 irisR|L layer's main component, cut at a fitted
           ellipse of its outline) with the colour it has on the plate, opaque; its part
           hidden under the rims and the iris under the catchlight are interpolated around
           the ellipse at the same radius. Moves with gaze.
  catch    the catchlight (and its overhang past the iris, painted in headCore),
           un-composited with the smallest exact alpha so that at rest catch over disc
           == plate. Moves at 0.3x the iris (the plan).
  fill     the socket where the iris shows at rest: 'v3' = the existing headCore
           underfill (what the plan calls the filled socket), 'row' = a geometric re-fill:
           the plate's own sclera colour by height in the opening plus each row's
           left/right residual, smoothed. The rest pose stays the plate exactly.
  bits     the v3 iris layer's other pixels (the lower sliver, the lid line) - static.
  window   the eye opening (rig-lids2's own `opening`) OR the disc: the moved parts are
           clipped to it.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe   # OpenCV
    $PY eye_parts.py            # writes WORK/eyes.npz and WORK/eyes-check.jpg
"""
import cv2
import numpy as np

import common as C

PAD = 26


def parts_for(k, layers, lids):
    Lr = layers
    hc = C.placed(C.load_rgba(Lr["headCore"]["file"]), Lr["headCore"]["box"])
    ir = C.placed(C.load_rgba(Lr["iris" + k]["file"]), Lr["iris" + k]["box"])
    pre = C.over(ir, hc)  # headCore + iris, premultiplied (headCore is opaque in the eye)
    a = ir[..., 3]
    k3 = np.ones((3, 3), np.uint8)
    er = cv2.erode((a > 0.3).astype(np.uint8), k3, iterations=2)  # cuts the thin bridges to the sliver
    n, lab, stats, _ = cv2.connectedComponentsWithStats(er, connectivity=4)
    main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    core = cv2.dilate((lab == main).astype(np.uint8), k3, iterations=3) > 0
    o = lids[k + "_open"].astype(bool)
    F0 = (a > 0) & core & (cv2.dilate(o.astype(np.uint8), k3, iterations=2) > 0)
    ring = C.placed(C.load_rgba(Lr["eyeAperture" + k]["file"]), Lr["eyeAperture" + k]["box"])[..., 3] > 0.5
    # the iris outline as an ellipse, fitted where the disc meets sclera (not the rims)
    vis = F0 & ~ring
    cs, _ = cv2.findContours(vis.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cpts = max(cs, key=cv2.contourArea)[:, 0, :]
    near = cv2.dilate(ring.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    el = cv2.fitEllipse(cpts[~near[cpts[:, 1], cpts[:, 0]]].astype(np.float32))
    Em = np.zeros(a.shape, np.uint8)
    cv2.ellipse(Em, el, 1, -1)
    E, E2 = Em > 0, cv2.dilate(Em, k3, iterations=2) > 0
    # the disc: the painted iris out to 2 px past the outline, plus the outline's hidden part under the rims
    ring_opaque = C.placed(C.load_rgba(Lr["eyeAperture" + k]["file"]), Lr["eyeAperture" + k]["box"])[..., 3] > 0.995
    F = (F0 & E2) | (E & ring_opaque & ~F0)
    bits = ir * (~(F0 & E2))[..., None]
    win = o | F
    ys, xs = np.nonzero(win)
    x0, y0, x1, y1 = xs.min() - PAD, ys.min() - PAD, xs.max() + PAD + 1, ys.max() + PAD + 1
    sl = (slice(y0, y1), slice(x0, x1))
    rgb = pre[..., :3][sl].copy()
    Fc, oc, wc = F[sl], o[sl], win[sl]
    known0 = (F0 & E2)[sl]
    # catchlight: bright, unsaturated pixels inside the disc
    mx, mn = rgb.max(2), rgb.min(2)
    sat = (mx - mn) / np.maximum(mx, 1e-4)
    catch_core = known0 & (C.lum(rgb) > 0.86) & (sat < 0.22)
    nc, labc, st, _ = cv2.connectedComponentsWithStats(catch_core.astype(np.uint8), connectivity=8)
    keep = np.zeros_like(catch_core)
    for i in range(1, nc):
        if st[i, cv2.CC_STAT_AREA] >= 6:
            keep |= labc == i
    catch_zone = (cv2.dilate(keep.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0) & known0
    # the catchlight's overhang past the iris (painted in headCore): white blobs touching the disc
    white_all = (C.lum(rgb) > 0.86) & (sat < 0.22) & wc & ~Fc
    nw, labw, stw, _ = cv2.connectedComponentsWithStats(white_all.astype(np.uint8), connectivity=8)
    touch = cv2.dilate(keep.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    over_ = np.zeros_like(white_all)
    for i in range(1, nw):
        m = labw == i
        if (m & touch).any():
            over_ |= m
    over_zone = (cv2.dilate(over_.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0) & wc & ~Fc
    # the iris under the catchlight and under the rims: interpolated around the ellipse at the same radius
    elc = ((el[0][0] - x0, el[0][1] - y0), el[1], el[2])
    bg = polar_fill(rgb, known0 & ~catch_zone, Fc | catch_zone, elc)
    disc_rgb = np.where((catch_zone | ~known0)[..., None], bg, rgb)
    disc = np.dstack([disc_rgb * Fc[..., None], Fc.astype(np.float32)]).astype(np.float32)
    Fvis = known0 | over_zone  # where the iris (and its catchlight) shows at rest: the socket fill goes here
    fg = np.median(rgb[keep], axis=0) if keep.any() else np.ones(3, np.float32)
    fg_mask = keep
    # socket re-fill ('row'): the plate's own sclera shading as a function of the height in the
    # opening, v = (y - top) / (bot - top), plus each row's left/right residual interpolated across F
    white = (C.lum(rgb) > 0.93) & (sat < 0.1)
    sclera = oc & ~Fc & ~white & (rgb.max(2) > 0.5) & (sat < 0.55) & (C.lum(rgb) > 0.45)
    Fc_all, Fc = Fc, Fvis
    cols, top, bot = lids[k + "_cols"], lids[k + "_top"], lids[k + "_colbot"]
    xx = np.arange(x0, x1)
    tt, bb = np.interp(xx, cols, top), np.interp(xx, cols, bot)
    yy = np.arange(y0, y1)[:, None]
    v = np.clip((yy - tt[None, :]) / np.maximum(bb - tt, 4)[None, :], 0, 1)
    bins = np.linspace(0, 1, 13)
    vb = np.clip(np.digitize(v, bins) - 1, 0, 11)
    model = np.zeros((12, 3), np.float32)
    have = np.zeros(12, bool)
    for i in range(12):
        m = sclera & (vb == i)
        if m.sum() >= 5:
            model[i] = np.median(rgb[m], axis=0)
            have[i] = True
    idx = np.nonzero(have)[0]
    for c in range(3):
        model[:, c] = np.interp(np.arange(12), idx, model[idx, c])
    base = np.stack([np.interp(v, (bins[:-1] + bins[1:]) / 2, model[:, c]) for c in range(3)], -1)
    res = np.where(sclera[..., None], rgb - base, 0)
    fill = rgb.copy()
    for r_ in range(Fc.shape[0]):
        xs_f = np.nonzero(Fc[r_])[0]
        if len(xs_f) == 0:
            continue
        xs_k = np.nonzero(sclera[r_])[0]
        left, right = xs_k[xs_k < xs_f.min()], xs_k[xs_k > xs_f.max()]
        rl = res[r_, left[-3:]].mean(0) if len(left) else None
        rr = res[r_, right[:3]].mean(0) if len(right) else None
        if rl is None and rr is None:
            rl = rr = np.zeros(3, np.float32)
        rl = rr if rl is None else rl
        rr = rl if rr is None else rr
        a_ = left[-1] if len(left) else xs_f.min() - 1
        b_ = right[0] if len(right) else xs_f.max() + 1
        t = np.clip((xs_f - a_) / max(1, b_ - a_), 0, 1)[:, None]
        fill[r_, xs_f] = base[r_, xs_f] + rl * (1 - t) + rr * t
    sm = cv2.GaussianBlur(fill, (0, 0), 1.2)
    fill = np.clip(np.where(Fc[..., None], sm, rgb), 0, 1)
    row_fill = np.dstack([fill * Fc[..., None], Fc.astype(np.float32)]).astype(np.float32)
    Fc = Fc_all
    # catch matte: against the inpainted iris on the disc, against the socket fill on the overhang
    zone = catch_zone | over_zone
    bgc = np.where(over_zone[..., None], fill, bg)
    d = fg[None, None, :] - bgc
    al = np.clip(((rgb - bgc) * d).sum(2) / np.maximum((d * d).sum(2), 1e-4), 0, 1)
    # the smallest alpha that makes catch over bg == plate exactly (a valid premultiplied colour)
    lo1 = np.where(bgc > 1e-4, 1 - rgb / np.maximum(bgc, 1e-4), 0)
    lo2 = np.where(bgc < 1 - 1e-4, (rgb - bgc) / np.maximum(1 - bgc, 1e-4), 0)
    al = np.maximum(al, np.clip(np.maximum(lo1, lo2).max(2), 0, 1)) * zone
    cprem = np.clip(rgb - (1 - al)[..., None] * bgc, 0, al[..., None])
    catch = np.dstack([cprem, al]).astype(np.float32)
    return {"box": np.array([x0, y0, x1, y1]), "disc": disc, "catch": catch, "fill_row": row_fill,
            "bits": bits[sl], "window": wc, "open": oc, "F": Fc, "pre": np.dstack([rgb, np.ones(Fc.shape)]).astype(np.float32),
            "hc": hc[sl]}


def polar_fill(rgb, known, want, el, nr=64, nphi=360):
    """Colours for `want` pixels from `known` ones at the same elliptical radius, interpolated in angle."""
    (cx, cy), (w, h), th = el
    t = np.deg2rad(th)
    rr = np.linspace(0, 1.12, nr)[:, None]
    ph = np.linspace(-np.pi, np.pi, nphi, endpoint=False)[None, :]
    u, v = rr * np.cos(ph) * w / 2, rr * np.sin(ph) * h / 2
    mx = (cx + u * np.cos(t) - v * np.sin(t)).astype(np.float32)
    my = (cy + u * np.sin(t) + v * np.cos(t)).astype(np.float32)
    kn = cv2.remap(known.astype(np.float32), mx, my, cv2.INTER_NEAREST, borderValue=0) > 0.5
    col = cv2.remap(np.ascontiguousarray(rgb), mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    P = col.copy()
    for i in range(nr):
        idx = np.nonzero(kn[i])[0]
        if len(idx) == 0:
            continue
        xs = np.concatenate([idx - nphi, idx, idx + nphi])
        for c in range(3):
            vals = np.tile(col[i, idx, c], 3)
            P[i, :, c] = np.interp(np.arange(nphi), xs, vals)
    out = rgb.copy()
    ys, xs = np.nonzero(want)
    dx, dy = xs - cx, ys - cy
    uu = dx * np.cos(t) + dy * np.sin(t)
    vv = -dx * np.sin(t) + dy * np.cos(t)
    r = np.sqrt((uu / (w / 2)) ** 2 + (vv / (h / 2)) ** 2)
    p = np.arctan2(vv / (h / 2), uu / (w / 2))
    ri = np.clip(r / 1.12 * (nr - 1), 0, nr - 1).astype(np.float32)
    pi_ = ((p + np.pi) / (2 * np.pi) * nphi).astype(np.float32) % nphi
    Pw = np.concatenate([P, P[:, :1]], 1)  # wrap for the remap
    samp = cv2.remap(Pw, pi_[None, :], ri[None, :], cv2.INTER_LINEAR)[0]
    out[ys, xs] = samp
    return out


def build():
    r = C.rig()
    layers = {l["name"]: l for l in r["artMeta"]["v3"]["frontal"]["layers"]}
    lids = np.load(C.WORK / "lids.npz")
    out = {}
    tiles = []
    for k in ("R", "L"):
        p = parts_for(k, layers, lids)
        for name, v in p.items():
            out[f"{k}_{name}"] = v
        # check: disc, catch on magenta, row fill, v3 underfill
        def mag(pm):
            return C.to_u8(pm[..., :3] + np.array([1, 0, 1]) * (1 - pm[..., 3:4]))
        hc = p["hc"]
        v3 = C.over(p["bits"], hc)
        row = C.over(p["fill_row"], v3)
        tiles.append(np.concatenate([C.up(mag(p["disc"]), 3), C.up(mag(p["catch"]), 3), C.up(C.to_u8(v3[..., :3]), 3),
                                     C.up(C.to_u8(row[..., :3]), 3)], 1))
        print(k, "box", p["box"].tolist(), "F px", int(p["F"].sum()), "catch px", int((p["catch"][..., 3] > 0.05).sum()),
              "F outside opening", int((p["F"] & ~p["open"]).sum()))
    w = max(t.shape[1] for t in tiles)
    tiles = [np.pad(t, ((0, 6), (0, w - t.shape[1]), (0, 0))) for t in tiles]
    C.save_jpg(np.concatenate(tiles, 0), C.WORK / "eyes-check.jpg")
    np.savez_compressed(C.WORK / "eyes.npz", **out)


if __name__ == "__main__":
    build()
