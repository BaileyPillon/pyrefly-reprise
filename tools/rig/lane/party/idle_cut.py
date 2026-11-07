"""idle_cut.py <config name> : cut the idle painting into the party parts (what `rig.py cut` does for a hand-drawn recipe, here from the idle's keypoints), into <work>/parts/ where `rig.py build` reads them.

Writes part_<n>.png (RGBA on the master canvas), cut_<n>.png (mask), rest_composite.png, rest_diff.png, labels_overlay.png, cut.json. A part the idle does not show (a far arm behind the body) gets a 10 px stub of
the colours next to its rest joint (hidden under the front parts) so the build has something to skin; its variants carry the real pixels. Every part is dilated `underlap_idle` px (1x) into its neighbours.
"""
from __future__ import annotations

import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import pcommon as P  # noqa: E402


def run(name: str) -> None:
    party = P.load(name)
    S = party.S
    pp = party.party
    src = np.array(Image.open(party.chars / f"idle@{S}x.png").convert("RGBA"))
    H, W = src.shape[:2]
    rgba = P.R.defringe_alpha(src)
    pts = party.points("idle", hidden=party.idle_hidden())
    labels, present = P.partition(rgba, pts, party.parts, party.order, S, margin=float(pp.get("margin", 15)) * S)
    K = int(float(pp.get("underlap_idle", 5)) * S)
    out = party.work / "parts"
    out.mkdir(parents=True, exist_ok=True)
    alpha = rgba[..., 3] > 24
    cuts, full = {}, {}
    idle_masks = {n: P.dilate_mask(labels == i, K) & alpha for i, n in enumerate(party.order) if (labels == i).any()}
    if "--no-discs" not in sys.argv:
        P.add_joint_discs(party, idle_masks, P.rest_joints(party), alpha)
    for i, n in enumerate(party.order):
        m = idle_masks.get(n, np.zeros((H, W), bool))
        if not m.any():  # a part the idle does not draw: a stub (hidden under the front parts) at its rest joint
            rj = party.rest_points()
            stub = pp["parts"][n].get("stub", "pelvis")
            at = (stub[0] * S, stub[1] * S) if isinstance(stub, list) else rj[stub]
            cx, cy = int(at[0]), int(at[1])
            m = np.zeros((H, W), bool)
            m[cy - 5:cy + 5, cx - 5:cx + 5] = True
            m &= alpha | True
            im = np.zeros((H, W, 4), np.uint8)
            im[..., :3] = rgba[..., :3]
            near = rgba[max(0, cy - 40):cy + 40, max(0, cx - 40):cx + 40]
            col = near[near[..., 3] > 200][:, :3]
            colour = col.mean(0).astype(np.uint8) if len(col) else np.array([60, 60, 70], np.uint8)
            im[m, :3] = colour
            im[m, 3] = 255
            print(f"idle_cut: {n}: not drawn in the idle: a 10 px stub at {at[0] / S:.0f}, {at[1] / S:.0f} (1x)")
        else:
            im = np.zeros((H, W, 4), np.uint8)
            im[..., :3] = rgba[..., :3]
            im[..., 3] = np.where(m, rgba[..., 3], 0)
        cuts[n] = m
        full[n] = im
        P.R.save_rgba(im, out / f"part_{n}.png")
        P.R.save_mask(m, out / f"cut_{n}.png")
    comp = np.zeros((H, W, 4), np.float32)
    for n in party.order:
        p = full[n].astype(np.float32)
        a = p[..., 3:4] / 255.0
        comp[..., :3] = comp[..., :3] * (1 - a) + p[..., :3] * a
        comp[..., 3:4] = comp[..., 3:4] * (1 - a) + 255.0 * a
    comp8 = comp.clip(0, 255).astype(np.uint8)
    P.R.save_rgba(comp8, out / "rest_composite.png")
    bg = np.array(P.BG, np.int32)
    over = lambda im: (im[..., :3].astype(np.int32) * (im[..., 3:4] / 255.0) + bg * (1 - im[..., 3:4] / 255.0))  # noqa: E731
    diff = np.abs(over(comp8) - over(rgba)).sum(-1)
    d30, d90 = int((diff > 30).sum()), int((diff > 90).sum())
    cols = [(255, 80, 80), (80, 200, 255), (255, 220, 60), (200, 120, 255), (90, 255, 120), (255, 150, 60), (255, 100, 220), (220, 220, 220), (120, 255, 255), (170, 170, 255)]
    base = Image.new("RGBA", (W, H), P.BG + (255,))
    base.alpha_composite(Image.fromarray(src, "RGBA"))
    ov = np.array(base.convert("RGB")).astype(np.float32)
    for i, n in enumerate(party.order):
        ov[labels == i] = ov[labels == i] * 0.45 + np.array(cols[i % len(cols)], np.float32) * 0.55
    im = Image.fromarray(ov.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    for n in party.order:
        ys, xs = np.nonzero(labels == party.order.index(n))
        if len(xs):
            d.text((float(xs.mean()) - 20, float(ys.mean())), n, fill=(0, 0, 0))
    im.resize((W // 2, H // 2), Image.LANCZOS).save(out / "labels_overlay.png")
    P.write_json(out / "cut.json", {"order": party.order, "areas": {n: int(cuts[n].sum()) for n in party.order}, "rest_diff_over_30": d30, "rest_diff_over_90": d90, "opaque": int(alpha.sum()), "size": [W, H], "scale": S}, indent=1)
    print(f"idle_cut: {len(party.order)} parts; the rest composite differs from the painting in {d30} px by more than 30 and {d90} by more than 90 (of {int(alpha.sum())} opaque)")
    print("  ", {n: int(cuts[n].sum()) for n in party.order})


if __name__ == "__main__":
    run(sys.argv[1])
