"""Silhouette-true layer ownership for the living-portrait v3 frontal rig.

Replaces the box/zig-zag polygons of rig-cut.py (v2) with masks whose every
internal boundary follows the painting's own linework:

  1. figure silhouette  = the plate's own alpha (the plate is an isnet-anime
     rembg cutout; `silhouette` re-runs isnet-anime on the plate over grey
     and records the agreement, so the provenance is checked, not assumed);
  2. classes (hair / skin / body / earring / eye windows) = a multi-source
     geodesic assignment from hand-authored seed scribbles
     (art/v3/masks/frontal.seeds.json), whose edge cost rises across dark
     ink and colour edges, so the class boundaries snap to ink lines;
     colour clustering (k-means, `kmeans`) is recorded as a cross-check;
  3. layer ownership = the classes split by the layer spec
     (art/v3/masks/frontal.layers.json): hair into hairFront / strand1 /
     strand2 / hairBack by polygon seeds + the same geodesic inside the hair,
     eye windows into iris ellipse + socket, lid rings around each window;
     outline ink goes to the upper layer (a moving layer carries its own
     outline, never leaves a copy of it on the layer below).

    python -s tools/gen/rig-masks.py classes      # -> v3/masks/classes.png + overlay
    python -s tools/gen/rig-masks.py owners       # -> v3/masks/owner.png + owners.json + overlays
    python -s tools/gen/rig-masks.py silhouette   # isnet-anime agreement check
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
CLASS_COLOURS = [(255, 170, 0), (60, 220, 90), (40, 120, 255), (0, 240, 240), (250, 40, 40), (180, 60, 255)]
# z-order of the v3 frontal layers, bottom -> top (the renderer draws in this order;
# body alone rides the chest sway, everything else rides the head).
Z = ["hairBack", "body", "headCore", "irisR", "irisL", "eyeApertureR", "eyeApertureL",
     "hairFront", "strand1", "strand2", "earring"]
LAYER_COLOURS = {
    "hairBack": (255, 150, 0), "body": (40, 120, 255), "headCore": (60, 220, 90), "irisR": (0, 255, 160),
    "irisL": (80, 80, 255), "eyeApertureR": (255, 255, 0), "eyeApertureL": (255, 220, 120),
    "hairFront": (255, 60, 60), "strand1": (255, 0, 200), "strand2": (200, 0, 255), "earring": (0, 240, 240),
}


def seeds_from_spec(shape, spec) -> np.ndarray:
    seeds = np.full(shape, -1, np.int64)
    for k, name in enumerate(spec["classes"]):
        s = spec["seeds"][name]
        m = L.poly_mask(shape, s.get("polys", []), s.get("brushes", []))
        seeds[m] = k
    return seeds


def overlay(rgba, labels, colours, out, alpha=0.45, edges=True):
    base = L.on_magenta(rgba)
    col = np.zeros_like(base)
    have = labels >= 0
    for k, c in (colours.items() if isinstance(colours, dict) else enumerate(colours)):
        col[labels == k] = c
    img = np.where(have[..., None], base * (1 - alpha) + col * alpha, base)
    if edges:
        e = np.zeros(labels.shape, bool)
        e[:-1] |= labels[:-1] != labels[1:]
        e[:, :-1] |= labels[:, :-1] != labels[:, 1:]
        img[e] = (255, 255, 255)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(out)


def cmd_classes(_args):
    plate = L.load_rgba(L.PLATE)
    spec = L.read_json(MASKS / "frontal.seeds.json")
    fig = plate[..., 3] > 0
    seeds = seeds_from_spec(fig.shape, spec)
    seeds[~fig] = -1
    lab = L.geodesic_labels(plate, seeds, fig)
    np.save(MASKS / "classes.npy", lab)
    overlay(plate, lab, CLASS_COLOURS, MASKS / "classes-overlay.png")
    counts = {n: int((lab == k).sum()) for k, n in enumerate(spec["classes"])}
    print("classes", counts, "unassigned", int(((lab < 0) & fig).sum()))


def ellipse_fit(mask: np.ndarray):
    ys, xs = np.nonzero(mask)
    cx, cy = xs.mean(), ys.mean()
    cov = np.cov(np.stack([xs - cx, ys - cy]))
    evals, evecs = np.linalg.eigh(cov)
    radii = 2.0 * np.sqrt(evals)  # a uniform ellipse has variance r^2/4 per axis
    return cx, cy, radii, evecs


def ellipse_mask(shape, cx, cy, radii, evecs, grow=0.0):
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.stack([xx - cx, yy - cy], -1) @ evecs
    return (d[..., 0] / (radii[0] + grow)) ** 2 + (d[..., 1] / (radii[1] + grow)) ** 2 <= 1.0


def cmd_owners(_args):
    plate = L.load_rgba(L.PLATE)
    spec = L.read_json(MASKS / "frontal.layers.json")
    cls = np.load(MASKS / "classes.npy")
    names = L.read_json(MASKS / "frontal.seeds.json")["classes"]
    C = {n: cls == k for k, n in enumerate(names)}
    fig = plate[..., 3] > 0
    shape = fig.shape
    lum = L.luminance(plate[..., :3])
    ink = lum < 0.22
    own = np.full(shape, -1, np.int64)
    zi = {n: i for i, n in enumerate(Z)}

    # --- hair split: polygon seeds (eroded) + geodesic inside the hair class
    hair = C["hair"]
    hseeds = np.full(shape, -1, np.int64)
    hseeds[hair] = zi["hairBack"]
    for name in ("hairFront", "strand1", "strand2"):
        s = spec[name]
        inside = L.poly_mask(shape, s["polys"])
        core = L.erode(inside, s.get("snapBand", 10))
        band = inside & ~core | (L.dilate(inside, s.get("snapBand", 10)) & ~inside)
        hseeds[band & hair] = -1
        hseeds[core & hair] = zi[name]
    # keep hairBack seeds only where they are not inside another part's band
    hl = L.geodesic_labels(plate, hseeds, hair)
    own[hair] = hl[hair]

    own[C["skin"]] = zi["headCore"]
    own[C["body"]] = zi["body"]
    own[C["earring"]] = zi["earring"]

    # --- eyes: window -> iris ellipse + socket (socket belongs to headCore);
    #     lid ring (lashes, lid ink, the skin right around it) -> eyeAperture
    meta = {}
    for side, win_cls in (("R", "eyeR"), ("L", "eyeL")):
        win = ndi.binary_fill_holes(C[win_cls])
        rgb = plate[..., :3]
        mx = rgb.max(-1); mn = rgb.min(-1)
        sat = (mx - mn) / np.maximum(mx, 1)
        # sclera = the pale blue crescent; the iris = the saturated green/blue
        # disc (its white catch-light is enclosed, so hole-filling keeps it)
        sclera = win & (lum > 0.55) & (rgb[..., 2] > rgb[..., 0] + 25) & (sat > 0.1) & (sat < 0.5)
        iris_core = win & (sat > 0.45) & (lum > 0.12) & ~sclera
        lab_, n_ = ndi.label(iris_core)
        if n_:
            sizes = ndi.sum(iris_core, lab_, range(1, n_ + 1))
            iris_core = lab_ == (1 + int(np.argmax(sizes)))
        iris_core = ndi.binary_fill_holes(iris_core) & ~sclera
        cx, cy, radii, evecs = ellipse_fit(iris_core)
        # the visible iris is cut by the upper lid, so the moment fit is too
        # small: grow the ellipse until it covers the visible iris pixels,
        # then by the dark limbal ring's width so the ring travels with it.
        grow = spec["iris"]["grow"]
        while (ellipse_mask(shape, cx, cy, radii, evecs, grow=grow) & iris_core).sum() < spec["iris"]["cover"] * iris_core.sum() and grow <= 20:
            grow += 0.5
        grow += spec["iris"]["ring"]
        disc = ellipse_mask(shape, cx, cy, radii, evecs, grow=grow)
        vis_iris = disc & win & ~sclera
        ring = L.dilate(win, spec["lids"]["ring"]) & ~win & fig & (C["skin"] | C["eyeR"] | C["eyeL"])
        own[ring] = zi["eyeAperture" + side]
        own[win] = zi["headCore"]
        own[vis_iris] = zi["iris" + side]
        meta["iris" + side] = {"centre": [round(float(cx), 1), round(float(cy), 1)],
                               "radii": [round(float(r), 1) for r in radii],
                               "axes": np.round(evecs, 4).tolist(),
                               "grow": grow}
        np.save(MASKS / f"disc{side}.npy", disc)
        np.save(MASKS / f"window{side}.npy", win)

    # the tassel's cast shadow on the hood moves with the tassel
    rgbp = plate[..., :3]
    ear = own == zi["earring"]
    shadow = L.dilate(ear, spec.get("earringShadowPx", 12)) & (own == zi["body"]) & (rgbp[..., 2] > rgbp[..., 0] + 10) & (lum < 0.5)
    own[shadow] = zi["earring"]
    # the tassel's own anti-aliased blue edge pixels that the class split left on the body
    fringe_px = L.dilate(own == zi["earring"], 3) & (own == zi["body"]) & (rgbp[..., 2] > rgbp[..., 0] + 20)
    own[fringe_px] = zi["earring"]

    # --- outline ownership: ink pixels of a lower layer that touch an upper
    #     layer within `inkReach` px join the upper layer, so the upper layer
    #     carries its own outline when it moves.
    reach = spec.get("inkReach", 3)
    for upper in ("earring", "strand1", "strand2", "hairFront", "headCore"):
        u = own == zi[upper]
        grow = L.dilate(u, reach) & ink & fig & (own >= 0)
        lower = np.isin(own, [zi[n] for n in Z[:zi[upper]]])
        own[grow & lower] = zi[upper]

    # skin showing between the thin fringe wisps (between the eyes) is face,
    # not hair: the fringe's lower edge must be a true hair silhouette.
    rgbf = plate[..., :3]
    wz = spec["wispZone"]
    zone = np.zeros(shape, bool); zone[wz[1]:wz[3], wz[0]:wz[2]] = True
    skinlike = (rgbf[..., 2] > 0.5 * rgbf[..., 0]) & (lum > 0.45) & ~ink
    fix = zone & (own == zi["hairFront"]) & skinlike
    fix = ndi.binary_opening(fix, iterations=1)
    own[fix] = zi["headCore"]

    # tidy: tiny islands of any layer merge into their surroundings
    for k in range(len(Z)):
        m = own == k
        lab_, n_ = ndi.label(m)
        if not n_:
            continue
        sizes = ndi.sum(m, lab_, range(1, n_ + 1))
        for i, s in enumerate(sizes, 1):
            if s < spec.get("minIsland", 24):
                isl = lab_ == i
                nb = own[L.dilate(isl, 1.5) & ~isl]
                nb = nb[nb >= 0]
                if nb.size:
                    own[isl] = np.bincount(nb).argmax()
    own[~fig] = -1
    # figure pixels no seed could reach (tiny islands cut off by ink): nearest owner
    lost = fig & (own < 0)
    if lost.any():
        _, (iy, ix) = ndi.distance_transform_edt(own < 0, return_indices=True)
        own[lost] = own[iy[lost], ix[lost]]
    np.save(MASKS / "owner.npy", own)
    L.save_l(np.where(own >= 0, own + 1, 0).astype(np.float32) / 255.0 * 255 / 255, MASKS / "owner-index.png")
    overlay(plate, own, {i: LAYER_COLOURS[n] for i, n in enumerate(Z)}, MASKS / "owner-overlay.png", alpha=0.5)
    counts = {n: int((own == i).sum()) for i, n in enumerate(Z)}
    L.write_json({"z": Z, "pixels": counts, "eyes": meta,
                  "method": "classes = geodesic from frontal.seeds.json; hair split by frontal.layers.json polygons + geodesic inside the hair; iris = ellipse fit to the non-sclera window pixels; lids = ring around the window; ink within inkReach px of an upper layer joins it."},
                 MASKS / "owners.json")
    print(counts)


def cmd_silhouette(_args):
    import io
    import os
    os.environ.setdefault("U2NET_HOME", r"D:\Tools\ComfyUI\rembg-models")
    from rembg import new_session, remove
    plate = L.load_rgba(L.PLATE)
    grey = np.full(plate.shape[:2] + (3,), 128, np.float32)
    a = plate[..., 3:4] / 255.0
    comp = plate[..., :3] * a + grey * (1 - a)
    buf = io.BytesIO(); Image.fromarray(comp.astype(np.uint8)).save(buf, "PNG")
    out = Image.open(io.BytesIO(remove(buf.getvalue(), session=new_session("isnet-anime")))).convert("RGBA")
    m = np.asarray(out)[..., 3] > 127
    p = plate[..., 3] > 0
    iou = float((m & p).sum() / max(1, (m | p).sum()))
    L.save_l(m.astype(np.float32), MASKS / "silhouette-isnet.png")
    L.write_json({"model": "isnet-anime (rembg, local weights D:/Tools/ComfyUI/rembg-models)",
                  "input": "plate composited over mid grey", "iouWithPlateAlpha": round(iou, 4),
                  "plateAlphaBinary": bool(np.isin(plate[..., 3], [0, 255]).all()),
                  "used": "plate alpha (exact rest composite needs the plate's own edge); isnet mask kept as the provenance check"},
                 MASKS / "silhouette.json")
    print("iou", iou)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("classes"); sub.add_parser("owners"); sub.add_parser("silhouette")
    a = ap.parse_args()
    {"classes": cmd_classes, "owners": cmd_owners, "silhouette": cmd_silhouette}[a.cmd](a)


if __name__ == "__main__":
    main()
