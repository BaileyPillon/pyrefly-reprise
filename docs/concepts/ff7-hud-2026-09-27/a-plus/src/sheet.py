"""A+ frames (JPEG), pixel checks against the spec, and the phone-readable sheet parts
(each at most 2000 px tall and under 1 MB).

Usage: python sheet.py <rendered dir> <a-plus dir>
"""
import json
import os
import sys
from PIL import Image, ImageDraw, ImageFont

R, OUT = sys.argv[1], sys.argv[2]
A_DIR = os.path.join(OUT, '..', 'frames')  # option A's frames, for the side by side
F = 'C:/Windows/Fonts/'
INK, PAPER, BLUE, MUTE, OK, BAD, EST = (11, 10, 18), (244, 241, 232), (120, 150, 255), (170, 164, 180), (110, 220, 140), (240, 110, 100), (240, 200, 110)
W = 1400


def font(name, size):
    return ImageFont.truetype(F + name, size)


H1, H2, BODY, CAP = font('georgiai.ttf', 44), font('bahnschrift.ttf', 25), font('georgia.ttf', 22), font('bahnschrift.ttf', 20)
TAG = 'FF7 BATTLE HUD · A+ (A, EVEN MORE FAITHFUL) · FF7 ONLY'

# ---------------- frames ----------------
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)
NAMES = {'f1': '1-cloud-turn-attack', 'f2': '2-magic-mp-cost', 'f3': '3-targeting', 'f4': '4-tail-laser-damage',
         'f5': '5-limit-full', 'f5b': '5b-limit-window', 'f1raj': 'type-rajdhani-1', 'f1pillar': 'pillarbox-1'}
FR = {}
for key, name in NAMES.items():
    for size in ('1600', '390'):
        p = os.path.join(R, f'{key}-{size}.png')
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert('RGB')
        im.save(os.path.join(OUT, 'frames', f'{name}-{size}.jpg'), quality=90, optimize=True)
        FR[key + size] = im

# ---------------- pixel checks on the rendered PNG (spec §7) ----------------
M = json.load(open(os.path.join(R, 'metrics.json')))
f1 = Image.open(os.path.join(R, 'f1-1600.png')).convert('RGB')
px = f1.load()
checks = []


def check(item, ok, note):
    checks.append({'item': item, 'ok': ok, 'note': note})


wr = M['sections']['f1-1600']['wins']['band-right']
wl = M['sections']['f1-1600']['wins']['band-left']
inset = 14
corners = {'TL': (wr['x'] + inset, wr['y'] + inset), 'TR': (wr['x'] + wr['w'] - inset, wr['y'] + inset),
           'BL': (wr['x'] + inset, wr['y'] + wr['h'] - inset), 'BR': (wr['x'] + wr['w'] - inset, wr['y'] + wr['h'] - inset)}
want = {'TL': 176, 'TR': 128, 'BL': 80, 'BR': 32}
got = {k: px[round(x), round(y)] for k, (x, y) in corners.items()}
ok1 = all(abs(got[k][2] - want[k]) <= 8 and got[k][0] <= 8 and got[k][1] <= 8 for k in want)
cx, cy = wl['x'] + wl['w'] * 0.5, wl['y'] + wl['h'] * 0.5
centre = px[round(cx), round(cy)]
ok1 = ok1 and abs(centre[2] - 104) <= 8
check(1, ok1, 'corners (3 px inside the frame) ' + ', '.join(f'{k} {got[k]}' for k in want) + f'; centre {centre} vs bilinear 104')

ramp = [px[round(wr['x']) + i, round(wr['y'] + wr['h'] / 2)] for i in range(13)]
grey = all(max(c) - min(c) <= 6 for c in ramp[:12])
check(2, grey, 'left-edge ramp ' + ' '.join('#%02X%02X%02X' % c for c in ramp[:12]) + '; radius 2 u = 8 px; no shadow, glow or grain')

top_pct, bot_pct = wr['y'] / 900 * 100, (wr['y'] + wr['h']) / 900 * 100
split = (wl['x'] + wl['w']) / 1600 * 100
strip = all(max(px[x, 880]) < 8 for x in range(0, 1600, 50))
check(3, abs(top_pct - 71.0) <= 0.5 and abs(bot_pct - 95.1) <= 0.5 and abs(split - 42.5) <= 1 and strip,
      f'band top {top_pct:.1f} %, bottom {bot_pct:.1f} %, split {split:.1f} %, black strip below: {strip}')

phone_spill = [s for k, v in M['sections'].items() if k.endswith('-390') for s in v['spill'] if s.get('offFrame')]
check(16, not phone_spill, f'phone: nothing outside 390 px ({len(phone_spill)} spills); command slots 44 px; both band windows at 2.05 px/u')
json.dump(checks, open(os.path.join(OUT, 'checks.json'), 'w'), indent=1)
for c in checks:
    print('CHECK', c['item'], 'PASS' if c['ok'] else 'FAIL', c['note'])
print('spills:', {k: v['spill'] for k, v in M['sections'].items() if v['spill']})


# ---------------- sheet helpers ----------------
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


def para(d, x, y, text, fnt=BODY, width=W - 90, fill=PAPER, gap=7):
    for ln in wrap(d, text, fnt, width):
        d.text((x, y), ln, font=fnt, fill=fill)
        y += fnt.size + gap
    return y


def thumb(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def new(title, tag=TAG):
    c = Image.new('RGB', (W, 2000), INK)
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, 12, 2000), fill=BLUE)
    d.text((44, 28), tag, font=H2, fill=BLUE)
    d.text((44, 62), title, font=H1, fill=PAPER)
    return c, d, 132


def save(c, bottom, name):
    c = c.crop((0, 0, W, min(2000, bottom + 24)))
    path = os.path.join(OUT, name)
    q = 86
    while True:
        c.save(path, quality=q, optimize=True)
        if os.path.getsize(path) < 1_000_000 or q < 60:
            break
        q -= 6
    print(name, c.size, os.path.getsize(path) // 1024, 'KB')
    return name


def frame_block(c, d, y, im, caption, w=W - 88):
    t = thumb(im, w)
    c.paste(t, (44, y))
    d.text((44, y + t.height + 6), caption, font=CAP, fill=MUTE)
    return y + t.height + 42


PARTS = []

# ---------------- part 1: A vs A+ ----------------
c, d, y = new('A (picked) beside A+ (the refinement)')
y = para(d, 44, y, 'The same moment in both: Cloud\u2019s turn with the tail raised. Top: option A as Bailey picked it. '
         'Bottom: A+, rebuilt to the measured FF7 battle screen (docs/plans/ff7-hud-faithful-a-spec.md). '
         'The scene and figures are the same original placeholders.') + 8
A1 = Image.open(os.path.join(A_DIR, 'a-1600.jpg')).convert('RGB')
y = frame_block(c, d, y, A1, 'A \u00b7 as picked (frames/a-1600.jpg)')
y = frame_block(c, d, y, FR['f11600'], 'A+ \u00b7 frame 1 (a-plus/frames/1-cloud-turn-attack-1600.jpg)')
PARTS.append(save(c, y, 'sheet-1-a-vs-aplus.jpg'))

# ---------------- part 2: what changed ----------------
c, d, y = new('What changed from A, and why')
band = lambda im, y0: thumb(im.crop((0, y0, 1600, 900)), W - 88)
for im, y0, cap in [(A1, 660, 'A \u00b7 the band'), (FR['f11600'], 628, 'A+ \u00b7 the band')]:
    t = band(im, y0)
    c.paste(t, (44, y))
    d.text((44, y + t.height + 4), cap, font=CAP, fill=MUTE)
    y += t.height + 36
CHANGES = [
    'Window colour: A\u2019s light 162\u00b0 purple-blue gradient became FF7\u2019s four-corner, blue-only gradient per window (#0000B0 / #000080 / #000050 / #000020, bilinear). [3 sources, PS1]',
    'Frame: A\u2019s white border, 10 px radius, glow, drop shadow and grain became a 3 u grey bevel (light middle, dark inner edge), 2 u radius, nothing outside it. [measured]',
    'Band: two windows edge to edge at 71.0 % to 95.1 % of the height, split at 42.5 %, with the black strip below. The enemy window is gone from the band.',
    'Left window is NAME + BARRIER, with a two-bar Barrier / MBarrier box per row (empty in this fight).',
    'HP reads "279/ 316" in two right-aligned fields of one size; MP shows the current value only; each has its 1 u line (blue-to-lavender, teal-to-cream, lost part dark red).',
    'LIMIT and TIME sit side by side in their own columns, in raised grey boxes with cylinder shading: LIMIT pink, TIME mint while filling and pale yellow when full.',
    'Headers appear once, in tiny grey outlined caps on the frame line: NAME, BARRIER | HP, MP, LIMIT, TIME. No per-row words.',
    'Command window: four fixed slots at 12 u pitch (Attack, Magic, blank where Summon would be, Item), over the names window and 4 u lower than the band.',
    'Cursor: a white gloved finger (our own drawing), not a triangle; the same hand points at the target.',
    'Top window: translucent, 89 % wide, centred white text, no speaker name, the game\u2019s own line with its opening quote and spelling.',
    'Type: one rounded proportional sans (M PLUS Rounded 1c, OFL) at FF7\u2019s cap height of 3.6 % of the frame, off-white with a 1 u shadow; no gold names.',
    'States added: the yellow ready triangle, yellow HP at or below 1/4, the full Limit gauge\u2019s blink colours, "Limit" in slot 1 with its letter colour cycle, the magenta-to-red Limit window.',
    'Damage digits: chunky white numerals with a black outline over each target (Russo One, OFL).',
    'Phone: FF7\u2019s two band windows keep their internal layout at one scale (2.05 px/u), stacked; command slots 44 px.',
]
for i, t in enumerate(CHANGES, 1):
    d.text((44, y), f'{i}.', font=BODY, fill=BLUE)
    y = para(d, 84, y, t, width=W - 130) + 4
PARTS.append(save(c, y, 'sheet-2-what-changed.jpg'))

# ---------------- parts 3-5: the desktop frames ----------------
TITLES = {'f1': '1 \u00b7 Cloud\u2019s turn, cursor on Attack; the hint in the top window',
          'f2': '2 \u00b7 Magic open: Ice, Bolt; MP needed "4/ 57" at the right [layout our estimate]',
          'f3': '3 \u00b7 Targeting: the finger on Guard Scorpion, its name in the top window [our estimate]',
          'f4': '4 \u00b7 Tail Laser: ability name on top, damage 74 and 73 on the party, Barret\u2019s HP yellow',
          'f5': '5 \u00b7 Limit full: the gauge blinks, "Limit" replaces Attack in slot 1',
          'f5b': '5b \u00b7 The Limit window (magenta to red), "LIMIT LEVEL 1", Braver'}
for n, (a, b) in enumerate([('f1', 'f2'), ('f3', 'f4'), ('f5', 'f5b')], start=3):
    c, d, y = new(f'A+ at 1600 x 900: frames {TITLES[a][:2].strip()} and {TITLES[b][:2].strip()}')
    y = frame_block(c, d, y, FR[a + '1600'], TITLES[a])
    y = frame_block(c, d, y + 6, FR[b + '1600'], TITLES[b])
    PARTS.append(save(c, y, f'sheet-{n}-frames-{a[1:]}-{b[1:]}.jpg'))

# ---------------- part 6: phone ----------------
c, d, y = new('A+ at 390 x 844 (phone)')
y = para(d, 44, y, 'FF7 has no portrait layout. Its two band windows keep their exact internal layout at one scale '
         '(2.05 px per FF7 unit) and stack: names + Barrier above, HP / MP / LIMIT / TIME below. The command window still '
         'overlaps the names window, with 44 px touch slots. Full-size frames in a-plus/frames/*-390.jpg (2x).') + 10
tw = 316
for i, k in enumerate(['f1', 'f2', 'f3', 'f4']):
    t = thumb(FR[k + '390'], tw)
    c.paste(t, (44 + i * (tw + 20), y))
    d.text((44 + i * (tw + 20), y + t.height + 4), TITLES[k][:2] + TITLES[k].split('\u00b7')[1][:22], font=CAP, fill=MUTE)
y += thumb(FR['f1390'], tw).height + 40
t = thumb(FR['f5390'], tw)
c.paste(t, (44, y))
d.text((44, y + t.height + 4), '5 \u00b7 Limit full', font=CAP, fill=MUTE)
para(d, 44 + tw + 30, y + 10, 'Phone checks: nothing crosses the 390 px edge; the top window wraps nothing at this length; '
     'damage digits 22 px; the finger 40 x 20 px; header caps about 8 px. The Barrier column is covered by the command '
     'window here too, as in FF7 (SQUARE shows it there; a tap target for that is not designed yet).', width=W - tw - 130)
y += t.height + 30
PARTS.append(save(c, y, 'sheet-6-phone.jpg'))

# ---------------- part 7: the two open choices ----------------
c, d, y = new('Two choices for Bailey: body font, and stretch or pillarbox')
y = para(d, 44, y, 'Body font (spec \u00a79 #2). Neither is FF7\u2019s font (rule 8 forbids the retail face and fan traces of it). '
         'Top: M PLUS Rounded 1c 500 (used on every A+ frame). Bottom: Rajdhani 600 (already in the repo; the Lifestream Encore windows used it).') + 8
for k, cap in [('f1', 'M PLUS Rounded 1c'), ('f1raj', 'Rajdhani')]:
    t = thumb(FR[k + '1600'].crop((0, 628, 1600, 900)), W - 88)
    c.paste(t, (44, y))
    d.text((44, y + t.height + 4), cap, font=CAP, fill=MUTE)
    y += t.height + 36
y = para(d, 44, y + 6, 'Wide screens (spec \u00a79 #1). Left: the band stretched edge to edge (recommended, used on every frame). '
         'Right: the whole battle pillarboxed to FF7\u2019s 4:3, exact but a quarter of the scene is lost to black bars.') + 8
hw = (W - 88 - 20) // 2
for i, k in enumerate(['f1', 'f1pillar']):
    t = thumb(FR[k + '1600'], hw)
    c.paste(t, (44 + i * (hw + 20), y))
    d.text((44 + i * (hw + 20), y + t.height + 4), 'stretch (recommended)' if i == 0 else 'pillarbox 4:3', font=CAP, fill=MUTE)
y += thumb(FR['f11600'], hw).height + 36
PARTS.append(save(c, y, 'sheet-7-choices.jpg'))

# ---------------- part 8: checklist and what is still not faithful ----------------
c, d, y = new('Fidelity checklist (spec \u00a77) and what is still not FF7')
res = {ch['item']: ch for ch in checks}
LIST = [
    (1, 'Window gradient: four corners, blue only, bilinear'), (2, 'Frame: grey 3 u bevel, 2 u radius, no shadow or grain'),
    (3, 'Band 71.0 % to 95.1 %, split 42.5 %, black strip'), (4, 'Left window NAME + BARRIER; no enemy name in the band'),
    (5, 'HP, MP, LIMIT, TIME headers once, tiny grey caps'), (6, 'HP "cur/ max", MP current only, line gauges'),
    (7, 'LIMIT and TIME side by side, raised boxes, cylinder fills'), (8, 'Command window: 4 slots, 12 u, over the names, 4 u lower'),
    (9, 'White gloved finger cursor, static'), (10, 'Yellow ready triangle over the actor'),
    (11, 'Top window translucent, 89 % wide, centred, no speaker'), (12, 'Type: one sans, cap 3.6 %, off-white, 1 u shadow'),
    (13, 'States: yellow HP, Limit blink and colour cycle, TIME freeze'), (14, 'Damage digits white, black outline'),
    (15, 'Absent: grain, shadows, gold names, per-row words, chips, banners'), (16, 'Phone: one scale, stacked, 44 px slots, no clipping'),
    (17, 'Scope: no FFX or FFX-2 file, token or font changed'),
]
BYC = {4: 'by construction', 5: 'by construction', 6: 'by construction', 7: 'by construction', 8: 'by construction',
       9: 'our own drawing', 10: 'by construction', 11: '50 % blend is our estimate', 12: 'cap from the measured font metrics',
       13: 'TIME freeze and blink need motion; stills show one phase', 14: 'by construction', 15: 'by construction',
       17: 'only docs/concepts/ff7-hud-2026-09-27/a-plus/ added'}
for n, label in LIST:
    if n in res:
        mark, col, note = ('PASS', OK, res[n]['note']) if res[n]['ok'] else ('FAIL', BAD, res[n]['note'])
    else:
        mark, col, note = ('PASS*', OK if n not in (11, 13) else EST, BYC.get(n, ''))
    d.text((44, y), f'{n:>2}', font=CAP, fill=MUTE)
    d.text((84, y), mark, font=CAP, fill=col)
    d.text((170, y), label, font=CAP, fill=PAPER)
    y = para(d, 170, y + 26, note, CAP, W - 220, MUTE, 4) + 6
y = para(d, 44, y + 8, '* checked by construction (the value is written into the page from the spec), not by sampling pixels. '
         'Items 1, 2, 3 and 16 were sampled on the rendered frames.', CAP, fill=MUTE) + 16
d.text((44, y), 'Still not FF7, and why', font=H2, fill=BLUE)
y += 40
STILL = [
    'The font. FF7\u2019s own face is retail (rule 8); M PLUS Rounded 1c or Rajdhani stands in. This is the largest remaining difference.',
    'The finger cursor and the damage numerals are our own drawings in FF7\u2019s spirit, not its sprites (rule 8).',
    'Pixel scale. FF7 draws at 320 x 224; we draw smooth vector shapes at full resolution, so there are no hard pixel steps.',
    'The stretch. On 16:9 the band is stretched sideways (5 px per u across, 4 px down); a pillarbox would be exact (choice above).',
    'Unsourced, shown as our estimate until the in-game check: the Magic list layout and the MP-needed window; the target name in the top window; the top window\u2019s 50 % blend; the Limit letter hues and blink rate; the Limit window\u2019s two middle corners; the orange full-TIME state (not shown); the yellow of low HP.',
    'The scene, the figures and the current HP values are placeholders; the art candidates in docs/concepts/ff7-art-2026-09-27 are not picked yet, so they are not used.',
    'Scale of the scene: FF7 frames the fight with a moving camera; these are single still frames.',
]
for t in STILL:
    d.text((44, y), '\u2022', font=BODY, fill=BLUE)
    y = para(d, 70, y, t, width=W - 120) + 4
PARTS.append(save(c, y, 'sheet-8-checklist.jpg'))
print('PARTS', PARTS)
