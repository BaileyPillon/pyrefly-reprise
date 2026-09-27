"""Finish the four FFX-2 Ixion look options as transparent cutouts (FFX-2 only; options, nothing installed).

    python docs/concepts/chapters/ixion-djose-2026-09-27/look/scripts/finish.py

Inputs (all in the candidates folder, made by render.py, tools/gen/rembg.py and
docs/concepts/chapters/fallen-aeons/production/scripts/possess_b.py):
  ixion-b-a-none.png   the FFX idle, padded (option A, pixels untouched)
  ixion-b-b-violet.png the house "Chapter IV violet" grade of the same pixels (option B)
  cut-c-7110.png       machina-fused repaint, cut out (option C)
  cut-d-7205.png       storm-fiend repaint, cut out (option D); raw-d-7205.png for hole repair
Writes opt-a.png .. opt-d.png next to them. Never deletes anything.
"""
from __future__ import annotations

import json
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

C = r"D:\Tools\pyrefly-art-backup\candidates\2026-09-27-ixion"


def p(name: str) -> str:
    return os.path.join(C, name)


def fill_holes(cut: Image.Image, raw: Image.Image, crop: list[int]) -> Image.Image:
    """Restore enclosed transparent pockets (rembg ate a highlight) from the raw render's pixels."""
    a = np.asarray(cut.getchannel("A")) > 40
    mask = Image.fromarray(((~a) * 255).astype(np.uint8)).copy()  # a writable copy: floodfill ignores the shared buffer
    ImageDraw.floodfill(mask, (0, 0), 128)  # outside = 128; enclosed holes stay 255
    holes = np.asarray(mask) == 255
    rawc = np.asarray(raw.convert("RGB").crop(tuple(crop))).astype(np.uint8)
    holes &= rawc.min(-1) < 215  # a near-white pocket is real background seen between the legs: keep it clear
    out = np.asarray(cut).copy()
    out[holes, :3] = rawc[holes]
    out[holes, 3] = 255
    print("holes filled", int(holes.sum()))
    return Image.fromarray(out, "RGBA")


def bolt(d: ImageDraw.ImageDraw, a, b, rnd: random.Random, width: int, color) -> None:
    pts = [a]
    n = 9
    for i in range(1, n):
        t = i / n
        x = a[0] + (b[0] - a[0]) * t + rnd.uniform(-18, 18)
        y = a[1] + (b[1] - a[1]) * t + rnd.uniform(-18, 18)
        pts.append((x, y))
    pts.append(b)
    d.line(pts, fill=color, width=width, joint="curve")


def storm(im: Image.Image, seed: int = 11) -> Image.Image:
    """House FX for option D: pale arcs over the body (arc colour #B8E4FF, visual-bible 1) and pyrefly motes."""
    rnd = random.Random(seed)
    pad = 60
    W, H = im.width + 2 * pad, im.height + 2 * pad
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base.alpha_composite(im, (pad, pad))
    A = np.asarray(base.getchannel("A")) > 200
    ys, xs = np.nonzero(A)
    pick = lambda: (int(xs[k := rnd.randrange(len(xs))]), int(ys[k]))  # noqa: E731
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    core = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dg, dc = ImageDraw.Draw(glow), ImageDraw.Draw(core)
    for _ in range(7):
        a = pick()
        ang = rnd.uniform(0, math.tau)
        ln = rnd.uniform(90, 200)
        b = (a[0] + math.cos(ang) * ln, a[1] + math.sin(ang) * ln * 0.6)
        s = rnd.randrange(1 << 30)
        bolt(dg, a, b, random.Random(s), 12, (140, 200, 255, 200))
        bolt(dc, a, b, random.Random(s), 3, (235, 248, 255, 255))
    # the horn: a short crackle at its base and tip (thunder aeon)
    tip = min(zip(ys, xs))  # topmost opaque pixel = horn tip
    t = (int(tip[1]), int(tip[0]))
    for k in range(3):
        s = rnd.randrange(1 << 30)
        b = (t[0] + rnd.uniform(-60, 60), t[1] + rnd.uniform(-40, 50))
        bolt(dg, t, b, random.Random(s), 10, (140, 200, 255, 190))
        bolt(dc, t, b, random.Random(s), 2, (240, 250, 255, 255))
    glow = glow.filter(ImageFilter.GaussianBlur(7))
    out = Image.alpha_composite(base, glow)
    out = Image.alpha_composite(out, core)
    # pyrefly motes drifting off the body: soft, multi-hued, low alpha
    motes = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dm = ImageDraw.Draw(motes)
    hues = [(190, 230, 255), (220, 200, 255), (200, 255, 230), (255, 240, 200)]
    for _ in range(16):
        x, y = pick()
        x += rnd.uniform(-80, 80)
        y -= rnd.uniform(20, 160)
        r = rnd.uniform(4, 9)
        dm.ellipse((x - r, y - r, x + r, y + r), fill=rnd.choice(hues) + (190,))
    motes = motes.filter(ImageFilter.GaussianBlur(2.5))
    return Image.alpha_composite(out, motes)


def main() -> None:
    a = Image.open(p("ixion-b-a-none.png")).convert("RGBA")
    b = Image.open(p("ixion-b-b-violet.png")).convert("RGBA")
    c = Image.open(p("cut-c-7110.png")).convert("RGBA")
    d = Image.open(p("cut-d-7205.png")).convert("RGBA")
    d = fill_holes(d, Image.open(p("raw-d-7205.png")), [21, 27, 1195, 819])
    d = storm(d)
    for key, im in zip("abcd", (a, b, c, d)):
        bbox = im.getchannel("A").point(lambda v: 255 if v > 90 else 0).getbbox()
        im.save(p(f"opt-{key}.png"))
        print(key, im.size, "content", bbox)
    with open(p("opt-provenance.json"), "w") as f:
        json.dump({
            "game": "FFX-2 only", "status": "CANDIDATES, options only, nothing installed",
            "a": "public/art/characters/ixion/idle.png (FFX, shipped by D-089), padded 70 px, pixels untouched",
            "b": "same pixels, possess_b.py 'Chapter IV violet' grade (house style, not canon: F-12)",
            "c": "raw-c-7110.png (render.py option c, img2img 0.76 + IP-Adapter 0.30 on the FFX idle), rembg cutout",
            "d": "raw-d-7205.png (render.py option d, darkened init, img2img 0.58 + IP-Adapter 0.40), rembg cutout, "
                 "enclosed holes restored from the raw, finish.py storm arcs (#B8E4FF family) and pyrefly motes",
        }, f, indent=2)


if __name__ == "__main__":
    main()
