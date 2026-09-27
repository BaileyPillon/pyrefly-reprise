"""Sin's head, round 3 (FFX only): dress the Fahrenheit's deck on the PLATE, so the deck layer carries it and it is the
same pixels on every stage. Copied from round 2's dress.py; only the positions changed (plate p6 has no painted plate or
pseudo-letters, so nothing is washed out first).

research/ffx-evrae-airship.md 12.1: the deck plating is lettered "Salvage Dream CID" and a gold dial carries
"Wind bless you" in Al Bhed script. We paint the words in our own type (Chakra Petch, OFL, already in
public/fonts), worn like stencil paint, in perspective on the steel plates. The dial's ring carries the phrase
in the Al Bhed letter substitution written in Latin letters (FEHT PMACC OUI): the script's own glyph shapes are
a retail design and are not reproduced (rule 8).
Usage: python dress.py <in.png> <out.png>   (2352x1344, the round-3 plate p6)
"""
import sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT = 'D:/Final Fantasy/public/fonts/chakra-petch/ChakraPetch-Bold-700.woff2'


def coeffs(dst, src):
    """PIL PERSPECTIVE data mapping output points (dst quad) to input points (src quad)."""
    A, b = [], []
    for (x, y), (u, v) in zip(dst, src):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        b += [u, v]
    return np.linalg.solve(np.array(A, float), np.array(b, float)).tolist()


def text_mask(text, w, h, size, spacing=0):
    m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m)
    f = ImageFont.truetype(FONT, size)
    x0, y0, x1, y1 = d.textbbox((0, 0), text, font=f)
    tw = x1 - x0 + spacing * (len(text) - 1)
    x = (w - tw) / 2 - x0
    for ch in text:
        d.text((x, (h - (y1 - y0)) / 2 - y0), ch, font=f, fill=255)
        x += d.textlength(ch, font=f) + spacing
    return m


def paint(im, mask, col, alpha, rng, wear=0.35):
    a = np.asarray(mask, float) / 255
    n = rng.random(a.shape)
    n = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), float) / 255
    a = a * np.clip((n - wear) / (1 - wear) * 1.6, 0, 1) * alpha                     # worn stencil paint
    base = np.asarray(im, float)
    lum = base.mean(axis=2, keepdims=True) / 255
    ink = np.array(col, float) * (0.55 + 0.6 * lum)                                   # takes the deck's light
    out = base * (1 - a[..., None]) + ink * a[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def warp(mask, quad, size):
    w, h = mask.size
    return mask.transform(size, Image.PERSPECTIVE, coeffs(quad, [(0, 0), (w, 0), (w, h), (0, h)]), Image.BICUBIC)


def dress(src, dst):
    im = Image.open(src).convert('RGB')
    size = im.size
    rng = np.random.default_rng(12)
    # SALVAGE DREAM across the keel plates in the foreground, converging on the prow's tip
    m = text_mask('SALVAGE DREAM', 1400, 180, 150, 10)
    im = paint(im, warp(m, [(985, 1228), (1320, 1228), (1368, 1302), (940, 1302)], size), (236, 224, 190), 0.95, rng, 0.3)
    # CID nearer the tip, dark stencil
    m = text_mask('CID', 600, 180, 150, 30)
    im = paint(im, warp(m, [(1090, 1112), (1180, 1112), (1186, 1140), (1084, 1140)], size), (52, 48, 56), 0.85, rng, 0.2)
    # the gold dial: an engraved ring of letters, drawn on a flat disc and laid onto the painted ellipse
    disc = Image.new('L', (800, 800), 0); d = ImageDraw.Draw(disc)
    f = ImageFont.truetype(FONT, 58)
    phrase = 'FEHT PMACC OUI \u00b7 FEHT PMACC OUI \u00b7 '
    for i, ch in enumerate(phrase):
        a = -math.pi / 2 + 2 * math.pi * i / len(phrase)
        g = Image.new('L', (80, 80), 0); ImageDraw.Draw(g).text((40, 40), ch, font=f, fill=255, anchor='mm')
        g = g.rotate(-math.degrees(a) - 90, resample=Image.BICUBIC)
        disc.paste(g, (int(400 + 300 * math.cos(a) - 40), int(400 + 300 * math.sin(a) - 40)), g)
    d.ellipse([60, 60, 740, 740], outline=255, width=8); d.ellipse([220, 220, 580, 580], outline=255, width=6)
    cx, cy, rx, ry = 1730, 1255, 132, 44
    ring = Image.new('L', size, 0); ring.paste(disc.resize((2 * rx, 2 * ry), Image.LANCZOS), (cx - rx, cy - ry))
    im = paint(im, ring, (58, 34, 8), 0.95, rng, 0.1)
    im.save(dst)
    print('dressed', dst)


if __name__ == '__main__':
    dress(sys.argv[1], sys.argv[2])
