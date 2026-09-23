"""Chapter 6 (FFX-2 only): the training set for the leblanc-x2 identity LoRA.

Why: five pose passes drew a different costume in every state (round-3 judge,
sets/leblanc/round3/judge.md). A LoRA trained on the on-model paintings of
THIS Leblanc (the installed idle is the costume truth, method check 2.1)
carries her hair, face, open robe, white halter dress, crimson obi, black fan
and lavender open-toe boots into any pose.

Sources are read, never written. Each crop is flattened onto white, small
crops are enlarged with RealESRGAN_x4plus on the CPU (never the shared GPU)
and brought back to about 1 MP with Lanczos. Captions carry the trigger, view
and pose only (plus, for the portrait, the one thing in it that differs from
the idle, so it binds to its word and not to the trigger).

    D:/Tools/ComfyUI/python_embeded/python.exe -s build-dataset.py build [--out D:/Tools/pyrefly-lora/leblanc/dataset]
    ... preview --out <dir>   (writes preview.jpg of every crop, no ESRGAN)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import pathlib

import numpy as np
from PIL import Image

REPO = pathlib.Path(__file__).resolve().parents[6]
ESRGAN = pathlib.Path('D:/Tools/ComfyUI/ComfyUI/models/upscale_models/RealESRGAN_x4plus.pth')
TARGET_AREA = 1024 * 1024
P = 'leblancX2, 1girl, solo'
IDLE = 'public/art/characters/leblanc/idle.png'
PORTRAIT = 'public/art/portraits/leblanc.png'
BG = 'white background, simple background'
IDLE_POSE = 'standing, looking at viewer, smile, holding folding fan, closed fan, fan to mouth, arm up'
REPEATS = {'idle': 2, 'portrait': 1}

# (id, subset, source, box in source pixels or None, canvas, caption tail)
# canvas: None = the crop itself; (w, h, scale, x, y) = paste the flattened
# figure scaled by `scale` at (x, y) on a white w x h canvas.
ITEMS = [
    ('idle-full', 'idle', IDLE, None, (832, 1216, 1.0, 120, 50),
     f'full body, {IDLE_POSE}, holding clothes, feet, {BG}'),
    ('idle-full-wide', 'idle', IDLE, None, (1024, 1024, 0.84, 260, 32),
     f'full body, wide shot, {IDLE_POSE}, holding clothes, {BG}'),
    ('idle-full-small', 'idle', IDLE, None, (896, 1152, 0.86, 90, 110),
     f'full body, {IDLE_POSE}, holding clothes, feet, {BG}'),
    ('idle-knees', 'idle', IDLE, (0, 0, 591, 880), None,
     f'cowboy shot, {IDLE_POSE}, holding clothes, {BG}'),
    ('idle-thighs', 'idle', IDLE, (20, 0, 591, 640), None,
     f'cowboy shot, upper body, {IDLE_POSE}, holding clothes, {BG}'),
    ('idle-upper', 'idle', IDLE, (80, 0, 560, 480), None,
     f'upper body, {IDLE_POSE}, {BG}'),
    ('idle-bust', 'idle', IDLE, (160, 0, 520, 360), None,
     f'portrait, head and shoulders, {IDLE_POSE}, {BG}'),
    ('idle-face', 'idle', IDLE, (215, 25, 475, 285), None,
     f'close-up, face, {IDLE_POSE}, {BG}'),
    ('idle-torso', 'idle', IDLE, (150, 170, 500, 560), None,
     f'close-up, upper body, head out of frame, arm up, {BG}'),
    ('idle-legs', 'idle', IDLE, (150, 540, 560, 1118), None,
     f'lower body, head out of frame, standing, legs, feet, {BG}'),
    ('portrait-face', 'portrait', PORTRAIT, (120, 0, 832, 712), None,
     'portrait, close-up, face, looking at viewer, smile, medium hair, hand up, holding, white background'),
]


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def flatten(im: Image.Image) -> Image.Image:
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
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


def to_area(im: Image.Image, allow_esrgan: bool) -> tuple[Image.Image, str]:
    area = im.width * im.height
    if 0.9 * TARGET_AREA <= area <= 1.6 * TARGET_AREA:
        return im, 'native'
    how = 'lanczos'
    if allow_esrgan and area < 0.5 * TARGET_AREA:
        im, how = esrgan(im), 'esrgan-x4+lanczos'
    s = math.sqrt(TARGET_AREA / (im.width * im.height))
    w, h = round(im.width * s / 8) * 8, round(im.height * s / 8) * 8
    return im.resize((w, h), Image.LANCZOS), how


def make(src: str, box, canvas, allow_esrgan=True):
    im = flatten(Image.open(REPO / src))
    if box:
        im = im.crop(box)
    if canvas:
        w, h, s, x, y = canvas
        fig = im
        if s != 1.0:
            fig = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        c = Image.new('RGB', (w, h), (255, 255, 255))
        c.paste(fig, (x, y))
        return c, 'canvas'
    return to_area(im, allow_esrgan)


def build(out: pathlib.Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    manifest = {'trigger': 'leblancX2', 'repeats': REPEATS, 'items': []}
    for ident, subset, src, box, canvas, tail in ITEMS:
        sp = REPO / src
        before = sha256(sp)
        im, how = make(src, box, canvas)
        d = out / subset
        d.mkdir(exist_ok=True)
        im.save(d / f'{ident}.png')
        caption = f'{P}, {tail}'
        (d / f'{ident}.txt').write_text(caption + '\n', encoding='utf-8')
        assert sha256(sp) == before, f'source changed: {src}'
        manifest['items'].append({
            'id': ident, 'subset': subset, 'source': src, 'sha256': before,
            'box': list(box) if box else None, 'canvas': list(canvas) if canvas else None,
            'size': [im.width, im.height], 'resize': how, 'caption': caption,
            'outSha256': sha256(d / f'{ident}.png'),
        })
        print(ident, subset, im.size, how)
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=1), encoding='utf-8')


def preview(out: pathlib.Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    tiles = []
    for ident, subset, src, box, canvas, tail in ITEMS:
        im, _ = make(src, box, canvas, allow_esrgan=False)
        im.thumbnail((360, 360))
        tiles.append(im)
    W = sum(t.width for t in tiles) + 6 * len(tiles)
    s = Image.new('RGB', (W, 360), (160, 160, 160))
    x = 0
    for t in tiles:
        s.paste(t, (x, 0))
        x += t.width + 6
    s.save(out / 'preview.jpg', quality=85)
    print(out / 'preview.jpg', s.size)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['build', 'preview'])
    ap.add_argument('--out', default='D:/Tools/pyrefly-lora/leblanc/dataset')
    a = ap.parse_args()
    (build if a.cmd == 'build' else preview)(pathlib.Path(a.out))


if __name__ == '__main__':
    main()
