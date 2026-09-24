"""Chapter IX (Yojimbo) hero-plate options: the pixel work after the renders (FFX only).

Method r3 (docs/plans/art-method-r3/METHOD-CHECK.md): the second figure in A and C
is NOT asked of the sampler (round 1 bound its words to Lulu: a white-painted face,
the samurai hat on her head). It is composited from the installed idle's own pixels,
behind Lulu, with depth-of-field blur and the chamber's cold light. B's one repair
erases pixels the sources do not support (glowing blue eyes and teeth inside the mask).

  python compose.py            -> D:/Tools/pyrefly-scratch/yoj-hero/options/{a,b,c}.png

Mattes are isnet-anime (the pipeline's installed rembg model), made beforehand into
D:/Tools/pyrefly-scratch/yoj-hero/tmp/matte-*.png.
"""
import colorsys
from PIL import Image, ImageFilter, ImageChops, ImageEnhance, ImageDraw

ROOT = 'D:/Final Fantasy/'
SCR = 'D:/Tools/pyrefly-scratch/yoj-hero/'
OUT = SCR + 'options/'
W, H = 1344, 768


def tint(im, rgb, k):
    """Mix an RGBA image's colour toward rgb by k, keeping alpha."""
    a = im.getchannel('A')
    flat = Image.new('RGB', im.size, rgb)
    mixed = Image.blend(im.convert('RGB'), flat, k)
    mixed.putalpha(a)
    return mixed


def fig(path, flip, crop_frac, height, blur):
    im = Image.open(ROOT + path).convert('RGBA')
    bb = im.getbbox()
    im = im.crop((bb[0], bb[1], bb[2], bb[1] + int((bb[3] - bb[1]) * crop_frac)))
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    s = height / im.height
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    return im.filter(ImageFilter.GaussianBlur(blur)) if blur else im


def glow(alpha, radius, rgb, strength):
    g = alpha.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(radius))
    g = g.point(lambda v: int(v * strength))
    layer = Image.new('RGBA', alpha.size, rgb + (0,))
    layer.putalpha(g)
    return layer


def option_a():
    """Lulu (hero render a4-909143: her idle forced at the approved plate's 0.5) and the unsent Lady Ginnem behind her, from Ginnem's idle."""
    base = Image.open(SCR + 'renders/a4-909143.png').convert('RGBA')
    lulu = Image.open(SCR + 'tmp/matte-a4-909143.png').convert('RGBA')
    # Round 2 placement: behind Lulu's shoulder on the right, where both the pause
    # CHAPTER tab and the prep card still show the plate (round 1 put her at the
    # far left, which neither surface shows). Unflipped: she faces left, at Lulu.
    g = fig('public/art/characters/ginnem/idle.png', False, 0.58, 700, 2.0)
    g = ImageEnhance.Color(g).enhance(0.6)
    g = tint(g, (200, 226, 255), 0.5)
    a = g.getchannel('A').point(lambda v: int(v * 0.8))
    g.putalpha(a)
    x, y = 1344 - 470, 40
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(g, (x, y))
    halo = glow(layer.getchannel('A'), 14, (170, 215, 255), 0.55)
    out = base.copy()
    out.alpha_composite(halo)
    out.alpha_composite(layer)
    out.alpha_composite(lulu)
    return out.convert('RGB')


def option_b():
    """Yojimbo (fresh hero render b-909154): the mask's glowing eyes and teeth darkened."""
    im = Image.open(SCR + 'renders/b-909154.png').convert('RGB')
    px = im.load()
    x0, y0, x1, y1 = 620, 310, 880, 540  # the eye holes and the teeth only; hat underside and blade keep their blue
    changed = 0
    for yy in range(y0, y1):
        for xx in range(x0, x1):
            r, g, b = px[xx, yy]
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.47 < h < 0.7 and s > 0.45 and v > 0.45:
                k = 0.14
                px[xx, yy] = (int(12 + r * k * 0.4), int(14 + g * k * 0.5), int(24 + b * k))
                changed += 1
    print('B: mask glow pixels darkened', changed)
    return im


def option_c():
    """Lulu's APPROVED plate pixels (face untouched) in the cold chamber, Yojimbo's silhouette behind."""
    plate = Image.open(ROOT + 'public/art/pause/lulu.png').convert('RGBA')
    matte = Image.open(SCR + 'tmp/matte-lulu-plate.png').getchannel('A')
    keep = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(keep)
    # Lulu's silhouette on this plate: hair and face end at x~0.71, the jaw turns in
    # under the chin, the fur collar comes back out at the bottom. Right of this line
    # the matte holds Macalania bokeh and a tree trunk, which are not hers.
    d.polygon([(0, 0), (990, 0), (985, 200), (968, 300), (962, 420), (940, 540), (905, 600), (880, 650),
               (960, 690), (1040, 730), (1070, 768), (0, 768)], fill=255)
    keep = keep.filter(ImageFilter.GaussianBlur(2))
    # Colour key: the matte kept Macalania bokeh (cyan-green and yellow light) between
    # the jaw and the fur collar. Those pixels are background, so they leave the matte.
    alpha = ImageChops.multiply(matte, keep)
    ap, pp = alpha.load(), plate.load()
    keyed = 0
    for yy in range(500, 740):
        for xx in range(780, 1080):
            r, g, b, _ = pp[xx, yy]
            h, s_, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.1 < h < 0.55 and v > 0.5 and s_ > 0.25 and ap[xx, yy] > 0:
                ap[xx, yy] = 0
                keyed += 1
    # The plate's pale backlight shows between the hair tips (top right), as a
    # fringe at the hair tips: bright, unsaturated background, keyed out the same way.
    for (bx0, by0, bx1, by1) in ((930, 0, 1000, 260),):
        for yy in range(by0, by1):
            for xx in range(bx0, bx1):
                r, g, b, _ = pp[xx, yy]
                h, s_, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                if v > 0.78 and s_ < 0.3 and ap[xx, yy] > 0:
                    ap[xx, yy] = 0
                    keyed += 1
    print('C: background pixels keyed out', keyed)
    alpha = alpha.filter(ImageFilter.MedianFilter(3))
    lulu = plate.copy()
    lulu.putalpha(alpha)
    bg = Image.open(ROOT + 'public/art/backdrops/cavern-stolen-fayth.png').convert('RGB').resize((W, H), Image.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(7))
    bg = ImageEnhance.Brightness(bg).enhance(0.8).convert('RGBA')
    y = fig('public/art/characters/yojimbo-cavern/idle.png', False, 0.62, 720, 2.5)
    rgb = y.convert('RGB')
    dark = ImageEnhance.Brightness(ImageEnhance.Color(rgb).enhance(0.55)).enhance(0.32)
    dark = Image.blend(dark, Image.new('RGB', dark.size, (18, 26, 48)), 0.25)
    dark.putalpha(y.getchannel('A'))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(dark, (W - dark.width + 60, 30))
    rim = glow(layer.getchannel('A'), 5, (185, 215, 255), 0.35)
    out = bg
    out.alpha_composite(rim)
    out.alpha_composite(layer)
    out.alpha_composite(lulu)
    return out.convert('RGB')


if __name__ == '__main__':
    import os
    os.makedirs(OUT, exist_ok=True)
    for k, fn in (('a', option_a), ('b', option_b), ('c', option_c)):
        fn().save(OUT + f'{k}.png')
        print('wrote', OUT + f'{k}.png')
