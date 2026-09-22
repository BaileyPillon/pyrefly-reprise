"""Living-portrait v3.1: the hood under the frontal tassel, for every turned yaw.

Found by the runtime pass at 1:1 (shots/crop-collar-m40.png): a yaw key
brings its own braid and drops the frontal earring layer, so the WHOLE
tassel footprint on the pinned body shows at every non-frontal yaw. v3's
hidden-region plan sized that fill for the earring's swing only (the
`earCollar` job, kept as a smooth fill), so the rest of the footprint was a
streaky push-pull: a pink block with a hard lower edge on the collar.

The body layer itself keeps the plate's pixels under the earring's soft
edge (that is what makes the rest pose exact), and those pixels hold the
tassel's own ink outline. So the fill goes into a SECOND body layer,
`body-turned.png`, covering the whole footprint (the earring's matte grown
2 px): the renderer draws it for a turned key and fades it in against the
frontal body across the frontal-to-turn blend, so the rest pose stays the
plate pixel for pixel.

    python -s tools/gen/rig-collar.py job                 # src + mask for inpaint.mjs
    node tools/gen/inpaint.mjs --latent --image <src> --mask <mask> ...   (see rig-build.sh)
    python -s tools/gen/rig-collar.py merge --pick <out>.<n>.full.png
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

JOBS = L.V3 / "jobs"
SRC = JOBS / "tassel.src.png"
MASK = JOBS / "tassel.mask.png"
REGION = JOBS / "tassel.region.png"


def layer(name):
    rig = L.read_json(L.ART / "rig.json")
    spec = next(l for l in rig["artMeta"]["v3"]["frontal"]["layers"] if l["name"] == name)
    img = L.load_rgba(L.ART / spec["file"])
    canvas = np.zeros((1216, 832, 4), np.float32)
    x, y, w, h = spec["box"]
    canvas[y:y + h, x:x + w] = img[: 1216 - y, : 832 - x]
    return canvas, spec


def region():
    ear, _ = layer("earring")
    body, _ = layer("body")
    return L.dilate(ear[..., 3] > 8, 2) & (body[..., 3] > 250)


def cmd_job(_a):
    body, _ = layer("body")
    reg = region()
    known = (body[..., 3] > 250) & ~L.dilate(reg, 2)
    rgb = L.push_pull_fill(body[..., :3], known)
    a = body[..., 3:4] / 255.0
    rgb = np.where(reg[..., None], rgb, body[..., :3] * a + 118 * (1 - a))
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(SRC)
    L.save_l(np.clip(ndi.gaussian_filter(L.dilate(reg, 4).astype(np.float32), 2), 0, 1), MASK)
    L.save_l(reg.astype(np.float32), REGION)
    print("tassel region px", int(reg.sum()))


def cmd_merge(a):
    body, spec = layer("body")
    reg = np.asarray(Image.open(REGION)) > 127
    src = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
    out = L.load_rgba(a.pick)[..., :3]
    # the diffusion pass's tone drift, measured where it should equal the source
    ring = L.dilate(reg, 12) & ~L.dilate(reg, 5) & (body[..., 3] > 250)
    drift = ndi.gaussian_filter(L.push_pull_fill(out - src, ring), (6, 6, 0))
    fixed = np.clip(out - drift, 0, 255)
    before = body.copy()
    body[reg, :3] = fixed[reg]
    # above the hood's top edge the tassel hid background, not fabric: where the
    # pass painted the grey source backdrop there, the turned body is see-through
    mx = fixed.max(-1); mn = fixed.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    lum = L.luminance(fixed)
    backdrop = reg & (sat < 0.2) & (lum > 0.25) & (lum < 0.7)
    backdrop = ndi.binary_opening(backdrop, iterations=1)
    body[backdrop, 3] = 0
    x, y, w, h = spec["box"]
    path = (L.ART / spec["file"]).with_name("body-turned.png")
    L.save_rgba(body[y:y + h, x:x + w], path)
    L.write_json({"pick": L.rel(a.pick), "region": "the earring's matte (alpha > 8) grown 2 px, where the body is opaque", "to": L.rel(path),
                  "pixels": int(reg.sum()), "madeTransparent": int(backdrop.sum()), "toneDrift": "ring 5-12 px outside the region, gaussian sigma 6"},
                 JOBS / "tassel.merge.json")
    crop = (150, 700, 450, 1100)
    both = np.concatenate([L.on_magenta(before)[crop[1]:crop[3], crop[0]:crop[2]],
                           L.on_magenta(body)[crop[1]:crop[3], crop[0]:crop[2]]], 1)
    Image.fromarray(np.clip(both, 0, 255).astype(np.uint8)).save(L.V3 / "overlays/tassel-fill-check.png")
    rig = L.read_json(L.ART / "rig.json")
    rig["artMeta"]["v3"]["frontal"]["bodyTurned"] = {"file": L.rel(path).split("prototype-v2/art/")[1], "box": spec["box"],
                                                    "_readme": "rig-collar.py: the body with the tassel footprint inpainted; drawn for turned keys, faded in across a frontal-to-turn blend"}
    L.write_json(rig, L.ART / "rig.json")
    print("merged", int(reg.sum()), "px into", L.rel(path))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("job")
    m = sub.add_parser("merge"); m.add_argument("--pick", required=True)
    a = ap.parse_args()
    {"job": cmd_job, "merge": cmd_merge}[a.cmd](a)


if __name__ == "__main__":
    main()
