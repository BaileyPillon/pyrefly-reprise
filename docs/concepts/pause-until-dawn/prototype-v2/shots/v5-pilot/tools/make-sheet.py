"""Living portrait v5 pilot (game case: both): sheet.jpg = frames every 2 degrees, head crops at 1:1, the head-only
swap metric (sweep-metric.py) for the pilot and for the v4.1 keys under the same hard cut, and the hole maps.

    python make-sheet.py <pilot sweep dir> <v41cut sweep dir> <work> <out.jpg> [title]
"""
import json
import pathlib
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT = "C:/Windows/Fonts/segoeui.ttf"
BOLD = "C:/Windows/Fonts/segoeuib.ttf"
BG = (14, 12, 10)
INK = (233, 220, 184)
DIM = (150, 140, 120)
PILOT = (242, 193, 78)
BASE = (120, 170, 230)
CUT = (230, 90, 90)
CROP = (200, 250, 680, 770)  # head crop at 1:1: 480 x 520


def font(sz, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, sz)


def frame(sweep, deg):
    log = json.loads((sweep / "log.json").read_text())
    rows = [r for r in log if r["target"] == deg]
    r = next((r for r in rows if r["dir"] == "up"), rows[0])
    return Image.open(sweep / r["file"]).convert("RGB"), r


def chart(met_p, met_b, w, h, rng=20):
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    pad_l, pad_b, pad_t = 70, 50, 40
    ymax = 40.0
    X = lambda v: pad_l + (v + rng) / (2 * rng) * (w - pad_l - 20)
    Y = lambda v: h - pad_b - min(v, ymax) / ymax * (h - pad_b - pad_t)
    for v in range(0, 41, 10):
        d.line([(pad_l, Y(v)), (w - 20, Y(v))], fill=(40, 36, 30))
        d.text((10, Y(v) - 10), f"{v}", fill=DIM, font=font(16))
    for v in range(-rng, rng + 1, 5):
        d.text((X(v) - 12, h - pad_b + 8), f"{v:+d}" if v else "0", fill=DIM, font=font(16))
    d.text((pad_l, 6), "head-box MAD of each 1-degree step (sweep up, frozen clock, no sway) - cut steps ringed red", fill=INK, font=font(18))
    for met, col in ((met_b, BASE), (met_p, PILOT)):
        steps = [s for s in met["dirs"]["up"]["steps"] if abs(s["a"]) <= rng and abs(s["b"]) <= rng]
        pts = [(X((s["a"] + s["b"]) / 2), Y(s["head"])) for s in steps]
        d.line(pts, fill=col, width=3)
        for s, p in zip(steps, pts):
            r = 7 if s["cut"] else 3
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], outline=CUT if s["cut"] else col, width=3 if s["cut"] else 1, fill=None if s["cut"] else col)
    d.text((w - 520, 40), "pilot (keys grown every 10 deg, hard cut)", fill=PILOT, font=font(17, True))
    d.text((w - 520, 64), "v4.1 keys, same hard cut ((b) alone, step 0)", fill=BASE, font=font(17, True))
    return im


def table(met_p, met_b, w, rng=20):
    lines = []
    for name, met in (("PILOT", met_p), ("v4.1 keys, cut", met_b)):
        for dname in ("up", "down"):
            dd = met["dirs"][dname]
            cuts = [c for c in dd["cuts"] if abs(c["a"]) <= rng]
            txt = "   ".join(f"{c['a']:+d}>{c['b']:+d} S {c['S']:.2f} (face {c['Sface']:.2f}, block {c['Sblock']:.2f})" for c in cuts)
            lines.append((f"{name} {dname}: median step {dd['medianHead']:.1f}, two paintings in {dd['mixedFrames']}/{dd['frames']} frames", txt))
    im = Image.new("RGB", (w, 40 + 58 * len(lines)), BG)
    d = ImageDraw.Draw(im)
    d.text((20, 6), "S = head-box step at the cut / median head-box step on that side (keep <= 1.5, kill > 2.0)", fill=INK, font=font(20, True))
    for i, (a, b) in enumerate(lines):
        d.text((20, 40 + 58 * i), a, fill=PILOT if "PILOT" in a else BASE, font=font(18, True))
        d.text((40, 62 + 58 * i), b, fill=INK, font=font(17))
    return im


def main():
    sweep, base, work, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3]), sys.argv[4]
    title = sys.argv[5] if len(sys.argv) > 5 else "Living portrait v5 pilot"
    met_p = json.loads((sweep / "metric.json").read_text())
    met_b = json.loads((base / "metric.json").read_text())
    degs = list(range(-20, 21, 2))
    thumbs, crops = [], []
    for deg in degs:
        im, r = frame(sweep, deg)
        t = im.resize((158, 231), Image.LANCZOS)
        thumbs.append((t, deg, r["paint"]["to"]))
        crops.append((im.crop(CROP), deg, r["paint"]["to"]))
    W = 7 * 480 + 8 * 12
    parts = []
    head = Image.new("RGB", (W, 120), BG)
    d = ImageDraw.Draw(head)
    d.text((20, 10), title, fill=INK, font=font(40, True))
    d.text((20, 66), "Yuna X-2 plate, -20..+20; keys grown out of the plate every 10 degrees; one painting at every frame (hard cut at each bracket's middle + 3 deg hysteresis). ?post=0, reduced motion, frozen clock.", fill=DIM, font=font(20))
    parts.append(head)
    strip = Image.new("RGB", (W, 231 + 60), BG)
    d = ImageDraw.Draw(strip)
    x = 12
    for t, deg, p in thumbs:
        strip.paste(t, (x, 8))
        d.text((x + 4, 242), f"{deg:+d}" if deg else "0", fill=INK, font=font(18, True))
        d.text((x + 50, 245), p.replace("frontal", "plate"), fill=DIM, font=font(14))
        x += 158 + 6
    parts.append(strip)
    grid = Image.new("RGB", (W, 3 * (520 + 44) + 12), BG)
    d = ImageDraw.Draw(grid)
    for i, (c, deg, p) in enumerate(crops):
        gx, gy = 12 + (i % 7) * 492, 12 + (i // 7) * 564
        grid.paste(c, (gx, gy))
        d.text((gx + 4, gy + 522), f"{deg:+d} deg  paint: {p.replace('frontal', 'plate')}  (1:1)", fill=INK, font=font(18, True))
    parts.append(grid)
    parts.append(chart(met_p, met_b, W, 420))
    parts.append(table(met_p, met_b, W))
    holes = []
    for k in ("v5-l20", "v5-l10", "v5-r10", "v5-r20"):
        p = work / "keys" / k / "holes.png"
        pj = work / "keys" / k / "propagate.json"
        if p.exists():
            info = json.loads(pj.read_text())
            holes.append((Image.open(p).convert("RGB").resize((416, 608), Image.LANCZOS), k, info))
    if holes:
        hs = Image.new("RGB", (W, 608 + 70), BG)
        d = ImageDraw.Draw(hs)
        d.text((20, 6), "What the push could not carry (magenta = repainted by the LoRA before growing; mask grown 8 px + feathered)", fill=INK, font=font(20, True))
        for i, (im, k, info) in enumerate(holes):
            hs.paste(im, (20 + i * 440, 40))
            d.text((20 + i * 440, 650), f"{k}: holes {info['holeShare'] * 100:.1f}% of the head", fill=INK, font=font(17))
        parts.append(hs)
    sheet = Image.new("RGB", (W, sum(p.height for p in parts)), BG)
    y = 0
    for p in parts:
        sheet.paste(p, (0, y))
        y += p.height
    sheet.save(out, quality=84, optimize=True)
    print(out, sheet.size)


if __name__ == "__main__":
    main()
