"""Contact sheet of the Logos local-fix candidates (FFX-2 only).

    D:/Tools/ComfyUI/python_embeded/python.exe -s fix-sheet.py <state>

One row per candidate renders/<state>.<seed>.fix.png, plus the pick it fixes as the
first row: native 1:1 crops (no resampling) of every fixed region, each padded by
`pad` px around the pass's mask, taken in RAW-frame coordinates via the cutout's
cropBox, next to the same box from the idle's reference where one applies.
Writes renders/fix-<state>.jpg (q88).
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
R = HERE / "renders"
BG = (200, 200, 200)


def flat(p):
    im = Image.open(p).convert("RGBA")
    bg = Image.new("RGBA", im.size, BG + (255,))
    bg.alpha_composite(im)
    return bg.convert("RGB")


def bbox(p, pad=14):
    xs, ys = [], []
    for sh in p["mask"]:
        if "ellipse" in sh:
            cx, cy, rx, ry = sh["ellipse"]
            xs += [cx - rx, cx + rx]
            ys += [cy - ry, cy + ry]
        elif "rect" in sh:
            xs += sh["rect"][0::2]
            ys += sh["rect"][1::2]
        else:
            xs += [q[0] for q in sh["poly"]]
            ys += [q[1] for q in sh["poly"]]
    return [int(min(xs)) - pad, int(min(ys)) - pad, int(max(xs)) + pad, int(max(ys)) + pad]


state = sys.argv[1]
ALL = json.load(open(HERE / "fixes.json", encoding="utf-8"))
fx = ALL[state]
boxes = []
for k, v in ALL.items():  # every round for this state (fixes.json keys like "hurt.r2" name their state)
    if (v.get("state") or k) == state:
        for p in v["passes"]:
            b = bbox(p)
            if b not in boxes:
                boxes.append(b)
tags = [fx["pick"]] + sorted(p.stem for p in R.glob(f"{state}.*.fix.png"))
rows = []
for t in tags:
    meta = json.load(open(R / f"{t}.json", encoding="utf-8"))
    cb = meta["cutout"]["cropBox"]
    im = flat(R / f"{t}.png")
    tiles = []
    for b in boxes:
        tiles.append(im.crop((b[0] - cb[0], b[1] - cb[1], b[2] - cb[0], b[3] - cb[1])))
    whole = im.resize((max(1, round(im.width * 260 / max(im.size))), max(1, round(im.height * 260 / max(im.size)))), Image.LANCZOS)
    tiles.append(whole)
    h = max(x.height for x in tiles) + 26
    w = sum(x.width for x in tiles) + 12 * (len(tiles) + 1)
    row = Image.new("RGB", (w, h), (236, 232, 226))
    d = ImageDraw.Draw(row)
    dn = ",".join(str(p.get("denoise")) for p in meta.get("passes", [])) or "installed pick"
    d.text((12, 6), f"{t}   denoise {dn}", fill=(20, 20, 20))
    x = 12
    for tl in tiles:
        row.paste(tl, (x, 22))
        x += tl.width + 12
    rows.append(row)
W = max(r.width for r in rows)
sheet = Image.new("RGB", (W, sum(r.height for r in rows)), (236, 232, 226))
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height
out = R / f"fix-{state}.jpg"
sheet.save(out, quality=88)
print(out, sheet.size)
