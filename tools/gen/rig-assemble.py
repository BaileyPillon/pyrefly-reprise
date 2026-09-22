"""Assemble the living-portrait v3 frontal layer set, exactly.

Inputs (all under the prototype's art/v3/): masks/owner.npy + owners.json
(rig-masks.py), masks/hidden.npz + fills/*.png (rig-fill.py), and the plate.

Rule that makes the rest pose exact: every plate pixel has ONE owner layer.
A layer is opaque on what it owns; its feather (3-6 px, per layer below)
only ever extends outward onto pixels owned by a LOWER layer, and carries
the plate's own colour there; a lower layer's hidden fill (inpainted
content) only ever sits where a HIGHER layer owns the pixel, i.e. under
alpha 255. So at rest every pixel composites to a*C + (1-a)*C = C.

  python -s tools/gen/rig-assemble.py          # layers + composite + rest-diff + magenta overlays

Writes art/v3/layers/frontal/<layer>.png (trimmed to its alpha box) +
<layer>.json (box, feather, provenance), art/rest-composite.png,
art/rest-diff.png, art/v3/layers/frontal/assembly.json, and one magenta
overlay per layer in art/v3/overlays/.
"""
from __future__ import annotations

import importlib.util
import pathlib

import numpy as np
from PIL import Image, ImageDraw

_spec = importlib.util.spec_from_file_location("riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)
from scipy import ndimage as ndi  # noqa: E402

MASKS = L.V3 / "masks"
FILLS = L.V3 / "fills"
OUT = L.V3 / "layers/frontal"
OVER = L.V3 / "overlays"
FEATHER = {"hairBack": 0, "body": 4, "headCore": 4, "irisR": 1.5, "irisL": 1.5, "eyeApertureR": 1.5,
           "eyeApertureL": 1.5, "hairFront": 4, "strand1": 6, "strand2": 6, "earring": 3}
MOTION = {"hairBack": "head", "body": "chest", "headCore": "head", "irisR": "iris", "irisL": "iris",
          "eyeApertureR": "head", "eyeApertureL": "head", "hairFront": "fringe", "strand1": "strand1",
          "strand2": "strand2", "earring": "earring"}


def smooth_ramp(d, f):
    t = np.clip(1.0 - d / (f + 1.0), 0, 1)
    return t * t * (3 - 2 * t)


def build_layers(plate, own, Z, hidden):
    fig = plate[..., 3] > 0
    rgb = plate[..., :3]
    layers = {}
    for k, n in enumerate(Z):
        mine = own == k
        a = mine.astype(np.float32)
        col = rgb.copy()
        f = FEATHER[n]
        if f > 0:
            d = ndi.distance_transform_edt(~mine)
            lower = (own >= 0) & (own < k)
            ramp = (d > 0) & (d <= f + 1) & lower
            a = np.where(ramp, np.maximum(a, smooth_ramp(d, f)), a)
        hid = hidden[n] & ~mine
        fp = FILLS / f"{n}.png"
        fill = L.load_rgba(fp) if fp.exists() else None
        if n.startswith("iris"):
            side = n[-1]
            disc = np.load(MASKS / f"disc{side}.npy")
            win = np.load(MASKS / f"window{side}.npy")
            upper = own > k
            rim = disc & ~mine & upper & ~win
            hid |= rim
            col[hid] = L.push_pull_fill(rgb, mine)[hid]
        elif n == "headCore":
            socket = np.zeros_like(mine)
            for side in ("R", "L"):
                win = np.load(MASKS / f"window{side}.npy")
                iris = np.isin(own, [Z.index("iris" + side)])
                sclera = win & mine
                s = iris & win
                col[s] = ndi.gaussian_filter(L.push_pull_fill(rgb, sclera), (1.2, 1.2, 0))[s]
                socket |= s
            hid |= socket
            if fill is not None:
                use = hid & (fill[..., 3] > 0) & ~socket
                col[use] = fill[use, :3]
        elif fill is not None:
            use = hid & (fill[..., 3] > 0)
            col[use] = fill[use, :3]
        # hairBack under the fringe's hair-over-hair band keeps the plate's own hair
        a = np.where(hid, 1.0, a)
        a = np.where(fig | hid, a, 0.0)
        # bleed colour into transparent texels so bilinear sampling never pulls black
        keep = a > 0
        if keep.any():
            col = np.where(keep[..., None], col, L.push_pull_fill(col, keep))
        layers[n] = np.dstack([col, a * 255.0])
    return layers


def trim(arr, pad=2):
    ys, xs = np.nonzero(arr[..., 3] > 0)
    x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
    x1, y1 = min(arr.shape[1], xs.max() + pad + 1), min(arr.shape[0], ys.max() + pad + 1)
    return arr[y0:y1, x0:x1], [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]


def main():
    plate = L.load_rgba(L.PLATE)
    own = np.load(MASKS / "owner.npy")
    info = L.read_json(MASKS / "owners.json")
    Z = info["z"]
    hidden = dict(np.load(MASKS / "hidden.npz"))
    layers = build_layers(plate, own, Z, hidden)
    OUT.mkdir(parents=True, exist_ok=True); OVER.mkdir(parents=True, exist_ok=True)
    meta = {}
    canvas = np.zeros(plate.shape, np.float32)
    for n in Z:
        arr = np.clip(np.rint(layers[n]), 0, 255)
        cut, box = trim(arr)
        L.save_rgba(cut, OUT / f"{n}.png")
        # recomposite from what is actually on disk (8-bit), not the floats
        back = L.load_rgba(OUT / f"{n}.png")
        L.over(canvas, back, box[0], box[1])
        side = {"layer": n, "box": box, "feather": FEATHER[n], "motion": MOTION[n], "zIndex": Z.index(n),
                "ownedPixels": int((own == Z.index(n)).sum()), "hiddenFillPixels": int(hidden[n].sum()),
                "source": L.rel(L.PLATE), "owner": L.rel(MASKS / "owner.npy"),
                "fill": L.rel(FILLS / f"{n}.png") if (FILLS / f"{n}.png").exists() else None}
        L.write_json(side, OUT / f"{n}.json")
        meta[n] = side
        full = np.zeros(plate.shape, np.float32); full[box[1]:box[1] + box[3], box[0]:box[0] + box[2]] = back
        Image.fromarray(np.clip(L.on_magenta(full), 0, 255).astype(np.uint8)).save(OVER / f"{n}.png")
    # the rest-pose proof: premultiplied colour + alpha against the plate
    pa = plate[..., 3:4] / 255.0
    ca = canvas[..., 3:4] / 255.0
    pc = np.rint(plate[..., :3] * pa)
    cc = np.rint(canvas[..., :3] * ca)
    diff = np.abs(np.concatenate([pc - cc, np.rint(plate[..., 3:4]) - np.rint(canvas[..., 3:4])], -1))
    mad = float(diff.mean()); mx = float(diff.max()); nz = int((diff.max(-1) > 0).sum())
    L.save_rgba(canvas, L.ART / "rest-composite.png")
    vis = np.clip(diff[..., :3].max(-1, keepdims=True) * 64, 0, 255).repeat(3, -1)
    img = Image.fromarray(vis.astype(np.uint8))
    ImageDraw.Draw(img).text((12, 12), f"rest composite vs plate: MAD {mad:.6f}  max {mx:.0f}  differing px {nz}  (x64)",
                             fill=(255, 255, 0))
    img.save(L.ART / "rest-diff.png")
    L.write_json({"z": Z, "layers": meta, "restDiff": {"mad": mad, "max": mx, "differingPixels": nz,
                  "compared": "premultiplied RGB and alpha of the 8-bit layer PNGs re-composited in z-order vs public/art/portraits/yuna-x2.png"}},
                 OUT / "assembly.json")
    print(f"MAD {mad} max {mx} differing {nz}")


if __name__ == "__main__":
    main()
