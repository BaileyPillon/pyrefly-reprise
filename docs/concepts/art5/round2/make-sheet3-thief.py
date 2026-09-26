"""sheet3-rikku-thief.jpg (FFX-2 only, 2026-09-26): the Rikku Thief idle and each slot's judged pick
at the body-height scale Bailey picked (JUDGE.md Question 1), or "no pick". Reads the
"thiefBodyGate" entries in judge2.json. Agent judge, NOT Bailey; nothing installed.

    python make-sheet3-thief.py
"""
from __future__ import annotations

import json
import pathlib

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
IDLE = pathlib.Path('D:/Final Fantasy/public/art/characters/rikku-thief/idle.png')
SLOTS = ['attack', 'cast', 'item', 'hurt', 'victory']
BG, PANEL, INK, GREEN, RED = (232, 232, 236), (200, 202, 210), (20, 20, 30), (20, 110, 40), (160, 30, 30)


def font(n):
    try:
        return ImageFont.truetype('arial.ttf', n)
    except OSError:
        return ImageFont.load_default()


def soles(im):
    a = im.split()[-1].point(lambda v: 255 if v > 90 else 0)
    return a.getbbox()[3]


def figure(png, scale, d):
    im = Image.open(png).convert('RGBA')
    k = scale * d
    return im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS), int(soles(im) * k)


def strip(entries, d, ground, height, label_font, small, with_labels=True):
    """One row: the idle, then each slot, soles on one ground line."""
    tiles = []
    idle, isole = figure(IDLE, 1.0, d)
    tiles.append(('idle (approved)', 'the height every pose matches', idle, isole, INK))
    for slot in SLOTS:
        e = entries.get(slot) or {}
        if e.get('pick'):
            im, s = figure(e['candidate'], e['scale']['bodyScale'], d)
            sc = e['scale']
            tiles.append((f"{slot}: {e['pick']}", f"{e['verdict']}  head {sc['headAtScale']:.2f}x idle", im, s, GREEN))
        else:
            tiles.append((f'{slot}: no pick', e.get('verdict', 'not judged').replace('FAIL ', ''), None, 0, RED))
    w = sum((t[2].width if t[2] else int(260 * d / 0.46)) + 24 for t in tiles) + 24
    row = Image.new('RGB', (w, height), BG)
    dr = ImageDraw.Draw(row)
    x = 24
    for title, sub, im, s, col in tiles:
        tw = im.width if im else int(260 * d / 0.46)
        if im:
            row.paste(im, (x, ground - s), im)
        else:
            dr.rectangle([x, ground - int(500 * d / 0.46), x + tw, ground], fill=PANEL)
            dr.text((x + 10, ground - int(260 * d / 0.46)), 'no pick', fill=RED, font=label_font)
        if with_labels:
            dr.text((x, ground + 8), title, fill=col, font=label_font)
            dr.text((x, ground + 36), sub, fill=INK, font=small)
        x += tw + 24
    dr.line([(0, ground), (w, ground)], fill=(150, 150, 158), width=1)
    return row


def main():
    j = json.loads((HERE / 'judge2.json').read_text(encoding='utf8'))
    entries = {s: j['slots'].get(f'rikku-thief/{s}', {}).get('thiefBodyGate') for s in SLOTS}
    f28, f22, f16 = font(28), font(22), font(17)
    big = strip(entries, 0.46, 600, 680, f22, f16)
    game = strip(entries, 240 / 1212, 260, 290, f16, f16, with_labels=False)
    W = max(big.width, game.width) + 20
    sheet = Image.new('RGB', (W, 70 + big.height + 40 + game.height + 90), BG)
    dr = ImageDraw.Draw(sheet)
    dr.text((14, 10), 'Rikku Thief poses at BODY height (Bailey 2026-09-26, JUDGE.md Q1). FFX-2 only.', fill=INK, font=f28)
    dr.text((14, 44), 'Agent judge, NOT Bailey. Nothing installed. Each pose is sized so her body matches the idle; her head shrinks to about half to two thirds.', fill=INK, font=f16)
    sheet.paste(big, (10, 70))
    y = 70 + big.height + 8
    dr.text((14, y), 'Game size (idle 240 px tall), same order:', fill=INK, font=f22)
    sheet.paste(game, (10, y + 32))
    notes = [e.get('why', '') for e in entries.values() if e and not e.get('pick')]
    yy = y + 32 + game.height + 6
    for s, e in entries.items():
        if e and not e.get('pick'):
            dr.text((14, yy), f"{s}: {e['why'].split(' Third')[0]} Stopped after three tries (rule 15).", fill=RED, font=f16); yy += 22
    sheet.save(HERE / 'sheet3-rikku-thief.jpg', quality=86)
    print('sheet3-rikku-thief.jpg', sheet.size, len(notes), 'no-pick slots')


if __name__ == '__main__':
    main()
