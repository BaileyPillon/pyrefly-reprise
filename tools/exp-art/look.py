"""Measure the experimental Leblanc room's LOOK against the approved target, mockup B (branch `exp-leblanc`; FFX-2 only).

Run with any python that has PIL and numpy (ComfyUI's embedded python does):

    python tools/exp-art/look.py --target B.png --frame FRAME.jpg [--frame OTHER.jpg ...] [--json out.json] [--md out.md]

Both pictures are scaled to 1600x900 and read in CIELAB (D65, from sRGB). The regions are matched by what they are, not by pixel position (the build's camera
sees the same hall from a different place, and its plate is its own painting): the floor in front, the hall's far end (the heart door and the floor before it), the
three stained-glass windows, and the side walls with their columns and shelves. Each picture has its own rectangles for them, and its own exclusions (the six
figures and their reflections, the PAUSE tag), all in fractions of the frame, so what is measured is the room, never a costume.

Per region: mean and spread (std) of L*, a* and b*, mean chroma C*, mean HSV saturation, and the black level (the 1st and 5th percentile of L*).
The whole room (every unmasked pixel) adds the frame's darkest 0.5 percent. `--md` writes the table the review reads, with the target first.
"""

from __future__ import annotations

import argparse
import json
import sys

import numpy as np
from PIL import Image

W, H = 1600, 900

# The same hall in each picture: rectangles are (x0, y0, x1, y1) in fractions of the frame.
REGIONS = {
    "target": {
        "floor": [(0.52, 0.84, 0.98, 0.99)],
        "far end": [(0.53, 0.20, 0.585, 0.50)],
        "windows": [(0.52, 0.01, 0.60, 0.17), (0.445, 0.02, 0.485, 0.28), (0.68, 0.02, 0.715, 0.28)],
        "walls": [(0.04, 0.08, 0.40, 0.28), (0.74, 0.05, 0.99, 0.27)],
    },
    "build": {
        "floor": [(0.52, 0.84, 0.98, 0.99)],
        "far end": [(0.43, 0.20, 0.50, 0.50)],
        "windows": [(0.40, 0.00, 0.54, 0.17), (0.225, 0.00, 0.29, 0.28), (0.655, 0.00, 0.725, 0.28)],
        "walls": [(0.0, 0.08, 0.21, 0.28), (0.78, 0.08, 1.0, 0.28)],
    },
}
# What is never measured: the figures with their reflections, and the interface tag. A build frame with the figures taken off the stage (`--plate`, the harness's
# `plateOnly`) needs only the tag out.
EXCLUDE = {
    "target": [(0.0, 0.26, 0.60, 1.0), (0.585, 0.26, 0.97, 0.82)],
    "build": [(0.14, 0.46, 0.42, 0.92), (0.50, 0.44, 0.72, 0.72), (0.0, 0.0, 0.10, 0.06)],
    "plate": [(0.0, 0.0, 0.10, 0.06)],
}
ORDER = ["whole room", "floor", "far end", "windows", "walls"]


def srgb_to_lab(rgb8: np.ndarray) -> np.ndarray:
    """(n, 3) uint8 sRGB -> (n, 3) CIELAB, D65."""
    c = rgb8.astype(np.float64) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = lin @ m.T
    white = np.array([0.95047, 1.0, 1.08883])
    t = xyz / white
    d = 6 / 29
    f = np.where(t > d**3, np.cbrt(t), t / (3 * d * d) + 4 / 29)
    L = 116 * f[:, 1] - 16
    a = 500 * (f[:, 0] - f[:, 1])
    b = 200 * (f[:, 1] - f[:, 2])
    return np.stack([L, a, b], axis=1)


def box_mask(boxes: list[tuple[float, float, float, float]]) -> np.ndarray:
    m = np.zeros((H, W), dtype=bool)
    for x0, y0, x1, y1 in boxes:
        m[int(round(y0 * H)) : int(round(y1 * H)), int(round(x0 * W)) : int(round(x1 * W))] = True
    return m


def measure(path: str, kind: str) -> dict:
    """`kind` is `target`, `build` (a frame with the figures on the field) or `plate` (a build frame with the figures off it; the build's regions)."""
    im = Image.open(path).convert("RGB").resize((W, H), Image.LANCZOS)
    px = np.asarray(im)
    keep = ~box_mask(EXCLUDE[kind])
    masks = {"whole room": keep}
    for name, boxes in REGIONS["build" if kind == "plate" else kind].items():
        masks[name] = box_mask(boxes) & keep
    out = {}
    for name in ORDER:
        sel = px[masks[name]]
        lab = srgb_to_lab(sel)
        mx, mn = sel.max(axis=1).astype(np.float64), sel.min(axis=1).astype(np.float64)
        sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0.0)
        chroma = np.hypot(lab[:, 1], lab[:, 2])
        row = {
            "pixels": int(sel.shape[0]),
            "L": [float(lab[:, 0].mean()), float(lab[:, 0].std())],
            "a": [float(lab[:, 1].mean()), float(lab[:, 1].std())],
            "b": [float(lab[:, 2].mean()), float(lab[:, 2].std())],
            "C": float(chroma.mean()),
            "S": float(sat.mean()),
            "black1": float(np.percentile(lab[:, 0], 1)),
            "black5": float(np.percentile(lab[:, 0], 5)),
            "rgb": [float(v) for v in sel.mean(axis=0)],
        }
        if name == "whole room":
            row["black0_5"] = float(np.percentile(lab[:, 0], 0.5))
        out[name] = row
    return out


def fmt_row(label: str, r: dict) -> str:
    return (
        f"| {label} | {r['L'][0]:.1f} / {r['L'][1]:.1f} | {r['a'][0]:+.1f} / {r['a'][1]:.1f} | {r['b'][0]:+.1f} / {r['b'][1]:.1f} "
        f"| {r['C']:.1f} | {r['S'] * 100:.0f} % | {r['black1']:.1f} / {r['black5']:.1f} |"
    )


def table(results: list[tuple[str, dict]]) -> str:
    lines = []
    for name in ORDER:
        lines.append(f"**{name}**\n")
        lines.append("| picture | L* mean / spread | a* mean / spread | b* mean / spread | C* | HSV S | black level L* (1st / 5th pct) |")
        lines.append("|---|---|---|---|---|---|---|")
        for label, res in results:
            lines.append(fmt_row(label, res[name]))
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", required=True)
    ap.add_argument("--frame", action="append", required=True, help="a build frame; `LABEL=path` names it")
    ap.add_argument("--plate", action="store_true", help="the frames have no figures on the field (only the PAUSE tag is left out)")
    ap.add_argument("--json")
    ap.add_argument("--md")
    args = ap.parse_args()

    results = [("target (mockup B)", measure(args.target, "target"))]
    for spec in args.frame:
        label, _, path = spec.partition("=") if "=" in spec else ("build", "", spec)
        results.append((label, measure(path, "plate" if args.plate else "build")))
    md = table(results)
    print(md)
    if args.md:
        with open(args.md, "w", encoding="utf-8") as f:
            f.write(md + "\n")
    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump({label: res for label, res in results}, f, indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
