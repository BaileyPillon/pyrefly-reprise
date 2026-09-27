"""Compose the frames (JPEG) and the phone-readable sheet (4 parts, each at most
2000 px tall and under 1 MB) from the rendered PNG sections.

Usage: python sheet.py <rendered dir> <concept dir>
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

R, OUT = sys.argv[1], sys.argv[2]
F = 'C:/Windows/Fonts/'
INK, PAPER, MAKO, MUTE = (11, 10, 18), (244, 241, 232), (92, 230, 168), (170, 164, 180)
W = 1400


def font(name, size):
    return ImageFont.truetype(F + name, size)


H1, H2, BODY, CAP = font('georgiai.ttf', 46), font('bahnschrift.ttf', 26), font('georgia.ttf', 23), font('bahnschrift.ttf', 20)


def wrap(d, text, fnt, width):
    lines, cur = [], ''
    for word in text.split():
        t = (cur + ' ' + word).strip()
        if d.textlength(t, font=fnt) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = word
    lines.append(cur)
    return lines


def para(d, x, y, text, fnt, width, fill=PAPER, gap=8):
    for ln in wrap(d, text, fnt, width):
        d.text((x, y), ln, font=fnt, fill=fill)
        y += fnt.size + gap
    return y


def thumb(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


# 1. frames
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)
FR = {}
for k in 'abc':
    for s in ('1600', '390'):
        im = Image.open(os.path.join(R, f'{k}-{s}.png')).convert('RGB')
        im.save(os.path.join(OUT, 'frames', f'{k}-{s}.jpg'), quality=88, optimize=True)
        FR[k + s] = im


def save(canvas, bottom, name):
    canvas = canvas.crop((0, 0, W, min(2000, bottom + 24)))
    path = os.path.join(OUT, name)
    canvas.save(path, quality=84, optimize=True)
    print(name, canvas.size, os.path.getsize(path) // 1024, 'KB')


def header(d, tag, title):
    d.rectangle((0, 0, 12, 2000), fill=MAKO)
    d.text((44, 30), tag, font=H2, fill=MAKO)
    d.text((44, 66), title, font=H1, fill=PAPER)
    return 136


TAG = 'FF7 BATTLE LOOK · OPTIONS FOR BAILEY · FF7 ONLY'

# 2. part 1: overview
c = Image.new('RGB', (W, 2000), INK)
d = ImageDraw.Draw(c)
y = header(d, TAG, 'Guard Scorpion: three HUD looks')
for b in [
    'The same moment in all three: Cloud and Barret on the Sector 1 reactor bridge, the tail is raised, '
    'Cloud\u2019s turn with Attack / Magic / Item open, Limit and ATB (TIME) gauges on both rows. The scene '
    'and the figures are original placeholders, labelled as such; party HP and MP are placeholder values.',
    'Recommendation: C, FF7\u2019s layout in Ink & Gold materials. It keeps what makes the fight read as FF7 '
    '(the bottom window band, the message window, the enemy window) and dresses it in the language Bailey '
    'approved, with mako green as the third accent. B is the cheap fallback; A is the most literal.',
]:
    y = para(d, 44, y, b, BODY, W - 90) + 6
y += 8
for k, cap in [('a', 'A \u00b7 FF7 classic blue windows, redrawn'), ('b', 'B \u00b7 Ink & Gold with a mako skin'),
               ('c', 'C \u00b7 FF7 layout, Ink & Gold materials (recommended)')]:
    t = thumb(FR[k + '1600'], 900)
    c.paste(t, (44, y))
    d.text((44 + 900 + 24, y + 10), cap.split(' \u00b7 ')[0], font=H1, fill=MAKO if k == 'c' else PAPER)
    para(d, 44 + 900 + 24, y + 72, cap.split(' \u00b7 ')[1], CAP, 400, fill=MUTE, gap=4)
    y += t.height + 22
save(c, y, 'sheet-1-overview.jpg')

# 3. parts 2-4: one option each, desktop + phone
OPT = {
    'a': ('A \u00b7 FF7 classic, redrawn', [
        'How it reads: instantly FF7 to anyone who played it. Blue gradient windows with a white bevel, the '
        'message window at the top, the enemy window and the command window at the bottom left, names, HP, MP, '
        'Limit and TIME at the bottom right. Our type (Exo 2, Rajdhani, Chakra Petch) and a grain pass; no retail font or glyph.',
        'Fidelity: highest. Cost: a second chrome system beside Ink & Gold (window material, pointer, gauges), '
        'about one HUD batch, and every later FF7 screen (results, pause) would need the same treatment.',
        'Risk: it reads as a different game from chapters I to XI. The heavy windows take about a quarter of the frame height at 1600.',
    ]),
    'b': ('B \u00b7 Ink & Gold, mako skin', [
        'How it reads: the same family as the FFX and FFX-2 chapters. The ivory action banner names the moment '
        '("Tail raised"), Cloud\u2019s line sits on an ink chip, the cascade command stack at the left, two skewed '
        'party rows with Limit and ATB bars at the right, the target bracket on the boss. Mako green takes the accent role.',
        'Fidelity: lowest; FF7\u2019s window band is gone. Cost: lowest; it reuses the shipped command stack, party '
        'status, bracket and banner, adds one token (--mako) and swaps the CTB queue for ATB bars.',
        'Risk: FF7 players may not feel FF7 until the fight starts. The banner is our addition, not an FF7 element.',
    ]),
    'c': ('C \u00b7 FF7 layout, Ink & Gold materials', [
        'How it reads: FF7\u2019s shapes and places (top message window, enemy window, command window, the '
        'party band with HP, MP, Limit and TIME) in ink panels with an ivory hairline and a mako inner line, '
        'Cormorant names, Rajdhani numbers, Chakra commands. The "TAIL RAISED" chip in the message window is our addition.',
        'Fidelity: high for layout and flow, ours for the surface: "faithful core, showpiece surface". Cost: '
        'medium; new layout component, existing tokens, fonts and bars.',
        'Risk: the window band takes the same quarter of the frame height as A. The phone stack is tight but legible at 390.',
    ]),
}
for n, k in enumerate('abc', start=2):
    title, lines = OPT[k]
    c = Image.new('RGB', (W, 2000), INK)
    d = ImageDraw.Draw(c)
    y = header(d, TAG + (' \u00b7 RECOMMENDED' if k == 'c' else ''), title)
    for b in lines:
        y = para(d, 44, y, b, BODY, W - 90) + 4
    y += 10
    desk = thumb(FR[k + '1600'], W - 88)
    c.paste(desk, (44, y))
    d.text((44, y + desk.height + 6), '1600 x 900', font=CAP, fill=MUTE)
    y += desk.height + 40
    ph = thumb(FR[k + '390'], 330)
    ph = ph.crop((0, 0, 330, min(ph.height, 2000 - y - 30)))
    c.paste(ph, (44, y))
    d.text((44 + 360, y), '390 x 844 (phone)', font=CAP, fill=MUTE)
    para(d, 44 + 360, y + 34, 'Scene on top, the HUD stacked below it, same moment and content as the desktop frame. '
         'Full-size frames: frames/' + k + '-1600.jpg and frames/' + k + '-390.jpg.', BODY, W - 450, fill=PAPER)
    y += ph.height
    save(c, y, f'sheet-{n}-option-{k}.jpg')
