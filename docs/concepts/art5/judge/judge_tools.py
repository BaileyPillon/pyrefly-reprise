"""Independent 1:1 judge of the FFX-2 battle-pose picks (decision sheet 2026-09-25, items 10 and 11).

FFX-2 only. Reads the maker's picks (Chapter XIII line-up: docs/concepts/chapters/trema/poses/
verdicts.json; art5: docs/concepts/art5/verdicts.json) and writes, for the judge's own eyes:

    review   one composite per pick into the scratch folder: the shipped idle and the pick at ONE
             pixel scale (the idle at its native size), the pick over a split mid-grey / dark-navy
             ground (fringes show on both), and 2x head crops of both with a 10 px source grid
             (labels every 50 px, in the source PNG's own pixels) for the head measurement.
    marks    re-draws the measured eye-line and chin points on the head crops (measure.json), so a
             reading can be checked before it becomes a sidecar `scale`.

    D:/Tools/ComfyUI/python_embeded/python.exe -s judge_tools.py review [id ...]
    D:/Tools/ComfyUI/python_embeded/python.exe -s judge_tools.py marks  [id ...]

Nothing here writes to public/art or approved-hashes.json. Sheets are make_judge_sheets.py.
"""
from __future__ import annotations

import json
import math
import pathlib
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
REPO = pathlib.Path('D:/Final Fantasy')
ART = REPO / 'public/art/characters'
TREMA = REPO / 'docs/concepts/chapters/trema/poses'
ART5 = REPO / 'docs/concepts/art5'
CAND4 = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu4/trema-poses')
CAND5 = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu5')
SCRATCH = pathlib.Path('D:/Tools/pyrefly-scratch/dec-0925/poses/review')
POSES = ['attack', 'cast', 'item', 'hurt', 'ko', 'victory']
GREY, NAVY = (178, 180, 188), (22, 28, 52)
# Out of reach in every shipped FFX-2 chapter today (item 11): they wait.
WAIT = {'rikku-berserker', 'paine-samurai'}

# Reach on today's builds (grid links from src/battle/ffx2/garment-grids.ts, nodes filled as
# src/battle/ffx2/setup.ts gridNodeContents; measured 2026-09-25 by reach.mts in this folder).
# 0 = worn at a chapter's start, 1 = one link from a start, 2 = more than one link.
TIER = {
    'yuna-dark-knight': 0, 'paine-dark-knight': 0, 'rikku-alchemist': 0,
    'rikku-dark-knight': 0, 'paine-warrior': 0, 'rikku-thief': 0, 'yuna-gunner': 0,
    'yuna-black-mage': 1, 'rikku-gunner': 1, 'rikku-black-mage': 1, 'paine-gunner': 1,
    'paine-black-mage': 1, 'paine-white-mage': 1, 'yuna-songstress': 1, 'rikku-white-mage': 1,
    'yuna-warrior': 2,
}


def font(n):
    try:
        return ImageFont.truetype('arial.ttf', n)
    except OSError:
        return ImageFont.load_default()


def picks():
    """Every maker pick (pick != null) in the two batches, reachable dresspheres only."""
    out = []
    v4 = json.loads((TREMA / 'verdicts.json').read_text(encoding='utf8'))
    for girl, slots in v4['girls'].items():
        for pose in POSES:
            v = slots.get(pose)
            if v and v.get('pick'):
                d = CAND4 / girl / pose / v['arm']
                out.append(dict(id=girl, slot=pose, batch='gpu4', dir=d, n=v['pick'], maker=v['summary']))
    v5 = json.loads((ART5 / 'verdicts.json').read_text(encoding='utf8'))
    for girl, slots in v5['girls'].items():
        if girl in WAIT:
            continue
        for pose in POSES:
            v = slots.get(pose)
            if v and v.get('pick'):
                d = CAND5 / girl / pose
                out.append(dict(id=girl, slot=pose, batch='gpu5', dir=d, n=v['pick'], maker=v['summary']))
    for p in out:
        p['png'] = p['dir'] / f"cand-{p['n']}.png"
        p['json'] = p['dir'] / f"cand-{p['n']}.json"
        p['key'] = f"{p['id']}/{p['slot']}"
        p['tier'] = TIER.get(p['id'], 2)
    return out


def rgba(path):
    return Image.open(path).convert('RGBA')


def on(im, colour):
    bg = Image.new('RGB', im.size, colour)
    bg.paste(im, mask=im.split()[-1])
    return bg


def split_ground(im):
    """Left half mid grey, right half dark navy, so a fringe shows on one of them."""
    bg = Image.new('RGB', im.size, GREY)
    bg.paste(NAVY, (im.width // 2, 0, im.width, im.height))
    bg.paste(im, mask=im.split()[-1])
    return bg


def nose_in_cutout(side):
    """The skeleton's nose keypoint (pure red disc) mapped into the cutout's pixels."""
    skel = REPO / side['controlnet']['skeleton']
    a = np.array(Image.open(skel).convert('RGB')).astype(int)
    m = (a[:, :, 0] > 240) & (a[:, :, 1] < 15) & (a[:, :, 2] < 15)
    ys, xs = np.nonzero(m)
    sx, sy = float(xs.mean()), float(ys.mean())
    # skeleton canvas = the raw render canvas; the cutout is cropBox of the raw.
    cb = side['cutout']['cropBox']
    return sx - cb[0], sy - cb[1]


# Eye-line centre of each shipped idle, read by eye off 1x gridded crops (source pixels). Only
# where the head crop is centred; the measurement itself is measure.json.
IDLE_EYES = {
    'paine-black-mage': (270, 210), 'paine-dark-knight': (360, 245), 'paine-gunner': (285, 158),
    'paine-warrior': (185, 155), 'paine-white-mage': (420, 150), 'rikku-alchemist': (248, 183),
    'rikku-black-mage': (230, 236), 'rikku-dark-knight': (315, 180), 'rikku-gunner': (161, 150),
    'rikku-thief': (297, 330), 'rikku-white-mage': (193, 190), 'yuna-black-mage': (325, 190),
    'yuna-dark-knight': (255, 249), 'yuna-gunner': (226, 152), 'yuna-songstress': (253, 141),
    'yuna-warrior': (335, 143),
}


def idle_head(idle_id):
    return IDLE_EYES[idle_id]


def head_crop(im, cx, cy, half_w=120, up=170, down=110, zoom=2, marks=None):
    """2x crop around (cx, cy) with a 10 px grid in SOURCE pixels, labels every 50."""
    x0, y0 = int(cx - half_w), int(cy - up)
    x1, y1 = int(cx + half_w), int(cy + down)
    c = Image.new('RGBA', (x1 - x0, y1 - y0), (0, 0, 0, 0))
    c.paste(im.crop((max(0, x0), max(0, y0), min(im.width, x1), min(im.height, y1))),
            (max(0, -x0), max(0, -y0)))
    c = on(c, GREY).resize((c.width * zoom, c.height * zoom), Image.LANCZOS)
    dr = ImageDraw.Draw(c, 'RGBA')
    f = font(13)
    for gx in range((x0 // 10 + 1) * 10, x1, 10):
        X = (gx - x0) * zoom
        strong = gx % 50 == 0
        dr.line([(X, 0), (X, c.height)], fill=(0, 90, 255, 120 if strong else 45), width=1)
        if strong:
            dr.text((X + 2, 2), str(gx), fill=(0, 40, 160, 255), font=f)
    for gy in range((y0 // 10 + 1) * 10, y1, 10):
        Y = (gy - y0) * zoom
        strong = gy % 50 == 0
        dr.line([(0, Y), (c.width, Y)], fill=(255, 40, 0, 120 if strong else 45), width=1)
        if strong:
            dr.text((2, Y + 2), str(gy), fill=(160, 20, 0, 255), font=f)
    for (px, py, col) in (marks or []):
        X, Y = (px - x0) * zoom, (py - y0) * zoom
        dr.line([(X - 14, Y), (X + 14, Y)], fill=col, width=2)
        dr.line([(X, Y - 14), (X, Y + 14)], fill=col, width=2)
    return c


def mark_list(m):
    if 'chin' not in m:
        return None
    pts = [(*m[k], (255, 0, 200, 255)) for k in ('eyeL', 'eyeR') if k in m]
    return pts + [(*m['chin'], (0, 200, 60, 255))]


def head_len(m):
    """Eye-line centre to chin tip, in source pixels (eyeL/eyeR averaged; one eye if only one shows)."""
    eyes = [m[k] for k in ('eyeL', 'eyeR') if k in m]
    ex = sum(e[0] for e in eyes) / len(eyes)
    ey = sum(e[1] for e in eyes) / len(eyes)
    return math.hypot(m['chin'][0] - ex, m['chin'][1] - ey)


def review(ids, with_marks=False):
    SCRATCH.mkdir(parents=True, exist_ok=True)
    meas = {}
    mpath = HERE / 'measure.json'
    if with_marks and mpath.exists():
        meas = json.loads(mpath.read_text(encoding='utf8'))
    f18 = font(18)
    for p in picks():
        if ids and p['id'] not in ids and p['key'] not in ids:
            continue
        side = json.loads(p['json'].read_text(encoding='utf8'))
        idle = rgba(ART / p['id'] / 'idle.png')
        pick = rgba(p['png'])
        nx, ny = nose_in_cutout(side)
        ix, iy = idle_head(p['id'])
        m = meas.get(p['key'], {})
        mi = meas.get(p['id'] + '/idle', {})
        pm, im_ = mark_list(m), mark_list(mi)
        prone = p['slot'] == 'ko'
        if 'chin' in m:  # centre the check crop on the measured face, not the skeleton's nose
            eyes = [m[k] for k in ('eyeL', 'eyeR') if k in m]
            nx = (sum(e[0] for e in eyes) / len(eyes) + m['chin'][0]) / 2
            ny = (sum(e[1] for e in eyes) / len(eyes) + m['chin'][1]) / 2 + (0 if prone else 40)
        hc = head_crop(pick, nx, ny - (0 if prone else 40), half_w=150 if prone else 120,
                       up=150 if prone else 150, down=150 if prone else 110, marks=pm)
        ic = head_crop(idle, ix, iy, up=130, down=110, marks=im_)
        if with_marks:
            out = Image.new('RGB', (hc.width + ic.width + 30, max(hc.height, ic.height) + 30), (250, 250, 250))
            ImageDraw.Draw(out).text((6, 4), f"{p['key']} marks: magenta = eyes, green = chin; pick | idle", fill=(0, 0, 0), font=f18)
            out.paste(hc, (0, 30))
            out.paste(ic, (hc.width + 30, 30))
            out.save(SCRATCH / (p['key'].replace('/', '__') + '.marks.jpg'), quality=88)
            continue
        left = split_ground(idle)
        mid = split_ground(pick)
        W = left.width + mid.width + max(hc.width, ic.width) + 60
        H = max(left.height, mid.height, hc.height + ic.height + 30) + 40
        out = Image.new('RGB', (W, H), (250, 250, 250))
        dr = ImageDraw.Draw(out)
        dr.text((10, 8), f"{p['key']}  {p['batch']} cand-{p['n']}  (idle | pick at one pixel scale; head crops 2x, grid = source px)",
                fill=(0, 0, 0), font=f18)
        out.paste(left, (10, 36))
        out.paste(mid, (20 + left.width, 36))
        out.paste(hc, (40 + left.width + mid.width, 36))
        out.paste(ic, (40 + left.width + mid.width, 36 + hc.height + 20))
        name = p['key'].replace('/', '__') + ('.marks' if with_marks else '') + '.jpg'
        out.save(SCRATCH / name, quality=88)
        print(SCRATCH / name, out.size, 'nose', round(nx), round(ny), 'idlehead', round(ix), round(iy))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'review'
    rest = sys.argv[2:]
    if cmd == 'list':
        for p in picks():
            print(p['tier'], p['key'], p['batch'], p['n'])
    elif cmd == 'review':
        review(rest)
    elif cmd == 'marks':
        review(rest, with_marks=True)
