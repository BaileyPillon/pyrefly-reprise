"""Chapter XIV (Isaaru) hero-plate options: the pixel work after the renders (FFX only).

The Yojimbo round's lesson: a second figure is never asked of the sampler. His aeons are
composited from their installed O-4 C paintings (public/art/characters/{grothia,spathi}/idle.png:
Ifrit's and Bahamut's own pixels with the picked sea-green edge and darker grade), behind the
rendered figure's isnet-anime matte, with depth-of-field blur. No paint.

  A: render a-<seed> as it came out.
  B: Yuna (render b-932203) with Isaaru's Grothia looming behind her on the right.
  C: Isaaru praying (render c-932305) with his Spathi rising behind him on the left.

  python compose.py [aseed]  -> D:/Tools/pyrefly-scratch/hero-plates/isaaru/options/{a,b,c}.png
"""
import sys
from PIL import Image, ImageFilter, ImageEnhance

ROOT = 'D:/Final Fantasy/'
SCR = 'D:/Tools/pyrefly-scratch/hero-plates/isaaru/'
OUT = SCR + 'options/'
W, H = 1344, 768
A_SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 932104
B_SEED, C_SEED = 932203, 932305


def glow(alpha, radius, rgb, strength):
    g = alpha.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(radius))
    g = g.point(lambda v: int(v * strength))
    layer = Image.new('RGBA', alpha.size, rgb + (0,))
    layer.putalpha(g)
    return layer


def aeon(name, top_frac, height, blur, x0_frac=0.0, x1_frac=1.0):
    im = Image.open(ROOT + f'public/art/characters/{name}/idle.png').convert('RGBA')
    bb = im.getbbox()
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    im = im.crop((bb[0] + int(bw * x0_frac), bb[1], bb[0] + int(bw * x1_frac), bb[1] + int(bh * top_frac)))
    s = height / im.height
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    return im.filter(ImageFilter.GaussianBlur(blur))


def matte(path, floor=60):
    m = Image.open(path).convert('RGBA')
    a = m.getchannel('A').point(lambda v: 0 if v < floor else v)
    m.putalpha(a)
    return m


def option_a():
    return Image.open(SCR + f'renders/a-{A_SEED}.png').convert('RGB')


def option_b():
    base = Image.open(SCR + f'renders/b-{B_SEED}.png').convert('RGBA')
    yuna = matte(SCR + f'tmp/matte-b-{B_SEED}.png')
    # Its horned head (the painting's upper left) sits just right of Yuna's hair; the body
    # runs off the right edge.
    g = aeon('grothia', 0.6, 760, 2.2, x0_frac=0.05)
    g = ImageEnhance.Brightness(g).enhance(0.85)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(g, (835, 10))
    rim = glow(layer.getchannel('A'), 8, (255, 70, 60), 0.35)
    out = base.copy()
    out.alpha_composite(rim)
    out.alpha_composite(layer)
    out.alpha_composite(yuna)
    return out.convert('RGB')


def option_c():
    base = Image.open(SCR + f'renders/c-{C_SEED}.png').convert('RGBA')
    isaaru = matte(SCR + f'tmp/matte-c-{C_SEED}.png')
    sp = aeon('spathi', 0.8, 900, 2.4)
    sp = ImageEnhance.Brightness(sp).enhance(0.95)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(sp, (-260, -60))
    rim = glow(layer.getchannel('A'), 10, (90, 220, 190), 0.3)
    out = base.copy()
    out.alpha_composite(rim)
    out.alpha_composite(layer)
    out.alpha_composite(isaaru)
    return out.convert('RGB')


if __name__ == '__main__':
    import os
    os.makedirs(OUT, exist_ok=True)
    only = os.environ.get('ONLY', 'abc')
    for k, fn in (('a', option_a), ('b', option_b), ('c', option_c)):
        if k in only:
            fn().save(OUT + f'{k}.png')
            print('wrote', OUT + f'{k}.png')
