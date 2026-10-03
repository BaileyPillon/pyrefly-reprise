"""
A-7 "Backdrops with a floor and a sky": shrink a derived depth map to 8 bits.

`DepthPlates` reads the map through a canvas (`getImageData`), which is 8 bits per channel, so the low byte of
`tools/fx/depth.py`'s 16-bit output is never seen by the game and only costs download size (about 1 MB a room,
against the live site's 800 MB line). This writes the same map as an 8-bit grey PNG, `round(depth16 / 257)`,
in place, and notes it in `depth.json` ("bits": 8). It reads and writes only `public/fx/<scene>/`; the painting is
never touched.

  D:/Tools/ComfyUI/python_embeded/python.exe tools/fx/depth8.py zanarkand-dome dreams-end ...

Game case: both (shared tooling).
"""

import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main(scenes):
    for scene in scenes:
        d = os.path.join(ROOT, 'public', 'fx', scene)
        png = os.path.join(d, 'depth.png')
        im = Image.open(png)
        a = np.asarray(im)
        if a.dtype == np.uint8:
            print(scene, 'already 8-bit')
            continue
        small = np.clip(np.round(a.astype(np.float64) / 257.0), 0, 255).astype(np.uint8)
        Image.fromarray(small, 'L').save(png, optimize=True)
        meta_path = os.path.join(d, 'depth.json')
        with open(meta_path, encoding='utf-8') as f:
            meta = json.load(f)
        meta['bits'] = 8
        meta['generator'] = 'tools/fx/depth.py, then tools/fx/depth8.py (round(depth16 / 257), the game reads 8 bits)'
        with open(meta_path, 'w', newline='\n', encoding='utf-8') as f:
            json.dump(meta, f, indent=1)
            f.write('\n')
        print(scene, 'ok', os.path.getsize(png), 'bytes')


if __name__ == '__main__':
    main(sys.argv[1:])
