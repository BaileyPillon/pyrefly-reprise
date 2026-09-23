"""Living-portrait v3.3: fill every layer's holes that sit under a FULLY opaque
upper layer drawn through the same mesh.

Why: the v3.2 check still showed a thin grey outline under the eye at -20
degrees (and faint lines along other layer edges). At rest the stack is the
plate to the pixel, but under the mesh warp each layer is resampled on its
own; where an upper layer's edge sits exactly over a hole in the layer below
(headCore was transparent under the eye apertures), the two resampled
coverages do not add to 1 and the backdrop leaks through a 1-px line (the
"conflation" artefact of two complementary anti-aliased edges). A layer that
is opaque under everything drawn over it cannot leak.

Only pixels where the layers above composite to alpha 255 are filled, so the
rest pose is unchanged to the bit; the fill colour is a smooth push-pull of the
layer's own opaque pixels (skin under the eyes, hair under the fringe), which
is also what shows if a moving part (fringe lift, iris) ever uncovers it.

    python -s tools/gen/rig-underfill.py        # after rig-turns / rig-braid (idempotent)
"""
from __future__ import annotations

import importlib.util
import pathlib

import numpy as np

_spec = importlib.util.spec_from_file_location("riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)

Y0 = 64  # canvas margins: turn layers reach x -162 .. 1152, and rig-margins.py adds up to 64 px past each border
X0 = 400
H = 1216 + 2 * Y0
W = 832 + 2 * X0

# frontal layers drawn through the head mesh, bottom to top (the body, strands
# and earring ride other meshes/offsets and have their own hidden fills)
HEAD_CHAIN = ["hairBack", "headCore", "eyeApertureR", "eyeApertureL", "hairFront"]  # irises move under the apertures: never filled, never counted
# only these get filled: their own colour (hair, skin) is right if a lifted fringe
# ever shows it; an aperture's push-pull (lash and sclera tones) would not be
FILLED = {"hairBack", "headCore"}


def placed(meta):
    img = L.load_rgba(L.ART / meta["file"]).astype(np.float32)
    c = np.zeros((H, W, 4), np.float32)
    x, y = int(meta["box"][0]) + X0, int(meta["box"][1]) + Y0
    h, w = img.shape[:2]
    c[y:y + h, x:x + w] = img
    return c, img


def fill_under(meta, upper_alpha):
    """Fill `meta`'s layer where it is not opaque but the layers above are; returns pixels filled."""
    c, img = placed(meta)
    x, y = int(meta["box"][0]) + X0, int(meta["box"][1]) + Y0
    h, w = img.shape[:2]
    up = upper_alpha[y:y + h, x:x + w]
    hole = (img[..., 3] < 255) & (up >= 254.5)
    if not hole.any():
        return 0
    known = img[..., 3] >= 255
    if not known.any():
        return 0
    rgb = L.push_pull_fill(img[..., :3], known)
    img[hole, :3] = rgb[hole]
    img[hole, 3] = 255
    L.save_rgba(img, L.ART / meta["file"])
    return int(hole.sum())


def over_alpha(acc, meta):
    c, _ = placed(meta)
    a = c[..., 3] / 255.0
    return 255.0 * (1 - (1 - acc / 255.0) * (1 - a))


def main():
    rig = L.read_json(L.ART / "rig.json")
    v3 = rig["artMeta"]["v3"]
    by_name = {l["name"]: l for l in v3["frontal"]["layers"]}
    report = {}
    chain = [by_name[n] for n in HEAD_CHAIN if n in by_name]
    for i, meta in enumerate(chain[:-1]):
        if meta["name"] not in FILLED:
            continue
        up = np.zeros((H, W), np.float32)
        for m in chain[i + 1:]:
            up = over_alpha(up, m)
        report[meta["name"]] = fill_under(meta, up)
    for kid, k in v3["keys"].items():
        if kid not in {r["id"] for r in rig["keys"]}:
            continue  # retired keys are not drawn
        up = over_alpha(np.zeros((H, W), np.float32), k["front"])
        report[f"{kid}.back"] = fill_under(k["back"], up)
    print(report)


if __name__ == "__main__":
    main()
