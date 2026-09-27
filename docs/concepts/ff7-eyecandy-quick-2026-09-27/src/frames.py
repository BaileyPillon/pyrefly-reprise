"""Build the scene layer (no HUD) of each eye-candy frame. Usage:
    python frames.py <workdir> [f1 f2 f3 p2]
<workdir> holds cloud.png and barret.png, the rembg cut-outs of the hi-fi pilots (see README).
Writes <workdir>/scene-<id>.png and <workdir>/scene-<id>.json (anchor points for the HUD page)."""
import json
import math
import sys
import numpy as np
from fxlib import F32, load_rgba, save_rgb, blur, grid, col, grade, lum
from stage import (ray_fan, backdrop, heat_shimmer, depth_of_field, wet_floor, Fig, layer_of, over, shadows,
                   reflection, god_rays, motes, bloom, core_glow, GS_IDLE, GS_UP, MAKO)
import fx

WORK = sys.argv[1]
WANT = sys.argv[2:] or ['f1', 'f2', 'f3', 'p2']


def load_cloud():
    """The hi-fi Cloud pilot also paints a second sword on his back: erase that hilt (never the figure)."""
    a = load_rgba(f'{WORK}/cloud.png').copy()
    h, w = a.shape[:2]
    x, y = grid(h, w)
    p0, p1 = np.array([40.0, 30.0]), np.array([232.0, 345.0])
    d = p1 - p0
    t = np.clip(((x - p0[0]) * d[0] + (y - p0[1]) * d[1]) / (d @ d), 0, 1)
    dist = np.hypot(x - (p0[0] + t * d[0]), y - (p0[1] + t * d[1]))
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    blond = (r > 0.62) & (g > 0.52) & ((r - b) > 0.1)
    kill = (dist < 46) & (y < 350) & ~blond
    a[..., 3] = np.where(kill, 0, a[..., 3])
    return a


# ---------------------------------------------------------------- layouts
DESK = dict(W=1600, H=900, bg=(0.70, -247, -348), y_f=560, core=(660, 330), col=(104, 560, 70),
            barret=dict(h=330, x=200, y=592), cloud=dict(h=350, x=425, y=618),
            boss=dict(w=880, x=1165, y=626), boss_up=dict(w=740, x=1180, y=626))
PHONE = dict(W=780, H=1688, bg=(0.89, -853, -275), y_f=880, core=(300, 560), col=(300, 880, 82),
             barret=dict(h=330, x=100, y=1140), cloud=dict(h=350, x=290, y=1172),
             boss=dict(w=600, x=480, y=990), boss_up=dict(w=560, x=500, y=990))


def base_stage(L, boss_img, seed, cloud_rot=None, cloud_at=None, dark=1.0):
    W, H, y_f = L['W'], L['H'], L['y_f']
    s, ox, oy = L['bg']
    cx, cy = L['core']
    img = backdrop(W, H, s, ox, oy)
    img = heat_shimmer(img, cx, (L['col'][0] + L['col'][1]) / 2, L['col'][2] * 2.4, (L['col'][1] - L['col'][0]) * 0.7, 2.2, seed)
    img = depth_of_field(img, y_f)
    img = img * 0.92
    img = wet_floor(img, y_f, seed)
    img = img + core_glow(H, W, cx, L['col'][0], L['col'][1], L['col'][2], k=0.18)

    barret = Fig(load_rgba(f'{WORK}/barret.png'), height=L['barret']['h']).light(cx, facing=+1)
    cloud_rgba = load_cloud()
    if cloud_rot is None:
        cloud = Fig(cloud_rgba, height=L['cloud']['h']).light(cx, facing=+1)
    else:
        cloud = Fig(cloud_rgba, height=L['cloud']['h'], rotate=cloud_rot).light(cx, facing=+1, rim_k=1.6)
    bw = L['boss_up']['w'] if boss_img == GS_UP else L['boss']['w']
    bl = L['boss_up'] if boss_img == GS_UP else L['boss']
    boss = Fig(load_rgba(boss_img), width=bw, flip=True).light(cx, facing=-1, rim_k=0.8, rim_px=4, dark=0.55, top_k=0.2)

    lb = layer_of(barret, W, H, L['barret']['x'], L['barret']['y'])
    cpos = cloud_at or (L['cloud']['x'], L['cloud']['y'])
    lc = layer_of(cloud, W, H, *cpos)
    lboss = layer_of(boss, W, H, bl['x'], bl['y'])

    # floor: shadows then reflections
    img = shadows(img, lboss, bl['x'], bl['y'], boss.w * 0.8, away=+1)
    img = shadows(img, lb, L['barret']['x'], L['barret']['y'], barret.w, away=-1)
    if cloud_at is None:
        img = shadows(img, lc, cpos[0], cpos[1], cloud.w * 0.8, away=-1)
    img = reflection(img, lboss, bl['y'], k=0.28, seed=seed)
    img = reflection(img, lb, L['barret']['y'], seed=seed + 1)
    if cloud_at is None:
        img = reflection(img, lc, cpos[1], seed=seed + 2)

    occ = np.clip(lb[..., 3] + lc[..., 3] + lboss[..., 3], 0, 1)
    img = god_rays(img, occ, cx, cy, thr=0.62, k=0.5 * dark)
    img = img + ray_fan(H, W, cx, cy, occ, seed, k=0.22 * dark)
    img = img * dark
    if dark < 1:  # the Limit's darkened stage: the bystanders dim, Cloud stays lit
        for lay_ in (lb, lboss):
            lay_[..., :3] *= 0.5 + 0.4 * dark
    img = over(img, lboss)
    img = over(img, lb)
    img = over(img, lc)
    anchors = dict(
        cloud=dict(x=cpos[0], top=float(cpos[1] - cloud.h), feet=cpos[1], w=cloud.w, h=cloud.h),
        barret=dict(x=L['barret']['x'], top=float(L['barret']['y'] - barret.h), feet=L['barret']['y'], w=barret.w),
        boss=dict(x=bl['x'], top=float(bl['y'] - boss.h), feet=bl['y'], w=boss.w, h=boss.h),
        core=dict(x=cx, y=cy))
    return img, dict(barret=lb, cloud=lc, boss=lboss, boss_fig=boss, cloud_fig=cloud, occ=occ), anchors


def finish(img, L, seed, mote_k=1.0, grade_kw=None):
    W, H = L['W'], L['H']
    sc = W / 1600 if W > H else 1.0
    img = img + motes(H, W, L['core'][0], L['core'][1], seed, n_small=int(340 * (1 if W > H else 1.3)), k=mote_k,
                      spread=(430 * sc if W > H else 300, 0), ybounds=(40, L['y_f'] + 60))
    img = bloom(img)
    return grade(img, seed, **(grade_kw or {}))


def frame_f1(L, key):
    img, lay, an = base_stage(L, GS_IDLE, 11)
    img = img + fx.boss_eye_glow(L, lay['boss_fig'], an)
    img = finish(img, L, 11)
    return img, an


def frame_f2(L, key):
    img, lay, an = base_stage(L, GS_UP, 21)
    img, extra = fx.tail_laser(img, L, lay, an)
    an.update(extra)
    img = finish(img, L, 21, mote_k=1.2, grade_kw=dict(vignette=0.3))
    return img, an


def frame_f3(L, key):
    leap = (L['W'] * 0.44, L['H'] * 0.585) if L['W'] > L['H'] else (L['W'] * 0.40, L['H'] * 0.50)
    img, lay, an = base_stage(L, GS_IDLE, 31, cloud_rot=-22, cloud_at=leap, dark=0.62)
    img, extra = fx.braver(img, L, lay, an)
    an.update(extra)
    img = finish(img, L, 31, mote_k=0.6, grade_kw=dict(vignette=0.62, contrast=0.18))
    return img, an


BUILD = {'f1': (frame_f1, DESK), 'f2': (frame_f2, DESK), 'f3': (frame_f3, DESK),
         'p1': (frame_f1, PHONE), 'p2': (frame_f2, PHONE), 'p3': (frame_f3, PHONE)}

for key in WANT:
    fn, L = BUILD[key]
    img, an = fn(L, key)
    save_rgb(img, f'{WORK}/scene-{key}.png')
    with open(f'{WORK}/scene-{key}.json', 'w') as f:
        json.dump(an, f, indent=1, default=float)
    print('built', key, img.shape)
