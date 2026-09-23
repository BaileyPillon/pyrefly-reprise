"""Living-portrait v4 (FFX-2 only): the training set for the yuna-x2 identity LoRA.

Why: the v3.3 turned keys are different paintings from the approved plate
(flat brown hair, no orange/pink tips, a small earring for the beaded tassel,
another line style). A LoRA trained on every approved painting of THIS Yuna
(the FFX-2 Gunner look) carries the plate's identity into every yaw.

Sources are read, never written. Each crop is flattened onto white (the
cutouts' RGB under alpha 0 is rembg fringe), small crops are enlarged with
RealESRGAN_x4plus on the CPU (never the shared GPU) and brought back to about
1 MP with Lanczos, and each gets a caption that describes pose and view only:
the identity is what the LoRA learns, so it is never written down.

    python -s tools/gen/rig-lora-data.py build [--out D:/Tools/pyrefly-lora/yuna-x2/dataset]

Writes <out>/<subset>/<id>.png + <id>.txt and <out>/manifest.json
(source path, source sha256, crop box, scale, caption, repeats).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import pathlib

import numpy as np
from PIL import Image

REPO = pathlib.Path(__file__).resolve().parents[2]
ESRGAN = pathlib.Path('D:/Tools/ComfyUI/ComfyUI/models/upscale_models/RealESRGAN_x4plus.pth')
TARGET_AREA = 1024 * 1024
P = 'yunaX2, 1girl, solo'

PLATE = 'public/art/portraits/yuna-x2.png'
PAUSE = 'public/art/pause/yuna-ffx2.png'
G = 'public/art/characters/yuna-gunner/'

# (id, subset, source, box x0,y0,x1,y1 or None, caption tail). Subsets carry the
# repeats: the plate is the identity target, so its crops weigh most.
ITEMS = [
    ('plate-full', 'plate', PLATE, None,
     'portrait, upper body, close-up, looking at viewer, straight-on, head tilt, '
     'light smile, closed mouth, bare shoulders, white background, simple background'),
    ('plate-head', 'plate', PLATE, (0, 0, 832, 832),
     'close-up, face, looking at viewer, straight-on, head tilt, light smile, '
     'closed mouth, white background, simple background'),
    ('plate-face', 'plate', PLATE, (140, 220, 700, 780),
     'extreme close-up, face, looking at viewer, straight-on, light smile, '
     'closed mouth, cropped head, white background'),
    ('plate-bust', 'plate', PLATE, (0, 150, 832, 1216),
     'portrait, upper body, looking at viewer, straight-on, light smile, closed mouth, '
     'collarbone, head out of frame top, white background, simple background'),
    ('idle-full', 'figure', G + 'idle.png', None,
     'full body, standing, looking at viewer, straight-on, light smile, '
     'holding gun, arms at sides, white background, simple background'),
    ('attack-full', 'figure', G + 'attack.png', None,
     'full body, standing, legs apart, looking at viewer, straight-on, '
     'dual wielding, holding gun, arms extended, firing, white background, simple background'),
    ('cast-full', 'figure', G + 'cast.png', None,
     'full body, standing, looking at viewer, arm up, holding gun, '
     'white background, simple background'),
    ('hurt-full', 'figure', G + 'hurt.png', None,
     'full body, standing, three-quarter view, from side, body facing right, '
     'looking at viewer, holding gun, white background, simple background'),
    ('victory-full', 'figure', G + 'victory.png', None,
     'full body, standing, three-quarter view, body facing left, looking at viewer, '
     'arm up, holding gun, open mouth, smile, white background, simple background'),
    ('ko-full', 'figure', G + 'ko.png', None,
     'full body, lying, on stomach, head on arm, one eye closed, holding gun, '
     'white background, simple background'),
    ('idle-bust', 'bust', G + 'idle.png', (100, 0, 420, 320),
     'upper body, portrait, looking at viewer, straight-on, light smile, closed mouth, '
     'white background, simple background'),
    ('attack-bust', 'bust', G + 'attack.png', (260, 60, 620, 420),
     'upper body, portrait, looking at viewer, straight-on, closed mouth, '
     'arms extended, white background, simple background'),
    ('hurt-bust', 'bust', G + 'hurt.png', (190, 0, 530, 340),
     'upper body, portrait, three-quarter view, looking at viewer, head turned, '
     'closed mouth, white background, simple background'),
    ('victory-bust', 'bust', G + 'victory.png', (90, 150, 420, 480),
     'upper body, portrait, three-quarter view, looking at viewer, open mouth, smile, '
     'arm up, white background, simple background'),
    ('ko-head', 'bust', G + 'ko.png', (560, 110, 1000, 550),
     'close-up, face, lying, head on arm, sideways, one eye closed, '
     'white background, simple background'),
    ('pause-full', 'scene', PAUSE, None,
     'upper body, leaning forward, head tilt, looking at viewer, smile, '
     'indoors, night, city lights, depth of field, blurry background'),
    ('pause-head', 'scene', PAUSE, (380, 0, 880, 500),
     'close-up, face, head tilt, looking at viewer, smile, parted lips, '
     'blurry background'),
]
REPEATS = {'plate': 4, 'figure': 1, 'bust': 1, 'scene': 1}  # ESRGAN busts smooth the line: weigh them least


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def flatten(im: Image.Image) -> Image.Image:
    if im.mode != 'RGBA':
        return im.convert('RGB')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


_model = None


def esrgan(im: Image.Image) -> Image.Image:
    """RealESRGAN_x4plus on the CPU (spandrel, ComfyUI's embedded python)."""
    global _model
    import torch
    import spandrel
    if _model is None:
        _model = spandrel.ModelLoader(device='cpu').load_from_file(str(ESRGAN)).eval()
    x = torch.from_numpy(np.asarray(im, dtype=np.float32) / 255.0).permute(2, 0, 1)[None]
    with torch.no_grad():
        y = _model(x)[0].clamp(0, 1).permute(1, 2, 0).numpy()
    return Image.fromarray((y * 255.0 + 0.5).astype(np.uint8))


def to_area(im: Image.Image) -> tuple[Image.Image, str]:
    area = im.width * im.height
    if area >= 0.9 * TARGET_AREA:
        return im, 'native'
    how = 'lanczos'
    if area < 0.35 * TARGET_AREA:
        im, how = esrgan(im), 'esrgan-x4+lanczos'
    s = math.sqrt(TARGET_AREA / (im.width * im.height))
    w, h = round(im.width * s / 8) * 8, round(im.height * s / 8) * 8
    return im.resize((w, h), Image.LANCZOS), how


def build(out: pathlib.Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    manifest = {'trigger': 'yunaX2', 'repeats': REPEATS, 'items': []}
    for ident, subset, src, box, tail in ITEMS:
        sp = REPO / src
        before = sha256(sp)
        im = flatten(Image.open(sp))
        if box:
            im = im.crop(box)
        im, how = to_area(im)
        d = out / subset
        d.mkdir(exist_ok=True)
        im.save(d / f'{ident}.png')
        caption = f'{P}, {tail}'
        (d / f'{ident}.txt').write_text(caption + '\n', encoding='utf-8')
        assert sha256(sp) == before, f'source changed: {src}'
        manifest['items'].append({
            'id': ident, 'subset': subset, 'source': src, 'sha256': before,
            'box': list(box) if box else None, 'size': [im.width, im.height],
            'resize': how, 'caption': caption,
        })
        print(ident, subset, im.size, how)
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=1), encoding='utf-8')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['build'])
    ap.add_argument('--out', default='D:/Tools/pyrefly-lora/yuna-x2/dataset')
    a = ap.parse_args()
    build(pathlib.Path(a.out))


if __name__ == '__main__':
    main()
