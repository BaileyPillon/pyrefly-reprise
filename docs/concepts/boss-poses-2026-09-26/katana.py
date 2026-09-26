"""Yojimbo's drawn katana from approved pixels (split out of bosses.py to keep each file under 400
lines). `python bosses.py katana` calls this."""
from __future__ import annotations

import json
import math

import numpy as np
from PIL import Image, ImageDraw

from bosses import ART, OUT


# ------------------------------------------------------------------ Yojimbo's katana
def katana():
    """The drawn katana, built from approved pixels only: the blade and tsuba of the installed
    cast (approved 2026-09-24) and the idle's own wrapped hilt and pommel (the cast's hilt is
    under his glove), turned onto the cast's grip line. Coordinates read off gridded crops."""
    cast = np.array(Image.open(ART / 'yojimbo-cavern' / 'cast.png').convert('RGBA')).astype(int)
    idle = Image.open(ART / 'yojimbo-cavern' / 'idle.png').convert('RGBA')
    H, W = cast.shape[:2]
    # 1. blade + habaki + tsuba from the cast, purple glove pixels left out
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon([(0, 45), (35, 48), (130, 138), (205, 243), (230, 262), (228, 288), (214, 297),
                               (190, 295), (176, 280), (163, 255), (95, 170), (0, 82)], fill=255)
    r, g, b, a = (cast[..., i] for i in range(4))
    purple = (b - g > 35) & (r > 70)
    keep = (np.array(m) > 0) & (a > 0) & ~purple
    blade = cast.copy(); blade[..., 3] = np.where(keep, a, 0)
    blade_im = Image.fromarray(blade.astype('uint8'), 'RGBA')
    # 2. the idle's hilt, pommel to just under the tsuba, moved onto the cast's grip line
    S, E = np.array([158.0, 378.0]), np.array([238.0, 448.0])
    u = (E - S) / np.linalg.norm(E - S); n = np.array([-u[1], u[0]]); hw = 17
    hm = Image.new('L', idle.size, 0)
    ImageDraw.Draw(hm).polygon([tuple(S + hw * n), tuple(S - hw * n), tuple(E - hw * n), tuple(E + hw * n)], fill=255)
    ia = np.array(idle).astype(int); ia[..., 3] = np.where(np.array(hm) > 0, ia[..., 3], 0)
    hilt = Image.fromarray(ia.astype('uint8'), 'RGBA')
    src_ang = math.degrees(math.atan2(*(S - E)[::-1]))       # ~221 deg: tsuba -> pommel
    dst_ang = 52.8                                          # cast grip line, tsuba -> pommel
    T0 = np.array([214.0, 290.0])                           # where the grip leaves the cast's tsuba
    d = math.radians(dst_ang - src_ang); c_, s_ = math.cos(d), math.sin(d)
    # inverse affine: dst p -> src q = R^-1 (p - T0) + E
    A = (c_, s_, 0, -s_, c_, 0)
    A = (A[0], A[1], E[0] - (A[0] * T0[0] + A[1] * T0[1]), A[3], A[4], E[1] - (A[3] * T0[0] + A[4] * T0[1]))
    hilt_t = hilt.transform((W + 60, H + 60), Image.AFFINE, A, resample=Image.BICUBIC)
    k = Image.new('RGBA', (W + 60, H + 60), (0, 0, 0, 0))
    k.alpha_composite(hilt_t)
    k.alpha_composite(blade_im, (0, 0))
    bb = k.getbbox(); k = k.crop(bb)
    L = float(np.linalg.norm(E - S))
    pommel = T0 + L * np.array([math.cos(math.radians(dst_ang)), math.sin(math.radians(dst_ang))])
    grip1 = T0 + 0.30 * (pommel - T0); grip2 = T0 + 0.75 * (pommel - T0)
    tip = np.array([8.0, 62.0])
    meta = {'bbox': bb, 'tip': list(tip - bb[:2]), 'grip': list((grip1 + grip2) / 2 - bb[:2]),
            'grip1': list(grip1 - bb[:2]), 'grip2': list(grip2 - bb[:2]), 'pommel': list(pommel - bb[:2]),
            'source': 'blade + tsuba: public/art/characters/yojimbo-cavern/cast.png (installed, approved 2026-09-24); '
                      'hilt: yojimbo-cavern/idle.png, turned %.1f deg onto the cast grip line' % (dst_ang - src_ang)}
    d_ = OUT / 'yojimbo' / '_refs'; d_.mkdir(parents=True, exist_ok=True)
    k.save(d_ / 'katana.png'); json.dump(meta, open(d_ / 'katana.json', 'w'), indent=1)
    prev = Image.new('RGBA', k.size, (200, 200, 200, 255)); prev.alpha_composite(k)
    dd = ImageDraw.Draw(prev)
    for key, col in (('tip', 'red'), ('grip1', 'blue'), ('grip2', 'blue'), ('pommel', 'green')):
        x, y = meta[key]; dd.ellipse([x - 4, y - 4, x + 4, y + 4], outline=col, width=2)
    prev.convert('RGB').save(d_ / 'katana-preview.png')
    print(json.dumps(meta))
