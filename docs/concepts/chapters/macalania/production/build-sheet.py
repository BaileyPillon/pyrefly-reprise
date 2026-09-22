# Production veto sheet for the Macalania chapter (FFX only).
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/macalania/production/build-sheet.py
# One row per installed item: the picked concept (or the approved idle it was
# referenced from), the installed painting whole, a 1:1 native-pixel face crop
# and a 1:1 native-pixel detail crop. Crop centres come from picks.json
# ("face" and "detail", as fractions of the installed image), so the crops are
# the places a judge has to look, not a guess. Writes sheet.jpg (q85).
import pathlib, json
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
picks = json.loads((HERE / "picks.json").read_text(encoding="utf-8"))
C = 300    # 1:1 crop side
H = 300    # thumbnail height
PAD = 10
LABEL = 250


def flat(im):
    im = im.convert("RGBA")
    bg = Image.new("RGB", im.size, (236, 236, 236))
    bg.paste(im, mask=im.split()[-1])
    return bg


def thumb(im):
    f = flat(im)
    w = int(f.width * H / f.height)
    if w > 420:
        w = 420
        return f.resize((w, int(f.height * w / f.width)), Image.LANCZOS)
    return f.resize((w, H), Image.LANCZOS)


def auto(im, which):
    """judge-sheet.py's heuristic: the head at the top (or left, for a prone
    figure) of the alpha's bounding box; the detail 38% of the way down."""
    a = im.convert("RGBA").split()[-1]
    w, h = im.size
    box = a.getbbox() or (0, 0, w, h)
    px = a.load()
    def cxr(y0, y1):
        xs = [x for y in range(y0, y1, 4) for x in range(0, w, 4) if px[x, y] > 128]
        return sum(xs) // len(xs) if xs else w // 2
    def cyr(x0, x1):
        ys = [y for x in range(x0, x1, 4) for y in range(0, h, 4) if px[x, y] > 128]
        return sum(ys) // len(ys) if ys else h // 2
    if w > h * 1.15:
        if which == "face":
            return box[0] + C // 2, cyr(box[0], box[0] + max(8, (box[2] - box[0]) // 5))
        cx = (box[0] + box[2]) // 2
        return cx, cyr(cx - 40, cx + 40)
    if which == "face":
        return cxr(box[1], box[1] + max(8, (box[3] - box[1]) // 8)), box[1] + C // 2
    my = box[1] + int((box[3] - box[1]) * 0.38)
    return cxr(my - 30, my + 30), my


def crop(im, frac, which="face"):
    f = flat(im)
    if frac == "auto":
        cx, cy = auto(im, which)
    else:
        cx, cy = int(frac[0] * f.width), int(frac[1] * f.height)
    x = max(0, min(f.width - C, cx - C // 2))
    y = max(0, min(f.height - C, cy - C // 2))
    return f.crop((x, y, x + C, y + C))


rows = picks["items"]
W = LABEL + 420 + PAD + 420 + PAD + C + PAD + C + PAD * 2
sheet = Image.new("RGB", (W, 40 + len(rows) * (H + PAD)), (34, 34, 38))
d = ImageDraw.Draw(sheet)
d.text((10, 12), "Macalania production (FFX) - every item a CANDIDATE, not approved.  columns: picked concept | installed whole | 1:1 face | 1:1 detail", fill=(255, 255, 255))
for i, it in enumerate(rows):
    y = 40 + i * (H + PAD)
    d.text((10, y + 4), it["label"], fill=(255, 220, 120))
    for j, line in enumerate(it.get("note", "").split("|")):
        d.text((10, y + 24 + j * 14), line.strip(), fill=(210, 210, 210))
    x = LABEL
    concept = Image.open(ROOT / it["concept"])
    inst = Image.open(ROOT / it["installed"])
    for im in (thumb(concept), thumb(inst)):
        sheet.paste(im, (x, y))
        x += 420 + PAD
    sheet.paste(crop(inst, it["face"], "face"), (x, y)); x += C + PAD
    sheet.paste(crop(inst, it["detail"], "detail"), (x, y))
out = HERE / "sheet.jpg"
sheet.save(out, quality=85)
print(out, sheet.size, out.stat().st_size)
