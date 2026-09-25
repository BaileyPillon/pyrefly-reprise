"""Chapter XIII (Trema) hero-plate options: the pixel work after the renders (FFX-2 only).

Method r3 (docs/plans/art-method-r3/METHOD-CHECK.md), as the Yojimbo round: a second
figure is NOT asked of the sampler (its words bind to the first). It is composited from
the installed idle's own pixels, lit by the hall's cold light, behind or below the
rendered figure's isnet-anime matte.

  python compose.py <a_render> <b_render> <c_render>
      -> D:/Tools/pyrefly-scratch/hero-plates/trema/options/{a,b,c}.png

Mattes: scripts/matte.py (ComfyUI's embedded python, isnet-anime) into tmp/matte-<name>.
"""
import os
import random
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = 'D:/Final Fantasy/'
SCR = 'D:/Tools/pyrefly-scratch/hero-plates/trema/'
OUT = SCR + 'options/'
W, H = 1344, 768
PYRE_GREEN, PYRE_WHITE = (139, 232, 176), (233, 255, 244)  # visual bible --pyre-green / --pyre-white


def tint(im, rgb, k):
    a = im.getchannel('A')
    mixed = Image.blend(im.convert('RGB'), Image.new('RGB', im.size, rgb), k)
    mixed.putalpha(a)
    return mixed


def glow(alpha, radius, rgb, strength):
    g = alpha.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(radius)).point(lambda v: int(v * strength))
    layer = Image.new('RGBA', alpha.size, rgb + (0,))
    layer.putalpha(g)
    return layer


def motes(size, boxes, n, seed, rmin=1.5, rmax=4.5, a=90):
    """Soft pyrefly motes: a blurred halo and a bright core, inside the given boxes."""
    random.seed(seed)
    halo = Image.new('RGBA', size, (0, 0, 0, 0))
    core = Image.new('RGBA', size, (0, 0, 0, 0))
    dh, dc = ImageDraw.Draw(halo), ImageDraw.Draw(core)
    for _ in range(n):
        x0, y0, x1, y1 = random.choice(boxes)
        x, y, r = random.uniform(x0, x1), random.uniform(y0, y1), random.uniform(rmin, rmax)
        c = random.choice([PYRE_GREEN, PYRE_WHITE, PYRE_GREEN])
        dh.ellipse((x - r * 3, y - r * 3, x + r * 3, y + r * 3), fill=c + (a,))
        dc.ellipse((x - r * 0.6, y - r * 0.6, x + r * 0.6, y + r * 0.6), fill=(250, 255, 250, 235))
    halo = halo.filter(ImageFilter.GaussianBlur(rmax * 1.4))
    return Image.alpha_composite(halo, core)


def matte(name):
    """The render's isnet-anime matte, hardened (alpha under 0.12 cut, over 0.6 solid): its soft
    edge along the white coat let a figure composited behind show through as a ghost."""
    m = Image.open(f'{SCR}tmp/matte-{name}.png').convert('RGBA')
    m.putalpha(m.getchannel('A').point(lambda v: 0 if v < 31 else 255 if v > 153 else int((v - 31) * 255 / 122)))
    return m


def option_a(render):
    """Trema alone on Cloister 100: the render as it came (no repair)."""
    return Image.open(f'{SCR}renders/{render}.png').convert('RGB')


def option_b(render, flip=False):
    """Trema over the beaten Paragon (research §2 step 2: the old man destroys it). Paragon's head,
    horns and gold forequarters from its installed idle, head lowered 10 degrees, low in the
    right-hand foreground under Trema's gaze, its hind end breaking into pyreflies."""
    base = Image.open(f'{SCR}renders/{render}.png').convert('RGBA')
    tre = matte(render)
    if flip:
        base, tre = base.transpose(Image.FLIP_LEFT_RIGHT), tre.transpose(Image.FLIP_LEFT_RIGHT)
    p = Image.open(ROOT + 'public/art/characters/paragon/idle.png').convert('RGBA')
    p = p.crop((16, 16, 700, 540))                   # head, horns, spiked crown and gold forequarters
    s = 1.55
    p = p.resize((round(p.width * s), round(p.height * s)), Image.LANCZOS).rotate(-10, Image.BICUBIC, expand=True)
    p = ImageEnhance.Brightness(ImageEnhance.Color(p).enhance(0.9)).enhance(0.85)
    p = tint(p, (40, 90, 100), 0.15).filter(ImageFilter.GaussianBlur(0.8))
    arr = np.asarray(p).astype(np.float32)
    h, w = arr.shape[:2]
    rng = np.random.default_rng(7)
    noise = np.asarray(Image.fromarray((rng.random((h // 2, w // 2)) * 255).astype(np.uint8))
                       .resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    gx = np.linspace(0, 1, w)[None, :] * np.ones((h, 1))
    cut = np.clip((gx - 0.2) / 0.3, 0, 1)   # only its head shows on the plate, so the dissolve starts behind the eyes
    keep = np.clip((noise - cut * 0.95) * 6 + 0.1, 0, 1)
    edge = (arr[..., 3] > 128) & (keep > 0.02) & (keep < 0.6)        # where it is coming apart
    arr[..., 3] *= keep
    p = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    x, y = W - p.width + 760, H - p.height + 400
    layer.alpha_composite(p, (x, y))
    rim = glow(layer.getchannel('A'), 10, PYRE_GREEN, 0.4)
    out = base.copy()
    out.alpha_composite(rim)
    out.alpha_composite(layer)
    ey, ex = np.nonzero(edge)
    random.seed(5)
    pts = [(int(ex[i]) + x, int(ey[i]) + y) for i in (random.randrange(len(ex)) for _ in range(160))]
    pts = [(px, py) for px, py in pts if 0 <= px < W and 0 <= py < H]
    out.alpha_composite(motes((W, H), [(px - 2, py - 2, px + 2, py + 2) for px, py in pts], 140, 13, 1.2, 3.2))
    out.alpha_composite(motes((W, H), [(1000, 120, W - 20, 520)], 50, 14, 1.2, 3.0, a=70))  # rising
    out.alpha_composite(tre)
    return out.convert('RGB')


def option_c(render):
    """Yuna facing Trema. The Yuna render is MIRRORED: as rendered, her green eye sat on her right
    and her blue eye on her left, the reverse of her approved Chapter IV plate's words ("blue right
    eye", "green left eye"); mirrored, the eyes are right and the long braid falls on the viewer's
    left, as on her approved FFX-2 plate. Trema's upper body from his idle stands behind her on the
    left, mirrored so that he faces her."""
    base = Image.open(f'{SCR}renders/{render}.png').convert('RGBA').transpose(Image.FLIP_LEFT_RIGHT)
    yuna = matte(render).transpose(Image.FLIP_LEFT_RIGHT)
    t = Image.open(ROOT + 'public/art/characters/trema/idle.png').convert('RGBA')
    t = t.crop((150, 16, 760, 720)).transpose(Image.FLIP_LEFT_RIGHT)   # hat to waist, the raised hand
    s = 820 / t.height
    t = t.resize((round(t.width * s), round(t.height * s)), Image.LANCZOS)
    t = ImageEnhance.Brightness(ImageEnhance.Color(t).enhance(0.8)).enhance(0.8)
    t = tint(t, (30, 80, 92), 0.2).filter(ImageFilter.GaussianBlur(1.8))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    x, y = -40, -10
    layer.alpha_composite(t, (x, y))
    rim = glow(layer.getchannel('A'), 6, (190, 235, 230), 0.4)
    out = base.copy()
    out.alpha_composite(rim)
    out.alpha_composite(layer)
    out.alpha_composite(motes((W, H), [(0, 0, x + t.width, H)], 30, 17, a=70))
    out.alpha_composite(yuna)
    return out.convert('RGB')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    a, b, c = sys.argv[1:4]
    option_a(a).save(OUT + 'a.png')
    option_b(b).save(OUT + 'b.png')
    option_c(c).save(OUT + 'c.png')
    print('ok')
