"""Chapter 6 (FFX-2 only): the training set for the logos-x2 identity LoRA.

Why: three text passes on Logos re-rolled the helmet, emblem, strap and wraps
in every state (sets/logos/round3/judge.md). A LoRA trained on the on-model
painting carries the installed idle's look into every pose, so the prompt only
has to say view and pose.

Which paintings qualify (the brief: on-model, judged 6 or above on identity,
never the wrong costume) is argued in dataset.md. Only the installed idle
(after its skin cleanup) qualifies; every training image here is a crop or a
mirror of it.

Sources are read, never written. Each crop is flattened onto white (the
cutout's RGB under alpha 0 is rembg fringe), padded with white where the box
leaves the canvas, small crops are enlarged with RealESRGAN_x4plus on the CPU
(never the shared GPU) and brought to about 1 MP with Lanczos. Captions carry
the trigger, 1boy, view/framing and pose only.

    D:/Tools/ComfyUI/python_embeded/python.exe -s build-dataset.py build [--out D:/Tools/pyrefly-lora/logos/dataset]

Writes <out>/img/<id>.png + <id>.txt and <out>/manifest.json (source path,
source sha256, box, mirror, resize, output sha256, caption, repeats).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import pathlib

import numpy as np
from PIL import Image, ImageOps

REPO = pathlib.Path(__file__).resolve().parents[6]
ESRGAN = pathlib.Path('D:/Tools/ComfyUI/ComfyUI/models/upscale_models/RealESRGAN_x4plus.pth')
TARGET_AREA = 1024 * 1024
P = 'logosX2, 1boy, solo'
BG = 'simple background, white background'
IDLE = 'public/art/characters/logos/idle.png'  # 604 x 1160, facing left

POSE = 'standing, legs apart, arms down, holding gun, dual wielding, gun pointed down'

# (id, box on the idle x0,y0,x1,y1 (may leave the canvas: padded white), caption tail).
# The mirrored copy of each is added automatically with 'facing right'.
CROPS = [
    ('full', (-60, -40, 664, 1200), f'full body, from side, profile, {POSE}'),
    ('full-wide', (-420, -120, 1024, 1280), f'full body, from side, profile, wide shot, {POSE}'),
    ('cowboy', (0, 0, 604, 860), f'cowboy shot, from side, profile, {POSE}'),
    ('upper', (60, -10, 560, 580), 'upper body, from side, profile, arms down, holding gun, looking down'),
    ('headshoulders', (130, -10, 490, 350), 'portrait, head and shoulders, from side, profile, looking down, closed mouth'),
    ('face', (180, 0, 400, 220), 'close-up, face, from side, profile, looking down, closed mouth'),
    ('chest', (170, 150, 490, 470), 'upper body, chest, shoulder, head out of frame, from side'),
    ('legs', (100, 690, 580, 1160), 'lower body, legs, feet, sandals, head out of frame, from side, standing'),
]
REPEATS = {'img': 1}


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def flatten(im: Image.Image) -> Image.Image:
    if im.mode != 'RGBA':
        return im.convert('RGB')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def crop_pad(im: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    x0, y0, x1, y1 = box
    out = Image.new('RGB', (x1 - x0, y1 - y0), (255, 255, 255))
    sx0, sy0, sx1, sy1 = max(0, x0), max(0, y0), min(im.width, x1), min(im.height, y1)
    out.paste(im.crop((sx0, sy0, sx1, sy1)), (sx0 - x0, sy0 - y0))
    return out


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
    how = 'lanczos'
    if area < 0.35 * TARGET_AREA:
        im, how = esrgan(im), 'esrgan-x4+lanczos'
    s = math.sqrt(TARGET_AREA / (im.width * im.height))
    w, h = round(im.width * s / 64) * 64, round(im.height * s / 64) * 64
    return im.resize((w, h), Image.LANCZOS), how


def build(out: pathlib.Path) -> None:
    d = out / 'img'
    d.mkdir(parents=True, exist_ok=True)
    src = REPO / IDLE
    before = sha256(src)
    base = flatten(Image.open(src))
    manifest = {'trigger': 'logosX2', 'repeats': REPEATS, 'items': []}
    for ident, box, tail in CROPS:
        im0, how = to_area(crop_pad(base, box))
        for mirror in (False, True):
            im = ImageOps.mirror(im0) if mirror else im0
            face = 'facing right' if mirror else 'facing left'
            name = f'{ident}{"-m" if mirror else ""}'
            caption = f'{P}, {tail}, {face}, {BG}'
            im.save(d / f'{name}.png')
            (d / f'{name}.txt').write_text(caption + '\n', encoding='utf-8')
            manifest['items'].append({
                'id': name, 'subset': 'img', 'source': IDLE, 'sha256': before,
                'box': list(box), 'mirror': mirror, 'size': [im.width, im.height],
                'resize': how, 'outSha256': sha256(d / f'{name}.png'), 'caption': caption,
            })
            print(name, im.size, how)
    assert sha256(src) == before, 'source changed'
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=1), encoding='utf-8')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['build'])
    ap.add_argument('--out', default='D:/Tools/pyrefly-lora/logos/dataset')
    a = ap.parse_args()
    build(pathlib.Path(a.out))


if __name__ == '__main__':
    main()
