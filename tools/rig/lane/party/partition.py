"""partition.py <config name> [pose,pose..] : split every pose painting among the party parts, one mask a part (what `rig.py variants` cuts the format-v2 pieces through).

For each pose: the painting is drawn into the idle's master frame (+ `pad` px of margin), its keypoints are mapped through the same registration, the figure is partitioned by capsule distance and a watershed on the
painting's ink lines (pcommon.partition), every part's label is dilated `underlap` px (1x) into its neighbours and written to <work>/masks/<pose>.<part>.png (8-bit, the frame with `pad` margin). Also
<work>/masks/<pose>.labels.png, a colour picture of the partition, for looking. A part the pose does not show gets no mask (its key hides it).
"""
from __future__ import annotations

import colorsys
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

import pcommon as P  # noqa: E402
from fxmask import fx_mask  # noqa: E402
from retarget import solve_pose  # noqa: E402


def run(name: str, only: list[str] | None = None) -> None:
    party = P.load(name)
    pp = party.party
    S = party.S
    T = party.targets()
    build = P.read_json(party.work / "build" / "build.json")
    size = (build["image"]["w"], build["image"]["h"])
    pad = int(pp.get("pad", 600))
    K = int(float(pp.get("underlap", 8)) * S)
    out = party.work / "masks"
    out.mkdir(parents=True, exist_ok=True)
    n = len(party.order)
    cols = [tuple(int(255 * c) for c in colorsys.hsv_to_rgb(i / n, 0.8, 1.0)) for i in range(n)]
    for pose in party.poses:
        if only and pose not in only:
            continue
        for old in out.glob(f"{pose}.*.png"):
            old.unlink()
        img = P.painting_in_master(party, pose, T, pad, size)
        rgba = np.asarray(img)
        pts = {k: (x + pad, y + pad) for k, (x, y) in party.points(pose, T).items()}
        fx = fx_mask(party, pose, T, rgba, pad) if "fx" in party.order else None  # the painted-in effects (a ring, a swirl): their own root-bound part
        seeds = {"fx": fx.astype(np.uint8)} if fx is not None and fx.any() else None
        labels, present = P.partition(rgba, pts, party.parts, party.order, S, margin=float(pp.get("margin", 15)) * S, seeds=seeds)
        fxm = (labels == party.order.index("fx")) if seeds else None
        vis = np.zeros(labels.shape + (3,), np.uint8)
        alpha = rgba[..., 3] > 8
        masks = {}
        for i, part in enumerate(party.order):
            m = labels == i
            vis[m] = cols[i]
            if present[part]:
                masks[part] = (m & alpha) if part == "fx" else P.dilate_mask(m, K) & alpha
                if fxm is not None and part != "fx":
                    masks[part] = masks[part] & ~fxm  # no underlap into the effect: a body piece carries none of it
        jm, _moved = P.marks_for(party, pose, T, size)
        _bones, _rep, jpos = solve_pose(party, party.rest_points(), jm, P.rest_joints(party))
        P.add_joint_discs(party, masks, {b: (x + pad, y + pad) for b, (x, y) in jpos.items()}, alpha)
        for i, part in enumerate(party.order):
            if not present[part]:
                continue
            md = masks[part]
            if int(md.sum()) < 400:  # nothing of the part in this painting (it is behind another, or the capsule sat on nothing): the key hides it
                present[part] = False
                continue
            Image.fromarray((md * 255).astype(np.uint8)).save(out / f"{pose}.{part}.png", optimize=True)
        ys, xs = np.nonzero(labels >= 0)
        if len(xs):
            x0, x1, y0, y1 = xs.min() - 20, xs.max() + 20, ys.min() - 20, ys.max() + 20
            base = np.asarray(Image.alpha_composite(Image.new("RGBA", img.size, P.BG + (255,)), img).convert("RGB")).astype(np.float32)
            mix = np.where((labels >= 0)[..., None], base * 0.5 + vis.astype(np.float32) * 0.5, base).astype(np.uint8)
            Image.fromarray(mix[max(0, y0):y1, max(0, x0):x1]).save(out / f"{pose}.labels.png")
        print(f"partition: {pose:9s} parts {', '.join(p for p in party.order if present[p])}")


if __name__ == "__main__":
    run(sys.argv[1], sys.argv[2].split(",") if len(sys.argv) > 2 else None)
