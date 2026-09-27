"""Sin head pilot: the supporting images for the sheet (JPEG, each under 1 MB), from the candidate folder.
  frames/paintings.jpg   the four picked paintings, uncropped
  frames/stages-C.jpg    option C's mouth stages 0..4 (the clock), a crop around the jaw
  frames/renders.jpg     every render of the round with its verdict
  frames/sketches.jpg    our own code-drawn layout sketches (the only image input)
Usage (repo root): python docs/concepts/chapters/sin-2026-09-27/head-pilot/src/images.py"""
import io, json, os
from PIL import Image, ImageDraw, ImageFont

C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'frames')
try:
    F = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 26)
    f = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 21)
except OSError:
    F = f = ImageFont.load_default()


def save(im, name):
    for q in (86, 80, 74, 68, 60):
        b = io.BytesIO(); im.save(b, 'JPEG', quality=q)
        if b.tell() < 950_000:
            break
    p = os.path.join(OUT, name)
    open(p, 'wb').write(b.getvalue())
    print(p, im.size, round(b.tell() / 1024), 'KB')


def grid(items, cw, ch, cols, title=None):
    rows = (len(items) + cols - 1) // cols
    top = 50 if title else 0
    im = Image.new('RGB', (cols * cw + (cols + 1) * 10, top + rows * (ch + 40) + 10), (12, 11, 18))
    d = ImageDraw.Draw(im)
    if title:
        d.text((12, 10), title, fill=(240, 236, 224), font=F)
    for i, (path, label, box) in enumerate(items):
        x = 10 + (i % cols) * (cw + 10); y = top + (i // cols) * (ch + 40)
        t = Image.open(path).convert('RGB')
        if box:
            W, H = t.size; t = t.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)))
        t = t.resize((cw, ch), Image.LANCZOS)
        im.paste(t, (x, y))
        d.text((x + 2, y + ch + 6), label, fill=(226, 220, 205), font=f)
    return im


picks = json.load(open(os.path.join(HERE, 'picks.json')))
save(grid([(p['img'], f"{k}: {p['label']} ({os.path.basename(p['img']).split('.')[0]})", None) for k, p in picks.items()], 1000, 571, 1), 'paintings.jpg')

box = (0.28, 0.18, 0.86, 0.66)
st = [(C + 'C/stages/C-m0.png', '0 · shut', box), (C + 'C/stages/C-m1.png', '1', box), (C + 'C/p2.full.png', '2 · the painting', box),
      (C + 'C/stages/C-m3.png', '3', box), (C + 'C/stages/C-m4.png', '4 · fully open', box)]
save(grid(st, 340, 226, 3, 'Option C: one painting, five mouth stages (derived in place)'), 'stages-C.jpg')

verdict = {
    'A/p1': 'reject: viaduct, violets, beak',
    'A/p2': 'PICK A', 'A/p3': 'reject: a robed person on the deck',
    'B/p1': 'runner-up B: murky', 'B/p2': 'reject: flat, no face', 'B/p3': 'reject: tiled teeth pattern',
    'B/p4': 'reject: a beam and a spire, no face', 'B/p5': 'PICK B',
    'C/p1': 'reject: no deck, city in front', 'C/p2': 'PICK C', 'C/p3': 'runner-up C: busy deck',
    'D/p1': 'runner-up D: a blob', 'D/p2': 'reject: people, pumpkin', 'D/p3': 'PICK D (beam line to paint out)', 'D/p4': 'reject: no face',
}
save(grid([(C + k + '.full.png', f'{k} · {v}', None) for k, v in verdict.items()], 470, 268, 3, 'Every render of the round (sketch img2img, animagine-xl-4.0-opt)'), 'renders.jpg')
save(grid([(C + f'sketches/sketch-{k}-m2.png', f'sketch {k}', None) for k in 'ABCD'], 640, 366, 2, 'Our own layout sketches, drawn in code from written descriptions (the only image input)'), 'sketches.jpg')
