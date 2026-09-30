"""
Eye-candy options round, option B "Living Paintings": the contact sheet of the depth plates (B-check 2).

For each room: the approved painting, its derived depth map, and the plates the runtime cuts from them
(the thresholds are read from src/engine/fx/b/ambient/<room>.ts, desktop layout), each plate tinted over
the painting. Reads public/art and public/fx; writes only the JPEG named on the command line.

  D:/Tools/ComfyUI/python_embeded/python.exe tools/fx/plate-sheet.py docs/concepts/eye-candy-2026-09-29/b/checks/plates-sheet.jpg

Game case: both (tooling).
"""

import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROOMS = [('gagazet', 'gagazet'), ('macalania', 'macalania-temple'), ('bevelle', 'bevelle-underground'), ('djose', 'djose-chamber-provisional')]
TINTS = np.array([[40, 70, 255], [40, 220, 90], [255, 220, 40], [255, 60, 60]], dtype=np.float64)
W, H = 480, 274


def thresholds(room):
    src = open(os.path.join(ROOT, 'src', 'engine', 'fx', 'b', 'ambient', room + '.ts'), encoding='utf-8').read()
    m = re.search(r"plates: \{ thresholds: \[([^\]]*)\]", src)
    floor = re.search(r"plates: \{[^\n]*floor:", src) is not None
    return [float(x) for x in m.group(1).split(',') if x.strip()], floor


def main(out):
    rows = []
    for room, key in ROOMS:
        th, floor = thresholds(room)
        paint = Image.open(os.path.join(ROOT, 'public', 'art', 'backdrops', key + '.png')).convert('RGB').resize((W, H), Image.LANCZOS)
        depth = np.asarray(Image.open(os.path.join(ROOT, 'public', 'fx', key, 'depth.png')).resize((W, H)), dtype=np.float64) / 65535
        p = np.asarray(paint, dtype=np.float64)
        level = np.digitize(depth, th)
        tiles = [paint, Image.fromarray((depth * 255).astype(np.uint8)).convert('RGB')]
        over = p * 0.45 + TINTS[np.minimum(level, 3)] * 0.55
        tiles.append(Image.fromarray(over.astype(np.uint8)))
        for k in range(1, len(th) + 1):
            mask = (level >= k)[..., None]
            tiles.append(Image.fromarray(np.where(mask, p, p * 0.12).astype(np.uint8)))
        row = Image.new('RGB', (W * 6, H + 22), (12, 12, 16))
        d = ImageDraw.Draw(row)
        labels = ['painting', 'depth (white = near)', 'plates'] + [('floor (projected) ' if floor and k == len(th) else 'plate ') + str(k) for k in range(1, len(th) + 1)]
        for i, t in enumerate(tiles):
            row.paste(t, (i * W, 22))
            d.text((i * W + 6, 5), f'{key}: {labels[i]}' if i == 0 else labels[i], fill=(230, 230, 230))
        rows.append(row)
    sheet = Image.new('RGB', (W * 6, (H + 22) * len(rows)))
    for i, r in enumerate(rows):
        sheet.paste(r, (0, i * (H + 22)))
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    sheet.save(out, quality=86)
    print('wrote', out)


if __name__ == '__main__':
    main(sys.argv[1])
