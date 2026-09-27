"""Compose the phone-readable sheet (4 parts, each <= 2000 px tall, < 1 MB) and
the full-size option frames from the rendered sections.

Usage: python sheet.py <rendered dir> <concept dir>
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont

R, OUT = sys.argv[1], sys.argv[2]
CHK = 'D:/pyrefly-t1-b4a/docs/screenshots/t1-b4a-check/'
R13 = 'D:/Final Fantasy/critic/rounds/round-13/evidence/braskas-final-aeon-win/'
F = 'C:/Windows/Fonts/'
INK, PAPER, GOLD, MUTE = (11, 10, 18), (244, 241, 232), (227, 185, 74), (170, 164, 180)
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


def thumb(path, w):
    im = Image.open(path).convert('RGB')
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def part(name, title, tag, blurb, tiles, phone=None, extra=None):
    """tiles: [(path, caption)] shown 2 per row at 540 wide; phone at the right."""
    canvas = Image.new('RGB', (W, 2000), INK)
    d = ImageDraw.Draw(canvas)
    d.rectangle((0, 0, 12, 2000), fill=GOLD)
    d.text((44, 30), tag, font=H2, fill=GOLD)
    d.text((44, 66), title, font=H1, fill=PAPER)
    y = 136
    for b in blurb:
        y = para(d, 44, y, b, BODY, W - 90) + 6
    y += 10
    tw, x0 = 530 if phone else 640, 44
    ty = y
    for r in range(0, len(tiles), 2):
        row = [thumb(p, tw) for p, _ in tiles[r:r + 2]]
        rh = max(t.height for t in row)
        for j, t in enumerate(row):
            cx = x0 + j * (tw + 20)
            canvas.paste(t, (cx, ty))
            d.text((cx, ty + rh + 6), tiles[r + j][1], font=CAP, fill=MUTE)
        ty += rh + 42
    bottom = ty
    if phone:
        p, cap = phone
        t = thumb(p, 236)
        px = x0 + 2 * (tw + 20) + 4
        canvas.paste(t, (px, y))
        pty = para(d, px, y + t.height + 6, cap, CAP, 250, fill=MUTE, gap=4)
        bottom = max(bottom, pty + 10)
    if extra:
        bottom = para(d, 44, bottom + 4, extra, BODY, W - 90, fill=GOLD) + 10
    canvas = canvas.crop((0, 0, W, min(2000, bottom + 20)))
    path = os.path.join(OUT, name)
    canvas.save(path, quality=84, optimize=True)
    print(name, canvas.size, os.path.getsize(path) // 1024, 'KB')


GC = 'Game case: both (shared presentation plumbing: one dialogue box, two skins).'

part('sheet-1-problem.jpg', 'Where the mid-battle line card goes',
     'PR-0211 · OPTIONS FOR BAILEY · BOTH GAMES', [
         'A story line during a fight (Jecht, Braska, Rikku...) shows on the ivory card. Today it sits at the bottom left and '
         'crosses the party (top row). The backed-out fix moved it to a fixed top band: at 2000x1012 in Chapter V it ran across '
         "Rikku's head, and in Chapter III it covered Braska's Final Aeon during his own lines (bottom row).",
         'No single fixed band clears both the party and the boss on every camera, so here are three placements on real frames. '
         'Recommendation: A, the compact card on the free side, with B as its fallback. Details on the next parts. ' + GC,
     ], [
         (CHK + 'revert-pr0211-ch5-1600.jpg', 'Today (main) · Ch V · 1600: card over the party'),
         (R13 + '25-doublecast.png', 'Today (round 13) · Ch III · 1600: over Lulu, Auron, Yuna'),
         (CHK + 'overlap-ffx2-vegnagun-shuyin-2000-01.jpg', "Backed out · Ch V · 2000: across Rikku's head"),
         (CHK + 'midbeat-braskas-final-aeon-1600-03.jpg', "Backed out · Ch III · 1600: over the boss's own line"),
     ])

OPT = [
    ('a', 'A · The free side', [
        'How it plays: a compact card (about 45% of the width) takes whichever of four slots is clear of the party and the '
        "speaker's on-screen boxes, picked once per beat so it never jumps mid-line. In all four frames here the top-left slot "
        'wins, over the dimmed guide; the gold outline on the first frame shows the pick and the dashed ones the slots it passed over.',
        'Cost: medium. The boxes already exist (stage.screenRects(), which the checker measured with), so the pick is a pure '
        'function with a unit test per chapter camera, plus a smaller card size in cutscene.css.',
        'Risk: a camera that fills every slot (none seen yet) needs a fallback; B is the natural one. The card lands on the '
        'dimmed HUD, never on actors.',
    ]),
    ('b', 'B · A bottom band', [
        'How it plays: the card becomes a full-width band along the bottom, like the cutscene dialogue box, over the party '
        'panel and the command menu, which wait during a beat anyway. The scene above it stays whole: faces, the boss, the '
        'Vegnagun head.',
        'Cost: small. CSS for .battle-midbeat only: band position, a slimmer portrait, a soft dim behind it. No new code paths.',
        'Risk: at close cameras it covers legs (Ch V 2000: Yuna from the thigh down) and hides the HP numbers for the length '
        'of the line. Faces and torsos stay clear in every frame here.',
    ]),
    ('c', 'C · A bubble at the speaker', [
        'How it plays: a small card with a pointer sits beside whoever is talking: next to the boss for Jecht in Chapter III, '
        "above Rikku for her line. Speakers with no body on stage (Jecht and Braska in Chapter V, comms voices) dock top-left "
        'with a VOICE tag.',
        'Cost: highest. Per-actor anchors from the projected boxes, a pointer that follows the camera, the off-stage fallback, '
        'and a phone layout.',
        'Risk: two looks, because many Chapter V lines are off-stage voices; a bubble near a large boss or a crowded party has '
        'little room; the small card is harder to read on a phone.',
    ]),
]
for i, (k, title, blurb) in enumerate(OPT):
    tiles = [(f'{R}/{k}-iii-1600.png', 'Ch III (FFX) · 1600x900'),
             (f'{R}/{k}-iii-2000.png', 'Ch III (FFX) · 2000x1012 · source frame has the menu up'),
             (f'{R}/{k}-v-1600.png', 'Ch V (FFX-2) · 1600x900'),
             (f'{R}/{k}-v-2000.png', "Ch V (FFX-2) · 2000x1012 · the failing camera")]
    part(f'sheet-{i + 2}-option-{k}.jpg', title, f'PR-0211 · OPTION {k.upper()} · BOTH GAMES', blurb, tiles,
         phone=(f'{R}/{k}-v-390.png', 'Phone 390x844 · Ch V'))

for f in sorted(os.listdir(R)):
    if f.endswith('.png'):
        Image.open(os.path.join(R, f)).convert('RGB').save(
            os.path.join(OUT, 'frames', f[:-4] + '.jpg'), quality=85, optimize=True)
print('frames done')
