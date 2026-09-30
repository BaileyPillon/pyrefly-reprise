"""Target beside build for the day set (D-301): the approved candidate (as Bailey saw it on the day art page) on the
left, the production build of branch poses-day on the right, each frame labelled with what the live page reported.
python sheets-day.py (after ch7-day.mjs, post-kneel.mjs and proof-rest.mjs have written ../shots/)."""
import json
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, '..', 'shots')
FINAL = os.path.join(HERE, '..')
C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-30-day'
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
    d.text((8, 30), sub[:150], fill=(200, 200, 210), font=SMALL)
    return t


def cutout(path, bg=(150, 150, 160)):
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getbbox())
    b = Image.new('RGBA', (im.width + 40, im.height + 40), bg + (255,))
    b.alpha_composite(im, (20, 20))
    return b


def stack(images, gap=6):
    images = [i for i in images if i is not None]
    W = max(i.width for i in images)
    H = sum(i.height for i in images) + gap * (len(images) - 1)
    s = Image.new('RGB', (W, H), (10, 10, 12))
    y = 0
    for i in images:
        s.paste(i.convert('RGB'), (0, y))
        y += i.height + gap
    return s


def shot(n):
    p = os.path.join(SHOTS, n)
    return Image.open(p) if os.path.exists(p) else None


def rec(n):
    p = os.path.join(SHOTS, n)
    return json.load(open(p)) if os.path.exists(p) else {}


def pair(name, left_tiles, right_tiles, wl=520, wr=900):
    L = stack([tile(i, wl, a, b) for i, a, b in left_tiles])
    R = stack([tile(i, wr, a, b) for i, a, b in right_tiles if i is not None])
    H = max(L.height, R.height)
    sh = Image.new('RGB', (L.width + R.width + 12, H), (10, 10, 12))
    sh.paste(L, (0, 0))
    sh.paste(R, (L.width + 12, 0))
    out = os.path.join(FINAL, name)
    sh.save(out, quality=86)
    print(out, sh.size)


def fdesc(f):
    if not f:
        return 'figure not found'
    return f"{f['art'].split('/')[-1]} {'+'.join(c[3:] for c in f['cls'])} box {f['box']['w']}x{f['box']['h']} at {f['box']['x']},{f['box']['y']}"


# ---- Chapter VII (FFX): Seymour kneels, falls; his battle KO
for size, dev, wr in (('1600x900', 'desktop', 900), ('390x844', 'phone', 360)):
    r = rec(f'ch7-{size}/run.json')
    if not r:
        continue
    ko = r.get('battleKo') or []
    last = ko[-1] if ko else None
    right = [
        (shot(f"ch7-{size}/{last['f']}") if last else None, f'BUILD {dev}: the kill, battle KO ({r.get("outcome")} by keys)',
         f"pose {last['seymour']['pose']} {last['seymour']['url']} lieRoll {last['seymour']['lieRoll']} prone {last['seymour']['prone']}" if last else ''),
        (shot(f'ch7-{size}/aftermath-kneel.jpg'), f'BUILD {dev}: "He went down on one knee."', fdesc((r.get('kneel') or {}).get('seymour'))),
        (shot(f'ch7-{size}/aftermath-fall.jpg'), f'BUILD {dev}: "Then he fell, and he just stopped."', fdesc((r.get('fall') or {}).get('seymour'))),
    ]
    left = [
        (cutout(f'{C}/seymour-macalania/kneel/cand-6.png'), 'TARGET: kneel cand-6 (approved, D-301)', 'FFX only, Chapter VII; byte for byte in the package'),
        (cutout(f'{C}/seymour-macalania/ko/cand-5.png'), 'TARGET: fall / KO cand-5 (approved, D-301)', 'the prone canvas; robe cut by its right edge as rendered'),
    ]
    pair(f'ch7-{dev}-target-vs-build.jpg', left, right, 520, wr)

# ---- Chapter XIV (FFX) Isaaru, Chapter V (FFX-2) Shuyin: the post-scene kneel
for actor, cand, chap in (('isaaru', 'isaaru/kneel/cand-9.png', 'FFX only, Chapter XIV'), ('shuyin', 'shuyin/kneel/cand-7.png', 'FFX-2 only, Chapter V')):
    for dev, wr in (('desktop', 900), ('phone', 360)):
        r = rec(f'{actor}-{dev}.json')
        if not r:
            continue
        right = [(shot(f'{actor}-{dev}-post-kneel.jpg'), f'BUILD {dev}: post scene, "{(r.get("kneel") or {}).get("line", "")[:40]}"', fdesc((r.get('kneel') or {}).get('figure')))]
        bare = rec(f'{actor}-{dev}-bare.json')
        if bare:
            right.append((shot(f'{actor}-{dev}-bare-post-kneel.jpg'), f'BUILD {dev}, package NOT served: the fallback', fdesc((bare.get('kneel') or {}).get('figure'))))
        pair(f'{actor}-{dev}-target-vs-build.jpg', [(cutout(f'{C}/{cand}'), f'TARGET: {actor} kneel {cand.split("/")[-1][:-4]} (approved, D-301)', chap)], right, 520, wr)

# ---- Chapter I (FFX) Kimahri: asleep, and at low HP
for dev, wr in (('desktop', 900), ('phone', 360)):
    s, lo = rec(f'ch1k-sleep-{dev}.json'), rec(f'ch1k-low-{dev}.json')
    if not s and not lo:
        continue
    def k(r, key):
        a = r.get('at', {}).get(key, {}).get('kimahri', {})
        return f"kimahri {a.get('pose')} {a.get('url')} HP {a.get('hp')} {a.get('statuses')}"
    right = [
        (shot(f'ch1k-sleep-{dev}-rest.jpg'), f'BUILD {dev}: Kimahri asleep (STAGED Sleep)', k(s, 'rest')),
        (shot(f'ch1k-low-{dev}-rest.jpg'), f'BUILD {dev}: Kimahri at low HP (STAGED 40 %: FFX line is half)', k(lo, 'rest')),
    ]
    left = [
        (cutout(f'{C}/kimahri/sleep/cand-6.png'), 'TARGET: Kimahri sleep cand-6 (approved, D-301)', 'FFX only; the changed method (a warp of his idle)'),
        (cutout(f'{C}/kimahri/critical/cand-4.png'), 'TARGET: Kimahri low HP cand-4 (approved, D-301)', 'FFX only; the slouch below half HP'),
    ]
    pair(f'kimahri-{dev}-target-vs-build.jpg', left, right, 420, wr)
