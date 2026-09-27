"""Sin's head, round 2 (FFX only): the supporting images for the sheet (JPEG, each under 1 MB), into ../frames/.
  paintings.jpg   the five dressed stage paintings, small, in clock order
  mouths.jpg      the mouth region of each stage, the same crop, side by side (the clock at a glance)
  phone-scale.jpg the five stages exactly as big as on a 390-px phone (1 image px = 1 CSS px)
  renders.jpg     every render of the round with its verdict
  sketches.jpg    our own code-drawn layout sketches (the only image input) and the stage-4 repaint mask
  deck.jpg        the Fahrenheit's deck dressing: lettering, plate, gold dial
Usage (repo root): python docs/concepts/chapters/sin-2026-09-27/head-round2/src/images.py"""
import io, os
from PIL import Image, ImageDraw, ImageFont

C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2/'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'frames')
F = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 24)
f = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 20)
NAMES = ['0 SHUT (turns 1-3)', '1 OPEN 1 (turns 4-6)', '2 OPEN 2 (turns 7-9)', '3 OPEN 3 (turns 10-11)', '4 FULLY OPEN (turn 12)']


def save(im, name):
    for q in (86, 80, 74, 68, 60):
        b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
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
        s.paste(img.resize((cw, ch), Image.LANCZOS), (x, y))
        d.text((x, y + ch + 4), t1, font=F, fill=(236, 232, 220))
        if t2:
            d.text((x, y + ch + 30), t2, font=f, fill=(170, 164, 150))
    return s


def main():
    os.makedirs(OUT, exist_ok=True)
    st = [Image.open(f'{C}final/stage-{k}.png').convert('RGB') for k in range(5)]
    save(grid([(im, NAMES[k], '') for k, im in enumerate(st)], 520, 297, 2, 44), 'paintings.jpg')
    box = (850, 330, 2050, 1060)                     # the mouth region, the same on every stage
    save(grid([(im.crop(box), NAMES[k], '') for k, im in enumerate(st)], 520, 316, 2, 44), 'mouths.jpg')
    # phone scale: the painting at 380 px tall (frame.html phone mode), the head region, 1:1 with CSS px
    sc = 380 / 1344
    ph = []
    for im in st:
        small = im.resize((round(2352 * sc), 380), Image.LANCZOS)
        ph.append(small.crop((round(0.34 * small.width), 20, round(0.34 * small.width) + 200, 260)))
    s = Image.new('RGB', (5 * 200 + 6 * 12, 240 + 60), (11, 10, 18)); d = ImageDraw.Draw(s)
    for k, p in enumerate(ph):
        s.paste(p, (12 + k * 212, 12)); d.text((12 + k * 212, 258), NAMES[k].split(' (')[0], font=F, fill=(236, 232, 220))
    save(s, 'phone-scale.jpg')
    r = [('s0/a1', 'a1 · 0.62', 'smooth humpback; tower, claw, wings fine'), ('s0/a2', 'a2 · 0.62', 'claw a dark blob on the tower'),
         ('s0/b1', 'b1 · 0.70', 'portholes: machinery on the creature'), ('s0/b2', 'b2 · 0.70', 'mouth not shut, a red grin'),
         ('s0/c1', 'c1 · 0.62 v2', 'metal plates, reads as a machine'), ('s0/c2', 'c2 · 0.62 v2', 'mouth a sliver open'),
         ('s0/c3', 'c3 · 0.66 v2  PICK', 'rock plates, jaws shut, claw clear'), ('s0/c4', 'c4 · 0.62 v2', 'eye lost, bolts on the hide')]
    items = [(Image.open(f'{C}{p}.full.png').convert('RGB'), a, b) for p, a, b in r]
    for k in range(1, 5):
        items.append((Image.open(f'{C}stages/m{k}-a.blend.png').convert('RGB').crop(box), f'stage {k} seed a  PICK', 'consistent violet throat'))
        items.append((Image.open(f'{C}stages/m{k}-b.blend.png').convert('RGB').crop(box), f'stage {k} seed b', 'gold rings, machine parts'))
    save(grid(items, 500, 286, 2), 'renders.jpg')
    sk = [(Image.open(f'{C}sketches/sketch-s{k}.png').convert('RGB'), f'sketch stage {k}', f'lower jaw at {[0, 6, 12, 18, 24][k]} degrees') for k in range(5)]
    sk.append((Image.open(f'{C}stages/mask-s4.png').convert('RGB'), 'stage 4 repaint mask', 'where sketch 4 differs from sketch 0'))
    save(grid(sk, 500, 286, 2), 'sketches.jpg')
    save(st[0].crop((900, 1020, 2000, 1344)), 'deck.jpg')


main()
