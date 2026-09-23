"""Leblanc round 2 LOOK aid: each state's head cut from the in-game 2x screenshots (ingame-<tag>-<state>.png),
enlarged 4x on a grid of 5 screenshot px (2.5 CSS px), with the expected bob width marked (heads.json x the
on-screen pixels per texel), so the in-battle head size is checked by eye, not only by the engine's numbers.
    python igheads.py <tag> <out.jpg>"""
import json, sys, pathlib
from PIL import Image, ImageDraw
H = pathlib.Path(__file__).resolve().parent
tag, out = sys.argv[1], sys.argv[2]
j = json.load(open(H / f'ingame-{tag}.json'))
heads = {k: v for k, v in json.load(open(H / 'heads.json')).items() if not k.startswith('_')}
# the bob's centre in the installed cut-out's pixels (from the gridded 1:1 crops)
HC = {'idle': (336, 95), 'attack': (450, 105), 'cast': (390, 345), 'hurt': (512, 95), 'ko': (165, 235)}
tiles = []
for s, st in j['states'].items():
    f = H / f'ingame-{tag}-{s}-clear.png'
    im = Image.open(f if f.exists() else H / f'ingame-{tag}-{s}.png').convert('RGB')
    r, c = st['rect'], st['meta']['content']
    ppt = r['h'] / (c['y1'] - c['y0'])
    ox, oy = max(0, r['x'] - 40), max(0, r['y'] - 40)
    hx, hy = HC[s]
    X, Y = (r['x'] + (hx - c['x0']) * ppt - ox) * 2, (r['y'] + (hy - c['y0']) * ppt - oy) * 2
    half = 45
    t = im.crop((int(X - half), int(Y - half), int(X + half), int(Y + half))).resize((360, 360), Image.NEAREST)
    d = ImageDraw.Draw(t)
    for k in range(0, 360, 20):
        d.line([(k, 0), (k, 359)], fill=(0, 90, 90)); d.line([(0, k), (359, k)], fill=(0, 90, 90))
    w = heads[s] * ppt * 2 * 4  # expected bob width in tile pixels
    d.line([(180 - w / 2, 350), (180 + w / 2, 350)], fill=(255, 255, 0), width=3)
    d.text((3, 3), f'{s}: expected {heads[s] * ppt:.1f} css px', fill=(255, 255, 0))
    tiles.append(t)
S = Image.new('RGB', (len(tiles) * 366, 360))
for i, t in enumerate(tiles):
    S.paste(t, (i * 366, 0))
S.save(out, quality=92)
print(out, S.size)
