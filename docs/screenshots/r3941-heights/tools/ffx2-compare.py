"""ffx2-compare.py: FFX-2 with and without the stature. The party's world heights, contact shadows and turn rings must be the
   same, and so must each girl's drawn height (the union of her planes' screen box; the animation sways a few pixels).
   python ffx2-compare.py --dir frames-ffx2 [--sheet ffx2-untouched.jpg]
   Takes the frames `capture.mjs` writes for the FFX-2 chapters (`--chapters=ffx2-bahamut,ffx2-vegnagun-shuyin,ffx2-leblanc`).
"""
import argparse
import json
import os
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

ap = argparse.ArgumentParser()
ap.add_argument('--dir', default='frames-ffx2')
ap.add_argument('--sheet', default='')
a = ap.parse_args()
tags = sorted({f.rsplit('-', 1)[0] for f in os.listdir(a.dir) if f.endswith('-before.json')})
bad = 0
worst_edge = 0.0
worst_height = 0.0
pairs = []
for tag in tags:
    b = json.load(open(os.path.join(a.dir, f'{tag}-before.json')))
    f = json.load(open(os.path.join(a.dir, f'{tag}-after.json')))
    heights = []
    for id_, ab in b['actors'].items():
        af = f['actors'].get(id_)
        same = af is not None and ab['height'] == af['height'] and ab['shadowBase'] == af['shadowBase'] and ab['ringBase'] == af['ringBase']
        if ab['side'] == 'party':
            rb, rf = b['rects'][id_], f['rects'][id_]
            h0, h1 = rb['yMax'] - rb['yMin'], rf['yMax'] - rf['yMin']
            worst_height = max(worst_height, abs(h1 - h0))
            worst_edge = max(worst_edge, *(abs(rb[k] - rf[k]) for k in ('yMin', 'yMax')))
            heights.append(f"{id_} world {ab['height']:.3f} drawn {h0:.1f} -> {h1:.1f} px" + ('' if same else ' DIFFERS'))
        if not same:
            bad += 1
    print(f"{tag}: " + '; '.join(heights))
    pairs.append(tag)
print(f'FFX-2 world heights, shadows and rings identical off and on: {"YES" if bad == 0 else "NO"}; the girls\' drawn heights differ by at most {worst_height:.1f} px, their top and bottom edges by at most {worst_edge:.1f} px (animation)')

if a.sheet:
    def font(size):
        for p in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
        return ImageFont.load_default()
    scale, bar, gutter = 0.5, 30, 8
    rows = []
    for tag in pairs:
        ib = Image.open(os.path.join(a.dir, f'{tag}-before.png')).convert('RGB')
        ia = Image.open(os.path.join(a.dir, f'{tag}-after.png')).convert('RGB')
        sz = (int(ib.width * scale), int(ib.height * scale))
        rows.append((tag, ib.resize(sz, Image.LANCZOS), ia.resize(sz, Image.LANCZOS)))
    w, h = rows[0][1].size
    sheet = Image.new('RGB', (w * 2 + gutter, (h + bar) * len(rows)), (11, 10, 18))
    d = ImageDraw.Draw(sheet)
    for i, (tag, ib, ia) in enumerate(rows):
        y = i * (h + bar)
        sheet.paste(ib, (0, y + bar))
        sheet.paste(ia, (w + gutter, y + bar))
        name = tag.replace('-1600x900', '').replace('ffx2-', 'FFX-2 ')
        d.text((8, y + 6), f'{name}: ?stature=off (before)', fill=(185, 177, 154), font=font(15))
        d.text((w + gutter + 8, y + 6), f'{name}: default (after): the same world heights, shadows and rings', fill=(240, 207, 146), font=font(15))
    sheet.save(a.sheet, 'JPEG', quality=84, optimize=True)
    print(a.sheet, sheet.size, os.path.getsize(a.sheet) // 1024, 'KB')
sys.exit(1 if bad else 0)
