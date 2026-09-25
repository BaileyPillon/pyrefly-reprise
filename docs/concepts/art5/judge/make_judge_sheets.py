"""Sheets for Bailey's naming (decision sheet 2026-09-25, items 10 and 11; FFX-2 only).

One sheet per girl and batch. Per dressphere: the shipped idle and every judge PASS at 1:1 (the
PNGs' own pixels, so a head that is too big or too small shows), then the same frames at game
size WITH the head-match `scale` applied the way PaintedScale does it (idle standing about 240 px,
every pose at the idle's pixel scale times its `scale`), all on one ground line. At the bottom, the
maker's picks the judge failed, small, with the reason: those slots stay empty (idle, flinch and
fallbacks as today) unless Bailey says otherwise.

    D:/Tools/ComfyUI/python_embeded/python.exe -s make_judge_sheets.py
Writes docs/concepts/chapters/trema/poses/judge/sheet-<girl>.jpg (item 10) and
docs/concepts/art5/judge/sheet-<girl>.jpg (item 11).
"""
from __future__ import annotations

import json
import pathlib
import sys
import textwrap

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from judge_tools import ART, GREY, HERE, font, on, picks, rgba  # noqa: E402

from PIL import Image, ImageDraw  # noqa: E402

TREMA_OUT = pathlib.Path('D:/Final Fantasy/docs/concepts/chapters/trema/poses/judge')
GAME_H = 240
POSES = ['attack', 'cast', 'item', 'hurt', 'ko', 'victory']
TIER_NAME = {0: 'worn at a chapter start', 1: 'one link from a start', 2: 'two or more links'}


def text_block(dr, xy, s, width_px, f, fill, line_h):
    x, y = xy
    for line in textwrap.wrap(s, max(12, int(width_px / (f.size * 0.52)))):
        dr.text((x, y), line, fill=fill, font=f)
        y += line_h
    return y


def dress_block(did, rows, judge):
    """One dressphere: idle + passes at 1:1, then a game-size strip with the scale applied."""
    f16, f20, f24 = font(16), font(20), font(26)
    idle = rgba(ART / did / 'idle.png')
    idle_side = json.loads((ART / did / 'idle.json').read_text(encoding='utf8'))
    passes = [r for r in rows if judge[r['key']]['verdict'] == 'PASS']
    tiles = [('shipped idle', 'the reference: every pose is sized from its pixels', on(idle, GREY))]
    for r in passes:
        j = judge[r['key']]
        cap = f"{r['slot'].upper()}  cand-{r['n']}  judge {j['overall']:.2f}  scale {j['scale']:.2f}"
        tiles.append((cap, j['look'], on(rgba(r['png']), GREY)))
    cap_h = 150
    w1 = sum(t[2].width + 24 for t in tiles) + 40
    h1 = max(t[2].height for t in tiles) + cap_h
    # game-size strip: idle standing GAME_H px; every pose at the idle's pixel scale x its scale.
    k = GAME_H / idle_side['baselineY']
    strip = [('idle', idle.resize((max(1, round(idle.width * k)), max(1, round(idle.height * k))), Image.LANCZOS),
              idle_side['baselineY'] * k)]
    for r in passes:
        j = judge[r['key']]
        side = json.loads(r['json'].read_text(encoding='utf8'))
        im = rgba(r['png'])
        s = k * j['scale']
        strip.append((f"{r['slot']} x{j['scale']:.2f}", im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS),
                      side['cutout']['baselineY'] * s))
    above = max(b for _, _, b in strip)
    below = max(im.height - b for _, im, b in strip)
    w2 = sum(im.width + 30 for _, im, _ in strip) + 40
    h2 = int(above + below) + 70
    W = max(w1, w2, 1400)
    H = 50 + h1 + h2
    block = Image.new('RGB', (W, H), (250, 250, 250))
    dr = ImageDraw.Draw(block)
    tier = rows[0]['tier']
    reach = judge[rows[0]['key']]['reach']
    dr.text((20, 10), f"{did}  ({TIER_NAME[tier]}: {reach})  -  {len(passes)} judge PASS of {len(rows)} maker picks",
            fill=(0, 0, 0), font=f24)
    x, y = 20, 50
    for cap, look, im in tiles:
        dr.text((x, y), cap, fill=(0, 0, 0), font=f20)
        text_block(dr, (x, y + 26), look, im.width, f16, (110, 20, 20), 19)
        block.paste(im, (x, y + cap_h + (h1 - cap_h - im.height)))
        x += im.width + 24
    y = 50 + h1
    dr.text((20, y + 8), 'At game size (idle standing 240 px), each pose at its sidecar scale, one ground line:',
            fill=(0, 0, 0), font=f20)
    ground = y + 44 + above
    dr.line([(20, ground), (W - 20, ground)], fill=(160, 160, 170), width=1)
    x = 20
    bg = Image.new('RGB', (1, 1))
    for name, im, b in strip:
        top = int(ground - b)
        tile = on(im, (250, 250, 250))
        block.paste(tile, (x, top))
        dr.text((x, int(ground + below) + 4), name, fill=(0, 0, 0), font=f16)
        x += im.width + 30
    del bg
    return block


def fails_block(rows, judge, W):
    f16, f20 = font(16), font(20)
    fails = [r for r in rows if judge[r['key']]['verdict'] == 'FAIL']
    if not fails:
        return None
    th = 200
    per_row = max(1, (W - 40) // 360)
    n_rows = (len(fails) + per_row - 1) // per_row
    H = 50 + n_rows * (th + 150)
    im = Image.new('RGB', (W, H), (238, 236, 236))
    dr = ImageDraw.Draw(im)
    dr.text((20, 12), 'Maker picks the judge FAILED: not offered. These slots stay empty (the idle, the flinch and the '
                      'fallbacks, as today) unless you say otherwise.', fill=(120, 0, 0), font=f20)
    for i, r in enumerate(fails):
        j = judge[r['key']]
        cx, cy = 20 + (i % per_row) * 360, 50 + (i // per_row) * (th + 150)
        t = rgba(r['png'])
        s = th / max(t.width, t.height)
        t = on(t.resize((max(1, round(t.width * s)), max(1, round(t.height * s))), Image.LANCZOS), GREY)
        im.paste(t, (cx, cy))
        dr.text((cx, cy + th + 4), f"{r['key']} cand-{r['n']}  {j['overall']:.2f}", fill=(0, 0, 0), font=f16)
        why = '; '.join(j['why']) if j['why'] and j['why'][0].startswith('scale') else j['look']
        text_block(dr, (cx, cy + th + 24), why, 330, font(14), (90, 20, 20), 17)
    return im


def sheet(girl, batch, rows, judge, out, title):
    by = {}
    for r in sorted(rows, key=lambda r: (r['tier'], r['id'], POSES.index(r['slot']))):
        by.setdefault(r['id'], []).append(r)
    blocks = [dress_block(did, rs, judge) for did, rs in by.items()
              if any(judge[r['key']]['verdict'] == 'PASS' for r in rs)]
    W = max([b.width for b in blocks] + [1800])
    fb = fails_block(rows, judge, W)
    parts = blocks + ([fb] if fb else [])
    H = 80 + sum(p.height + 20 for p in parts)
    s = Image.new('RGB', (W, H), (255, 255, 255))
    ImageDraw.Draw(s).text((20, 20), title, fill=(0, 0, 0), font=font(30))
    y = 80
    for p in parts:
        s.paste(p, (0, y))
        y += p.height + 20
    out.parent.mkdir(parents=True, exist_ok=True)
    s.save(out, quality=82)
    print(out, s.size)


def main():
    judge = json.loads((HERE / 'judge.json').read_text(encoding='utf8'))['picks']
    ps = picks()
    for girl in ('yuna', 'paine', 'rikku'):
        t = [p for p in ps if p['batch'] == 'gpu4' and p['id'].startswith(girl)]
        if t:
            sheet(girl, 'gpu4', t, judge, TREMA_OUT / f'sheet-{t[0]["id"]}.jpg',
                  f"{t[0]['id']}: Chapter XIII line-up poses, judge PASSES for Bailey to name (FFX-2 only). "
                  f"Nothing installed. Name a slot to install it.")
        a = [p for p in ps if p['batch'] == 'gpu5' and p['id'].startswith(girl)]
        if a:
            sheet(girl, 'gpu5', a, judge, HERE / f'sheet-{girl}.jpg',
                  f"{girl.capitalize()}: reachable FFX-2 dressphere poses, judge PASSES for Bailey to name (FFX-2 only). "
                  f"Start and one-link dresspheres first. Nothing installed.")


if __name__ == '__main__':
    main()
