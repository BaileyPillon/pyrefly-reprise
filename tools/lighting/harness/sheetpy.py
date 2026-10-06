import sys, glob, json
from PIL import Image, ImageDraw
d, chapter, out = sys.argv[1:4]
rows = []
keys = sorted({f.split('__')[1]+'__'+f.split('__')[2] for f in glob.glob(f'{d}/{chapter}__*__*__*.png')})
for k in keys:
    ident, pose = k.split('__')
    box = json.load(open(f'{d}/{chapter}__{ident}__{pose}.box.json'))
    tiles = []
    for look in ['0','2','3']:
        try: im = Image.open(f'{d}/{chapter}__{ident}__{pose}__{look}.png').convert('RGB').crop(tuple(box))
        except Exception: continue
        tiles.append(im)
    H = 300
    tiles = [t.resize((int(t.size[0]*H/t.size[1]), H), Image.LANCZOS) for t in tiles]
    W = sum(t.size[0] for t in tiles)+4*len(tiles)
    row = Image.new('RGB', (W, H)); x = 0
    for t in tiles: row.paste(t, (x, 0)); x += t.size[0]+4
    ImageDraw.Draw(row).text((4, 4), f'{ident} {pose}  (off | look 2 | look 3)', fill=(255,255,255))
    rows.append(row)
W = max(r.size[0] for r in rows); Ht = sum(r.size[1] for r in rows)
s = Image.new('RGB', (W, Ht)); y = 0
for r in rows: s.paste(r, (0, y)); y += r.size[1]
s.save(out); print(s.size)
