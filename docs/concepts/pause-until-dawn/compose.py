#!/usr/bin/env python
"""Compose `sheet.png` (every frame, labelled, with 1:1 type crops) and
`grades.png` (grade A beside grade B) from the rendered frames.

    D:/Tools/ComfyUI/python_embeded/python.exe docs/concepts/pause-until-dawn/compose.py

Run from the repo root. Label type is Bahnschrift, as in the kit's own
`strip.py` — PIL cannot read the repo's woff2 faces, and these labels are
chrome around the mockup, not part of it.
"""
import os
from PIL import Image, ImageDraw, ImageFont

D = os.path.join('docs', 'concepts', 'pause-until-dawn')
INK = (10, 9, 16)
GOLD = (227, 185, 74)
PAPER = (244, 241, 232)
DIM = (150, 146, 138)

BAHN = 'C:/Windows/Fonts/bahnschrift.ttf'


def font(size, weight=400):
    try:
        f = ImageFont.truetype(BAHN, size)
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
        return f
    except Exception:
        return ImageFont.load_default()


def load(name):
    return Image.open(os.path.join(D, name)).convert('RGB')


def caption(d, x, y, text, f, fill=DIM):
    d.text((x, y), text, font=f, fill=fill)


# --------------------------------------------------------------- grades.png

def grades():
    a = load('a-grade-a-faithful.png').resize((1200, 675), Image.LANCZOS)
    b = load('a-ffx-tidus.png').resize((1200, 675), Image.LANCZOS)
    W, H = 24 + 1200 + 24 + 1200 + 24, 24 + 34 + 675 + 40 + 24
    im = Image.new('RGB', (W, H), INK)
    d = ImageDraw.Draw(im)
    f_h = font(26, 700)
    f_s = font(19, 400)
    caption(d, 24, 24, 'GRADE A  ·  "faithful"', f_h, PAPER)
    caption(d, 24 + 1200 + 24, 24, 'GRADE B  ·  "ours"', f_h, GOLD)
    im.paste(a, (24, 24 + 34))
    im.paste(b, (24 + 1200 + 24, 24 + 34))
    y = 24 + 34 + 675 + 10
    caption(d, 24, y, 'cool, desaturated, near-black; gold is the only colour left in the frame', f_s)
    caption(d, 24 + 1200 + 24, y,
            'the same composition on a warm ink-and-gold grade; the paint keeps its skin tones', f_s)
    im.save(os.path.join(D, 'grades.png'))
    print('grades.png', im.size)


# ---------------------------------------------------------------- sheet.png

FRAMES = [
    ('a-ffx-tidus.png', '(a)  FFX · TIDUS · CHAPTER 1', 'grade B "ours" — the recommended grade'),
    ('a-grade-a-faithful.png', '(a2)  THE SAME FRAME, GRADE A', 'grade A "faithful" — the reference\u2019s cool, near-black grade'),
    ('b-ffx-yuna.png', '(b)  FFX · YUNA · mid cross-fade', 'her painting puts her face left, so the chrome goes to the empty side'),
    ('c-ffx2-yuna-gunner.png', '(c)  FFX-2 · YUNA (GUNNER) · CHAPTER 4', 'pink accent, ATB / chain / dressphere / garment grid'),
    ('d-options.png', '(d)  THE OPTIONS TAB', 'same picture; the rows float where the meters were'),
    ('e-hidden.png', '(e)  PANELS HIDDEN  (H)', 'everything but the painting and one line'),
]

CROPS = [
    ('a-ffx-tidus.png', (56, 44, 1000, 102), 'THE TAB STRIP, 1:1  — active 20px, the rest 15px, HP hairline under each member'),
    ('a-ffx-tidus.png', (58, 326, 566, 410), 'THREE METER ROWS, 1:1  — label 14px, bar 124x3, value 15px'),
    ('a-ffx-tidus.png', (54, 694, 768, 822), 'THE OBJECTIVE, 1:1  — eyebrow 14px, the line 39px'),
]


def sheet():
    CW, CH = 780, 439
    pad, gut = 26, 22
    W = pad * 2 + CW * 2 + gut
    rows = len(FRAMES) // 2
    head = 84
    cell_h = CH + 46
    phone_h = 500
    H = pad + head + rows * cell_h + 18 + phone_h + pad

    im = Image.new('RGB', (W, H), INK)
    d = ImageDraw.Draw(im)
    f_t = font(34, 700)
    f_st = font(20, 400)
    f_lab = font(20, 700)
    f_sub = font(17, 400)

    caption(d, pad, pad, 'PAUSE, REBUILT ON THE UNTIL DAWN CHARACTER-SCREEN LAYOUT', f_t, PAPER)
    caption(d, pad, pad + 42,
            'Pyrefly Reprise · concept only, nothing built · frames rendered at 1600x900 from HTML '
            '· paintings are the approved public/art/pause masters, framed with CSS, never edited',
            f_st, DIM)
    d.line([(pad, pad + 74), (W - pad, pad + 74)], fill=(58, 52, 40), width=1)

    y = pad + head
    for i, (name, label, sub) in enumerate(FRAMES):
        x = pad + (i % 2) * (CW + gut)
        if i % 2 == 0 and i:
            y += cell_h
        im.paste(load(name).resize((CW, CH), Image.LANCZOS), (x, y))
        caption(d, x, y + CH + 6, label, f_lab, GOLD)
        caption(d, x, y + CH + 26, sub, f_sub, DIM)
    y += cell_h + 18

    # phone beside the 1:1 crops
    ph = load('f-phone.png')
    scale = 460 / ph.height
    ph = ph.resize((int(ph.width * scale), 460), Image.LANCZOS)
    im.paste(ph, (pad, y))
    caption(d, pad, y + 464, '(f)  390x844', f_lab, GOLD)
    caption(d, pad, y + 484, 'tabs swipe; meters stack', f_sub, DIM)

    cx = pad + ph.width + gut + 10
    cy = y
    for name, box, lab in CROPS:
        caption(d, cx, cy, lab, f_sub, DIM)
        crop = load(name).crop(box)
        im.paste(crop, (cx, cy + 22))
        d.rectangle([cx - 1, cy + 21, cx + crop.width, cy + 22 + crop.height],
                    outline=(58, 52, 40), width=1)
        cy += 22 + crop.height + 20

    im.save(os.path.join(D, 'sheet.png'))
    print('sheet.png', im.size)


grades()
sheet()
