# 1:1 judge crops (FFX-2 only): per candidate, head, obi and feet at native pixels next to idle's.
# Head = the largest platinum-hair blob; obi = the largest crimson blob; feet = the bottom 240 rows.
# Usage: crops.py <state> [seed ...]  -> _crops-<state>.jpg
import sys, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[6]
IDLE = ROOT / "public/art/characters/leblanc/idle.png"
FONT = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 20)
BG = (150, 150, 160, 255)

def blob_box(a, mask):
    lab, n = ndimage.label(mask)
    if not n: return None
    sizes = ndimage.sum(mask, lab, range(1, n + 1)); i = int(np.argmax(sizes)) + 1
    ys, xs = np.where(lab == i); return xs.min(), ys.min(), xs.max(), ys.max()

def centered(im, box, w, h):
    cx, cy = (box[0] + box[2]) // 2, (box[1] + box[3]) // 2
    x0 = min(max(0, cx - w // 2), max(0, im.width - w)); y0 = min(max(0, cy - h // 2), max(0, im.height - h))
    return im.crop((x0, y0, x0 + w, y0 + h))

def on_bg(im):
    bg = Image.new("RGBA", im.size, BG); bg.alpha_composite(im); return bg

def crops(p, fc=None):
    im = Image.open(p).convert("RGBA"); a = np.asarray(im).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    hair = (al > 200) & (r > 150) & (abs(r - g) < 14) & (r - b > 12) & (r - b < 90)
    hb = blob_box(a, hair) or (0, 0, 260, 260)
    face = centered(im, (fc[0], fc[1], fc[0], fc[1]) if fc else (hb[0], hb[1], hb[2], hb[3] + 60), 280, 280)
    red = (al > 200) & (r > 120) & (g < 70) & (b < 100) & (r - b > 50)
    ob = blob_box(a, red) or (0, im.height // 3, im.width, im.height // 3 + 40)
    obi = centered(im, ob, 300, 280)
    ys = np.where(al.max(axis=1) > 0)[0]; bottom = ys.max() if len(ys) else im.height
    row = al[max(0, bottom - 240):bottom + 1]; xs = np.where(row.max(axis=0) > 0)[0]
    feet = im.crop((xs.min(), max(0, bottom - 240), xs.max() + 1, bottom + 1))
    return [on_bg(face), on_bg(obi), on_bg(feet)]

if __name__ == "__main__":
    state = sys.argv[1]
    # each arg: <seed>@<faceX>,<faceY> (face centre in cutout pixels, read off _grid-<state>.jpg)
    args = [a.split("@") for a in sys.argv[2:]]
    paths = [(IDLE, (330, 125))] + [
        (HERE / "renders" / f"{state}.{a[0]}.png", tuple(int(v) for v in a[1].split(",")) if len(a) > 1 else None)
        for a in args]
    rows = []
    for p, fc in paths:
        cs = crops(p, fc); w = sum(c.width for c in cs) + 10 * len(cs) + 150; h = max(c.height for c in cs)
        row = Image.new("RGB", (w, h), (50, 50, 60)); d = ImageDraw.Draw(row)
        d.text((6, 6), "idle" if p == IDLE else p.stem, fill=(255, 255, 255), font=FONT); x = 150
        for c in cs: row.paste(c.convert("RGB"), (x, 0)); x += c.width + 10
        rows.append(row)
    W = max(r.width for r in rows); H = sum(r.height + 8 for r in rows)
    out = Image.new("RGB", (W, H), (30, 30, 36)); y = 0
    for r in rows: out.paste(r, (0, y)); y += r.height + 8
    out.save(HERE / f"_crops-{state}.jpg", quality=90); print(out.size)
