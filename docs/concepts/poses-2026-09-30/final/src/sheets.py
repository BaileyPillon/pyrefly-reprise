"""Target beside build: the approved candidate (as Bailey saw it on the morning page) on the left, the production build
of branch poses-0930 on the right. python sheets.py (after proof.mjs has written ../shots/)."""
import json
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, '..', 'shots')
FINAL = os.path.join(HERE, '..')
O = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-30-overnight'
PILOT = 'D:/Tools/pyrefly-scratch/picks-0930/poses/out'
PKG = 'D:/Tools/pyrefly-art-backup/approved/2026-09-30-poses/characters'
try:
    FONT = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
    SMALL = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 15)
except OSError:
    FONT = SMALL = ImageFont.load_default()


def tile(img, w, label, sub=''):
    img = img.convert('RGB')
    h = int(img.height * w / img.width)
    t = Image.new('RGB', (w, h + 54), (22, 22, 28))
    t.paste(img.resize((w, h), Image.LANCZOS), (0, 54))
    d = ImageDraw.Draw(t)
    d.text((8, 4), label, fill=(240, 210, 120), font=FONT)
    d.text((8, 30), sub, fill=(200, 200, 210), font=SMALL)
    return t


def cutout(path, scale=1.0, bg=(150, 150, 160)):
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getbbox())
    b = Image.new('RGBA', (im.width + 40, im.height + 40), bg + (255,))
    b.alpha_composite(im, (20, 20))
    return b


def pair(name, left, right, w=800):
    lt = tile(*left[:1], w, *left[1:]) if False else tile(left[0], w, left[1], left[2])
    rt = tile(right[0], w, right[1], right[2])
    H = max(lt.height, rt.height)
    sh = Image.new('RGB', (w * 2 + 12, H), (10, 10, 12))
    sh.paste(lt, (0, 0))
    sh.paste(rt, (w + 12, 0))
    out = os.path.join(FINAL, name)
    sh.save(out, quality=86)
    print(out, sh.size)


def stack(images):
    W = max(i.width for i in images)
    H = sum(i.height for i in images) + 6 * (len(images) - 1)
    s = Image.new('RGB', (W, H), (10, 10, 12))
    y = 0
    for i in images:
        s.paste(i.convert('RGB'), (0, y))
        y += i.height + 6
    return s


def shot(n):
    p = os.path.join(SHOTS, n)
    return Image.open(p) if os.path.exists(p) else None


def rec(n):
    p = os.path.join(SHOTS, n)
    return json.load(open(p)) if os.path.exists(p) else {}


def row_of(r, key, ids):
    a = r.get('at', {}).get(key, {})
    return ', '.join(f"{i} {a[i]['pose']} ({a[i]['hp']})" for i in ids if i in a)


# ---- Chapter I, FFX: Yuna asleep, Auron and Wakka low HP
for dev in ('desktop', 'phone'):
    r = rec(f'ch1-{dev}.json')
    a, b = shot(f'ch1-{dev}-other-attack.jpg'), shot(f'ch1-{dev}-after-attack.jpg')
    if not (a and b):
        continue
    tgt = stack([Image.open(f'{O}/sleep-lowhp-composites/ch1a-sleep.jpg'), Image.open(f'{O}/sleep-lowhp-composites/ch1a-critical.jpg')])
    bld = stack([a, b])
    pair(f'ch1-{dev}-target-vs-build.jpg',
         (tgt, 'APPROVED: Yuna sleep c56, Auron critical c4, Wakka critical c6', 'overnight composites (candidates held with setPose on a main build, STAGED)'),
         (bld, f'BUILD {dev}: poses-0930 production bundle, the real fight', f"top: {row_of(r, 'other-attack', ['yuna', 'auron', 'wakka'])}; bottom: {row_of(r, 'after-attack', ['auron', 'wakka'])}"),
         w=800 if dev == 'desktop' else 520)

# ---- Chapter IV, FFX-2: Yuna Gunner asleep, Paine Warrior low HP; Bahamut's Mega Flare splash
for dev in ('desktop', 'phone'):
    r = rec(f'ch4-{dev}.json')
    a = shot(f'ch4-{dev}-all-rest.jpg') or shot(f'ch4-{dev}-after-attack.jpg') or shot(f'ch4-{dev}-rest.jpg')
    if a:
        tgt = stack([Image.open(f'{O}/sleep-lowhp-composites/ch4-sleep.jpg'), Image.open(f'{O}/sleep-lowhp-composites/ch4-critical.jpg')])
        pair(f'ch4-{dev}-target-vs-build.jpg',
             (tgt, 'APPROVED: Yuna Gunner sleep c31, Paine Warrior critical c16', 'overnight composites (STAGED on a main build)'),
             (a, f'BUILD {dev}: poses-0930 production bundle, the real fight', row_of(r, 'all-rest' if shot(f'ch4-{dev}-all-rest.jpg') else 'after-attack', ['yuna', 'rikku', 'paine'])),
             w=800 if dev == 'desktop' else 520)
    s = shot(f'ch4-{dev}-splash.jpg')
    if s:
        sheet = Image.open(f'{O}/bahamut-splash/sheet.jpg')
        b10 = sheet.crop((0, 768, 640, 1152))
        note = next((n for n in r.get('notes', []) if n.startswith('splash:')), '')
        pair(f'ch4-{dev}-splash-target-vs-build.jpg',
             (b10, 'APPROVED: Bahamut splash B10-flare-55-core', 'the candidate sheet (a PIL mock of the splash layer at 1600x900)'),
             (s, f'BUILD {dev}: Mega Flare cut-in, the real splash layer', note[:150]),
             w=800 if dev == 'desktop' else 520)

# ---- Chapter XIII, FFX-2: Paine Songstress attack and hurt
for dev in ('desktop', 'phone'):
    r = rec(f'ch13-{dev}.json')
    a, h = shot(f'ch13-{dev}-attack.jpg'), shot(f'ch13-{dev}-hurt.jpg')
    if not (a or h):
        continue
    tgt = stack([cutout(f'{PKG}/paine-songstress/attack.png'), cutout(f'{PKG}/paine-songstress/hurt.png')])
    bld = stack([x for x in (a, h) if x])
    pair(f'ch13-{dev}-target-vs-build.jpg',
         (tgt, 'APPROVED: Paine Songstress attack A1-attack-19, hurt H1-hurt-121', 'the candidates as picked'),
         (bld, f'BUILD {dev}: Chapter XIII, the real fight', f"attack: {row_of(r, 'attack', ['paine'])}; hurt: {row_of(r, 'hurt', ['paine'])}"),
         w=800 if dev == 'desktop' else 520)
