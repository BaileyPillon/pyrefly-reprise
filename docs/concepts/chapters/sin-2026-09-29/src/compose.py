"""Sin art options, 2026-09-29 (FFX only): the frame backgrounds (1600x900 JPEG) from the picked paintings, with the
light states the engine would add over one painting (no new pixels are painted here):

  deck     round 3's dressed deck layer (L4-deck: "SALVAGE DREAM", "CID", the dial ring, our own type) laid back over
           the painting, so every Sin frame stands on the same deck, pixel for pixel
  near     NEAR shades the deck under the creature's bulk; FAR leaves the whole deck lit (research/ffx-evrae-airship.md
           12.3: "At NEAR ... the deck shadowed by its bulk ... At FAR ... the whole deck lit")
  charge   "Core gathers energy.": a violet glow over the painted core (research/ffx-sin.md 9.3: the core charges
           visibly before Gravija). The core is found in the painting near our sketch's core position.
  dim      the core at rest: the painted core darkened to a low violet ember, so the charge reads against it.

  python compose.py <painting.full.png> <out.jpg> [deck] [near] [charge=x,y | dim=x,y] [r=0.05]
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

DECK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3/final/rig/L4-deck.png'


def find_core(a, x, y, r=0.07):
    """The brightest violet spot within r (normalised) of (x, y): where the painting put the core."""
    h, w = a.shape[:2]
    x0, x1 = int(max(0, (x - r) * w)), int(min(w, (x + r) * w)); y0, y1 = int(max(0, (y - r * 1.6) * h)), int(min(h, (y + r * 1.6) * h))
    win = a[y0:y1, x0:x1].astype(float)
    score = win[..., 0] * 0.5 + win[..., 2] - win[..., 1] * 0.8
    score = np.asarray(Image.fromarray(np.clip(score, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), float)
    iy, ix = np.unravel_index(np.argmax(score), score.shape)
    return (x0 + ix) / w, (y0 + iy) / h


def glow(im, c, radius, strength=1.0):
    w, h = im.size
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot((xx - c[0] * w) / radius, (yy - c[1] * h) / radius)
    g = np.exp(-d ** 2 * 2.2)[..., None] * np.array((190, 120, 255), float) * strength
    core = np.exp(-d ** 2 * 18)[..., None] * np.array((255, 240, 255), float) * strength
    a = np.asarray(im, float)
    return Image.fromarray(np.clip(a + g + core, 0, 255).astype(np.uint8))


def main(src, out, *opts):
    im = Image.open(src).convert('RGB')
    if im.size != (2352, 1344):
        im = im.resize((2352, 1344), Image.LANCZOS)
    o = dict(x.split('=') if '=' in x else (x, '1') for x in opts)
    if 'deck' in o:
        dk = Image.open(DECK).convert('RGBA')
        if 'near' in o:           # shade the deck under the creature: darker and cooler towards the right
            a = np.asarray(dk, float)
            ramp = np.linspace(0.86, 0.58, a.shape[1])[None, :, None]
            a[..., :3] = a[..., :3] * ramp * np.array((0.94, 0.96, 1.04))
            dk = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
        base = im.convert('RGBA'); base.alpha_composite(dk); im = base.convert('RGB')
    if 'dim' in o:
        x, y = (float(v) for v in o['dim'].split(','))
        c = find_core(np.asarray(im), x, y)
        w, h = im.size; r = float(o.get('r', 0.05)) * w
        yy, xx = np.mgrid[0:h, 0:w]
        d = np.clip(np.hypot(xx - c[0] * w, yy - c[1] * h) / r, 0, 1)[..., None]
        a = np.asarray(im, float)
        ember = a * np.array((0.42, 0.34, 0.52))                    # dark, violet
        im = Image.fromarray(np.clip(a * d + ember * (1 - d), 0, 255).astype(np.uint8))
        print('core dimmed at', round(c[0], 3), round(c[1], 3))
    if 'charge' in o:
        x, y = (float(v) for v in o['charge'].split(','))
        c = find_core(np.asarray(im), x, y)
        im = glow(im, c, float(o.get('r', 0.05)) * im.size[0], 0.95)
        print('core found at', round(c[0], 3), round(c[1], 3))
    im.resize((1600, 900), Image.LANCZOS).save(out, quality=88)
    print('wrote', out)


if __name__ == '__main__':
    main(*sys.argv[1:])
