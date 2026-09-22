"""Living-portrait v3 warp landmarks: composite every yaw key on the plate
canvas and draw its landmark set over a 20 px grid, so the points can be
placed and checked at 1:1 (the mesh warp in the prototype's src/warp.ts
reads them from art/rig.json -> keys[].landmarks, order in
artMeta.commonLandmarkOrder).

  python tools/gen/rig-landmarks.py composite --out <dir>   # <dir>/<key>.png
  python tools/gen/rig-landmarks.py overlay --out <dir> [--crop x,y,w,h] [--scale 2]
  python tools/gen/rig-landmarks.py sheet                   # art/v3/warp/landmarks-sheet.png
"""
import argparse, json, os
from PIL import Image, ImageDraw

ROOT = 'docs/concepts/pause-until-dawn/prototype-v2/art'
W, H = 832, 1216
BG = (8, 5, 8, 255)


def rig():
    return json.load(open(os.path.join(ROOT, 'rig.json'), encoding='utf-8'))


def paste(canvas, placed):
    im = Image.open(os.path.join(ROOT, placed['file'])).convert('RGBA')
    x, y = placed['box'][0], placed['box'][1]
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.paste(im, (x, y))
    return Image.alpha_composite(canvas, layer)


def composite(r, key_id):
    v3 = r['artMeta']['v3']
    c = Image.new('RGBA', (W, H), BG)
    if key_id == 'frontal':
        for l in v3['frontal']['layers']:
            c = paste(c, l)
        return c
    body = next(l for l in v3['frontal']['layers'] if l['motion'] == 'chest')
    k = v3['keys'][key_id]
    for p in (k['back'], body, k['front']):
        c = paste(c, p)
    return c


COLORS = [(255, 60, 60), (60, 255, 60), (80, 160, 255), (255, 255, 60), (255, 60, 255), (60, 255, 255), (255, 160, 40), (255, 255, 255)]


def overlay(r, key, img, grid=True):
    names = r['artMeta']['commonLandmarkOrder']
    d = ImageDraw.Draw(img)
    if grid:
        for x in range(0, W, 20):
            d.line([(x, 0), (x, H)], fill=(255, 255, 255, 40) if x % 100 else (255, 255, 255, 110))
        for y in range(0, H, 20):
            d.line([(0, y), (W, y)], fill=(255, 255, 255, 40) if y % 100 else (255, 255, 255, 110))
    for i, (x, y) in enumerate(key.get('landmarks', [])):
        col = COLORS[i % len(COLORS)]
        d.ellipse([x - 4, y - 4, x + 4, y + 4], outline=col, width=2)
        d.text((x + 6, y - 6), f'{i}:{names[i] if i < len(names) else i}', fill=col)
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['composite', 'overlay', 'sheet'])
    ap.add_argument('--out', default=os.path.join(ROOT, 'v3', 'warp'))
    ap.add_argument('--crop')
    ap.add_argument('--scale', type=float, default=1)
    ap.add_argument('--key')
    a = ap.parse_args()
    r = rig()
    os.makedirs(a.out, exist_ok=True)
    keys = [k for k in r['keys'] if not a.key or k['id'] == a.key]
    tiles = []
    for k in keys:
        img = composite(r, k['id'])
        if a.cmd == 'composite':
            img.save(os.path.join(a.out, f"{k['id']}.png"))
            continue
        img = overlay(r, k, Image.alpha_composite(img, Image.new('RGBA', (W, H), (0, 0, 0, 0))))
        if a.crop:
            x, y, w, h = map(int, a.crop.split(','))
            img = img.crop((x, y, x + w, y + h))
        if a.scale != 1:
            img = img.resize((int(img.width * a.scale), int(img.height * a.scale)), Image.LANCZOS)
        if a.cmd == 'overlay':
            img.convert('RGB').save(os.path.join(a.out, f"{k['id']}.lm.png"))
        tiles.append(img)
    if a.cmd == 'sheet':
        tw = 416
        th = int(tiles[0].height * tw / tiles[0].width)
        sheet = Image.new('RGB', (tw * len(tiles), th), (0, 0, 0))
        for i, t in enumerate(tiles):
            sheet.paste(t.convert('RGB').resize((tw, th), Image.LANCZOS), (i * tw, 0))
        sheet.save(os.path.join(a.out, 'landmarks-sheet.png'))


if __name__ == '__main__':
    main()
