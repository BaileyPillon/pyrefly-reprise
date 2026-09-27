"""Sin's head, round 3 (FFX only): the supporting images for the sheet (JPEG, each under 1 MB), into ../frames/,
and the identity check (how many pixels each stage shares with the others) into ../frames/identity.json.
  paintings.jpg    the five rig stages, small, in clock order
  mouths.jpg       the head of each stage, the same crop
  phone-scale.jpg  the head of each stage exactly as big as on a 390-px phone (1 image px = 1 CSS px)
  layers.jpg       the rig's layers, each on a checkerboard
  renders.jpg      every render of the round with its verdict
  sketches.jpg     our own code-drawn sketches (the only image input) and the rig run on the sketches
  method-test.jpg  the method check: test A (the rig on round 2's painting) and test B (a tight masked repaint)
  deck.jpg         the Fahrenheit's deck, dressed once on the plate
Usage (repo root): python docs/concepts/chapters/sin-2026-09-27/head-round3/src/images.py"""
import io, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3/'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'frames')
F = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)
f = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
NAMES = ['0 SHUT (turns 1-3)', '1 OPEN 1 (turns 4-6)', '2 OPEN 2 (turns 7-9)', '3 OPEN 3 (turns 10-11)', '4 FULLY OPEN (turn 12)']


def save(im, name):
    for q in (86, 80, 74, 68, 60):
        b = io.BytesIO(); im.convert('RGB').save(b, 'JPEG', quality=q)
        if b.tell() < 950_000:
            break
    p = os.path.join(OUT, name)
    open(p, 'wb').write(b.getvalue())
    print(p, im.size, round(b.tell() / 1024), 'KB')


def grid(items, cw, ch, cols, cap=56):
    rows = (len(items) + cols - 1) // cols
    s = Image.new('RGB', (cols * cw + (cols + 1) * 12, rows * (ch + cap) + 12), (11, 10, 18))
    d = ImageDraw.Draw(s)
    for i, (img, t1, t2) in enumerate(items):
        x, y = 12 + (i % cols) * (cw + 12), 12 + (i // cols) * (ch + cap)
        s.paste(img.convert('RGB').resize((cw, ch), Image.LANCZOS), (x, y))
        d.text((x, y + ch + 4), t1, font=F, fill=(236, 232, 220))
        if t2:
            d.text((x, y + ch + 30), t2, font=f, fill=(170, 164, 150))
    return s


def checker(im):
    bg = Image.new('RGBA', im.size, (60, 60, 70, 255))
    d = ImageDraw.Draw(bg)
    for y in range(0, im.size[1], 48):
        for x in range((y // 48 % 2) * 48, im.size[0], 96):
            d.rectangle([x, y, x + 47, y + 47], fill=(90, 90, 104, 255))
    bg.alpha_composite(im.convert('RGBA'))
    return bg


def identity(st):
    a = [np.asarray(im, int) for im in st]
    R = json.load(open(C + 'sketches/rig.json'))
    deck = Image.new('L', st[0].size, 0); ImageDraw.Draw(deck).polygon([tuple(p) for p in R['deck']], fill=255)
    dm = np.asarray(deck) > 0
    out = {'deckPixelsDifferingBetweenAnyStages': 0, 'stageVsStage4ChangedShare': []}
    for k in range(5):
        d = np.abs(a[k] - a[4]).max(axis=2) > 2
        out['stageVsStage4ChangedShare'].append(round(float(d.mean()), 4))
        out['deckPixelsDifferingBetweenAnyStages'] += int((d & dm).sum())
    union = np.zeros(a[0].shape[:2], bool)
    for k in range(4):
        union |= np.abs(a[k] - a[4]).max(axis=2) > 2
    out['shareTouchedByTheJawAtAnyStage'] = round(float(union.mean()), 4)
    json.dump(out, open(os.path.join(OUT, 'identity.json'), 'w'), indent=1)
    print(out)


def main():
    os.makedirs(OUT, exist_ok=True)
    st = [Image.open(f'{C}final/rig/stage-{k}.png').convert('RGB') for k in range(5)]
    identity(st)
    save(grid([(im, NAMES[k], '') for k, im in enumerate(st)], 520, 297, 2, 44), 'paintings.jpg')
    box = (880, 220, 1980, 860)
    save(grid([(im.crop(box), NAMES[k], '') for k, im in enumerate(st)], 520, 302, 2, 44), 'mouths.jpg')
    sc = 380 / 1344                                  # frame.html phone mode: the painting at 380 px tall
    s = Image.new('RGB', (5 * 200 + 6 * 12, 200 + 60), (11, 10, 18)); d = ImageDraw.Draw(s)
    for k, im in enumerate(st):
        small = im.resize((round(2352 * sc), 380), Image.LANCZOS)
        s.paste(small.crop((round(0.40 * small.width), 40, round(0.40 * small.width) + 200, 240)), (12 + k * 212, 12))
        d.text((12 + k * 212, 218), NAMES[k].split(' (')[0], font=F, fill=(236, 232, 220))
    save(s, 'phone-scale.jpg')
    L = C + 'final/rig/'
    lay = [(Image.open(L + 'L0-plate.png'), 'L0 plate', 'sky, Bevelle, the white tower (static)'),
           (checker(Image.open(L + 'L1-throat.png')), 'L1 throat', 'static; shown only inside the mouth of the stage'),
           (checker(Image.open(L + 'L1b-hinge.png')), 'L1b hinge patch', 'static; skin under the turning jaw'),
           (checker(Image.open(L + 'L2-jaw.png')), 'L2 lower jaw', 'the ONLY moving layer: turned about the hinge'),
           (checker(Image.open(L + 'L3-top.png')), 'L3 skull, neck, arm, wings', 'static, over the jaw'),
           (checker(Image.open(L + 'L4-deck.png')), 'L4 deck', 'static, over everything')]
    save(grid(lay, 500, 286, 2), 'layers.jpg')
    r = [('plate/p1', 'plate p1 · 0.62', 'good deck; tower grew to the top fifth'),
         ('plate/p2', 'plate p2 · 0.66', 'tower top far above the claw'),
         ('plate/p3', 'plate p3 · 0.55 v2', 'fine tower, still too tall'),
         ('plate/p4', 'plate p4 · 0.60 v2', 'tower a needle, too tall'),
         ('plate/p5', 'plate p5 · 0.50 v3', 'spire and ball high up'),
         ('plate/p6', 'plate p6 · 0.46 v3  PICK', 'tower top on the horizon, clean deck'),
         ('sin/a1', 'creature a1 · 0.66', 'claw on the tower; cobbles, a gun-like joint'),
         ('sin/a2', 'creature a2 · 0.74', 'a robot dragon, gold trim, a pole'),
         ('sin/b1', 'creature b1 · 0.62 v2  PICK', 'organic head, both wings; see repairs'),
         ('sin/b2', 'creature b2 · 0.66 v2', 'blocky, mechanical'),
         ('sin/b3', 'creature b3 · 0.66 v2', 'cobblestones and rivets'),
         ('sin/b4', 'creature b4 · 0.62 v2', 'ribs inside the mouth, a blue gem'),
         ('sin/b5', 'creature b5 · 0.60 v2', 'best wings; gold cracks over the head'),
         ('fix/wing-a', 'repair: near wing · 0.58', 'KEPT: feathers, no rod'),
         ('fix/cheek-a', 'repair: cheek · 0.55', 'dropped: wire-like loops'),
         ('fix/patch2-a', 'repair: shoulder+cheek · 0.52', 'dropped: gold wires'),
         ('fix/patch3-a', 'repair: positive words · 0.45', 'dropped: pearls and cords')]
    items = [(Image.open(f'{C}{p}.full.png'), a, b) for p, a, b in r]
    items.append((Image.open(C + 'fix/b1-final.png'), 'b1 after the repairs', 'wing repaint + own-pixel mends + throat'))
    save(grid(items, 500, 286, 3), 'renders.jpg')
    sk = C + 'sketches/'
    rigtest = sk + 'rigtest.jpg'
    items = [(Image.open(sk + 'sketch-plate.png'), 'sketch: plate', 'no creature'),
             (Image.open(sk + 'sketch-sin.png'), 'sketch: creature, mouth fully open', 'the one creature job'),
             (Image.open(sk + 'sketch-shut.png'), 'sketch: jaw drawn shut', 'only to check the rig against'),
             (Image.open(sk + 'v1/sketch-plate.png'), 'sketch v1: plate', 'plate p6 was painted from this')]
    if os.path.exists(rigtest):
        items.append((Image.open(rigtest), 'the rig run on the sketches', 'stages 0-4, then the shut sketch'))
    save(grid(items, 500, 286, 2), 'sketches.jpg')
    mt = C + 'method-test/'
    items = [(Image.open(mt + f'rig-s{k}.png').crop((700, 250, 2100, 1100)), f'test A · jaw at {[0, 6, 12, 18, 24][k]} deg', 'round 2 painting, only the jaw turned') for k in (0, 2, 4)]
    box = (850, 330, 2050, 1060)
    items += [(Image.open('D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2/stages/comp-s2.png').resize((2352, 1344)).crop(box), 'test B input', 'round 2 sketch pasted, tight mask'),
              (Image.open(mt + 'b-s2-040.full.png').crop(box), 'test B · denoise 0.40', 'flat jaw, blob mouth; 3.2 % moved outside'),
              (Image.open('D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2/stages/m2-a.blend.png').crop(box), 'round 2 · denoise 0.62', 'painted, but a new jaw each stage')]
    save(grid(items, 500, 300, 3), 'method-test.jpg')
    save(st[0].crop((820, 1030, 2100, 1344)), 'deck.jpg')


main()
