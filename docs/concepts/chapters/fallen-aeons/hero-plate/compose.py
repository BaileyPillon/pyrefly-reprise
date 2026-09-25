"""Chapter XI (Fallen Aeons) hero-plate options: the pixel work after the renders (FFX-2 only).

Method r3, as the Yojimbo and Natus plate rounds settled it: a second figure is NOT asked of the
sampler. In A the possessed Anima is the installed x2-anima idle's own pixels (the picked O-2 B
violet is already in them); in C, Cindy and Mindy are their installed idles' own pixels. Each is
graded toward the Road's light, blurred for depth of field and set behind the hero render's
isnet-anime matte (../../natus/hero-plate/scripts/matte.py).

  python compose.py [a|b|c ...]   -> D:/Tools/pyrefly-scratch/hero-plates/fallen-aeons/options/

The base renders are named in BASES below (their sidecars are in renders/).
"""
import colorsys
import os
import sys
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageChops

ROOT = 'D:/Final Fantasy/public/art/'
SCR = 'D:/Tools/pyrefly-scratch/hero-plates/fallen-aeons/'
W, H = 1344, 768
BASES = {'a': 'af-961103', 'b': 'b-962101', 'c': 'c-963103'}
# Face centres in the installed idles' own pixels, read off a 100 px grid (tmp/heads.jpg).
HEADS = {'x2-anima': (362, 375), 'cindy': (117, 135), 'mindy': (158, 198)}


def hero_only(matte_path, seed_xy):
    """The hero render's matte, keeping only the connected figure that contains seed_xy."""
    m = Image.open(SCR + matte_path).convert('RGBA')
    a = m.getchannel('A')
    b = a.point(lambda v: 255 if v > 24 else 0)
    ImageDraw.floodfill(b, seed_xy, 128)
    keep = b.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1))
    m.putalpha(ImageChops.multiply(a, keep))
    return m


def grade(im, bright, color, tint_rgb, tint_k, blur):
    a = im.getchannel('A')
    rgb = ImageEnhance.Color(im.convert('RGB')).enhance(color)
    rgb = ImageEnhance.Brightness(rgb).enhance(bright)
    rgb = Image.blend(rgb, Image.new('RGB', rgb.size, tint_rgb), tint_k)
    rgb.putalpha(a)
    return rgb.filter(ImageFilter.GaussianBlur(blur)) if blur else rgb


def idle(name, rows=None, flip=False):
    im = Image.open(ROOT + f'characters/{name}/idle.png').convert('RGBA')
    hx, hy = HEADS[name]
    if rows:
        im = im.crop((0, rows[0], im.width, rows[1]))
        hy -= rows[0]
        # Fade the cut edge over its last 180 px, so a cropped figure dissolves instead of ending in a line.
        fade = Image.new('L', im.size, 255)
        fd = ImageDraw.Draw(fade)
        for i in range(180):
            fd.line([(0, im.height - 1 - i), (im.width, im.height - 1 - i)], fill=round(255 * i / 180))
        im.putalpha(ImageChops.multiply(im.getchannel('A'), fade))
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
        hx = im.width - hx
    return im, (hx, hy)


def place(fig, head, scale, at):
    f = fig.resize((round(fig.width * scale), round(fig.height * scale)), Image.LANCZOS)
    return f, (round(at[0] - head[0] * scale), round(at[1] - head[1] * scale))


def swap_irises(im, boxes):
    """Canon (research/visual-bible.md, Yuna: left eye blue, right eye green). boxes = [(box, lo, hi, shift)]."""
    px = im.load()
    n = 0
    for (x0, y0, x1, y1), lo, hi, shift in boxes:
        for yy in range(y0, y1):
            for xx in range(x0, x1):
                r, g, b = px[xx, yy][:3]
                h, s_, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                if lo < h < hi and s_ > 0.25 and v > 0.12:
                    rr, gg, bb = colorsys.hsv_to_rgb((h + shift) % 1, s_, v)
                    px[xx, yy] = (round(rr * 255), round(gg * 255), round(bb * 255)) + tuple(px[xx, yy][3:])
                    n += 1
    return n


def behind(base_name, figs, hero_seed, iris_boxes=None):
    base = Image.open(SCR + f'renders/{base_name}.png').convert('RGB')
    if iris_boxes:
        print(base_name, 'iris pixels recoloured', swap_irises(base, iris_boxes))
    hero = base.copy().convert('RGBA')
    hero.putalpha(hero_only(f'tmp/matte-{base_name}.png', hero_seed).getchannel('A'))
    out = base.convert('RGBA')
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for f, xy in figs:
        layer.alpha_composite(f, xy)
    out.alpha_composite(layer)
    out.alpha_composite(hero)
    return out.convert('RGB')


OPTIONS = {}


def option(k):
    def reg(fn):
        OPTIONS[k] = fn
        return fn
    return reg


@option('a')
def option_a():
    """Yuna (White Mage) asks forgiveness; the possessed Anima waits on the right.

    Round 3 of A (a3f 961105..961107) still filled the frame with the hood, as every A render did
    (two failures on composition, rule 15). So the method changed: af-961103's Yuna (her own pixels
    under the isnet-anime matte, irises traded to canon) is moved 230 px left, and the space
    she leaves is the installed Road plate (backdrops/road-to-the-farplane.png, O-3 A), blurred for
    depth. Anima is x2-anima's idle as installed (facing left, toward Yuna)."""
    base = Image.open(SCR + f"renders/{BASES['a']}.png").convert('RGB')
    iris = [((455, 222, 548, 308), 0.5, 0.75, -0.3), ((680, 200, 770, 290), 0.12, 0.32, 0.4)]
    print('a iris pixels recoloured', swap_irises(base, iris))
    yuna = base.convert('RGBA')
    yuna.putalpha(hero_only(f"tmp/matte-{BASES['a']}.png", (400, 500)).getchannel('A'))
    k = 1.0  # 0.9 showed the render's own top edge across the hood; she is moved, not scaled
    yuna = yuna.resize((round(W * k), round(H * k)), Image.LANCZOS)
    road = Image.open(ROOT + 'backdrops/road-to-the-farplane.png').convert('RGB')
    road = road.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(6))
    out = ImageEnhance.Brightness(road).enhance(0.95).convert('RGBA')
    an, head = idle('x2-anima', rows=(0, 1150))
    an = grade(an, 0.95, 0.9, (190, 180, 230), 0.1, 2.2)
    an, xy = place(an, head, 0.95, (1185, 290))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(an, (max(xy[0], 0), max(xy[1], 0)), (max(-xy[0], 0), max(-xy[1], 0)))
    out.alpha_composite(layer)
    yl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    yl.alpha_composite(yuna, (0, H - yuna.height), (230, 0))
    out.alpha_composite(yl)
    return out.convert('RGB')


@option('b')
def option_b():
    """The possessed Shiva close up: the render as it came, no pixel work."""
    return Image.open(SCR + f"renders/{BASES['b']}.png").convert('RGB')


@option('c')
def option_c():
    """Sandy close up; Cindy and Mindy behind her on the left, from their idles."""
    ci, ch = idle('cindy', rows=(0, 700))
    mi, mh = idle('mindy', rows=(0, 700), flip=False)
    ci = grade(ci, 0.92, 0.9, (190, 180, 230), 0.12, 2.4)
    mi = grade(mi, 0.92, 0.9, (190, 180, 230), 0.12, 2.8)
    ci, cxy = place(ci, ch, 1.3, (215, 360))
    mi, mxy = place(mi, mh, 0.8, (110, 150))
    return behind(BASES['c'], [(mi, mxy), (ci, cxy)], (1100, 700))


if __name__ == '__main__':
    os.makedirs(SCR + 'options', exist_ok=True)
    for k in sys.argv[1:] or ['a', 'b', 'c']:
        OPTIONS[k]().save(SCR + f'options/{k}.png')
        print('wrote', SCR + f'options/{k}.png')
