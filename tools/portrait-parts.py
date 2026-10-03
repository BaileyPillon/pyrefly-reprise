"""Install the picked living-portrait face parts (D-320) into public/portrait-parts/ and write the manifest.

Game case: both (shared plumbing; the parts are per plate, FFX plates 1-3 and FFX-2 plates 4-5, see PLATES).

Source: D:/Tools/pyrefly-art-backup/candidates/2026-10-02-overnight/portrait-face-parts/<plate>/parts/ (the agents'
recommended picks, the ones D-320 approved). Nothing is repainted here: each part is copied as it was painted, and
each eye's window mask (an L image) is packed into the alpha of a white RGBA PNG so the driver can clip with
`destination-in`.

Output (a real folder, listed in .git/info/exclude; at release time it is copied into public/art/portrait-parts/):
  public/portrait-parts/manifest.json
  public/portrait-parts/<plate>/{2x,1x}/<part>.png

Usage: python tools/portrait-parts.py [--src DIR] [--out DIR]
"""
import argparse
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image

DEFAULT_SRC = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-02-overnight/portrait-face-parts'

# plate -> what the A2 rig may move on it. `blink` and `gaze` list the eyes whose lid / iris is driven.
# gazeScale shrinks the iris travel where the README names a flaw at large offsets.
PLATES = {
    'tidus': dict(blink=['R', 'L'], gaze=['R', 'L'], gazeScale=1.0),
    'yuna-ffx2': dict(blink=['R', 'L'], gaze=['R', 'L'], gazeScale=0.7),
    'yuna': dict(blink=['R', 'L'], gaze=['R', 'L'], gazeScale=0.9),
    'paine': dict(blink=['R', 'L'], gaze=['R', 'L'], gazeScale=0.9),
    'wakka': dict(blink=['R', 'L'], gaze=['R', 'L'], gazeScale=1.0),
    # both Rikkus keep the wink: only the open eye has parts
    'rikku': dict(blink=['L'], gaze=['L'], gazeScale=0.75),
    'rikku-ffx2': dict(blink=['L'], gaze=['L'], gazeScale=0.6),
    # Kimahri blinks the near eye only (the far eye's closed part is a lavender patch)
    'kimahri': dict(blink=['L'], gaze=['L'], gazeScale=0.7),
    'lulu': dict(blink=['R', 'L'], gaze=['R', 'L'], gazeScale=0.8),
    # Auron: dark glasses, the visible eye sliver's lid only, no eye movement
    'auron': dict(blink=['L'], gaze=[], gazeScale=0.0),
}

MASTER = [2688, 1536]


def wanted_parts(cfg):
    names = ['mouth-open-smile', 'mouth-concerned-press']
    names += [f'lid{e}-closed' for e in cfg['blink']]
    for e in cfg['gaze']:
        names += [f'eye{e}-socket', f'eye{e}-iris', f'eye{e}-catch', f'eye{e}-window']
    return names


def union(boxes):
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[0] + b[2] for b in boxes)
    y1 = max(b[1] + b[3] for b in boxes)
    return [x0, y0, x1 - x0, y1 - y0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=DEFAULT_SRC)
    ap.add_argument('--out', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'portrait-parts'))
    args = ap.parse_args()
    out = os.path.abspath(args.out)
    manifest = {'version': 1, 'master': MASTER, 'plates': {}}
    total = 0
    for plate, cfg in PLATES.items():
        pj = json.load(open(os.path.join(args.src, plate, 'parts', 'parts.json'), encoding='utf-8'))
        parts = {}
        for name in wanted_parts(cfg):
            meta = pj[name]
            parts[name] = {'box2x': meta['box2x'], 'box1x': meta['box1x']}
            for scale in ('2x', '1x'):
                dst = os.path.join(out, plate, scale, f'{name}.png')
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                if name.endswith('-window'):
                    mask = Image.open(os.path.join(args.src, plate, 'parts', 'masks', f'{name}.{scale}.png')).convert('L')
                    a = np.array(mask)
                    rgba = np.zeros(a.shape + (4,), dtype=np.uint8)
                    rgba[..., :3] = 255
                    rgba[..., 3] = a
                    Image.fromarray(rgba, 'RGBA').save(dst, optimize=True)
                else:
                    shutil.copyfile(os.path.join(args.src, plate, 'parts', scale, f'{name}.png'), dst)
                total += os.path.getsize(dst)
        manifest['plates'][plate] = {
            'canvas2x': union([p['box2x'] for p in parts.values()]),
            'canvas1x': union([p['box1x'] for p in parts.values()]),
            'blink': cfg['blink'],
            'gaze': cfg['gaze'],
            'gazeScale': cfg['gazeScale'],
            'parts': parts,
        }
    with open(os.path.join(out, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=1)
    size = {}
    for plate in PLATES:
        for scale in ('2x', '1x'):
            d = os.path.join(out, plate, scale)
            size[f'{plate}/{scale}'] = sum(os.path.getsize(os.path.join(d, n)) for n in os.listdir(d))
    print(json.dumps({'out': out, 'bytes': total, 'perPlate': size}, indent=1))
    return 0


if __name__ == '__main__':
    sys.exit(main())
