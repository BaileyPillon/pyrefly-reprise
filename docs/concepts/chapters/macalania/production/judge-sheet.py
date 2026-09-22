# Judge sheet for one subject/state (FFX only, Macalania production).
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/macalania/production/judge-sheet.py <subject> <state> <reference.png> <out.jpg>
# Row 1: the reference (picked concept for idle, picked idle otherwise) and every
# candidate whole, scaled to one height. Row 2: 1:1 native-pixel head crops.
# Row 3: 1:1 native-pixel costume/detail crops. Judge from rows 2 and 3.
import pathlib, sys, json
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
subject, state, ref, out = sys.argv[1:5]
R = HERE / "renders" / subject
cands = sorted(p for p in R.glob(f"{state}.*.png") if not p.name.endswith((".raw.png", ".mask.png")))
C = 340  # crop side, native pixels
H = 560  # whole-figure row height


def flat(im):
    im = im.convert("RGBA")
    bg = Image.new("RGB", im.size, (236, 236, 236))
    bg.paste(im, mask=im.split()[-1])
    return bg


def crops(im):
    a = im.convert("RGBA").split()[-1]
    w, h = im.size
    box = a.getbbox() or (0, 0, w, h)
    wide = w > h * 1.15
    px = a.load()

    def centroid_x(y0, y1):
        xs = [x for y in range(y0, y1, 4) for x in range(0, w, 4) if px[x, y] > 128]
        return sum(xs) // len(xs) if xs else w // 2

    def centroid_y(x0, x1):
        ys = [y for x in range(x0, x1, 4) for y in range(0, h, 4) if px[x, y] > 128]
        return sum(ys) // len(ys) if ys else h // 2

    if wide:  # prone: head at the left
        cy = centroid_y(box[0], box[0] + max(8, (box[2] - box[0]) // 5))
        head = (box[0], cy - C // 2)
        cx = (box[0] + box[2]) // 2
        body = (cx - C // 2, centroid_y(cx - 40, cx + 40) - C // 2)
    else:
        top = box[1]
        cx = centroid_x(top, top + max(8, (box[3] - top) // 8))
        head = (cx - C // 2, top)
        my = top + int((box[3] - top) * 0.38)
        body = (centroid_x(my - 30, my + 30) - C // 2, my - C // 2)
    f = flat(im)
    return [f.crop((x, y, x + C, y + C)) for x, y in (head, body)]


cells = [("REF " + pathlib.Path(ref).name, Image.open(ROOT / ref))] + [(p.stem.replace(f"{state}.", ""), Image.open(p)) for p in cands]
wholes = []
for name, im in cells:
    f = flat(im)
    wholes.append(f.resize((max(1, int(f.width * H / f.height)), H), Image.LANCZOS))
colw = max(max(w.width for w in wholes), C) + 12
W = colw * len(cells)
sheet = Image.new("RGB", (W, 30 + H + 12 + C + 12 + C + 10), (40, 40, 44))
d = ImageDraw.Draw(sheet)
d.text((8, 8), f"{subject} / {state}  (row 2 and 3 are 1:1 native pixels)", fill=(255, 255, 255))
for i, ((name, im), wh) in enumerate(zip(cells, wholes)):
    x = i * colw + 6
    sheet.paste(wh, (x, 30))
    d.text((x + 2, 30 + H - 14), name, fill=(200, 0, 0))
    hc, bc = crops(im)
    sheet.paste(hc, (x, 30 + H + 12))
    sheet.paste(bc, (x, 30 + H + 12 + C + 12))
sheet.save(out, quality=88)
print(out, sheet.size, [p.name for p in cands])
