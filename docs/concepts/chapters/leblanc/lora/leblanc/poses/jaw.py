"""Turn the cast frame's solid black patch under the jaw into hair shade (FFX-2 only, Chapter 6). No diffusion.

lora/leblanc/judge.md (cast, face 6): "a black mass sits under the jaw: the dark underside of the far
hair, painted as a solid patch; at 1:1 it reads as a hole or a beard". Six masked repaints (repaint.mjs
`fix`/`fixh` at 0.65 and 0.8, `jaw` with VAEEncodeForInpaint at 1) all painted the black back. So this
recolours it as what it is, the far hair's underside, in the tones idle's own hair shade uses (sampled
from public/art/characters/leblanc/idle.png: about 165,148,122): inside the ellipse, near-black pixels
become that shade (a 1 px darker rim kept where they meet other colours, as line art) and the white
background seen through the gap becomes the lighter hair tone, so the cut-out does not punch a hole.

    python jaw.py <src-tag> <out-name> cx,cy,rx,ry [--palette hair|neck]

--palette neck paints it as the neck in shadow instead (idle's neck shade, about 216,168,144): the
hair-shade version still read as a lump at 1:1 and the repaint drew it black again, so the redo uses neck.
"""
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter

D = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/poses')
PALETTES = {
    'hair': ((158, 140, 114), (92, 78, 62), (212, 196, 164)),
    'neck': ((214, 170, 150), (132, 92, 84), (238, 214, 202)),
}


def main():
    src, name, ell = sys.argv[1], sys.argv[2], tuple(map(int, sys.argv[3].split(',')))
    pal = sys.argv[sys.argv.index('--palette') + 1] if '--palette' in sys.argv else 'hair'
    SHADE, RIM, LIGHT = PALETTES[pal]
    im = Image.open(D / f'{src}.raw.png').convert('RGB')
    cx, cy, rx, ry = ell
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
    black = im.convert('L').point(lambda v: 255 if v < 70 else 0)
    inner = black.filter(ImageFilter.MinFilter(3))       # black pixels with black on every side
    px, mp, bp, ip = im.load(), m.load(), black.load(), inner.load()
    n = 0
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if not mp[x, y]:
                continue
            r, g, b = px[x, y]
            if bp[x, y]:
                px[x, y] = SHADE if ip[x, y] else RIM
                n += 1
            elif min(r, g, b) > 225 and max(r, g, b) - min(r, g, b) < 18:
                px[x, y] = LIGHT
                n += 1
    im.save(D / f'{src}.{name}.raw.png')
    print(f'{src}.{name}', 'pixels recoloured:', n)


if __name__ == '__main__':
    main()
