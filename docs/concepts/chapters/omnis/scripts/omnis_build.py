# Seymour Omnis options (FFX only): disc treatments and billboard composites.
# The discs are drawn from one render (disc-a.png, seed 912301) tinted per quarter (A, B) or
# drawn as flat Ink & Gold rings (C). Ring order is OUR ESTIMATE (plan B8): clockwise
# Fire, Water, Ice, Thunder (GameFAQs' reset cycle read as a ring). Colours are sourced
# (research 4.1): orange Fire, purple Ice, blue Water, yellow Thunder.
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

R = 'D:/Tools/pyrefly-scratch/omnis-options/renders/'
ELEM = ['fire', 'water', 'ice', 'thunder']  # clockwise, our estimate
COL = {'fire': (240, 118, 30), 'water': (40, 120, 235), 'ice': (160, 100, 235), 'thunder': (245, 212, 50)}
GOLD = (227, 185, 74)
INK = (11, 10, 18)


def _angles(S):
    y, x = np.mgrid[0:S, 0:S].astype(np.float32)
    c = (S - 1) / 2
    dx, dy = x - c, y - c
    return np.degrees(np.arctan2(dy, dx)) % 360, np.hypot(dx, dy) / c  # clockwise from +x, radius 0..1


def facing_element(facing, theta):
    # element i sits at facing + i*90 + theta (clockwise); the one at `facing` counts
    k = int(round(-theta / 90.0)) % 4
    return ELEM[k]


def _sector(ang, facing, theta):
    rel = (ang - facing - theta) % 360
    return (np.floor((rel + 45) / 90) % 4).astype(int)


def painted_disc(S, facing, theta, lit=True):
    src = Image.open(R + 'disc-a.png').convert('RGBA')
    cx, cy, r = 469, 497, 318
    tex = src.crop((cx - r, cy - r, cx + r, cy + r)).resize((S, S), Image.LANCZOS).rotate(-theta, resample=Image.BICUBIC)
    t = np.asarray(tex).astype(np.float32) / 255
    ang, rad = _angles(S)
    sec = _sector(ang, facing, theta)
    L = 0.3 * t[..., 0] + 0.59 * t[..., 1] + 0.11 * t[..., 2]
    out = np.zeros((S, S, 4), np.float32)
    col = np.zeros((S, S, 3), np.float32)
    for i, e in enumerate(ELEM):
        col[sec == i] = np.array(COL[e]) / 255
    tint = col * (0.22 + 1.0 * L[..., None])
    rim = (rad > 0.86)[..., None]
    rgb = np.where(rim, t[..., :3] * 0.85, tint * 0.88 + t[..., :3] * 0.12)
    # quarter dividers (screen angles of the boundaries rotate with the disc)
    rel = (ang - facing - theta - 45) % 90
    div = ((rel < 2.2) | (rel > 87.8)) & (rad > 0.18) & (rad < 0.9)
    rgb[div] = np.array(INK) / 255
    if lit:
        fr = (ang - facing + 180) % 360 - 180
        on = (np.abs(fr) <= 45)[..., None]
        rgb = np.where(on, np.clip(rgb * 1.35 + 0.08, 0, 1), rgb * 0.6)
    out[..., :3] = rgb
    out[..., 3] = np.where(rad <= 1.0, t[..., 3], 0) * (rad <= 1.0)
    im = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGBA')
    if lit:
        im = _facing_glow(im, S, facing)
    return im


def _facing_glow(im, S, facing, colour=GOLD):
    g = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    w = max(4, S // 40)
    d.arc((w, w, S - w, S - w), facing - 44, facing + 44, fill=colour + (255,), width=w * 2)
    g = g.filter(ImageFilter.GaussianBlur(w * 0.8))
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.alpha_composite(im)
    out.alpha_composite(g)
    d2 = ImageDraw.Draw(out)
    d2.arc((w, w, S - w, S - w), facing - 44, facing + 44, fill=(255, 240, 200, 255), width=max(2, w // 2))
    return out


def _icon(d, e, cx, cy, s, fill):
    if e == 'fire':  # three tongues, flat base: never a droplet
        pts = [(-0.55, 0.85), (-0.62, 0.1), (-0.38, -0.45), (-0.22, 0.0), (0.0, -1.0), (0.22, 0.0), (0.4, -0.5), (0.62, 0.1), (0.55, 0.85)]
        d.polygon([(cx + x * s, cy + y * s) for x, y in pts], fill=fill)
    elif e == 'water':
        d.polygon([(cx, cy - s)] + [(cx + s * 0.62 * math.cos(math.radians(a)), cy + s * 0.25 + s * 0.62 * math.sin(math.radians(a))) for a in range(-20, 201, 20)], fill=fill)
    elif e == 'ice':
        for a in (0, 60, 120):
            ca, sa = math.cos(math.radians(a)), math.sin(math.radians(a))
            d.line((cx - ca * s, cy - sa * s, cx + ca * s, cy + sa * s), fill=fill, width=max(3, int(s * 0.28)))
    else:
        d.polygon([(cx + s * 0.25, cy - s), (cx - s * 0.5, cy + s * 0.1), (cx - s * 0.02, cy + s * 0.1), (cx - s * 0.25, cy + s),
                   (cx + s * 0.5, cy - s * 0.15), (cx + s * 0.02, cy - s * 0.15)], fill=fill)


def inkgold_disc(S, facing, theta, lit=True):
    # a flat Ink & Gold ring, drawn in 2D here and squashed to read as a tilted mesh
    big = S * 2
    im = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    m = big * 0.04
    d.ellipse((m, m, big - m, big - m), fill=INK + (235,), outline=GOLD + (255,), width=int(big * 0.018))
    for i, e in enumerate(ELEM):
        a0 = facing + theta + i * 90 - 43
        a1 = a0 + 86
        on = lit and facing_element(facing, theta) == e and abs(((facing + theta + i * 90) - facing + 180) % 360 - 180) < 1
        w = int(big * (0.2 if on else 0.15))
        c = COL[e] + (255,)
        if not on and lit:
            c = tuple(int(v * 0.6) for v in COL[e]) + (255,)
        d.arc((m * 2.2, m * 2.2, big - m * 2.2, big - m * 2.2), a0, a1, fill=c, width=w)
        am = math.radians(facing + theta + i * 90)
        rr = big * (0.412 - (0.1 if on else 0.075))
        _icon(d, e, big / 2 + rr * math.cos(am), big / 2 + rr * math.sin(am), big * (0.065 if on else 0.05), INK + (255,))
    d.ellipse((big * 0.45, big * 0.45, big * 0.55, big * 0.55), fill=GOLD + (255,))
    if lit:  # gold pointer at the facing side
        am = math.radians(facing)
        tip = (big / 2 + big * 0.5 * math.cos(am), big / 2 + big * 0.5 * math.sin(am))
        bx, by = big / 2 + big * 0.43 * math.cos(am), big / 2 + big * 0.43 * math.sin(am)
        px, py = -math.sin(am) * big * 0.05, math.cos(am) * big * 0.05
        d.polygon([tip, (bx + px, by + py), (bx - px, by - py)], fill=(255, 240, 200, 255))
    im = im.resize((S, S), Image.LANCZOS)
    glow = im.filter(ImageFilter.GaussianBlur(S / 60))
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.alpha_composite(glow)
    out.alpha_composite(im)
    return out


def disc(treat, S, facing, theta, lit=True):
    if treat == 'c':
        d = inkgold_disc(S, facing, theta, lit)
        return d.resize((S, int(S * 0.82)), Image.LANCZOS)  # a slight tilt: reads as a turning mesh
    return painted_disc(S, facing, theta, lit)


# Disc positions on the billboard canvas (fractions), and the side each disc faces (toward him).
CANVAS = (2050, 1560)
SLOTS = [((0.15, 0.30), 0), ((0.21, 0.66), 0), ((0.85, 0.30), 180), ((0.79, 0.66), 180)]


def red_glow(im, k=1.0):
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    rgb = a[..., :3]
    L = rgb.mean(-1, keepdims=True)
    red = np.concatenate([L * 0.4 + 150, L * 0.25 + 10, L * 0.25 + 20], -1)
    a[..., :3] = rgb * (1 - 0.38 * k) + red * 0.38 * k
    base = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    halo = Image.new('RGBA', base.size, (0, 0, 0, 0))
    alpha = base.split()[3].filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(28))
    halo.paste(Image.new('RGBA', base.size, (255, 40, 40, 255)), (0, 0), alpha.point(lambda v: int(v * 0.85 * k)))
    out = Image.new('RGBA', base.size, (0, 0, 0, 0))
    out.alpha_composite(halo)
    out.alpha_composite(base)
    return out


def translucent(im):
    # O-1 C: A's pixels made see-through and pyrefly-lit (a PIL grade, not a render)
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    rgb = a[..., :3]
    L = rgb.mean(-1, keepdims=True)
    pyre = np.concatenate([L * 0.55 + 60, L * 0.7 + 90, L * 0.6 + 95], -1)
    a[..., :3] = rgb * 0.45 + pyre * 0.55
    a[..., 3] = a[..., 3] * np.clip(0.35 + L[..., 0] / 255 * 0.75, 0, 0.9)
    base = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
    halo = Image.new('RGBA', base.size, (0, 0, 0, 0))
    alpha = im.split()[3].filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(22))
    halo.paste(Image.new('RGBA', base.size, (150, 255, 220, 255)), (0, 0), alpha.point(lambda v: int(v * 0.45)))
    out = Image.new('RGBA', base.size, (0, 0, 0, 0))
    out.alpha_composite(halo)
    out.alpha_composite(base)
    rng = np.random.default_rng(7)
    d = ImageDraw.Draw(out)
    W, H = out.size
    for _ in range(90):
        x, y = rng.uniform(0.1, 0.9) * W, rng.uniform(0.05, 0.95) * H
        r = rng.uniform(3, 8)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(200, 255, 230, int(rng.uniform(120, 230))))
    return out


def figure(which):
    return {'a': 'omnis-a.png', 'b': 'omnis-b2.png', 'c': 'omnis-a.png'}[which]


def composite(fig='a', treat='a', thetas=(0, 0, 0, 0), glow=0.0, discs=True, lit=True, fig_h=0.86, hover=0.10):
    W, H = CANVAS
    cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    S = int(H * 0.34)
    if discs:
        for (pos, facing), th in zip(SLOTS, thetas):
            dimg = disc(treat, S, facing, th, lit)
            cv.alpha_composite(dimg, (int(pos[0] * W - dimg.width / 2), int(pos[1] * H - dimg.height / 2)))
    f = Image.open(R + figure(fig)).convert('RGBA')
    if fig == 'c':
        f = translucent(f)
    fh = int(H * fig_h)
    f = f.resize((int(f.width * fh / f.height), fh), Image.LANCZOS)
    fa = np.asarray(f).astype(np.float32); fa[..., :3] = np.minimum(fa[..., :3], 228); f = Image.fromarray(fa.astype(np.uint8), 'RGBA')
    if glow:
        f = red_glow(f, glow)
    cv.alpha_composite(f, (int(W / 2 - f.width / 2), int(H * (1 - hover) - fh)))
    return cv


if __name__ == '__main__':
    import sys
    composite(*sys.argv[2:3] or ['a']).save(sys.argv[1])
