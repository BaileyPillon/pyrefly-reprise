"""Living-portrait v3.2: eyelids that roll down over the eye, for the frontal
plate AND every turned key.

The v3.1 check (critic/scratch/living-portrait-v3/out/z-blink-closed-leftEye-3x.png)
found the closed lid a flat pink oval with a jagged lower edge, a blue iris
sliver above it and a white sclera crescent beside it, moving in three steps;
turned keys had no lids at all (no blink past about 11 degrees).

Each lid frame is built from the painting's own pixels, per eye:

  opening   the sclera + iris region around the pupil landmark (light,
            unsaturated sclera or saturated blue/green iris), closed and
            filled; per column its top(x) and bottom(x)
  lashes    the dark pixels in a band above top(x): the painted upper lash line
  frame a   the lid edge ye(x) = top(x) + (1 - a) (bottom(x) - 3 - top(x)): the
            curve itself changes shape as it falls (it rolls from the upper
            lid's arch to the lower lid's), everything from the top of the lash
            band down to ye(x) becomes lid skin (sampled per column just above
            the lashes, shaded darker toward the edge), and the lash line is
            carried down onto ye(x), flattening as it closes
  below     transparent: the eye as painted (and the frontal's moving iris)
            shows under the lid

    python -s tools/gen/rig-lids.py             # all keys
    python -s tools/gen/rig-lids.py --only turn-l45
Writes art/v3/patches/lids/<key>/a<NN>.png, wires rig.json (patches.eyes for
the frontal, artMeta.v3.keyLids for the turns) and a 3x check sheet per key.
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
OUT = L.V3 / "patches/lids"
APERTURES = [0.85, 0.7, 0.55, 0.42, 0.3, 0.18, 0.08, 0.0]
RIM_MAX = 22  # px above top(x) the painted upper rim (line + lashes) may reach
CORNER = 10  # px past each end of the opening that the lid still reaches, fading
CLOSED_AT = 0.72  # the closed line, as a fraction of the opening's height


def hsv(rgb):
    from skimage import color
    return color.rgb2hsv(np.clip(rgb / 255.0, 0, 1))


def key_canvas(rig, key_id):
    """The painting the lids sit on, on the plate canvas (RGBA, straight)."""
    v3 = rig["artMeta"]["v3"]
    c = np.zeros((H, W, 4), np.float32)

    def over(meta):
        im = L.load_rgba(L.ART / meta["file"])
        x, y = meta["box"][:2]
        h, w = im.shape[:2]
        xa, xb = max(0, x), min(W, x + w)
        ya, yb = max(0, y), min(H, y + h)  # a layer may carry a margin past the canvas (rig-margins.py)
        sub = im[ya - y:yb - y, xa - x:xb - x]
        a = sub[..., 3:4] / 255.0
        c[ya:yb, xa:xb, :3] = c[ya:yb, xa:xb, :3] * (1 - a) + sub[..., :3] * a
        c[ya:yb, xa:xb, 3] = np.maximum(c[ya:yb, xa:xb, 3], sub[..., 3])

    if key_id == "frontal":
        for l in v3["frontal"]["layers"]:
            if l["name"] in ("headCore", "irisR", "irisL", "eyeApertureR", "eyeApertureL"):
                over(l)
    else:
        over(v3["keys"][key_id]["front"])
    return c


def opening(c, px, py):
    """The eye's opening around its pupil, or None when that eye is not painted (a profile's far eye)."""
    s = hsv(c[..., :3])
    sat, val = s[..., 1], s[..., 2]
    hue = s[..., 0] * 360
    a = c[..., 3] > 128
    sclera = a & (val > 0.7) & (sat < 0.3)
    iris = a & (sat > 0.3) & (hue > 90) & (hue < 260)
    box = np.zeros(a.shape, bool)
    box[max(0, py - 75):py + 60, max(0, px - 95):px + 95] = True
    m = (sclera | iris) & box
    m = ndi.binary_closing(m, iterations=3)
    lab, n = ndi.label(m)
    if n == 0:
        return None
    # the component nearest the pupil
    yy, xx = np.nonzero(lab)
    d = (yy - py) ** 2 + (xx - px) ** 2
    comp = lab[yy[np.argmin(d)], xx[np.argmin(d)]]
    if d.min() > 30 ** 2:
        return None
    o = ndi.binary_fill_holes(ndi.binary_closing(lab == comp, iterations=4))
    if o.sum() < 400 or (o & iris).sum() < 60:
        return None  # no iris in it: a light patch of hair, not an eye
    return o


def curves(o):
    cols = np.nonzero(o.any(0))[0]
    top = np.array([np.nonzero(o[:, x])[0].min() for x in cols], np.float64)
    bot = np.array([np.nonzero(o[:, x])[0].max() for x in cols], np.float64)
    k = np.ones(7) / 7
    pad = lambda v: np.concatenate([np.full(3, v[0]), v, np.full(3, v[-1])])
    return cols, np.convolve(pad(top), k, "valid"), np.convolve(pad(bot), k, "valid")


def dark_mask(c):
    lum = L.luminance(c[..., :3])
    s = hsv(c[..., :3])
    red = (s[..., 1] > 0.5) & ((s[..., 0] * 360 < 22) | (s[..., 0] * 360 > 330)) & (lum < 0.6)
    return (c[..., 3] > 128) & ((lum < 0.32) | red)


def hair_mask(c, o):
    """Hair strands crossing the eye in a turned key (never covered by a lid):
    brown/orange, saturated, mid-dark, in components that reach well outside
    the eye (a strand comes from the fringe; the rim does not)."""
    s = hsv(c[..., :3])
    h, sat, v = s[..., 0] * 360, s[..., 1], s[..., 2]
    hair = (c[..., 3] > 128) & (h > 8) & (h < 48) & (sat > 0.42) & (v > 0.28) & (v < 0.86)
    lab, n = ndi.label(hair)
    if n == 0:
        return hair
    far = ~L.dilate(o, 34)
    keep = np.unique(lab[far & hair])
    return np.isin(lab, keep[keep > 0]) & ~o


def rim_runs(c, cols, top, o):
    """Per column (the opening's columns plus CORNER px each side), the painted
    upper lid rim: the dark run connected to the opening's top edge, up to
    RIM_MAX px tall. Returns {x: (y0, y1)} with y1 the row just under the rim."""
    dark = dark_mask(c) & ~hair_mask(c, o)
    ext = np.arange(cols[0] - CORNER, cols[-1] + CORNER + 1)
    t_ext = np.interp(ext, cols, top)
    zone = np.zeros(dark.shape, bool)
    touch = np.zeros(dark.shape, bool)
    for x, t in zip(ext, t_ext):
        if 0 <= x < W:
            zone[int(max(0, t - RIM_MAX)):int(t + 3), x] = True
            touch[int(max(0, t - 4)):int(t + 3), x] = True
    band = dark & zone
    lab, _ = ndi.label(band)
    keep = np.unique(lab[touch & band])
    band = np.isin(lab, keep[keep > 0])
    runs = {}
    for x, t in zip(ext, t_ext):
        if 0 <= x < W:
            ys = np.nonzero(band[:, x])[0]
            if len(ys):
                runs[int(x)] = (int(ys.min()), int(round(t)) + 1)
    return runs, ext, t_ext


def smooth_rim_tops(runs):
    """The rim's top per column, as a smooth curve: the highest of its
    neighbours (+-4 columns), then a 7-column mean, so the lid's top edge does
    not step from lash to lash."""
    if not runs:
        return runs
    xs = np.array(sorted(runs))
    r0 = np.array([runs[x][0] for x in xs], np.float64)
    lo = np.array([r0[max(0, i - 4):i + 5].min() for i in range(len(r0))])
    k = np.ones(7) / 7
    sm = np.convolve(np.concatenate([np.full(3, lo[0]), lo, np.full(3, lo[-1])]), k, "valid")
    return {int(x): (int(np.floor(v)), runs[int(x)][1]) for x, v in zip(xs, sm)}


def membrane(c, cover, o):
    """Lid skin over `cover`: a smooth (Laplace) fill from the skin that rings
    it, so the lid carries the face's own light and gradient (v3.2 used one
    sampled colour per column: a flat oval)."""
    s = hsv(c[..., :3])
    skin = (c[..., 3] > 200) & (s[..., 2] > 0.62) & (s[..., 1] > 0.06) & (s[..., 1] < 0.62) & ((s[..., 0] * 360 < 48) | (s[..., 0] * 360 > 330))
    ring = L.dilate(cover | o, 16) & ~L.dilate(cover | o, 2) & skin & ~dark_mask(c)
    ys, xs = np.nonzero(L.dilate(cover | o, 20))
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgb = c[y0:y1, x0:x1, :3].astype(np.float32)
    known = ring[y0:y1, x0:x1]
    f = L.push_pull_fill(rgb, known)
    free = ~known
    for _ in range(500):  # Jacobi relaxation: a harmonic membrane between the known skin
        avg = (np.roll(f, 1, 0) + np.roll(f, -1, 0) + np.roll(f, 1, 1) + np.roll(f, -1, 1)) / 4
        f[free] = avg[free]
    out = np.zeros(c.shape[:2] + (3,), np.float32)
    out[y0:y1, x0:x1] = f
    return out


def closed_curve(cols, top, bot):
    """Where the lid edge rests when closed: CLOSED_AT of the way down the
    opening, smoothed into one clean curve. The closed frame also covers the
    opening below it (lower-lid skin), so no crescent of eye shows under it."""
    cl = top + CLOSED_AT * (bot + 1.0 - top)
    k = np.ones(9) / 9
    pad = lambda v: np.concatenate([np.full(4, v[0]), v, np.full(4, v[-1])])
    return np.convolve(pad(cl), k, "valid")


def eye_frames(c, px, py, fallback_skin):
    o = opening(c, px, py)
    if o is None:
        return None
    cols, top, bot = curves(o)
    runs, ext, t_ext = rim_runs(c, cols, top, o)
    runs = smooth_rim_tops(runs)
    hair = hair_mask(c, o)
    b_ext = np.interp(ext, cols, bot)
    closed = closed_curve(cols, top, bot)
    c_ext = np.interp(ext, cols, closed)
    # how far each column's lid travels: full inside the opening, fading to 0 over the corners
    inside_w = np.clip(np.minimum(ext - (cols[0] - CORNER), (cols[-1] + CORNER) - ext) / CORNER, 0, 1)
    travel = (c_ext - t_ext) * inside_w
    # everything a closed lid covers: from the rim's top (or 2 px above the opening) to the closed line
    cover = np.zeros(o.shape, bool)
    for j, x in enumerate(ext):
        if 0 <= x < W and inside_w[j] > 0:
            r0 = runs.get(int(x), (int(round(t_ext[j])) - 2, 0))[0]
            cover[max(0, r0 - 6):int(np.ceil(max(t_ext[j] + travel[j], b_ext[j]))) + 3, x] = True
    skin = membrane(c, cover, o)
    ink = np.array([34.0, 18.0, 22.0])
    rim_px = [c[y0:y1, x, :3] for x, (y0, y1) in runs.items() if y1 > y0]
    if rim_px:
        ink = np.percentile(np.concatenate(rim_px, 0), 12, axis=0)
    frames = []
    yy = np.arange(H, dtype=np.float32)
    for a in APERTURES:
        img = np.zeros((H, W, 4), np.float32)
        synth = a <= 0.08
        a_geom = 0.0 if synth else a  # the drawn closed line always sits on the fully closed curve
        for j, x in enumerate(ext):
            if not (0 <= x < W) or inside_w[j] <= 0:
                continue
            t = t_ext[j]
            ye = t + (1 - a_geom) * travel[j]
            r0, r1 = runs.get(int(x), (int(round(t)) - 2, int(round(t)) + 1))
            y_top = max(0, r0 - 6)  # a 5 px ramp: full cover from r0 - 1, the rim's soft top never shows
            y_bot = int(np.ceil(ye if not synth else max(ye, b_ext[j] + 2)))
            if y_bot > y_top:
                ys = np.arange(y_top, y_bot + 1)
                f = np.clip((ys - y_top) / max(1.0, ye - y_top), 0, 1)
                # the lid shades a little toward its edge (it curves away from the light)
                img[y_top:y_bot + 1, x, :3] = skin[y_top:y_bot + 1, x] * (1.0 - 0.10 * f[:, None] ** 2)
                img[y_top:y_bot + 1, x, 3] = 255 * np.clip((ys - y_top + 1) / 5.0, 0, 1)
            if not synth and int(x) in runs:
                # the painted rim, carried down so it rides on the lid edge
                run = c[r0:r1, x].copy()
                d = int(round(ye - (r1 - 1)))
                for k in range(len(run)):
                    yk = r0 + d + k
                    if 0 <= yk < H and run[k, 3] > 0:
                        al = run[k, 3] / 255.0
                        img[yk, x, :3] = img[yk, x, :3] * (1 - al) + run[k, :3] * al
                        img[yk, x, 3] = max(img[yk, x, 3], run[k, 3])
            if synth:
                # closed: one clean lash line along the resting curve, thickest mid-eye, tapering to the corners
                u = np.clip((x - (cols[0] - CORNER)) / max(1, (cols[-1] - cols[0] + 2 * CORNER)), 0, 1)
                half = 0.9 + 2.6 * np.sin(np.pi * u) ** 0.7
                yc = t + travel[j]
                al = np.clip(half - np.abs(yy - yc) + 0.5, 0, 1)
                for yk in np.nonzero(al > 0)[0]:
                    base = img[yk, x, :3] if img[yk, x, 3] > 0 else ink
                    img[yk, x, :3] = base * (1 - al[yk]) + ink * al[yk]
                    img[yk, x, 3] = max(img[yk, x, 3], 255 * al[yk])
        img[..., 3] *= np.clip(c[..., 3] / 255.0, 0, 1)
        img[..., 3] *= ~hair  # strands across the eye stay in front of the lid
        frames.append((a, img))
    return frames, {"cols": [int(cols[0]), int(cols[-1])], "top": float(top.mean()), "bottom": float(bot.mean()),
                    "rimColumns": len(runs), "ink": [round(float(v), 1) for v in ink]}


def build(rig, key_id):
    order = rig["artMeta"]["commonLandmarkOrder"]
    key = next(k for k in rig["keys"] if k["id"] == key_id)
    lm = key["landmarks"]
    c = key_canvas(rig, key_id)
    s = hsv(c[..., :3])
    skinlike = (c[..., 3] > 200) & (s[..., 2] > 0.6) & (s[..., 1] > 0.1) & (s[..., 1] < 0.5)
    fallback = np.median(c[..., :3][skinlike], 0) if skinlike.any() else np.array([240, 180, 150.0])
    eyes = {}
    for name in ("pupil_R", "pupil_L"):
        px, py = (int(round(v)) for v in lm[order.index(name)])
        got = eye_frames(c, px, py, fallback)
        if got:
            eyes[name] = got
    if not eyes:
        print(key_id, "no painted eye found")
        return None
    out_dir = OUT / key_id
    out_dir.mkdir(parents=True, exist_ok=True)
    entries = []
    for i, a in enumerate(APERTURES):
        img = np.zeros((H, W, 4), np.float32)
        for frames, _ in eyes.values():
            f = frames[i][1]
            # straight-alpha "over" (v3.2 stored premultiplied colour as straight: a dark line along every soft lid edge)
            m = f[..., 3:4] / 255.0
            d = img[..., 3:4] / 255.0
            out_a = m + d * (1 - m)
            img[..., :3] = np.where(out_a > 0, (f[..., :3] * m + img[..., :3] * d * (1 - m)) / np.maximum(out_a, 1e-6), 0)
            img[..., 3] = out_a[..., 0] * 255
        ys, xs = np.nonzero(img[..., 3] > 0)
        x0, y0, x1, y1 = xs.min() - 1, ys.min() - 1, xs.max() + 2, ys.max() + 2
        dst = out_dir / f"a{int(round(a * 100)):02d}.png"
        L.save_rgba(img[y0:y1, x0:x1], dst)
        entries.append({"name": f"lid-{int(round(a * 100)):02d}", "aperture": a, "raw": True, "file": L.rel(dst).split("prototype-v2/art/")[1],
                        "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]})
    sheet(c, entries, out_dir / "check.png")
    print(key_id, {k: v[1] for k, v in eyes.items()})
    return entries


def sheet(c, entries, dst):
    rows = []
    x0 = min(e["box"][0] for e in entries) - 10
    y0 = min(e["box"][1] for e in entries) - 10
    x1 = max(e["box"][0] + e["box"][2] for e in entries) + 10
    y1 = max(e["box"][1] + e["box"][3] for e in entries) + 10
    base = c[..., :3] * (c[..., 3:4] / 255.0) + 8 * (1 - c[..., 3:4] / 255.0)
    rows.append(base[y0:y1, x0:x1])
    for e in entries:
        im = L.load_rgba(L.ART / e["file"])
        comp = base.copy()
        bx, by = e["box"][:2]
        h, w = im.shape[:2]
        a = im[..., 3:4] / 255.0
        comp[by:by + h, bx:bx + w] = comp[by:by + h, bx:bx + w] * (1 - a) + im[..., :3] * a
        rows.append(comp[y0:y1, x0:x1])
    s = np.concatenate(rows, 0)
    Image.fromarray(np.clip(s, 0, 255).astype(np.uint8)).resize((s.shape[1] * 2, s.shape[0] * 2), Image.NEAREST).save(dst)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    a = ap.parse_args()
    rig = L.read_json(L.ART / "rig.json")
    v3 = rig["artMeta"]["v3"]
    ids = [k["id"] for k in rig["keys"]]
    key_lids = dict(v3.get("keyLids", {}))
    for kid in ids:
        if a.only and a.only != kid:
            continue
        entries = build(rig, kid)
        if entries is None:
            continue
        if kid == "frontal":
            v3["patches"]["eyes"] = entries
        else:
            key_lids[kid] = entries
    v3["keyLids"] = key_lids
    v3["keyLidsReadme"] = "tools/gen/rig-lids.py: per key, lid frames by aperture (nearest wins); transparent below the lid edge"
    L.write_json(rig, L.ART / "rig.json")


if __name__ == "__main__":
    main()
