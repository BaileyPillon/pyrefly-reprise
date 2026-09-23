"""Ormi LoRA r2 step pick sheet (FFX-2 only, Chapter 6): round2/pick-sheet.jpg.

Block 1, the idle pose (lora-ormi.mjs steptest, D:/Tools/pyrefly-lora/ormi/r2/cand/steptest):
  one column per step (500, 1000, 1500, 2000) and seed, the installed idle first; under each
  whole render (0.4x) the head and the costume at 1:1 native pixels.
Block 0, the idle pose through the production recipe (render-r2.mjs idle), round-1 LoRA
  as control, then each r2 step: head, costume and feet at 1:1.
Block 2, an unseen pose (render-r2.mjs ko with each step, no ko frame was trained on):
  the whole render (0.4x), then the head and the torso/shield at 1:1.
Head and costume boxes are fixed per block because the pose (idle prompt; ko skeleton)
puts them in the same place in every render; each crop was looked at.

    python pick-sheet-r2.py
"""
from __future__ import annotations

import pathlib

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
CAND = pathlib.Path('D:/Tools/pyrefly-lora/ormi/r2/cand/steptest')
KO = pathlib.Path('D:/Tools/pyrefly-lora/ormi/r2/poses/ko')
STEPS = [500, 1000, 1500, 2000]
SEEDS = [9300, 9301]
KO_SEEDS = [9310, 9311]
PAD, LABEL = 10, 22


def font(size):
    for n in ('arial.ttf', 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            pass
    return ImageFont.load_default()


def flat(p):
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (236, 236, 240, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def column(label, im, boxes, scale=0.4):
    whole = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    return label, [whole] + [im.crop(b) for b in boxes]


def block(title, cols):
    f, fs = font(20), font(15)
    widths = [max(t.width for t in c[1]) for c in cols]
    rows = len(cols[0][1])
    heights = [max(c[1][r].height for c in cols) for r in range(rows)]
    W = sum(widths) + PAD * (len(cols) + 1)
    H = LABEL * 2 + sum(heights) + PAD * (rows + 1)
    img = Image.new('RGB', (W, H), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((PAD, 2), title, fill=(0, 0, 0), font=f)
    x = PAD
    for (label, tiles), w in zip(cols, widths):
        d.text((x, LABEL + 2), label, fill=(80, 80, 80), font=fs)
        y = LABEL * 2
        for t, h in zip(tiles, heights):
            img.paste(t, (x, y))
            y += h + PAD
        x += w + PAD
    return img


def main():
    idle = Image.open(REPO / 'public/art/characters/ormi/idle.png').convert('RGBA')
    canvas = Image.new('RGBA', (832, 1216), (236, 236, 240, 255))
    canvas.alpha_composite(idle, (131, 10))  # idle.json cropBox origin: the idle on its own render canvas
    idle_im = canvas.convert('RGB')
    head, costume = (250, 0, 600, 330), (200, 280, 640, 900)
    cols = [column('installed idle', idle_im, (head, costume))]
    for step in STEPS:
        for seed in SEEDS:
            p = CAND / f'ormi-x2-r2-step{step:08d}.{seed}.png'
            if p.exists():
                cols.append(column(f'step {step} / {seed}', flat(p), (head, costume)))
    b1 = block('Block 1: idle pose, trigger only (steptest, no costume words), r2 steps vs the installed idle (head, costume at 1:1)', cols)
    feet = (150, 880, 700, 1216)
    cols0 = [column('installed idle', idle_im, (head, costume, feet))]
    for step in ['r1'] + STEPS:
        for seed in SEEDS + [9302]:
            # v2: the second pass, after `flat color, matte` was swapped for the topknot words (round2.md)
            p = pathlib.Path('D:/Tools/pyrefly-lora/ormi/r2/poses/idle') / f'idle.v2step{step}.{seed}.raw.png'
            if p.exists():
                cols0.append(column(('round-1 LoRA' if step == 'r1' else f'step {step}') + f' / {seed}', flat(p), (head, costume, feet)))
    b0 = block('Block 0: idle pose through the production recipe (render-r2.mjs idle: costume words, OpenPose idle skeleton, negatives), r1 control then r2 steps (head, costume, feet at 1:1)', cols0)
    ko_head, ko_body = (800, 250, 1216, 700), (300, 200, 900, 760)
    cols2 = []
    for step in ['r1'] + STEPS:
        for seed in KO_SEEDS:
            p = KO / f'ko.step{step}.{seed}.raw.png'
            if p.exists():
                cols2.append(column(f'ko {"round-1 LoRA" if step == "r1" else "step " + str(step)} / {seed}', flat(p), (ko_head, ko_body), scale=0.3))
    blocks = [b0, b1]
    if cols2:
        blocks.append(block('Block 2: unseen pose (ko, OpenPose), per step (head, torso and shield at 1:1)', cols2))
    W = max(b.width for b in blocks)
    H = sum(b.height for b in blocks) + PAD * len(blocks)
    sheet = Image.new('RGB', (W, H), (255, 255, 255))
    y = 0
    for b in blocks:
        sheet.paste(b, (0, y))
        y += b.height + PAD
    sheet.save(HERE / 'pick-sheet.jpg', quality=85)
    print('pick-sheet', sheet.size)


if __name__ == '__main__':
    main()
