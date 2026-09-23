"""Logos ROUND 2, IP-Adapter references from the REPAIRED idle (same method as ../poses/make-refs.py).

    D:/Tools/ComfyUI/python_embeded/python.exe -s make-refs.py

refs/idle-square.png : the installed idle (public/art/characters/logos/idle.png, the
                       cleaned one, sha256 64a43dc9...d925f) flattened on white and
                       padded to a square, 1024x1024 (the adapter's CLIP-Vision
                       centre-crops a square; an unpadded tall idle loses the head).
refs/idle-head.png   : a square crop of the idle's head, helmet and shoulder emblem
                       (box 200,0,480,280, the round-3 head box), 1024x1024.
The two go to IPAdapterAdvanced as one ImageBatch, combine 'concat'.
"""
import hashlib
import json
import pathlib

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[6]
SRC = REPO / 'public/art/characters/logos/idle.png'
BOX = (200, 0, 480, 280)

im = Image.open(SRC).convert('RGBA')
flat = Image.new('RGB', im.size, (255, 255, 255))
flat.paste(im, mask=im.split()[-1])
s = max(im.size) + 64
sq = Image.new('RGB', (s, s), (255, 255, 255))
sq.paste(flat, ((s - im.width) // 2, (s - im.height) // 2))
(HERE / 'refs').mkdir(exist_ok=True)
sq.resize((1024, 1024), Image.LANCZOS).save(HERE / 'refs/idle-square.png')
flat.crop(BOX).resize((1024, 1024), Image.LANCZOS).save(HERE / 'refs/idle-head.png')
(HERE / 'refs/refs.json').write_text(json.dumps({
    'source': 'public/art/characters/logos/idle.png',
    'sourceSha256': hashlib.sha256(SRC.read_bytes()).hexdigest(),
    'headBox': BOX,
}, indent=1) + '\n', encoding='utf-8')
print('refs written')
