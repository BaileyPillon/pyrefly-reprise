"""Quick look grids (not the sheet): raw frames of a state, or 1:1 crops.

    python look.py grid attack [--scale 0.5]          -> D:/Tools/pyrefly-lora/leblanc/poses/_look-<state>.jpg
    python look.py crop attack.1 x0 y0 x1 y1 [...]      -> _crop.jpg (boxes in raw-frame pixels, native scale)
"""
import pathlib
import sys

from PIL import Image

D = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/poses')


def grid(state, scale=0.5):
    # state = 'attack' (sets 1..8) or 'attack.v3' (a named set)
    files = [f for f in D.glob(f'{state}.*.raw.png') if f.name[len(state) + 1:].split('.')[0].isdigit()]
    files.sort(key=lambda p: int(p.name[len(state) + 1:].split('.')[0]))
    ims = [Image.open(f).convert('RGB') for f in files]
    w, h = ims[0].size
    tw, th = int(w * scale), int(h * scale)
    cols = min(len(ims), 6 if w < h else 3)
    rows = (len(ims) + cols - 1) // cols
    out = Image.new('RGB', (tw * cols, th * rows), (60, 60, 60))
    for i, im in enumerate(ims):
        out.paste(im.resize((tw, th), Image.LANCZOS), ((i % cols) * tw, (i // cols) * th))
    out.save(D / f'_look-{state}.jpg', quality=88)
    print(D / f'_look-{state}.jpg', [f.name for f in files])


def crop(tag, boxes):
    im = Image.open(D / f'{tag}.raw.png').convert('RGB')
    parts = [im.crop(b) for b in boxes]
    W = sum(p.width for p in parts) + 8 * (len(parts) - 1)
    H = max(p.height for p in parts)
    out = Image.new('RGB', (W, H), (60, 60, 60))
    x = 0
    for p in parts:
        out.paste(p, (x, 0)); x += p.width + 8
    out.save(D / '_crop.jpg', quality=92)
    print(D / '_crop.jpg')


if __name__ == '__main__':
    if sys.argv[1] == 'grid':
        grid(sys.argv[2], float(sys.argv[4]) if len(sys.argv) > 4 else 0.5)
    else:
        v = list(map(int, sys.argv[3:]))
        crop(sys.argv[2], [tuple(v[i:i + 4]) for i in range(0, len(v), 4)])
