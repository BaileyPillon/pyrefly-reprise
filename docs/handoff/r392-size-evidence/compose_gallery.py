"""Compose the before/after gallery of pose-gallery.mjs: one row per build, one tile per pose, the idle's guides drawn on every tile.
    python compose_gallery.py <out.jpg> <figure> <title> <before-dir>:<before-tag> <after-dir>:<after-tag> [--label-before "..."] [--label-after "..."]
yellow = the idle's head top, red = the idle's stance, cyan = the idle's feet (screen positions from the idle plane as that build draws it); the tile captions say the head's size in px on screen."""
import json, sys, pathlib
from PIL import Image, ImageDraw, ImageFont

out, figure, title = sys.argv[1], sys.argv[2], sys.argv[3]
rows = []
for spec, label in ((sys.argv[4], "BEFORE (live 39.1 table)"), (sys.argv[5], "AFTER (r392)")):
    d, tag = spec.rsplit(":", 1)
    rows.append((label, tag, pathlib.Path(d)))
font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 20)
small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
tiles = []
for label, tag, d in rows:
    meta = json.loads((d / f"{tag}-{figure}.json").read_text(encoding="utf8"))
    r = []
    idle_head = None
    for s in meta["shots"]:
        im = Image.open(d / s["file"]).convert("RGB")
        dr = ImageDraw.Draw(im)
        g = s.get("guides") or {}
        if g.get("headTopY") is not None:
            dr.line([(0, g["headTopY"]), (im.size[0], g["headTopY"])], fill=(255, 230, 60), width=1)
        if g.get("stanceX") is not None:
            dr.line([(g["stanceX"], 0), (g["stanceX"], im.size[1])], fill=(255, 70, 70), width=1)
        if g.get("feetY") is not None:
            dr.line([(0, g["feetY"]), (im.size[0], g["feetY"])], fill=(70, 220, 255), width=1)
        if idle_head is None:
            idle_head = s["headPx"]
        cap = f"{s['pose']}   head {s['headPx']:.1f} px" + ("" if s["pose"] == "idle" or not idle_head else f"  (x{s['headPx'] / idle_head:.2f} of the idle's)")
        r.append((im, cap))
    tiles.append((label, r))
cw, ch = tiles[0][1][0][0].size
pad = 6
W = len(tiles[0][1]) * (cw + pad) + pad
H = 56 + sum(34 + ch + pad for _ in tiles)
sheet = Image.new("RGB", (W, H), (20, 20, 24))
dr = ImageDraw.Draw(sheet)
dr.text((pad, 6), title, fill=(255, 230, 120), font=font)
dr.text((pad, 30), "yellow = the idle's head top, red = the idle's stance, cyan = the idle's feet; every tile is 1:1 with the 1600x900 battle", fill=(190, 190, 200), font=small)
y = 56
for label, r in tiles:
    dr.text((pad, y + 6), label, fill=(255, 255, 255), font=font)
    y += 34
    for i, (im, cap) in enumerate(r):
        sheet.paste(im, (pad + i * (cw + pad), y))
        dr.rectangle([pad + i * (cw + pad), y, pad + i * (cw + pad) + 330, y + 22], fill=(0, 0, 0))
        dr.text((pad + i * (cw + pad) + 4, y + 2), cap, fill=(255, 255, 255), font=small)
    y += ch + pad
sheet.save(out, quality=90)
print(out, sheet.size)
