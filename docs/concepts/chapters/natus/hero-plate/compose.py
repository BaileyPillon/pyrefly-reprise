"""Chapter X (Seymour Natus) hero-plate options: the pixel work after the renders (FFX only).

Method r3 (docs/plans/art-method-r3/METHOD-CHECK.md), as the Yojimbo plate round settled it:
a second figure is NOT asked of the sampler. Natus (with his ring layer, placed per his idle
sidecar's `layers` block) and Mortibody are composited from their installed idles' own pixels,
behind the hero render's isnet-anime matte, with depth-of-field blur and the night's light.
In B the only added pixels are the installed ring layer behind his head (every "ring" phrase
the sampler got became a shield or a spiked halo, renders b 952101..952106).

  python compose.py   -> D:/Tools/pyrefly-scratch/hero-plates/natus/options/{a,b,c}.png

Mattes: scripts/matte.py (isnet-anime) into D:/Tools/pyrefly-scratch/hero-plates/natus/tmp/.
"""
import colorsys
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageChops

ROOT = 'D:/Final Fantasy/public/art/'
SCR = 'D:/Tools/pyrefly-scratch/hero-plates/natus/'
W, H = 1344, 768


def natus_with_ring(y0, y1, ring_alpha):
    """Natus's idle with his ring layer behind, exactly per the idle sidecar (diameter 974, centre (346, 469)),
    cut to idle rows y0..y1 and columns -150..850. Returns (image, head) with head = his face centre
    (350, 240 in idle pixels) in the returned image. ring_alpha dims the ring so it frames, not dominates."""
    fig = Image.open(ROOT + 'characters/seymour-natus/idle.png').convert('RGBA')
    ring = Image.open(ROOT + 'characters/seymour-natus-ring/idle.png').convert('RGBA').resize((974, 974), Image.LANCZOS)
    ring.putalpha(ring.getchannel('A').point(lambda v: int(v * ring_alpha)))
    ox, oy = 150, 150
    canvas = Image.new('RGBA', (1000, fig.height + 2 * oy), (0, 0, 0, 0))
    canvas.alpha_composite(ring, (ox + 346 - 487, oy + 469 - 487))
    canvas.alpha_composite(fig, (ox, oy))
    return canvas.crop((0, oy + y0, 1000, oy + y1)), (ox + 350, 240 - y0)


def place(fig, head, scale, at):
    """Scale fig and return (fig, xy) so that its head lands on plate point `at`."""
    f = fig.resize((round(fig.width * scale), round(fig.height * scale)), Image.LANCZOS)
    return f, (round(at[0] - head[0] * scale), round(at[1] - head[1] * scale))


def grade(im, bright, color, tint_rgb, tint_k, blur):
    a = im.getchannel('A')
    rgb = ImageEnhance.Color(im.convert('RGB')).enhance(color)
    rgb = ImageEnhance.Brightness(rgb).enhance(bright)
    rgb = Image.blend(rgb, Image.new('RGB', rgb.size, tint_rgb), tint_k)
    rgb.putalpha(a)
    return rgb.filter(ImageFilter.GaussianBlur(blur)) if blur else rgb


def glow(alpha, radius, rgb, strength):
    g = alpha.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(radius))
    g = g.point(lambda v: int(v * strength))
    layer = Image.new('RGBA', alpha.size, rgb + (0,))
    layer.putalpha(g)
    return layer


def scaled(im, height, top_frac=1.0):
    im = im.crop((0, 0, im.width, int(im.height * top_frac)))
    s = height / im.height
    return im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)


def hero_only(matte_path, seed_xy):
    """The hero render's matte, keeping only the connected figure that contains seed_xy.
    isnet-anime also keeps bright background shapes (lanterns); those must not land on top."""
    m = Image.open(SCR + matte_path).convert('RGBA')
    a = m.getchannel('A')
    b = a.point(lambda v: 255 if v > 24 else 0)
    ImageDraw.floodfill(b, seed_xy, 128)
    keep = b.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1))
    m.putalpha(ImageChops.multiply(a, keep))
    return m


def over(base, fig, xy, halo_rgb, halo_k, hero_matte, seed_xy):
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(fig, xy)
    out = base.convert('RGBA')
    out.alpha_composite(glow(layer.getchannel('A'), 16, halo_rgb, halo_k))
    out.alpha_composite(layer)
    out.alpha_composite(hero_only(hero_matte, seed_xy))
    return out.convert('RGB')


def option_a():
    """Kimahri's stand: render a-951102 (Kimahri left, facing right); Natus looms close on the right."""
    base = Image.open(SCR + 'renders/a-951102.png')
    n, head = natus_with_ring(-20, 760, 0.55)
    n = grade(n, 0.8, 0.9, (40, 30, 90), 0.14, 1.6)
    n, xy = place(n, head, 1.35, (1120, 230))
    return over(base, n, xy, (170, 140, 255), 0.3, 'tmp/matte-a-951102.png', (500, 400))


def option_b():
    """Natus close up: render b2f-952203; the installed ring layer set behind his head."""
    base = Image.open(SCR + 'renders/b2f-952203.png').convert('RGBA')
    ring = Image.open(ROOT + 'characters/seymour-natus-ring/idle.png').convert('RGBA').resize((820, 820), Image.LANCZOS)
    ring.putalpha(ring.getchannel('A').point(lambda v: int(v * 0.9)))
    ring = grade(ring, 0.9, 0.85, (60, 50, 120), 0.15, 1.2)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(ring, (672 - 410, 250 - 410))
    base.alpha_composite(glow(layer.getchannel('A'), 12, (190, 170, 255), 0.35))
    base.alpha_composite(layer)
    base.alpha_composite(Image.open(SCR + 'tmp/matte-b2f-952203.png').convert('RGBA'))
    return base.convert('RGB')


def swap_irises(im, blue_box, green_box):
    """Canon (research/visual-bible.md, Yuna: left eye blue, right eye green). Render c-953106 drew
    them the other way round, so the two irises trade hue inside a box round each eye; value,
    saturation and every line are kept. Returns the count of recoloured pixels."""
    px = im.load()
    n = 0
    for (x0, y0, x1, y1), lo, hi, shift in ((blue_box, 0.5, 0.72, -0.22), (green_box, 0.28, 0.5, 0.22)):
        for yy in range(y0, y1):
            for xx in range(x0, x1):
                r, g, b = px[xx, yy][:3]
                h, s_, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                if lo < h < hi and s_ > 0.25 and v > 0.12:
                    rr, gg, bb = colorsys.hsv_to_rgb((h + shift) % 1, s_, v)
                    px[xx, yy] = (round(rr * 255), round(gg * 255), round(bb * 255)) + tuple(px[xx, yy][3:])
                    n += 1
    return n


def option_c():
    """The turn back: render c-953106 (Yuna on the right, looking back over her shoulder); Natus and
    Mortibody waiting further down the bridge on the left, where she is turning back to."""
    base = Image.open(SCR + 'renders/c-953106.png').convert('RGB')
    print('C: iris pixels recoloured', swap_irises(base, (510, 160, 595, 235), (635, 190, 720, 265)))
    matte = hero_only('tmp/matte-c-953106.png', (700, 600))
    fixed = base.copy().convert('RGBA')
    fixed.putalpha(matte.getchannel('A'))
    base = base.convert('RGBA')
    n, head = natus_with_ring(-20, 1000, 0.5)
    n = grade(n, 0.66, 0.8, (30, 30, 80), 0.22, 2.4)
    n, nxy = place(n, head, 0.62, (345, 250))
    m = scaled(Image.open(ROOT + 'characters/mortibody/idle.png').convert('RGBA'), 230)
    m = m.transpose(Image.FLIP_LEFT_RIGHT)  # faces right, towards Yuna (it is nonBiped; flipping is how the engine faces it)
    m = grade(m, 0.62, 0.8, (30, 30, 80), 0.22, 2.6)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.alpha_composite(n, nxy)
    layer.alpha_composite(m, (-40, 215))  # on Natus's screen-left, hovering, as the fight stages it
    base.alpha_composite(glow(layer.getchannel('A'), 18, (170, 140, 255), 0.3))
    base.alpha_composite(layer)
    base.alpha_composite(fixed)
    return base.convert('RGB')


if __name__ == '__main__':
    import os
    import sys
    os.makedirs(SCR + 'options', exist_ok=True)
    which = sys.argv[1:] or ['a', 'b', 'c']
    for k in which:
        {'a': option_a, 'b': option_b, 'c': option_c}[k]().save(SCR + f'options/{k}.png')
        print('wrote', SCR + f'options/{k}.png')
