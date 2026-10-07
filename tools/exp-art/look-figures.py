"""Do the figures still read against the room? (the experimental Leblanc room's look, branch `exp-leblanc`; FFX-2 only)

Run with ComfyUI's embedded python (PIL, numpy and scipy):

    python tools/exp-art/look-figures.py --pair "before=WITH.png|WITHOUT.png" --pair "after=WITH2.png|WITHOUT2.png" [--md out.md]

A pair is the same frozen frame twice, the figures on the field and the figures off it (`tools/exp-look.mjs sweep`, `"plateOnly": true`). The figures are where the two
differ strongly (the soft contact shadows differ little and stay out); for each figure the table gives its own lightness (L*), the lightness of the room in a ring
just outside its silhouette in the frame without figures, and their difference: the contrast a player reads it by. The colour difference (CIE76 Delta E) of the figure's pixels from the room's mean colour beside it
is the number to watch: a figure whose mean Delta E is under about 25, or whose edge pixels (the outer three pixels of its silhouette) are mostly under 14, is one
that would blur into the floor; the table counts them.
"""

from __future__ import annotations

import argparse
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

W, H = 1600, 900


def srgb_to_lab(rgb8: np.ndarray) -> np.ndarray:
    c = rgb8.astype(np.float64) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = lin @ m.T
    t = xyz / np.array([0.95047, 1.0, 1.08883])
    d = 6 / 29
    f = np.where(t > d**3, np.cbrt(t), t / (3 * d * d) + 4 / 29)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def load(path: str) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGB").resize((W, H), Image.LANCZOS))


def measure(with_path: str, without_path: str) -> list[dict]:
    a, b = load(with_path), load(without_path)
    diff = np.abs(a.astype(int) - b.astype(int)).max(axis=2)
    mask = diff > 34
    mask[0:60, 0:200] = False  # the PAUSE tag
    mask = ndimage.binary_opening(mask, iterations=1)
    mask = ndimage.binary_closing(mask, iterations=3)
    labels, n = ndimage.label(mask)
    la, lb = srgb_to_lab(a), srgb_to_lab(b)
    rows = []
    for i in range(1, n + 1):
        comp = labels == i
        area = int(comp.sum())
        if area < 2500:
            continue
        ring = ndimage.binary_dilation(comp, iterations=14) & ~ndimage.binary_dilation(comp, iterations=4) & ~mask
        ys, xs = np.nonzero(comp)
        fig = la[comp]
        bg = lb[ring]
        dl = float(fig[:, 0].mean() - bg[:, 0].mean())
        fc = np.hypot(fig[:, 1], fig[:, 2]).mean()
        bc = np.hypot(bg[:, 1], bg[:, 2]).mean()
        # the colour distance of every figure pixel from the room's mean colour beside it, and the share of the silhouette's edge pixels that sit within 14 of it: where the edge could dissolve
        ref = bg.mean(axis=0)
        dE = np.linalg.norm(fig - ref, axis=1)
        edge = comp & ~ndimage.binary_erosion(comp, iterations=3)
        near = np.linalg.norm(la[edge] - ref, axis=1) < 14
        rows.append({
            "where": f"x {int(xs.mean() / W * 100)}%, y {int(ys.mean() / H * 100)}%",
            "area": area,
            "figL": float(fig[:, 0].mean()),
            "bgL": float(bg[:, 0].mean()),
            "dL": dl,
            "dC": float(fc - bc),
            "dE": float(dE.mean()),
            "edgeNear": float(near.mean()),
        })
    return sorted(rows, key=lambda r: r["where"])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pair", action="append", required=True, help='"label=WITH.png|WITHOUT.png"')
    ap.add_argument("--md")
    args = ap.parse_args()
    out = []
    for spec in args.pair:
        label, _, rest = spec.partition("=")
        w, _, wo = rest.partition("|")
        rows = measure(w, wo)
        out.append(f"**{label}**\n")
        out.append("| figure (centre) | figure L* | room beside it L* | difference L* | mean colour difference (Delta E) | edge pixels within 14 of the room |")
        out.append("|---|---|---|---|---|---|")
        for r in rows:
            out.append(f"| {r['where']} | {r['figL']:.0f} | {r['bgL']:.0f} | {r['dL']:+.0f} | {r['dE']:.0f} | {r['edgeNear'] * 100:.0f} % |")
        weak = sum(1 for r in rows if r["dE"] < 25 or r["edgeNear"] > 0.4)
        out.append(f"\n{len(rows)} figures found; {weak} weak (mean Delta E under 25, or over 40 percent of the edge within 14); mean Delta E {np.mean([r['dE'] for r in rows]):.0f}; mean edge share near the room {np.mean([r['edgeNear'] for r in rows]) * 100:.0f} %\n")
    text = "\n".join(out)
    print(text)
    if args.md:
        with open(args.md, "w", encoding="utf-8") as f:
            f.write(text + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
