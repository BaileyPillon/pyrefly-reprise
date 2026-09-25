"""Chapter XV (The Den of Woe) hero-plate options: the pixel work after the renders (FFX-2 only).

The picked O-1 B treatment ("translucent and lit from within", docs/concepts/chapters/gippal/
scripts/shade.py, its parameters unchanged) is applied here to the rendered Gippal's
isnet-anime matte, over a blurred copy of the installed Den backdrop (the picked O-3 A cold
blue light), so the cave shows through him. Baralai and Nooj (and, in C, Gippal) come from
their installed shade idles, which already carry the same treatment. Nothing is asked of the
sampler beyond one figure (method r3, the Yojimbo round).

  python compose.py <a_render> <b_render> <c_render>
      -> D:/Tools/pyrefly-scratch/hero-plates/gippal/options/{a,b,c}.png
"""
import os
import random
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = 'D:/Final Fantasy/'
SCR = 'D:/Tools/pyrefly-scratch/hero-plates/gippal/'
OUT = SCR + 'options/'
W, H = 1344, 768


def den_plate(blur=9, crop=(300, 80, 2388, 1274)):
    """The installed Den backdrop (candidate, O-3 A), cropped to the plate's aspect and blurred to bokeh."""
    bd = Image.open(ROOT + 'public/art/backdrops/den-of-woe.png').convert('RGB').crop(crop).resize((W, H), Image.LANCZOS)
    return ImageEnhance.Brightness(bd.filter(ImageFilter.GaussianBlur(blur))).enhance(0.9).convert('RGBA')


def motes(region, n, colors, rmin, rmax, seed, a=60):
    """shade.py's motes, inside a boolean region."""
    random.seed(seed)
    h, w = region.shape
    halo = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    core = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    dh, dc = ImageDraw.Draw(halo), ImageDraw.Draw(core)
    yy, xx = np.nonzero(region)
    for _ in range(n):
        i = random.randrange(len(xx))
        x, y, r = xx[i], yy[i], random.uniform(rmin, rmax)
        dh.ellipse((x - r * 3, y - r * 3, x + r * 3, y + r * 3), fill=random.choice(colors) + (a,))
        dc.ellipse((x - r * 0.6, y - r * 0.6, x + r * 0.6, y + r * 0.6), fill=(255, 255, 255, 235))
    return Image.alpha_composite(halo.filter(ImageFilter.GaussianBlur(rmax * 1.6)), core)


def shade_b(fig, seed=11, k=3):
    """O-1 B on an RGBA figure: desaturate and cool, an inner glow toward the core, alpha
    thinning toward the bottom edge, a cold outer halo, pale motes inside (shade.py).

    Plate scale (the one change from shade.py, which is tuned for a 1,200 px full-body idle):
    at head-and-shoulders size the whole figure counts as "core", and the verbatim glow and
    0.80 alpha washed the face out flat (tmp/test-a-verbatim.jpg). So the kernels scale by
    k, the luminance keeps its line work (gamma 1.35), the core glow is 0.5 of shade.py's,
    the cool tint is a little stronger (0.56/0.80/1.06, the render's own colour at 0.10), and the alpha runs 0.90 at the top to 0.62 at the bottom edge (was 0.80 to 0.50)."""
    arr = np.asarray(fig).astype(np.float32) / 255
    rgb, A = arr[..., :3], arr[..., 3]
    H_, W_ = A.shape
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    alpha_img = fig.getchannel('A')
    ys, _ = np.nonzero(A > 0.5)
    top, bot = ys.min(), ys.max()
    vy = ((np.arange(H_)[:, None] - top) / max(1, bot - top)).clip(0, 1) * np.ones((1, W_))
    cool = np.array([0.56, 0.80, 1.06], np.float32)
    b_rgb = (lum ** 1.35)[..., None] * cool * 0.98 + rgb * 0.10
    core = np.asarray(alpha_img.filter(ImageFilter.MinFilter(21 * k if (21 * k) % 2 else 21 * k + 1))
                      .filter(ImageFilter.GaussianBlur(28 * k))).astype(np.float32) / 255
    b_rgb = np.clip(b_rgb + core[..., None] * np.array([0.30, 0.42, 0.50]) * 0.45, 0, 1)
    b_a = A * (0.90 - 0.28 * vy ** 2)
    b = Image.fromarray(np.concatenate([b_rgb * 255, b_a[..., None] * 255], -1).astype(np.uint8), 'RGBA')
    halo = np.asarray(alpha_img.filter(ImageFilter.MaxFilter(25)).filter(ImageFilter.GaussianBlur(20 * k))).astype(np.float32) / 255
    hl = np.zeros((H_, W_, 4), np.float32)
    hl[..., :3] = [150, 210, 255]
    hl[..., 3] = np.clip(halo * 0.45, 0, 1) * 255
    b = Image.alpha_composite(Image.fromarray(hl.astype(np.uint8), 'RGBA'), b)
    inside = (A > 0.6) & (np.asarray(alpha_img.filter(ImageFilter.MinFilter(15))) > 128)
    n = max(40, int(inside.sum() / 6000))
    return Image.alpha_composite(b, motes(inside, n, [(200, 235, 255), (170, 220, 255), (220, 255, 240)], 1.5, 3.5, seed, 60))


def matte(name):
    """The render's isnet-anime matte, its faint background haze (alpha under 0.12) cut to zero:
    left in, the plate-scale halo turned it into a visible box."""
    m = Image.open(f'{SCR}tmp/matte-{name}.png').convert('RGBA')
    m.putalpha(m.getchannel('A').point(lambda v: 0 if v < 31 else min(255, int((v - 31) * 255 / 224))))
    return m


def idle_fig(name, crop_frac, height, flip=False, blur=0.0, fade=1.0):
    """An installed shade idle (already O-1 B), cropped from the top to crop_frac of its body."""
    im = Image.open(ROOT + f'public/art/characters/{name}/idle.png').convert('RGBA')
    bb = im.getbbox()
    im = im.crop((bb[0], bb[1], bb[2], bb[1] + int((bb[3] - bb[1]) * crop_frac)))
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    s = height / im.height
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(im.getchannel('A')).astype(np.float32) * fade
    # the crop ends mid-body: fade the lowest 35 % out, so no straight cut line shows
    ramp = np.clip((1.0 - np.arange(im.height) / im.height) / 0.35, 0, 1)[:, None]
    im.putalpha(Image.fromarray((a * ramp).astype(np.uint8)))
    return im


def option_a(render):
    """Gippal's shade alone: his rendered matte, O-1 B, over the blurred Den."""
    out = den_plate()
    out.alpha_composite(shade_b(matte(render), 11))
    return out.convert('RGB')


def option_b(render, dx=260):
    """The three shades as one idea. Gippal (anger) from a second render, MIRRORED: as rendered, the
    patch sat on his left eye; mirrored it is on his right, as sourced (visual bible 1.23.5). His
    matte moves left by dx, and the edge that opens on his far shoulder dissolves over 300 px.
    Baralai (sorrow) and Nooj (despair) stand behind him on the right, from their installed shade
    idles, facing him (unmirrored: Nooj's machina arm stays his left, bible 1.23.4)."""
    out = den_plate()
    bara = idle_fig('baralai-shade', 0.52, 800, blur=2.4, fade=0.8)
    nooj = idle_fig('nooj-shade', 0.5, 860, blur=1.6, fade=0.88)
    out.alpha_composite(bara, (W - bara.width + 300, 10))
    out.alpha_composite(nooj, (W - nooj.width - 40, -20))
    g = shade_b(matte(render), 12).transpose(Image.FLIP_LEFT_RIGHT)
    ramp = np.clip((W - 40 - np.arange(W)) / 300.0, 0, 1)[None, :] * np.ones((H, 1))
    ga = np.asarray(g.getchannel('A')).astype(np.float32) * ramp
    g.putalpha(Image.fromarray(ga.astype(np.uint8)))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(g.crop((dx, 0, W, H)), (0, 0))
    out.alpha_composite(layer)
    return out.convert('RGB')


def option_c(render):
    """Paine, the squad's sphere recorder (research §2: only Nooj, Baralai, Gippal and their recorder
    Paine got out), with the three shades of her old comrades behind her on the left. The shade
    idles stay UNMIRRORED (Gippal's patch on his right eye, Nooj's machina arm his left), so they
    stand turned from her."""
    base = Image.open(f'{SCR}renders/{render}.png').convert('RGBA')
    paine = matte(render)
    out = base.copy()
    for name, x, y, h in (('baralai-shade', 190, 60, 560), ('nooj-shade', -60, 10, 640), ('gippal-shade', 60, 250, 520)):
        f = idle_fig(name, 0.55, h, blur=2.2, fade=0.85)
        out.alpha_composite(f, (x, y))
    out.alpha_composite(paine)
    return out.convert('RGB')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    a, b, c = sys.argv[1:4]
    if a != '-':
        option_a(a).save(OUT + 'a.png')
    if b != '-':
        option_b(b).save(OUT + 'b.png')
    if c != '-':
        option_c(c).save(OUT + 'c.png')
    print('ok')
