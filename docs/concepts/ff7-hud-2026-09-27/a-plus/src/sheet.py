"""A+ frames (JPEG), pixel checks against the spec, and the phone-readable sheet parts
(each at most 2000 px tall and under 1 MB).

Usage: python sheet.py <rendered dir> <a-plus dir>
"""
import json
import os
import sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheet_text import CHANGES, REPAIRS, ESTIMATES, INGAME, STILL  # noqa: E402

R, OUT = sys.argv[1], sys.argv[2]
A_DIR = os.path.join(OUT, '..', 'frames')  # option A's frames, for the side by side
F = 'C:/Windows/Fonts/'
INK, PAPER, BLUE, MUTE, OK, BAD, EST = (11, 10, 18), (244, 241, 232), (120, 150, 255), (170, 164, 180), (110, 220, 140), (240, 110, 100), (240, 200, 110)
W = 1400


def font(name, size):
    return ImageFont.truetype(F + name, size)


H1, H2, BODY, CAP = font('georgiai.ttf', 42), font('bahnschrift.ttf', 25), font('georgia.ttf', 21), font('bahnschrift.ttf', 19)
TAG = 'FF7 BATTLE HUD \u00b7 A+ (A, EVEN MORE FAITHFUL) \u00b7 FF7 ONLY \u00b7 REPAIR PASS'

# ---------------- frames ----------------
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)
NAMES = {'f1': '1-cloud-turn-attack', 'f2': '2-magic-mp-cost', 'f3': '3-targeting', 'f3b': '3b-targeting-help-name',
         'f4': '4-tail-laser-damage', 'f5': '5-limit-full', 'f5p1': '5-limit-full-next-step', 'f5b': '5b-limit-window',
         'f1MPR': 'type-mplus-1', 'f1Raj': 'type-rajdhani-1', 'f1Exo': 'type-exo2-1', 'f1Chk': 'type-chakra-1',
         'f1pillar': 'pillarbox-1', 'f1B': 'phoneB-1-cloud-turn-attack', 'f2B': 'phoneB-2-magic-mp-cost',
         'f3B': 'phoneB-3-targeting', 'f4B': 'phoneB-4-tail-laser-damage', 'f5B': 'phoneB-5-limit-full'}
FR = {}
for key, name in NAMES.items():
    for size in ('1600', '390'):
        p = os.path.join(R, f'{key}-{size}.png')
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert('RGB')
        im.save(os.path.join(OUT, 'frames', f'{name}-{size}.jpg'), quality=90, optimize=True)
        FR[key + size] = im

# ---------------- pixel checks on the rendered PNG (spec \u00a77) ----------------
M = json.load(open(os.path.join(R, 'metrics.json')))
f1 = Image.open(os.path.join(R, 'f1-1600.png')).convert('RGB')
px = f1.load()
checks = []


def check(item, ok, note):
    checks.append({'item': item, 'ok': bool(ok), 'note': note})


wins = M['sections']['f1-1600']['wins']
wr, wl = wins['band-right'], wins['band-left']
inset = 14
corners = {'TL': (wr['x'] + inset, wr['y'] + inset), 'TR': (wr['x'] + wr['w'] - inset, wr['y'] + inset),
           'BL': (wr['x'] + inset, wr['y'] + wr['h'] - inset), 'BR': (wr['x'] + wr['w'] - inset, wr['y'] + wr['h'] - inset)}
want = {'TL': 176, 'TR': 128, 'BL': 80, 'BR': 32}
got = {k: px[round(x), round(y)] for k, (x, y) in corners.items()}
ok1 = all(abs(got[k][2] - want[k]) <= 8 and got[k][0] <= 8 and got[k][1] <= 8 for k in want)
centre = px[round(wl['x'] + wl['w'] * 0.5), round(wl['y'] + wl['h'] * 0.5)]
ok1 = ok1 and abs(centre[2] - 104) <= 8
check(1, ok1, 'corners (14 px inside) ' + ', '.join(f'{k} {got[k]}' for k in want) + f'; left-window centre {centre} vs bilinear 104')

ramp = [px[round(wr['x']) + i, round(wr['y'] + wr['h'] / 2)] for i in range(13)]
grey = all(max(c) - min(c) <= 6 for c in ramp[:12])
outside = px[round(wr['x']) - 3, round(wr['y']) - 6]
check(2, grey, 'left-edge ramp ' + ' '.join('#%02X%02X%02X' % c for c in ramp[:12]) + f'; 3 px outside the frame: {outside} (scene, no shadow)')

top_pct, bot_pct = wr['y'] / 900 * 100, (wr['y'] + wr['h']) / 900 * 100
split = (wl['x'] + wl['w']) / 1600 * 100
gap_u = (wr['x'] - wl['x'] - wl['w']) / 5
strip = all(max(px[x, 880]) < 8 for x in range(0, 1600, 50))
check(3, abs(top_pct - 71.0) <= 0.5 and abs(bot_pct - 95.1) <= 0.5 and abs(split - 42.5) <= 1 and strip and 2.5 <= gap_u <= 3.5,
      f'band top {top_pct:.1f} %, bottom {bot_pct:.1f} %, split {split:.1f} %, gap {gap_u:.1f} u, black strip below: {strip}')

cm = wins['command']
check(8, abs((cm['y'] + cm['h']) - (wl['y'] + wl['h']) - 4 * 900 / 224) < 2 and cm['x'] < wl['x'] + wl['w'],
      f"command window {cm['w']:.0f} x {cm['h']:.0f} px (59 x 54 u), bottom {cm['y'] + cm['h'] - wl['y'] - wl['h']:.1f} px below the band (4 u = 16.1)")

# cap height: the bright rows of "Cloud" in the names window
rows = [y for y in range(650, 720) if any(min(px[x, y]) > 200 for x in range(60, 200))]
cap = rows[-1] - rows[0] + 1 if rows else 0
check(12, abs(cap / 900 * 100 - 3.6) <= 0.3, f'"Cloud" ink height {cap} px = {cap / 9:.2f} % of 900 (FF7 3.6 %); our own glyph set, not the retail font')

spills = {k: v['spill'] for k, v in M['sections'].items() if v['spill']}
phone_off = [s for k, v in M['sections'].items() if k.endswith('-390') for s in v['spill'] if s.get('offFrame')]
check(16, not phone_off, f'phone A and B: {len(phone_off)} texts cross the 390 px edge; command slots 44 px; A at 2.05 px/u, B at 1.64 px/u')
json.dump({'checks': checks, 'spills': spills, 'fonts': M['fonts']}, open(os.path.join(OUT, 'checks.json'), 'w'), indent=1)
for c in checks:
    print('CHECK', c['item'], 'PASS' if c['ok'] else 'FAIL', c['note'])
print('spills:', spills)


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


def para(d, x, y, text, fnt=BODY, width=W - 90, fill=PAPER, gap=6):
    for ln in wrap(d, text, fnt, width):
        d.text((x, y), ln, font=fnt, fill=fill)
        y += fnt.size + gap
    return y


def thumb(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def new(title):
    c = Image.new('RGB', (W, 2000), INK)
    d = ImageDraw.Draw(c)
    d.rectangle((0, 0, 12, 2000), fill=BLUE)
    d.text((44, 26), TAG, font=H2, fill=BLUE)
    d.text((44, 60), title, font=H1, fill=PAPER)
    return c, d, 128


def save(c, bottom, name):
    assert bottom <= 1990, (name, bottom)
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


def block(c, d, y, im, caption, w=W - 88, x=44):
    t = thumb(im, w)
    c.paste(t, (x, y))
    d.text((x, y + t.height + 5), caption, font=CAP, fill=MUTE)
    return y + t.height + 38


def bullets(d, y, items, fnt=BODY, mark='\u2022', col=BLUE):
    for i, t in enumerate(items, 1):
        d.text((44, y), mark if mark else f'{i}.', font=fnt, fill=col)
        y = para(d, 84, y, t, fnt, width=W - 130) + 3
    return y


PARTS = []
A1 = Image.open(os.path.join(A_DIR, 'a-1600.jpg')).convert('RGB')
BAND = (0, 628, 1600, 900)

# 1: A vs A+
c, d, y = new('A (picked) beside A+ (the refinement)')
y = para(d, 44, y, 'The same moment: Cloud\u2019s turn with the tail raised. Top: option A as Bailey picked it. Bottom: A+, rebuilt to '
         'the measured FF7 battle screen (docs/plans/ff7-hud-faithful-a-spec.md) and repaired after an adversarial fidelity review. '
         'Scene and figures are the same original placeholders.') + 8
y = block(c, d, y, A1, 'A \u00b7 as picked (frames/a-1600.jpg)')
y = block(c, d, y, FR['f11600'], 'A+ \u00b7 frame 1 (a-plus/frames/1-cloud-turn-attack-1600.jpg)')
PARTS.append(save(c, y, 'sheet-1-a-vs-aplus.jpg'))

# 2: what changed
c, d, y = new('What changed from A')
for im, cap_ in [(A1.crop((0, 660, 1600, 900)), 'A \u00b7 the band'), (FR['f11600'].crop(BAND), 'A+ \u00b7 the band')]:
    y = block(c, d, y, im, cap_) - 6
y = bullets(d, y, CHANGES, mark=None)
d.text((44, y + 8), 'Repair pass (after the fidelity review scored the first A+ source 7.4)', font=H2, fill=BLUE)
y = bullets(d, y + 46, REPAIRS, fnt=CAP)
PARTS.append(save(c, y, 'sheet-2-what-changed.jpg'))

# 3-5: the desktop frames
TITLES = {'f1': '1 \u00b7 Cloud\u2019s turn, cursor on Attack; the hint in the top window',
          'f2': '2 \u00b7 Magic open: Ice, Bolt; MP needed "4/ 57" right of the list [whole layout: our estimate]',
          'f3': '3 \u00b7 Targeting: the finger on Guard Scorpion; top window empty',
          'f3b': '3b \u00b7 Variant: the name shown as the SELECT help [our estimate]',
          'f4': '4 \u00b7 Tail Laser: ability name on top, damage 74 and 73 on the party, Barret\u2019s HP yellow',
          'f5': '5 \u00b7 Limit full: the gauge blinks, "Limit" replaces Attack in slot 1'}
for n, (a, b) in enumerate([('f1', 'f2'), ('f3', 'f3b'), ('f4', 'f5')], start=3):
    c, d, y = new(f'A+ at 1600 x 900: frames {TITLES[a].split(" ")[0]} and {TITLES[b].split(" ")[0]}')
    y = block(c, d, y, FR[a + '1600'], TITLES[a])
    y = block(c, d, y + 6, FR[b + '1600'], TITLES[b])
    PARTS.append(save(c, y, f'sheet-{n}-frames-{a[1:]}-{b[1:]}.jpg'))

# 6: the Limit window and close-ups
c, d, y = new('5b \u00b7 the Limit window, and close-ups')
y = block(c, d, y, FR['f5b1600'], '5b \u00b7 the Limit window (magenta to red), "LIMIT LEVEL 1", Braver; the window covers slot 1, as in FF7')
cmr = M['sections']['f5-1600']['wins']['command']
cmd_box = (round(cmr['x']) - 30, round(cmr['y']) - 4, round(cmr['x'] + cmr['w']) + 6, round(cmr['y'] + cmr['h']) + 4)
zoom = lambda im, box, f: im.crop(box).resize(((box[2] - box[0]) * f, (box[3] - box[1]) * f), Image.LANCZOS)
tiles = [(zoom(FR['f51600'], cmd_box, 2), '"Limit", step 1 of 8'), (zoom(FR['f5p11600'], cmd_box, 2), 'the next step (100 ms later)'),
         (zoom(FR['f11600'], (940, 392, 1030, 446), 5), 'ready triangle (mid-spin)'),
         (zoom(FR['f41600'], (935, 470, 1170, 540), 2), 'damage digits, equal cells')]
x0, row_h = 44, 0
for im, cap_ in tiles:
    if x0 + im.width > W - 40:
        y += row_h + 40
        x0, row_h = 44, 0
    c.paste(im, (x0, y))
    d.text((x0, y + im.height + 4), cap_, font=CAP, fill=MUTE)
    x0 += im.width + 24
    row_h = max(row_h, im.height)
y += row_h + 40
PARTS.append(save(c, y, 'sheet-6-limit-and-closeups.jpg'))

# 7: phone
c, d, y = new('A+ at 390 x 844 (phone): two adaptations')
y = para(d, 44, y, 'FF7 has no portrait layout, so both rows are adaptations. A (top): FF7\u2019s two band windows at one scale (2.05 px/u), '
         'stacked; the name no longer sits on its HP line. B (bottom): one scale of 1.64 px/u, and each name repeated at the left of its '
         'status row, so a row reads across as in FF7 (type is smaller: cap 13 px). The command window keeps FF7\u2019s anchor (4 u below '
         'the names window) and grows upwards for 44 px touch slots. The dashed top band simulates a 47 px safe area.', CAP, gap=4) + 10
tw = 250
for label, suf in (('A \u00b7 stacked', ''), ('B \u00b7 names on the status rows', 'B')):
    d.text((44, y), label, font=H2, fill=BLUE)
    y += 36
    for i, k in enumerate(['f1', 'f2', 'f3', 'f4', 'f5']):
        t = thumb(FR[k + suf + '390'], tw)
        c.paste(t, (44 + i * (tw + 13), y))
        d.text((44 + i * (tw + 13), y + t.height + 4), TITLES[k].split(' \u00b7 ')[1][:26], font=CAP, fill=MUTE)
    y += thumb(FR['f1390'], tw).height + 40
PARTS.append(save(c, y, 'sheet-7-phone.jpg'))

# 8: type
c, d, y = new('Type: our own glyph set against four OFL faces')
FT = M['fonts']
y = para(d, 44, y, 'FF7\u2019s battle face is retail (rule 8), so the choice is between our own drawing and a free face. Ratios measured '
         'on the reference stills (our reading, JPEG, \u00b15 %): digit pitch 0.86 to 0.90 of the cap; "Cloud" 3.8 caps wide; "Barret" 4.45. '
         'Every candidate is set at FF7\u2019s cap (3.6 % of the frame); headers use the same family, heavier.', CAP, gap=4) + 10
for fam, key, label in [('PR7', 'f1', 'PR7 Line (ours, on every frame)'), ('MPR', 'f1MPR', 'M PLUS Rounded 1c 500'),
                        ('Raj', 'f1Raj', 'Rajdhani 600'), ('Exo', 'f1Exo', 'Exo 2 600'), ('Chk', 'f1Chk', 'Chakra Petch 500')]:
    f = FT[fam]
    t = thumb(FR[key + '1600'].crop((0, 636, 1600, 862)), W - 88)
    c.paste(t, (44, y))
    d.text((44, y + t.height + 4), f"{label}  \u00b7  digit {f['digitPerCap']:.2f} cap  \u00b7  Cloud {f['cloudPerCap']:.2f}  \u00b7  Barret {f['barretPerCap']:.2f}",
           font=CAP, fill=PAPER if fam == 'PR7' else MUTE)
    y += t.height + 36
PARTS.append(save(c, y, 'sheet-8-type.jpg'))

# 9: stretch or pillarbox
c, d, y = new('Wide screens: stretch or pillarbox (spec \u00a79 #1)')
y = para(d, 44, y, 'Top: the band stretched edge to edge (recommended, used on every frame): column starts stretch, their contents keep '
         'FF7\u2019s proportions. Bottom: the whole battle pillarboxed to FF7\u2019s 4:3: exact, but a quarter of the scene is lost.') + 8
y = block(c, d, y, FR['f11600'], 'stretch (recommended)')
y = block(c, d, y, FR['f1pillar1600'], 'pillarbox 4:3')
PARTS.append(save(c, y, 'sheet-9-stretch-or-pillarbox.jpg'))

# 10: checklist
c, d, y = new('Fidelity checklist (spec \u00a77)')
res = {ch['item']: ch for ch in checks}
LIST = [(1, 'Window gradient: four corners, blue only, bilinear'), (2, 'Frame: grey 3 u bevel, 2 u radius, no shadow or grain'),
        (3, 'Band 71.0 % to 95.1 %, split 42.5 %, 3 u gap, black strip'), (4, 'Left window NAME + BARRIER; no enemy name in the band'),
        (5, 'HP, MP, LIMIT, TIME headers once, small grey caps'), (6, 'HP "cur/ max", MP current only, line gauges'),
        (7, 'LIMIT and TIME side by side, raised boxes (4:1), cylinder fills'), (8, 'Command window: 4 slots, 12 u, over the names, 4 u lower'),
        (9, 'White gloved finger cursor, static'), (10, 'Yellow ready triangle over the actor'),
        (11, 'Top window translucent, 89 % wide, centred, no speaker'), (12, 'Type: one family, cap 3.6 %, off-white, 1 u shadow'),
        (13, 'States: yellow HP, Limit blink and letter colours, TIME freeze'), (14, 'Damage digits white, black edge, equal cells'),
        (15, 'Absent: grain, shadows, gold names, per-row words, chips, banners'), (16, 'Phone: one scale, 44 px slots, no clipping'),
        (17, 'Scope: no FFX or FFX-2 file, token or font changed')]
BYC = {4: 'by construction', 5: 'by construction; header caps in the body family (no pixel face)', 6: 'by construction; max field 32 u after the current field',
       7: 'by construction; boxes 36 x 9 u at the vertical scale', 9: 'our own drawing', 10: 'our own drawing, solid, two shaded faces',
       11: '50 % blend is our estimate', 13: 'blink and TIME freeze need motion; the stills show one phase each',
       14: 'our own numeral set', 15: 'by construction; sheet chips sit outside the HUD layer', 17: 'only docs/concepts/ff7-hud-2026-09-27/a-plus/ changed'}
for n, label in LIST:
    if n in res:
        mark, col, note = ('PASS', OK, res[n]['note']) if res[n]['ok'] else ('FAIL', BAD, res[n]['note'])
    else:
        mark, col, note = ('PASS*', EST if n in (11, 13) else OK, BYC.get(n, ''))
    d.text((44, y), f'{n:>2}', font=CAP, fill=MUTE)
    d.text((84, y), mark, font=CAP, fill=col)
    d.text((170, y), label, font=CAP, fill=PAPER)
    y = para(d, 170, y + 25, note, CAP, W - 220, MUTE, 3) + 6
y = para(d, 44, y + 8, '* by construction (the value is written into the page from the spec), not sampled. Items 1, 2, 3, 8, 12 and 16 '
         'were measured on the rendered frames (checks.json).', CAP, fill=MUTE)
PARTS.append(save(c, y, 'sheet-10-checklist.jpg'))

# 11: estimates, in-game checks, still not FF7
c, d, y = new('Our estimates, the in-game check, and what is still not FF7')
d.text((44, y), 'Shown on the frames but unsourced (our estimate)', font=H2, fill=EST)
y += 38
for val, where in ESTIMATES:
    d.text((44, y), '\u2022', font=CAP, fill=EST)
    y = para(d, 70, y, f'{val}  \u2192  {where}', CAP, W - 120, PAPER, 3) + 4
d.text((44, y + 10), 'To settle in the running game (spec \u00a79 #4)', font=H2, fill=BLUE)
y = bullets(d, y + 48, INGAME, fnt=CAP)
d.text((44, y + 10), 'Still not FF7, and why', font=H2, fill=BLUE)
y = bullets(d, y + 48, STILL, fnt=CAP)
PARTS.append(save(c, y, 'sheet-11-estimates-and-open.jpg'))
print('PARTS', PARTS)
