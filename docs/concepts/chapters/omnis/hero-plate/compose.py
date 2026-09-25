"""Chapter XII (Seymour Omnis) hero-plate options: the pixel work after the renders (FFX only).

Method r3 (docs/plans/art-method-r3/METHOD-CHECK.md) and the Yojimbo hero-plate round's
lesson: a second figure is never asked of the sampler. It is composited from installed
pixels, behind the rendered figure's isnet-anime matte, with depth-of-field blur.

  A: render a-931107 as it came out (no pixel work).
  B: Yuna (render b-931208) with Seymour Omnis dissolving behind her shoulder, from his
     installed O-1 A idle (public/art/characters/seymour-omnis/idle.png).
  C: Omnis glowing red (render c-<seed>) with two Mortiphasm discs behind him, from the
     installed disc and its facing layer (public/art/characters/mortiphasm*/idle.png),
     the facing quarter (Fire, orange, the opening state) turned toward him.

  python compose.py [cseed]   -> D:/Tools/pyrefly-scratch/hero-plates/omnis/options/{a,b,c}.png
"""
import sys
from PIL import Image, ImageFilter, ImageEnhance, ImageChops

ROOT = 'D:/Final Fantasy/'
SCR = 'D:/Tools/pyrefly-scratch/hero-plates/omnis/'
OUT = SCR + 'options/'
W, H = 1344, 768
A_SEED, B_SEED = 931107, 931208
C_SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 931306


def tint(im, rgb, k):
    a = im.getchannel('A')
    mixed = Image.blend(im.convert('RGB'), Image.new('RGB', im.size, rgb), k)
    mixed.putalpha(a)
    return mixed


def glow(alpha, radius, rgb, strength):
    g = alpha.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(radius))
    g = g.point(lambda v: int(v * strength))
    layer = Image.new('RGBA', alpha.size, rgb + (0,))
    layer.putalpha(g)
    return layer


def fade_bottom(im, start_frac, end_alpha=0.0):
    """Fade alpha linearly from start_frac of the height to the bottom (dissolving)."""
    a = im.getchannel('A')
    ramp = Image.new('L', im.size, 255)
    px = ramp.load()
    y0 = int(im.height * start_frac)
    for y in range(y0, im.height):
        v = int(255 * (1 - (y - y0) / max(1, im.height - y0) * (1 - end_alpha)))
        for x in range(im.width):
            px[x, y] = v
    im.putalpha(ImageChops.multiply(a, ramp))
    return im


def option_a():
    return Image.open(SCR + f'renders/a-{A_SEED}.png').convert('RGB')


def option_b():
    base = Image.open(SCR + f'renders/b-{B_SEED}.png').convert('RGBA')
    yuna = Image.open(SCR + f'tmp/matte-b-{B_SEED}.png').convert('RGBA')
    om = Image.open(ROOT + 'public/art/characters/seymour-omnis/idle.png').convert('RGBA')
    bb = om.getbbox()
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    # His head, chest and the near shoulders only (the arms spread wider than the plate).
    om = om.crop((bb[0] + int(bw * 0.22), bb[1], bb[0] + int(bw * 0.78), bb[1] + int(bh * 0.5)))
    s = 900 / om.height
    om = om.resize((round(om.width * s), round(om.height * s)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2.2))
    om = ImageEnhance.Color(om).enhance(0.75)
    om = tint(om, (170, 150, 235), 0.28)
    om = fade_bottom(om, 0.35, 0.0)
    om.putalpha(om.getchannel('A').point(lambda v: int(v * 0.72)))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(om, (W - om.width + 60, -60))
    halo = glow(layer.getchannel('A'), 16, (200, 235, 225), 0.35)
    out = base.copy()
    out.alpha_composite(halo)
    out.alpha_composite(layer)
    out.alpha_composite(yuna)
    return out.convert('RGB')


def disc(size, facing_deg, blur):
    """The installed disc with its facing layer, rotated so the lit quarter points facing_deg (0 = screen right)."""
    d = Image.open(ROOT + 'public/art/characters/mortiphasm/idle.png').convert('RGBA')
    f = Image.open(ROOT + 'public/art/characters/mortiphasm-facing/idle.png').convert('RGBA')
    # Opening state: all four discs face him with Fire. Fire sits at 0 deg on the disc and the
    # facing layer is painted toward 0 deg, so both turn together (a turn is a rotation).
    d.alpha_composite(f)
    d = d.rotate(facing_deg, resample=Image.BICUBIC, expand=False)
    d = d.resize((size, size), Image.LANCZOS)
    return d.filter(ImageFilter.GaussianBlur(blur))


def option_c():
    base = Image.open(SCR + f'renders/c-{C_SEED}.png').convert('RGBA')
    om = Image.open(SCR + f'tmp/matte-c-{C_SEED}.png').convert('RGBA')
    out = base.copy()
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # Two discs, one each side behind him, lit quarter turned inward (toward him).
    # Only the top corners are free of his horn crescents (the matte does not hold them), so
    # the discs sit there, cut by the frame, centred on (130, 0) and (W - 130, 0).
    left = disc(300, -40, 2.5)    # upper left: the Fire quarter turned down-right, at him
    right = disc(300, 220, 2.5)   # upper right: turned down-left, at him
    for im, x, y in ((left, -20, -150), (right, W - 280, -150)):
        im = ImageEnhance.Brightness(im).enhance(0.8)
        layer.alpha_composite(im, (x, y))
    rim = glow(layer.getchannel('A'), 10, (255, 90, 80), 0.3)
    out.alpha_composite(rim)
    out.alpha_composite(layer)
    out.alpha_composite(om)
    return out.convert('RGB')


if __name__ == '__main__':
    import os
    os.makedirs(OUT, exist_ok=True)
    only = os.environ.get('ONLY', 'abc')
    for k, fn in (('a', option_a), ('b', option_b), ('c', option_c)):
        if k in only:
            fn().save(OUT + f'{k}.png')
            print('wrote', OUT + f'{k}.png')
