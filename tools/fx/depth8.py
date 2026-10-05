"""
A-7 "Backdrops with a floor and a sky": shrink a derived depth map to 8 bits.

`DepthPlates` reads the map through a canvas (`getImageData`), which is 8 bits per channel, so the low byte of
`tools/fx/depth.py`'s 16-bit output is never seen by the game and only costs download size (about 1 MB a room,
against the live site's 800 MB line). This writes the same map as an 8-bit grey PNG, `depth16 >> 8`, in place, and
notes it in `depth.json` ("bits": 8). It reads and writes only `public/fx/<scene>/`; the painting is never touched.

Why `>> 8` and not a rounded `depth16 / 257` (which this file used until 2026-10-03, release 38): Chromium reads a
16-bit grey PNG into a canvas as its high byte, so the in-game value of the 16-bit file IS `d >> 8`, and writing that
makes the 8-bit file read back pixel for pixel the same as the 16-bit one (0 differing pixels in all four rooms that
were still 16-bit, measured in headless Chromium 153). `round(d / 257)` differs from today's in-game value by exactly
1/255 on 28 to 37 percent of the pixels. The eight rooms converted before that day were written with the rounded
formula and keep it: their files are already the 8-bit ones the live site serves, and a plate threshold is far wider
than one step. An 8-bit file is also read the same by every browser, where the 16-bit to 8-bit step is browser-defined.

  python tools/fx/depth8.py zanarkand-dome dreams-end ...        (Pillow and numpy; any Python 3)

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
        small = (a.astype(np.uint16) >> 8).astype(np.uint8)
        Image.fromarray(small).save(png, optimize=True)
        meta_path = os.path.join(d, 'depth.json')
        with open(meta_path, encoding='utf-8') as f:
            meta = json.load(f)
        meta['bits'] = 8
        meta['generator'] = 'tools/fx/depth.py, then tools/fx/depth8.py (depth16 >> 8, the high byte the game reads from the 16-bit file)'
        with open(meta_path, 'w', newline='\n', encoding='utf-8') as f:
            json.dump(meta, f, indent=1)
            f.write('\n')
        print(scene, 'ok', os.path.getsize(png), 'bytes')


if __name__ == '__main__':
    main(sys.argv[1:])
