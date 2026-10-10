"""The HUD's text contrast over the room (the experimental Leblanc room's look, branch `exp-leblanc`; FFX-2 only).

    python tools/exp-art/hud-contrast.py --run "before=DIR/before" --run "after=DIR/after" [--md out.md]

`tools/exp-look.mjs hud --tag NAME` writes `NAME-hud-boxes.json` (every visible text element of the menu: its text, colour, font size and box) and
`NAME-hud-textless.png` (the same frame with every glyph made transparent, so the pixels of an element's box are the panel and the room behind its text). For each
element the table takes the median colour of its box as the background, composites a translucent text colour over it, and gives the WCAG contrast ratio of the two:
(L1 + 0.05) / (L2 + 0.05). The summary is what a review reads: how many elements fall under 4.5 (3 for text of 24 px, or 18.7 px and bold, and up), the lowest ratio
and the median.
"""

from __future__ import annotations

import argparse
import json
import re
import sys

import numpy as np
from PIL import Image


def lin(c: float) -> float:
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(rgb) -> float:
    return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])


def parse_color(s: str):
    m = re.match(r"rgba?\(([^)]*)\)", s)
    if not m:
        return None
    parts = [p.strip() for p in m.group(1).replace("/", ",").split(",")]
    vals = [float(p.rstrip("%")) for p in parts if p]
    if len(vals) < 3:
        return None
    a = vals[3] if len(vals) > 3 else 1.0
    return vals[0], vals[1], vals[2], a


def analyse(prefix: str) -> dict:
    boxes = json.load(open(prefix + "-hud-boxes.json", encoding="utf-8"))
    img = np.asarray(Image.open(prefix + "-hud-textless.png").convert("RGB"))
    H, W, _ = img.shape
    rows = []
    for b in boxes:
        col = parse_color(b["color"])
        if col is None or col[3] < 0.15:
            continue
        x0, y0 = max(0, b["x"]), max(0, b["y"])
        x1, y1 = min(W, b["x"] + b["w"]), min(H, b["y"] + b["h"])
        if x1 - x0 < 4 or y1 - y0 < 4:
            continue
        bg = np.median(img[y0:y1, x0:x1].reshape(-1, 3), axis=0)
        fg = np.array(col[:3]) * col[3] + bg * (1 - col[3])
        l1, l2 = lum(fg), lum(bg)
        ratio = (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)
        large = b["size"] >= 24 or (b["size"] >= 18.66 and str(b["weight"]) in ("700", "800", "900", "bold"))
        rows.append({"text": b["text"], "cls": b["cls"], "size": b["size"], "ratio": float(ratio), "large": large, "bg": [int(v) for v in bg], "fg": [int(v) for v in fg]})
    return {"rows": rows}


def summarise(res: dict) -> dict:
    r = res["rows"]
    ratios = np.array([x["ratio"] for x in r])
    need = np.array([3.0 if x["large"] else 4.5 for x in r])
    return {
        "count": len(r),
        "below": int((ratios < need).sum()),
        "min": float(ratios.min()),
        "p5": float(np.percentile(ratios, 5)),
        "median": float(np.median(ratios)),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", action="append", required=True, help='"label=PREFIX" (PREFIX-hud-boxes.json and PREFIX-hud-textless.png)')
    ap.add_argument("--worst", type=int, default=8)
    ap.add_argument("--md")
    args = ap.parse_args()
    out = ["| run | text elements | under their threshold (4.5, or 3 for large text) | lowest ratio | 5th percentile | median |", "|---|---|---|---|---|---|"]
    details = []
    for spec in args.run:
        label, _, prefix = spec.partition("=")
        res = analyse(prefix)
        s = summarise(res)
        out.append(f"| {label} | {s['count']} | {s['below']} | {s['min']:.2f} | {s['p5']:.2f} | {s['median']:.2f} |")
        worst = sorted(res["rows"], key=lambda x: x["ratio"])[: args.worst]
        details.append(f"\n{label}: the {len(worst)} lowest\n")
        details.append("| text | element | size px | ratio | text colour | background |")
        details.append("|---|---|---|---|---|---|")
        for w in worst:
            details.append(f"| {w['text'][:28]} | {w['cls'][:34]} | {w['size']:.0f} | {w['ratio']:.2f} | {tuple(w['fg'])} | {tuple(w['bg'])} |")
    text = "\n".join(out + details)
    print(text)
    if args.md:
        with open(args.md, "w", encoding="utf-8") as f:
            f.write(text + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
