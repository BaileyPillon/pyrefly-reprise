"""Contact sheet for the logos-x2 step pick: pick-sheet.jpg.

One row per checkpoint (none = the control without the LoRA, then every saved step).
Column 1 is the anchor, the installed idle on its own 832 x 1216 canvas; then the three
seeds whole (scaled to 480 px tall), then 1:1 native-pixel crops of the head/helmet
and of the shoulder emblem + strap (the regions the round-3 judge failed most).

    python pick-sheet.py [--pick STEP]
"""
from __future__ import annotations

import argparse
import pathlib

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[5]
PICK = pathlib.Path('D:/Tools/pyrefly-lora/logos/pick')
ROWS = ['none', 'step500', 'step1000', 'step1500', 'step2000']
H = 480
HEAD = (300, 20, 620, 340)       # canvas box around the idle's head
CHEST = (380, 220, 700, 540)     # canvas box around the idle's emblem and strap
PAD = 8


def anchor() -> Image.Image:
    idle = Image.open(REPO / 'public/art/characters/logos/idle.png').convert('RGBA')
    c = Image.new('RGBA', (832, 1216), (255, 255, 255, 255))
    c.alpha_composite(idle, (164, 42))
    return c.convert('RGB')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--pick', default=None)
    a = ap.parse_args()
    anc = anchor()
    rows = [('anchor: installed idle', [anc, anc, anc])] + [
        (r, [Image.open(PICK / f'{r}.s{i}.png').convert('RGB') for i in (1, 2, 3)]) for r in ROWS]
    sw = int(832 * H / 1216)
    cw = HEAD[2] - HEAD[0]
    width = 170 + 3 * (sw + PAD) + 6 * (cw + PAD)
    height = len(rows) * (max(H, cw) + PAD) + 30
    sheet = Image.new('RGB', (width, height), (235, 235, 235))
    d = ImageDraw.Draw(sheet)
    d.text((10, 8), 'logos-x2 step pick: whole (3 seeds) | 1:1 head x3 | 1:1 emblem+strap x3 (LoRA 0.8, idle IP-Adapter 0.3, OpenPose 0.5)', fill='black')
    y = 30
    for name, ims in rows:
        label = name + ('  <- PICK' if a.pick and name == f'step{a.pick}' else '')
        d.text((10, y + 10), label, fill='red' if 'PICK' in label else 'black')
        x = 170
        for im in ims:
            sheet.paste(im.resize((sw, H), Image.LANCZOS), (x, y))
            x += sw + PAD
        for box in (HEAD, CHEST):
            for im in ims:
                sheet.paste(im.crop(box), (x, y))
                x += cw + PAD
        y += max(H, cw) + PAD
    flex = sorted(PICK.glob('flex-step*.png'), key=lambda q: (int(q.stem.split('step')[1].split('.')[0]), q.stem))
    if flex:
        fw = int(832 * H / 1216)
        strip = Image.new('RGB', (width, H + 40), (235, 235, 235))
        ds = ImageDraw.Draw(strip)
        ds.text((10, 8), 'pose flex, prompt only (no OpenPose): aiming, outstretched arms, leaning forward; steps 1000, 1500, 2000 x 2 seeds', fill='black')
        x = 170
        for q in flex:
            strip.paste(Image.open(q).convert('RGB').resize((fw, H), Image.LANCZOS), (x, 32))
            ds.text((x + 4, 36), q.stem, fill='black')
            x += fw + PAD
        both = Image.new('RGB', (width, sheet.height + strip.height), (235, 235, 235))
        both.paste(sheet, (0, 0))
        both.paste(strip, (0, sheet.height))
        sheet = both
    sheet.save(HERE / 'pick-sheet.jpg', quality=86)
    print(HERE / 'pick-sheet.jpg', sheet.size)


if __name__ == '__main__':
    main()
