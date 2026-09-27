"""Hi-fi round (2026-09-27): compose one painted battle scene per direction, before the HUD goes on top.
FF7 staging after Bailey's call (2026-09-27): the party on the LEFT facing screen-right, Guard Scorpion
on the RIGHT facing screen-left, towering over them. The eye candy is done here, in code, on our own
art: the mako core's glow and bloom, green rim light on every fighter's core-facing edge, warm key
light spill, contact shadows, drifting mako motes and haze, and a vignette. Nothing is mirrored.
Writes <out>/scene-1600.png, <out>/scene-390@2x.png (780x1688) and <out>/marks.json (where the ready
triangle goes: over Cloud's head).
Usage: python compose.py <out_dir> <backdrop.png> <cloud.png> <barret.png> <gs.png> [grade: house|keyart|film] [layout-override.json]
(the override merges per key into the desk / phone layouts, e.g. a backdrop zoom so its floor sits under the fighters)"""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

out, bg_p, cloud_p, barret_p, gs_p = sys.argv[1:6]
grade = sys.argv[6] if len(sys.argv) > 6 else 'house'
os.makedirs(out, exist_ok=True)
MAKO = np.array((110, 255, 185), float)
WARM = np.array((255, 196, 130), float)
G = {'house': dict(rim=1.0, glow=0.55, bloom=0.35, motes=90),
     'keyart': dict(rim=0.8, glow=0.45, bloom=0.28, motes=70),
     'film': dict(rim=1.25, glow=0.65, bloom=0.45, motes=130)}[grade]


def f32(im):
    return np.asarray(im, float) / 255.0


def cover(im, w, h, cx=0.5, top=None, zoom=1.0):
    s = max(w / im.width, h / im.height) * zoom
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x0 = int(np.clip(cx * im.width - w / 2, 0, im.width - w))
    y0 = int((im.height - h) / 2 if top is None else np.clip(top * im.height, 0, im.height - h))
    return im.crop((x0, y0, x0 + w, y0 + h))


def blur(a, r):
    if a.ndim == 2:
        return f32(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)))
    return np.stack([blur(a[..., i], r) for i in range(a.shape[2])], -1)


def lit_figure(fig, h, light_dir, rim, scene_rgb, pos):
    """Scale a cut-out to height h, add the core-side rim light and a light spill sampled from the scene."""
    fig = fig.crop(fig.getbbox())
    w = round(fig.width * h / fig.height)
    fig = fig.resize((w, h), Image.LANCZOS)
    a = f32(fig)
    rgb, al = a[..., :3], a[..., 3]
    r = max(2, round(h / 140))
    sh = np.roll(al, -light_dir * r, axis=1)                   # alpha shifted away from the light
    edge = np.clip(al - sh, 0, 1)                                # pixels on the lit silhouette edge
    edge = np.clip(blur(edge, r * 0.8) * 1.6, 0, 1) * al
    top = np.linspace(1.0, 0.55, h)[:, None]                      # brighter up high (the core is tall)
    rgb = rgb + edge[..., None] * top[..., None] * (MAKO / 255) * 0.75 * rim
    xs = np.linspace(0, 1, w)[None, :] if light_dir > 0 else np.linspace(1, 0, w)[None, :]
    spill = (xs ** 2)[..., None] * (MAKO / 255) * 0.10 * rim     # soft green wash on the core side
    rgb = rgb * (0.92 + 0.08 * xs[..., None]) + spill * al[..., None]
    rgb = rgb * (1 - 0.18 * np.linspace(0, 1, h)[:, None, None] ** 3)   # floor occlusion at the feet
    return np.dstack([np.clip(rgb, 0, 1), al])


def paste(canvas, fig, cx, base):
    h, w = fig.shape[:2]
    x0, y0 = int(cx - w / 2), int(base - h)
    X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(canvas.shape[1], x0 + w), min(canvas.shape[0], y0 + h)
    f = fig[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
    al = f[..., 3:4]
    canvas[Y0:Y1, X0:X1] = canvas[Y0:Y1, X0:X1] * (1 - al) + f[..., :3] * al
    return (x0, y0, w, h)


def shadow(canvas, cx, base, rx, ry, k=0.6):
    H, W = canvas.shape[:2]
    ys, xs = np.mgrid[0:H, 0:W]
    m = np.clip(1 - ((xs - cx) / rx) ** 2 - ((ys - base) / ry) ** 2, 0, 1) ** 0.8
    canvas *= 1 - k * m[..., None]


def scene(W, H, layout, seed):
    bg = Image.open(bg_p).convert('RGB')
    c = f32(cover(bg, W, H, **layout['bg']))
    ys, xs = np.mgrid[0:H, 0:W]
    cx, cy = layout['core']
    d = np.hypot((xs - cx) / (W * 0.30), (ys - cy) / (H * 0.42))
    c = c * 0.9 + (np.clip(1 - d, 0, 1) ** 2)[..., None] * (MAKO / 255) * G['glow']          # core glow
    c = np.clip(c, 0, 1)
    marks = {}
    for name, p, key, ldir in (('gs', gs_p, 'gs', -1), ('barret', barret_p, 'barret', 1), ('cloud', cloud_p, 'cloud', 1)):
        L = layout[key]
        fig = lit_figure(Image.open(p).convert('RGBA'), L['h'], ldir, G['rim'], c, L)
        shadow(c, L['x'] + L.get('sx', 0), L['base'] - 2, fig.shape[1] * 0.42, max(8, L['h'] * 0.035))
        marks[name] = paste(c, fig, L['x'], L['base'])
    # mako motes: soft glowing specks drifting up from the floor and around the core
    rng = np.random.default_rng(seed)
    mote = np.zeros((H, W))
    for _ in range(G['motes']):
        x = rng.normal(cx, W * 0.28); y = rng.uniform(H * 0.15, H * 0.95)
        s = rng.uniform(0.6, 2.4) * W / 1600
        yy, xx = int(y), int(x)
        if 0 <= yy < H and 0 <= xx < W:
            r = max(1, int(s * 3))
            y0, y1, x0, x1 = max(0, yy - r), min(H, yy + r + 1), max(0, xx - r), min(W, xx + r + 1)
            gy, gx = np.mgrid[y0:y1, x0:x1]
            mote[y0:y1, x0:x1] = np.maximum(mote[y0:y1, x0:x1], np.exp(-((gx - x) ** 2 + (gy - y) ** 2) / (2 * s * s)) * rng.uniform(0.4, 1))
    c = c + (blur(mote, 3 * W / 1600) * 1.4 + mote * 0.8)[..., None] * (MAKO / 255)
    # haze low on the floor, then bloom from everything bright, then a warm-edged vignette
    haze = np.clip(1 - np.abs(ys - layout['haze']) / (H * 0.12), 0, 1) ** 2
    c = c + haze[..., None] * (MAKO / 255) * 0.06
    lum = c @ np.array((0.3, 0.59, 0.11))
    bright = np.clip(c * (np.clip(lum - 0.62, 0, 1) / 0.38)[..., None], 0, 1)
    c = c + blur(bright, 18 * W / 1600) * G['bloom'] + blur(bright, 60 * W / 1600) * G['bloom'] * 0.6
    v = np.clip(1 - 0.55 * (np.hypot((xs - W / 2) / (W * 0.62), (ys - H * 0.45) / (H * 0.75)) ** 2.2), 0.25, 1)
    c = c * v[..., None]
    c = 1 - np.exp(-np.clip(c, 0, None) * 1.9)                     # gentle filmic shoulder: no clipped whites
    c = c / (1 - np.exp(-1.9))
    return Image.fromarray((np.clip(c, 0, 1) * 255).astype(np.uint8)), marks


# Desk 1600x900: the playfield is y 120..639 (A+ band top at 159 u = 639 px). Guard Scorpion towers.
desk = {'bg': {'cx': 0.5}, 'core': (800, 300), 'haze': 600,
        'gs': {'x': 1160, 'base': 625, 'h': 490},
        'barret': {'x': 250, 'base': 575, 'h': 318},
        'cloud': {'x': 430, 'base': 628, 'h': 300}}
# Phone 390x844 at 2x = 780x1688: the playfield is y 110..1194 (band top at 597 css px).
phone = {'bg': {'cx': 0.5, 'top': 0.25, 'zoom': 1.3}, 'core': (390, 520), 'haze': 960,
         'gs': {'x': 530, 'base': 985, 'h': 380},
         'barret': {'x': 88, 'base': 960, 'h': 262},
         'cloud': {'x': 222, 'base': 1010, 'h': 250}}
if len(sys.argv) > 7:
    ov = json.load(open(sys.argv[7]))
    for L, k in ((desk, 'desk'), (phone, 'phone')):
        for key, v in ov.get(k, {}).items():
            L[key] = {**L[key], **v} if isinstance(v, dict) and isinstance(L.get(key), dict) else v
im, m1 = scene(1600, 900, desk, 7)
im.save(os.path.join(out, 'scene-1600.png'))
im2, m2 = scene(780, 1688, phone, 7)
im2.save(os.path.join(out, 'scene-390@2x.png'))
json.dump({'desk': m1, 'phone': m2, 'grade': grade, 'inputs': [bg_p, cloud_p, barret_p, gs_p]}, open(os.path.join(out, 'marks.json'), 'w'), indent=1)
print('ok', m1['cloud'], m2['cloud'])
