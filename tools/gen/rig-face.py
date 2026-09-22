"""Brows and eyelids for the living-portrait v3 frontal rig (measured, not
guessed), built on the v3 layer set.

  brows   Mattes her visible right brow (viewer-left, over the green eye)
          against a skin estimate, mirrors it across the perpendicular
          bisector of the two iris centres (owners.json) and paints it into
          headCore's hidden fill under the fringe, where the plate never
          showed the left brow. Then writes the `raised` and `drawn` brow
          patches: brow removed from its rest place, re-laid displaced
          (raised: up 3-5 px, more at the inner end; drawn: inner end down
          3 px and 2 px inward). A patch's colour is the rest face everywhere
          outside the brow's own matte, so its edge cannot show.
  eyes    Blink states as measured lid moves: per column of each eye
          window, the upper-lid band (lid line + lashes, H px above the
          window) slides down by (1 - aperture) * window height; the lid
          skin above it is filled from the lid's own skin. Aperture 0.66
          (blink-1), 0.5 (half), 0.33 (blink-2), 0.0 (closed-geo, also the
          pre-fill the diffusion `closed` pass refines). Only the lid is in
          the patch: the live iris layer keeps showing (and travelling)
          below the lid edge. Also a difference image outside the lid region.
  closed  Merges a picked --latent inpaint of closed-geo into the `closed`
          patch (tone drift removed, alpha limited to the lid region).

    python -s tools/gen/rig-face.py brows      # before rig-assemble.py (edits fills/headCore.png)
    python -s tools/gen/rig-face.py eyes       # after rig-assemble.py
    python -s tools/gen/rig-face.py closed --pick art/v3/jobs/out/closed.2.full.png
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

MASKS = L.V3 / "masks"
FILLS = L.V3 / "fills"
LAYERS = L.V3 / "layers/frontal"
PATCHES = L.V3 / "patches"
FACE_LAYERS = ["hairBack", "body", "headCore", "irisR", "irisL", "eyeApertureR", "eyeApertureL"]


def compose(names):
    canvas = np.zeros((1216, 832, 4), np.float32)
    for n in names:
        box = L.read_json(LAYERS / f"{n}.json")["box"]
        L.over(canvas, L.load_rgba(LAYERS / f"{n}.png"), box[0], box[1])
    return canvas


def reflect_coords(shape, c1, c2):
    """For every pixel, its mirror across the perpendicular bisector of c1-c2."""
    h, w = shape
    u = np.array(c2, float) - np.array(c1, float); u /= np.linalg.norm(u)
    m = (np.array(c1, float) + np.array(c2, float)) / 2
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = (xx - m[0]) * u[0] + (yy - m[1]) * u[1]
    return yy - 2 * d * u[1], xx - 2 * d * u[0]


def sample(img, ys, xs):
    if img.ndim == 2:
        return ndi.map_coordinates(img, [ys, xs], order=1, mode="constant")
    return np.dstack([ndi.map_coordinates(img[..., c], [ys, xs], order=1, mode="constant") for c in range(img.shape[2])])


def brow_matte(rgb, poly_m, skin_lum_floor=0.5, ink=0.08):
    # the skin under the brow, per column: a vertical blend from the forehead
    # just above the brow to the lid skin just below it (the brow sits on a
    # light-to-shade gradient; a ring average would paint a pale stripe)
    skin = rgb.copy()
    cols = np.nonzero(poly_m.any(0))[0]
    have = np.zeros(rgb.shape[1], bool)
    for x in cols:
        ys = np.nonzero(poly_m[:, x])[0]
        t0, b0 = ys[0] - 2, ys[-1] + 2
        ca, cb = rgb[max(t0 - 1, 0):t0 + 1, x].mean(0), rgb[b0:b0 + 2, x].mean(0)
        for y in ys:
            f = (y - t0) / max(1, b0 - t0)
            skin[y, x] = ca * (1 - f) + cb * f
        have[x] = True
    skin = np.where(poly_m[..., None], ndi.gaussian_filter(skin, (0.5, 2.0, 0)), skin)
    ls, lc = L.luminance(skin), L.luminance(rgb)
    a = np.clip((ls - lc) / np.maximum(ls - ink, 1e-3), 0, 1) * poly_m
    a[a < 0.06] = 0
    strong = a > 0.6
    dark = rgb[strong].mean(0) if strong.any() else np.array([40, 20, 15], np.float32)
    col = (rgb - (1 - a[..., None]) * skin) / np.maximum(a[..., None], 1e-3)
    col = np.where((a > 0.25)[..., None], np.clip(col, 0, 255), dark)
    return a.astype(np.float32), col.astype(np.float32), skin


def displace(a, col, disp_fn, shape):
    """Backward-warp a matte by a per-pixel displacement field (dx, dy)."""
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx, dy = disp_fn(xx, yy)
    ys, xs = yy - dy, xx - dx
    return sample(a, ys, xs), sample(col, ys, xs)


def cmd_brows(_a):
    spec = L.read_json(MASKS / "frontal.face.json")["brows"]
    plate = L.load_rgba(L.PLATE)
    rgb = plate[..., :3]
    eyes = L.read_json(MASKS / "owners.json")["eyes"]
    c1, c2 = eyes["irisR"]["centre"], eyes["irisL"]["centre"]
    shape = rgb.shape[:2]
    poly = L.poly_mask(shape, [spec["visiblePoly"]])
    a_r, col_r, skin_r = brow_matte(rgb, poly)
    ys, xs = reflect_coords(shape, c1, c2)
    a_l = sample(a_r, ys, xs); col_l = sample(col_r, ys, xs)
    hidden = dict(np.load(MASKS / "hidden.npz"))["headCore"]
    fp = FILLS / "headCore.png"
    fill = L.load_rgba(fp)
    put = hidden & (a_l > 0) & (fill[..., 3] > 0)
    fill[put, :3] = a_l[put, None] * col_l[put] + (1 - a_l[put, None]) * fill[put, :3]
    L.save_rgba(fill, fp)
    np.savez_compressed(MASKS / "brows.npz", aR=a_r, colR=col_r, skinR=skin_r, aL=a_l, colL=col_l)
    # a check image: the plate with the mirrored brow drawn over (only a check)
    chk = rgb * 1.0
    chk = a_l[..., None] * np.array([0, 255, 255]) * 0.6 + (1 - 0.6 * a_l[..., None]) * chk
    Image.fromarray(np.clip(chk[280:400, 220:720], 0, 255).astype(np.uint8)).resize((1000, 240), Image.NEAREST).save(PATCHES.parent / "masks/brow-mirror-check.png")
    L.write_json({"visiblePoly": spec["visiblePoly"], "mirrorAxis": {"irisR": c1, "irisL": c2},
                  "paintedIntoHeadCoreFill": int(put.sum())}, MASKS / "brows.json")
    print("mirrored brow pixels painted under the fringe:", int(put.sum()))


def brow_patch(base, br, name, spec):
    shape = base.shape[:2]
    out = base[..., :3].copy()
    alpha = np.zeros(shape, np.float32)
    for side, cfg in (("R", spec["R"]), ("L", spec["L"])):
        a, col = br["a" + side], br["col" + side]
        skin = br["skinR"] if side == "R" else br["skinL"]
        x_in, x_out = cfg["innerX"], cfg["outerX"]
        mv = spec["moves"][name]

        def disp(xx, yy, x_in=x_in, x_out=x_out, mv=mv, side=side):
            t = np.clip((xx - x_out) / (x_in - x_out), 0, 1)  # 0 outer .. 1 inner
            inward = 1.0 if side == "R" else -1.0
            return inward * mv["dxInner"] * t, mv["dyOuter"] + (mv["dyInner"] - mv["dyOuter"]) * t
        aw, cw = displace(a, col, disp, shape)
        rest = a > 0
        out[rest] = skin[rest]
        out = aw[..., None] * cw + (1 - aw[..., None]) * out
        alpha = np.maximum(alpha, (L.dilate(rest | (aw > 0.02), 3)).astype(np.float32))
    alpha = ndi.gaussian_filter(alpha, 1.0) * (alpha > 0)
    return np.dstack([out, alpha * 255])


def write_patch(arr, name, group, meta):
    ys, xs = np.nonzero(arr[..., 3] > 0)
    x0, y0, x1, y1 = xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3
    L.save_rgba(arr[y0:y1, x0:x1], PATCHES / group / f"{name}.png")
    side = {"box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)], **meta}
    L.write_json(side, PATCHES / group / f"{name}.json")
    return side


def eye_geometry(win):
    """Columns of an eye window with a smooth upper-lid curve U and lower-lid
    curve B. U is a robust quadratic fit to the window's top edge: where a
    fringe strand cuts into the window its top reads too low, so points
    below the fit are dropped and the fit repeated."""
    cols = np.nonzero(win.any(0))[0]
    top = np.array([np.nonzero(win[:, x])[0][0] for x in cols], float)
    bot = np.array([np.nonzero(win[:, x])[0][-1] for x in cols], float)
    keep = np.ones(len(cols), bool)
    for _ in range(6):
        c = np.polyfit(cols[keep], top[keep], 2)
        fit = np.polyval(c, cols)
        keep = top <= fit + 2.0
    U = np.minimum(np.polyval(c, cols), top + 0.0)
    U = ndi.gaussian_filter1d(np.polyval(c, cols), 1.0)
    B = ndi.gaussian_filter1d(bot, 2.0)
    B = np.maximum(B, U + 1)
    return cols, U, B


def band_strip(rgb, cols, U, H):
    """The upper-lid band (lid line + lashes), H rows above U, per column."""
    k = np.arange(H, dtype=np.float32)[:, None]
    ys = (U[None, :] - H + k)
    xs = np.broadcast_to(cols[None, :].astype(np.float32), ys.shape)
    return sample(rgb, ys, xs)


def mirror_strip(strip, n_out):
    """A band strip re-sampled for the other eye: mirrored left-right and
    stretched to that eye's column count."""
    n_in = strip.shape[1]
    t = np.linspace(0, 1, n_out)
    src = (1 - t) * (n_in - 1)
    i0 = np.floor(src).astype(int); fr = (src - i0)[None, :, None]
    i1 = np.minimum(i0 + 1, n_in - 1)
    return strip[:, i0] * (1 - fr) + strip[:, i1] * fr


def lid_patch(rgb, win, cols, U, B, strip, f, lid_dark):
    """Upper lid (the band strip) slid down to aperture f."""
    h, w = rgb.shape[:2]
    H = strip.shape[0]
    out = np.zeros((h, w, 4), np.float32)
    need = np.zeros((h, w), bool)
    n = len(cols)
    for i, x in enumerate(cols):
        u, b = U[i], B[i]
        edge = min(i, n - 1 - i) / 6.0  # the lid meets the corners: taper the slide
        taper = 1.0 if edge >= 1 else edge * edge * (3 - 2 * edge)
        s = (1 - f) * (b - u) * (taper if f > 0 else 1.0)
        top = int(np.floor(u - H))
        new_bottom = u + s
        for y in range(max(0, top), min(h, int(np.ceil(new_bottom)) + 2)):
            k = y - s - (u - H)
            if k >= 0:
                k0 = int(np.floor(k)); fr = k - k0
                c = strip[min(k0, H - 1), i] * (1 - fr) + strip[min(k0 + 1, H - 1), i] * fr
                a = 1.0 if y <= new_bottom else max(0.0, 1.0 - (y - new_bottom))
                out[y, x, :3] = c
            else:
                need[y, x] = True
                a = 1.0
            out[y, x, 3] = max(out[y, x, 3], a * 255)
    if need.any():
        skin_known = (L.luminance(rgb) > 0.5) & L.dilate(need, 14) & ~need & (out[..., 3] == 0) & ~L.dilate(win, 6) & (rgb[..., 2] < rgb[..., 0])
        skin = ndi.gaussian_filter(L.push_pull_fill(rgb, skin_known), (2, 2, 0))
        # the lid darkens toward the lash line, not as a flat step
        depth = ndi.distance_transform_edt(need)
        top_d = np.zeros_like(depth)
        yy = np.nonzero(need)
        # distance below the top of this column's uncovered skin
        col_top = {}
        for y, x in zip(*yy):
            col_top[x] = min(col_top.get(x, y), y)
        for y, x in zip(*yy):
            top_d[y, x] = y - col_top[x]
        shade = 1.0 - (1.0 - lid_dark) * np.clip(top_d / 10.0, 0, 1)
        out[need, :3] = skin[need] * shade[need, None]
    return out


def cmd_eyes(_a):
    spec = L.read_json(MASKS / "frontal.face.json")["eyes"]
    base = compose(FACE_LAYERS)
    plate = L.load_rgba(L.PLATE)
    res = {}
    for name, f in spec["states"].items():
        patch = np.zeros(base.shape, np.float32)
        rgbb = base[..., :3]
        pale = (rgbb[..., 2] > rgbb[..., 0] + 25) & (L.luminance(rgbb) > 0.55)
        # the opening = the window plus any of its pale sclera crescent the
        # window class stopped short of (the lid must cover all of it shut)
        opening = {sd: ndi.binary_fill_holes(np.load(MASKS / f"window{sd}.npy") | (L.dilate(np.load(MASKS / f"window{sd}.npy"), 8) & pale))
                   for sd in ("R", "L")}
        geo = {sd: eye_geometry(opening[sd]) for sd in ("R", "L")}
        strips = {sd: band_strip(base[..., :3], geo[sd][0], geo[sd][1], spec["bandPx"]) for sd in ("R", "L")}
        # her left (blue) eye's upper lid lies under the fringe in the plate:
        # its band is her right eye's, mirrored and stretched to fit.
        for sd in spec["mirrorBandFrom"]:
            other = "R" if sd == "L" else "L"
            strips[sd] = mirror_strip(strips[other], len(geo[sd][0]))
        for sd in ("R", "L"):
            cols, U, B = geo[sd]
            L.over(patch, lid_patch(base[..., :3], opening[sd], cols, U, B, strips[sd], f, spec["lidShade"]))
        meta = write_patch(patch, name, "eyes", {"aperture": f, "method": "measured lid slide (rig-face.py eyes)",
                                                 "source": "v3 frontal layers composited without the fringe"})
        # proof: patch over the rest face vs the rest face, outside the lid region
        comp = base.copy(); L.over(comp, patch)
        lid = L.dilate(patch[..., 3] > 0, 1)
        d = np.abs(comp[..., :3] - base[..., :3]).max(-1)
        outside = float(d[~lid].max()) if (~lid).any() else 0.0
        vis = np.clip(d * 8, 0, 255)
        vis[lid] = np.maximum(vis[lid], 40)
        Image.fromarray(vis.astype(np.uint8)).crop((200, 320, 740, 500)).save(PATCHES / "eyes" / f"{name}.diff.png")
        res[name] = {**meta, "maxDiffOutsideLidRegion": outside}
        Image.fromarray(np.clip(L.on_magenta(comp)[320:500, 200:740], 0, 255).astype(np.uint8)).save(PATCHES / "eyes" / f"{name}.preview.png")
    L.write_json(res, PATCHES / "eyes" / "eyes.json")
    np.save(PATCHES / "eyes" / "_base.npy", base.astype(np.float16))
    print({k: v["maxDiffOutsideLidRegion"] for k, v in res.items()})


def cmd_browpatches(_a):
    spec = L.read_json(MASKS / "frontal.face.json")["brows"]
    base = compose(FACE_LAYERS)
    z = dict(np.load(MASKS / "brows.npz"))
    # skin under the mirrored brow: the rest face minus the brow itself
    around = L.dilate(z["aL"] > 0, 10)
    known = around & ~(z["aL"] > 0.02) & (L.luminance(base[..., :3]) > 0.5)
    z["skinL"] = ndi.gaussian_filter(L.push_pull_fill(base[..., :3], known), (1.5, 1.5, 0))
    res = {}
    for name in spec["moves"]:
        arr = brow_patch(base, z, name, spec)
        res[name] = write_patch(arr, name, "brows", {"move": spec["moves"][name], "method": "brow matte displaced (rig-face.py browpatches)"})
        comp = base.copy(); L.over(comp, arr)
        Image.fromarray(np.clip(L.on_magenta(comp)[280:420, 200:740], 0, 255).astype(np.uint8)).save(PATCHES / "brows" / f"{name}.preview.png")
    L.write_json(res, PATCHES / "brows" / "brows.json")
    print(res)


def cmd_mouth(_a):
    """Re-matte the v2 mouth patches (inpainted rectangles whose whole box
    was drawn with a feathered edge, so their tone drift read as a lighter
    rectangle): remove the drift (measured where the patch should equal the
    plate), then keep only where the mouth actually changed."""
    base = compose(FACE_LAYERS)[..., :3]
    old = L.PROTO / "art/patches/mouth"
    res = {}
    for name in ("parted", "smile", "pressed"):
        side = L.read_json(old / f"{name}.json")
        bx, by, bw, bh = side["box"]; pad = side["pad"]
        x0, y0 = bx - pad, by - pad
        crop = L.load_rgba(old / f"{name}.png")[..., :3]
        full = base.copy(); full[y0:y0 + crop.shape[0], x0:x0 + crop.shape[1]] = crop
        inside = np.zeros(base.shape[:2], bool); inside[y0:y0 + crop.shape[0], x0:x0 + crop.shape[1]] = True
        diff = full - base
        mouth_zone = L.ellipses_mask(base.shape[:2], [L.read_json(MASKS / "frontal.face.json")["mouthZone"]])
        raw = inside & mouth_zone & (np.abs(diff).max(-1) > 18)
        core = L.dilate(ndi.binary_opening(raw, iterations=2), 2)
        ring = inside & ~L.dilate(core, 4)
        drift = ndi.gaussian_filter(L.push_pull_fill(diff, ring), (5, 5, 0))
        fixed = np.clip(full - drift * inside[..., None], 0, 255)
        region = L.dilate(core, 3) & L.erode(inside, 3)
        alpha = ndi.gaussian_filter(region.astype(np.float32), 1.5) * region
        arr = np.dstack([fixed, alpha * 255])
        meta = write_patch(arr, name, "mouth", {"from": L.rel(old / f"{name}.png"), "method": "v2 inpaint re-matted: tone drift removed, alpha only where the mouth changed (rig-face.py mouth)"})
        comp = base.copy(); comp = arr[..., :3] * alpha[..., None] + comp * (1 - alpha[..., None])
        d = np.abs(comp - base).max(-1)
        res[name] = {**meta, "maxDiffOutsideRegion": float(d[~region].max())}
        Image.fromarray(np.clip(comp[560:720, 260:660], 0, 255).astype(np.uint8)).save(PATCHES / "mouth" / f"{name}.preview.png")
    L.write_json(res, PATCHES / "mouth" / "mouth.json")
    print({k: v["maxDiffOutsideRegion"] for k, v in res.items()})


def cmd_closedjob(_a):
    """Source + mask for the diffusion refine of closed-geo: the whole rest
    face with closed-geo drawn under the fringe; the mask is the lid region
    minus what the fringe covers."""
    face = compose(FACE_LAYERS)
    geo = L.load_rgba(PATCHES / "eyes" / "closed-geo.png")
    x, y, w, h = L.read_json(PATCHES / "eyes" / "closed-geo.json")["box"]
    L.over(face, geo, x, y)
    for n in ("hairFront", "strand1", "strand2", "earring"):
        box = L.read_json(LAYERS / f"{n}.json")["box"]
        L.over(face, L.load_rgba(LAYERS / f"{n}.png"), box[0], box[1])
    a = face[..., 3:4] / 255.0
    rgb = face[..., :3] * a + 118 * (1 - a)
    jobs = L.V3 / "jobs"
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(jobs / "closed.src.png")
    full = np.zeros(face.shape[:2], bool); full[y:y + h, x:x + w] = geo[..., 3] > 0
    own = np.load(MASKS / "owner.npy")
    Z = L.read_json(MASKS / "owners.json")["z"]
    m = full & ~(own == Z.index("hairFront"))
    L.save_l(np.clip(ndi.gaussian_filter(L.dilate(m, 2).astype(np.float32), 1.2), 0, 1), jobs / "closed.mask.png")
    print("closed job mask px", int(m.sum()))


def cmd_closed(a):
    base = np.load(PATCHES / "eyes" / "_base.npy").astype(np.float32)
    geo = L.load_rgba(PATCHES / "eyes" / "closed-geo.png")
    meta = L.read_json(PATCHES / "eyes" / "closed-geo.json")
    x, y, w, h = meta["box"]
    full = np.zeros(base.shape, np.float32); full[y:y + h, x:x + w] = geo
    region = full[..., 3] > 0
    out = L.load_rgba(a.pick)[..., :3]
    src = np.asarray(Image.open(L.REPO / "docs/concepts/pause-until-dawn/prototype-v2/art/v3/jobs/closed.src.png").convert("RGB")).astype(np.float32)
    ring = L.dilate(region, 10) & ~L.dilate(region, 3)
    drift = ndi.gaussian_filter(L.push_pull_fill(out - src, ring), (6, 6, 0))
    fixed = np.clip(out - drift, 0, 255)
    arr = full.copy(); arr[region, :3] = fixed[region]
    side = write_patch(arr, "closed", "eyes", {"aperture": 0.0, "method": "closed-geo refined by a --latent inpaint",
                                               "pick": L.rel(a.pick)})
    print(side)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("brows"); sub.add_parser("eyes"); sub.add_parser("browpatches"); sub.add_parser("closedjob"); sub.add_parser("mouth")
    c = sub.add_parser("closed"); c.add_argument("--pick", required=True)
    a = ap.parse_args()
    {"brows": cmd_brows, "eyes": cmd_eyes, "browpatches": cmd_browpatches, "closedjob": cmd_closedjob, "mouth": cmd_mouth, "closed": cmd_closed}[a.cmd](a)


if __name__ == "__main__":
    main()
