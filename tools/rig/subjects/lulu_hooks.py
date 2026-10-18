"""Lulu's hooks (the rig program, 2026-10-18; FFX only: Lulu is an FFX figure). Pass 2 (2026-10-18) cut the skirt into two parts, the column (`skirt`) and the left sweep (`train`), and hangs both from the hips.

Her skirt is the one part the declarative config cannot skin: it is a single long panel that is planted at the hem and follows the hips at the waist. Each vertex blends three things:

- the `pelvis` bone, by how high it sits: above `TOP` (1x px) a vertex is the pelvis's alone (the hips and waist are rigid with it, which the gate's hole test at the pelvis joint needs), below `BOT` the
  pelvis has no say, between them a smoothstep (a long one: the flare grows toward the hem and the belts keep their spacing);
- `skirtL` and `skirtR`, two bones at the hem's centre that are held at rest and only SCALED (the fitter's `scales`): the left and the right of the skirt flare or narrow independently about the hem
  (her idle's train trails to the left; the paintings that flare the skirt flare it to the right too), split by x across a ramp around the hem's centre line.
A vertex keeps its two heaviest influences (the rig file holds two).
"""
from __future__ import annotations

import numpy as np

TOP = 600.0  # 1x painting rows: above this a vertex is the pelvis's alone
BOT = 1120.0  # below this it is the skirt bones' alone
XC = 245.0  # 1x painting column of the hem's centre: the line between the left and the right of the skirt
RAMP = 45.0  # the left/right blend reaches this far to each side of it


def _smooth(t: float) -> float:
    t = float(np.clip(t, 0.0, 1.0))
    return t * t * (3 - 2 * t)


def skin_skirt(state):
    S = state.S
    pel, left, right = state.BI["pelvis"], state.BI["skirtL"], state.BI["skirtR"]

    def fn(verts):
        out = []
        for x, y in verts:
            p = 1.0 - _smooth((y / S - TOP) / (BOT - TOP))  # the pelvis's share
            a = _smooth(((x / S) - (XC - RAMP)) / (2 * RAMP))  # 0 at the far left, 1 at the far right
            w = {pel: p, left: (1.0 - p) * (1.0 - a), right: (1.0 - p) * a}
            top2 = sorted(((wt, b) for b, wt in w.items() if wt > 1e-4), reverse=True)[:2]
            tot = sum(wt for wt, _ in top2)
            out.append([(b, wt / tot) for wt, b in top2])
        return out

    return fn


def skin_train(state):
    """The train (the left sweep of the hem) is blended exactly like the skirt's own left side: the pelvis above `TOP`, the `train` bone below `BOT` (a child of `skirtL`, so it swings with the left of the skirt),
    a smoothstep between. A rigid train would swing farther than the column beside it at its top rows and open a wedge along the seam."""
    pel, tr = state.BI["pelvis"], state.BI["train"]

    def fn(verts):
        out = []
        for x, y in verts:
            p = 1.0 - _smooth((y / state.S - TOP) / (BOT - TOP))
            out.append([(pel, p), (tr, 1.0 - p)] if 0.0 < p < 1.0 else [(pel, 1.0)] if p >= 1.0 else [(tr, 1.0)])
        return out

    return fn


# ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# Pass 2: the front-view parts. Her defend and Overdrive (od-fury) paintings face the viewer; a rig of side-view parts cannot turn. The upper body of each painting (head, hair, collar, arms, the doll or
# dolls, down to the waist) is CUT from that painting as one part (no model, no repaint: the painting's own pixels, its alpha, a soft edge at the waist) and a key brings it in.
# Format v1 has no part swap, a scale must be above 0 and at most 4 a bone, and a part cannot lie outside the master's box, so the part is stored as a SPECK (its mesh is the real shape divided by 16, at
# the hips) behind every other part, on a chain of two bones at one joint (a child of the root: a body joint the gate watches is a bone whose neighbours are parts); the key that wants it scales each bone 4 times (16 in all), moves the chain to the figure and puts the part in front (`layers`).
# Every other key leaves the chain alone: the speck stays under the hips, hidden.
# ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STANCE_X, SOLES_Y = 244.0, 1142.0  # the idle's stance column and its soles row (1x px)
FRONT_S = 16.0  # the speck factor: 2 bones x 4 x 4 (the gate's range for one bone's scale is (0, 4])
FRONT_J = (330.0, 560.0)  # the chain's joint (1x px): under the hips, inside the opaque skirt top
FRONTS = {
    # name: the painting, its stance column and soles row (1x px, `tools/posescale` feetPx), the scale it is drawn at over the idle's (1.0 = the idle's own; the game draws defend at 1.176, od-fury at 1.183),
    #       the row it is cut at (1x painting px: under the arms / the corset), the draw order at rest (behind everything), the order in its key (in front of everything)
    "fdef": dict(pose="defend", feetx=374.5, anchor=1116.0, m=1.10, cut=490.0, feather=14.0, order=0, layer=20),
    "fod": dict(pose="od-fury", feetx=277.5, anchor=918.0, m=1.18, cut=388.0, feather=14.0, order=1, layer=21),
}


def _front_part(state, name, spec):
    import numpy as np
    from PIL import Image
    from scipy import ndimage as ndi

    R = state.R
    S = state.S
    src = np.array(Image.open(state.sub.dir_chars / f"{spec['pose']}@4x.png").convert("RGBA"))
    rgba = R.defringe_alpha(src)
    a = rgba[..., 3].astype(np.float32)
    ys = np.arange(a.shape[0], dtype=np.float32)[:, None]
    cut4 = spec["cut"] * 4.0
    ft4 = spec["feather"] * 4.0
    a = a * np.clip((cut4 - ys) / ft4, 0.0, 1.0)  # the waist edge fades out over `feather` px: the idle's skirt top takes over under it
    rgba[..., 3] = a.astype(np.uint8)
    yy, xx = np.nonzero(a > 8)
    x0, x1, y0, y1 = int(xx.min()), int(xx.max()) + 1, int(yy.min()), int(yy.max()) + 1
    crop = rgba[y0:y1, x0:x1]
    w1, h1 = (x1 - x0) / 4.0, (y1 - y0) / 4.0  # 1x painting px
    m = spec["m"]
    d = min(S * m, 960.0 / w1, 2300.0 / h1)  # PNG px per 1x painting px (the file has to fit the master's box); the key magnifies the rest
    pw, ph = int(round(w1 * d)), int(round(h1 * d))
    im = Image.fromarray(crop, "RGBA").convert("RGBa").resize((pw, ph), Image.LANCZOS).convert("RGBA")
    arr = np.array(im)
    arr = R.dilate_rgb(arr, 8)  # colour under the transparent edge, so filtering never pulls the grey ground in
    out = state.out
    Image.fromarray(arr, "RGBA").save(out / f"{name}.png")
    rim = (R.outer_edge_mask(arr[..., 3]) * 255).astype(np.uint8)
    rim[max(0, ph - int(S * spec["feather"] * 2.2)):, :] = 0  # no rim light along the waist cut
    Image.fromarray(rim, "L").save(out / f"{name}.rim.png")
    P, T = R.build_mesh(arr[..., 3] > 8, edge_step=22.0, inner_step=44.0, domain_grow=10, seed=1)
    q = S * m / d  # PNG px -> the figure's master px
    # where the PNG's top-left lands in the figure's master px: the painting's (x0/4, y0/4) at the idle's stance and soles
    fx = S * (STANCE_X + (x0 / 4.0 - spec["feetx"]) * m)
    fy = S * (SOLES_Y + (y0 / 4.0 - spec["anchor"]) * m)
    Vf = np.array([fx, fy]) + P * q  # the real vertices (master px)
    C = np.array([(Vf[:, 0].min() + Vf[:, 0].max()) / 2.0, (Vf[:, 1].min() + Vf[:, 1].max()) / 2.0])
    J = np.array(FRONT_J) * S
    Pb = J + (Vf - C) / FRONT_S  # the speck
    uvs = P / np.array([pw, ph], np.float64)
    rec = {"name": name, "order": spec["order"], "png": f"{name}.png", "rim": f"{name}.rim.png", "box": [0, 0, pw, ph],
           "verts": [round(float(v), 5) for v in Pb.reshape(-1)], "uvs": [round(float(v), 6) for v in uvs.reshape(-1)],
           "triangles": [int(t) for t in T.reshape(-1)], "bone": f"{name}2"}
    state.fronts[name] = {"centre": [round(float(C[0]), 2), round(float(C[1]), 2)], "layer": spec["layer"], "box": [round(float(Vf[:, 0].min()), 1), round(float(Vf[:, 1].min()), 1), round(float(Vf[:, 0].max()), 1), round(float(Vf[:, 1].max()), 1)], "png": [pw, ph], "q": round(q, 4)}
    return rec


def build(state):
    """After the standard parts: shift their draw order up by two (the front parts sit behind everything at rest) and add the front parts."""
    state.fronts = {}
    for r in state.parts:
        r["order"] = r["order"] + 2
    for name, spec in FRONTS.items():
        state.parts.append(_front_part(state, name, spec))
    import json
    (state.out / "fronts.json").write_text(json.dumps(state.fronts, indent=1))


def cut_parts(state):
    """Pass 2, the doll's hem. Where her moogle doll sat the skirt is black belt on black belt (the painting's own pixels round the doll are 0 to 15 of 255), but the smooth fill the cut ops make there was a
    lighter grey-blue blob with a halo and the doll's red antenna was left standing above it: the dark smudge Bailey saw where the doll leaves the hem. Here the fill takes the BLACK of the ring of the painting
    round the doll (its darkest quarter, by band of rows), keeps the fill's own faint form (a fifth of it), and the antenna's thin red wire (left in the skirt by the cut) goes to the doll part, so it leaves with the doll. Classical, the painting's own colours."""
    import numpy as np

    R = state.R
    S = state.S
    full, cut = state.full["skirt"], state.cut["skirt"]
    doll = state.cut["doll"]
    ring = R.grow(doll, 16) & ~R.grow(doll, 4) & state.alpha & ~doll
    zone = R.grow(doll, 2) & cut  # the fill the cut ops made: the skirt behind the doll (the doll is drawn over it at rest, so the painting is not changed)
    # the antenna: red pixels of the skirt above and beside the doll
    rgb = full[..., :3].astype(np.int32)
    red = cut & (rgb[..., 0] > rgb[..., 1] + 8) & (rgb[..., 0] > rgb[..., 2] + 8) & (rgb[..., 0] > 20)
    ys, xs = np.nonzero(doll)
    box_y0, box_y1 = ys.min() - 90, ys.max()
    box_x0, box_x1 = xs.min() - 20, xs.max() + 20
    red[:box_y0] = False
    red[box_y1:] = False
    red[:, :box_x0] = False
    red[:, box_x1:] = False
    red = R.grow(red, 4) & cut
    # the antenna wire belongs to the doll (it leaves with it); behind it the skirt is the black of the ring
    state.cut["doll"] = state.cut["doll"] | red
    state.full["doll"][red] = state.rgba[red]
    fill = zone | red
    ry, rx = np.nonzero(ring)
    lum = state.rgba[ry, rx, :3].astype(np.float32).mean(1)
    out = full.copy()
    band = 40 * S
    for y0 in range(int(ys.min()) - 100 * S // S, int(ys.max()) + 60, band):
        sel = (ry >= y0) & (ry < y0 + band)
        if sel.sum() < 30:
            continue
        cols = state.rgba[ry[sel], rx[sel], :3].astype(np.float32)
        dark = cols[lum[sel] <= np.percentile(lum[sel], 25)].mean(0)
        m = fill.copy()
        m[:y0] = False
        m[y0 + band:] = False
        w_old = np.where(red[m], 0.0, 0.2)[:, None]  # the antenna's pixels keep nothing of their red
        out[m, :3] = np.clip((1.0 - w_old) * dark + w_old * full[m, :3], 0, 255).astype(np.uint8)
    full[fill] = out[fill]
