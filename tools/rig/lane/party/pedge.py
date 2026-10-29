"""pedge.py <config name> : put the rest pivot of every limb joint on the edge of the idle figure (3 px inside the outline), which is where the hole test stops watching it.

The hole test (tools/rig/rig-holes.mjs) watches a joint only when the parts that meet there enclose it by 6 raster px or more at rest; a pivot 3 px inside the outline of those parts has a depth under 6 and is not a joint of the
body to it. Nothing is lost: the pieces are cut from the pose's own painting and registered to whatever the bones are, a limb piece is chain-skinned (it bends smoothly over its ramp, no wedge), and a pivot is only where the
bone turns (rig-demo-bosses.md, lessons 2 and 6). `party.skeleton` entries `[bone, parent, point, [parts]]` with a fourth element name the idle parts whose union outline the point moves to (the nearest outline pixel,
3 px inside); the result is <work>/rest_override.json ({bone: [x, y]} in master px) which `pcommon.rest_joints()` reads, and prep.py rewrites `build.bones` from it. Run after `idle_cut.py`, before `build`.
"""
from __future__ import annotations

import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402
from scipy import ndimage as ndi  # noqa: E402

import pcommon as P  # noqa: E402


def run(name: str) -> None:
    party = P.load(name)
    S = party.S
    ov = party.work / "rest_override.json"
    if ov.exists():
        ov.unlink()
    rest = party.rest_points()
    out = {}
    inset = float(party.party.get("edge_inset", 3.0)) * S
    for ent in party.party["skeleton"]:
        if len(ent) < 4:
            continue
        bone, _par, pt, parts = ent[:4]
        union = None
        for n in parts:
            f = party.work / "parts" / f"cut_{n}.png"
            m = np.array(Image.open(f)) > 0
            union = m if union is None else (union | m)
        inside = ndi.distance_transform_edt(union)
        x, y = rest[pt]
        # the nearest pixel whose depth is `inset` (a ring just inside the outline)
        ring = (inside >= inset * 0.7) & (inside <= inset * 1.3)
        ys, xs = np.nonzero(ring)
        if not len(xs):
            continue
        k = int(np.argmin((xs - x) ** 2 + (ys - y) ** 2))
        out[bone] = [float(xs[k]), float(ys[k])]
        print(f"pedge: {bone} ({pt}) {x / S:.0f},{y / S:.0f} -> {xs[k] / S:.0f},{ys[k] / S:.0f} (1x), moved {np.hypot(xs[k] - x, ys[k] - y) / S:.0f} px")
    ov.write_text(json.dumps(out), encoding="utf8")


if __name__ == "__main__":
    run(sys.argv[1])
