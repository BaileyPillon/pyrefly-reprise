"""Per-girl review sheets for the Trema line-up pose candidates (FFX-2 only, Chapter XIII).

Each row is one slot: the shipped idle, then every candidate of the production arm, all at ONE
pixel scale (so a head that came out too big shows as too big), with the cutout guard's word and
this session's own look (verdicts.json) under each frame. A strip at the bottom repeats the idle
and the recommended frame per slot at game size (the idle about 240 px tall).

    D:/Tools/ComfyUI/python_embeded/python.exe -s make-sheets.py            # all three girls
Writes sheet-<girl>.jpg (1:1 detail at 0.35 scale) beside this file. Candidates are read from
D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu4/trema-poses/<girl>/<pose>/<arm>/.
"""
from __future__ import annotations

import json
import pathlib

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
CAND = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu4/trema-poses')
ART = pathlib.Path('D:/Final Fantasy/public/art/characters')
POSES = ['attack', 'cast', 'item', 'hurt', 'ko', 'victory']
SCALE = 0.3
GAME_H = 240
BG = (178, 180, 188)


def font(n):
    try:
        return ImageFont.truetype('arial.ttf', n)
    except OSError:
        return ImageFont.load_default()


def flat(path, s):
    im = Image.open(path).convert('RGBA')
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    bg = Image.new('RGB', im.size, BG)
    bg.paste(im, mask=im.split()[-1])
    return bg


def main():
    verdicts = json.loads((HERE / 'verdicts.json').read_text(encoding='utf8'))
    f14, f18, f24 = font(14), font(18), font(26)
    for girl, slots in verdicts['girls'].items():
        idle_path = ART / girl / 'idle.png'
        idle = flat(idle_path, SCALE)
        rows = []
        for pose in POSES:
            v = slots.get(pose)
            if not v:
                continue
            d = CAND / girl / pose / v['arm']
            tiles = [('shipped idle', '', idle)]
            for n in v['cands']:
                p = d / f'cand-{n}.png'
                if not p.exists():
                    continue
                side = json.loads((d / f'cand-{n}.json').read_text(encoding='utf8'))
                guard = 'guard ok' if side['guard']['ok'] else 'guard REJECT'
                look = v['look'].get(str(n), '')
                mark = ' PICK' if n == v.get('pick') else ''
                tiles.append((f'cand-{n}{mark}  {guard}', look, flat(p, SCALE)))
            rows.append((pose, v, tiles))
        W = max(sum(t[2].width + 12 for t in tiles) for _, _, tiles in rows) + 40
        row_h = [max(t[2].height for t in tiles) + 90 for _, _, tiles in rows]
        # game-size strip
        gs = GAME_H / Image.open(idle_path).height
        strip = [('idle', flat(idle_path, gs))]
        for pose, v, _ in rows:
            if v.get('pick'):
                strip.append((pose, flat(CAND / girl / pose / v['arm'] / f"cand-{v['pick']}.png", gs)))
        strip_w = sum(t[1].width + 20 for t in strip) + 40
        W = max(W, strip_w)
        H = 70 + sum(row_h) + GAME_H + 120
        sheet = Image.new('RGB', (W, H), (250, 250, 250))
        dr = ImageDraw.Draw(sheet)
        dr.text((20, 18), f"{girl}: battle-pose CANDIDATES for Chapter XIII (FFX-2 only). Nothing installed. "
                          f"All frames at one pixel scale ({SCALE}); game-size strip at the bottom.", fill=(0, 0, 0), font=f24)
        y = 70
        for (pose, v, tiles), h in zip(rows, row_h):
            dr.text((20, y), f"{pose.upper()}  —  {v['summary']}", fill=(20, 20, 20), font=f18)
            x = 20
            for cap, look, im in tiles:
                sheet.paste(im, (x, y + 28 + (h - 90 - im.height)))
                dr.text((x, y + h - 58), cap, fill=(0, 0, 0), font=f14)
                dr.text((x, y + h - 40), look[:int(im.width / 7) + 1], fill=(90, 20, 20), font=f14)
                x += im.width + 12
            y += h
        dr.text((20, y + 10), 'At game size (idle about 240 px tall), the recommended frame per slot:', fill=(0, 0, 0), font=f18)
        x = 20
        for name, im in strip:
            sheet.paste(im, (x, y + 40 + GAME_H - im.height))
            dr.text((x, y + 44 + GAME_H), name, fill=(0, 0, 0), font=f14)
            x += im.width + 20
        out = HERE / f'sheet-{girl}.jpg'
        sheet.save(out, quality=80)
        print(out, sheet.size)


if __name__ == '__main__':
    main()
