"""Chapter 6 (FFX-2 only): the step-pick contact sheet for the leblanc-x2 LoRA.

One row per LoRA (no LoRA, then each saved step): the installed idle first,
then each step-test render (idle pose, then the unseen attack pose), each
whole figure scaled to the row height, followed by a head crop of every render
enlarged 2x next to the idle's head at the same enlargement (so hair, face and
choker compare at 1:1 relative to each other).

    python pick-sheet.py <cand-dir> <out.jpg> <tag1,tag2,...> <seed1,seed2> [poses=idle,attack]
"""
from __future__ import annotations

import pathlib
import sys

import numpy as np
from PIL import Image, ImageDraw

REPO = pathlib.Path(__file__).resolve().parents[6]
IDLE = REPO / 'public/art/characters/leblanc/idle.png'
ROW_H = 520
HEAD = 200


def flat(p: pathlib.Path) -> Image.Image:
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def head_box(im: Image.Image) -> tuple[int, int, int, int]:
    """Square around the top of the figure: 0.2 of the figure's height, centred on its ink."""
    a = np.asarray(im.convert('L'), dtype=np.int16)
    ink = a < 235
    ys = np.where(ink.any(axis=1))[0]
    if len(ys) == 0:
        return (0, 0, im.width, im.width)
    y0, y1 = int(ys[0]), int(ys[-1])
    side = max(64, int(0.2 * (y1 - y0)))
    band = ink[y0:y0 + side]
    xs = np.where(band.any(axis=0))[0]
    cx = int(xs.mean()) if len(xs) else im.width // 2
    x0 = max(0, min(im.width - side, cx - side // 2))
    top = max(0, y0 - side // 10)
    return (x0, top, x0 + side, top + side)


def scaled(im: Image.Image, h: int) -> Image.Image:
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


def main() -> None:
    cand = pathlib.Path(sys.argv[1])
    out = pathlib.Path(sys.argv[2])
    tags = sys.argv[3].split(',')
    seeds = sys.argv[4].split(',')
    poses = (sys.argv[5] if len(sys.argv) > 5 else 'idle,attack').split(',')
    idle = flat(IDLE)
    idle_head_src = idle.crop(head_box(idle))
    rows = []
    for tag in tags:
        figs, heads = [scaled(idle, ROW_H)], [idle_head_src.resize((HEAD, HEAD), Image.LANCZOS)]
        labels = ['installed idle']
        for pose in poses:
            for seed in seeds:
                p = cand / f'{pose}.{tag}.{seed}.png'
                if not p.exists():
                    continue
                im = flat(p)
                figs.append(scaled(im, ROW_H))
                # same relative enlargement as the idle head: both heads to HEAD px
                heads.append(im.crop(head_box(im)).resize((HEAD, HEAD), Image.LANCZOS))
                labels.append(f'{pose} {seed}')
        W = sum(f.width for f in figs) + 8 * len(figs) + sum(h.width for h in heads) + 8 * len(heads) + 16
        row = Image.new('RGB', (W, ROW_H + 30), (235, 235, 235))
        d = ImageDraw.Draw(row)
        d.text((6, 4), f'{tag}', fill=(0, 0, 0))
        x = 0
        for f, lab in zip(figs, labels):
            row.paste(f, (x, 30))
            d.text((x + 4, 16), lab, fill=(60, 60, 60))
            x += f.width + 8
        x += 16
        for h in heads:
            row.paste(h, (x, 30))
            x += h.width + 8
        rows.append(row)
    W = max(r.width for r in rows)
    sheet = Image.new('RGB', (W, sum(r.height for r in rows) + 6 * len(rows)), (200, 200, 200))
    y = 0
    for r in rows:
        sheet.paste(r, (0, y))
        y += r.height + 6
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=85)
    print(out, sheet.size)


if __name__ == '__main__':
    main()
