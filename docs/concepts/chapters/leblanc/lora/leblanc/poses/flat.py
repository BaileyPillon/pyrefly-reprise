"""Flatten cutouts onto a checker-free mid grey (so white dress and fringe both show) for looking.

    python flat.py attack.3 [attack.7 ...]   -> D:/Tools/pyrefly-lora/leblanc/poses/_flat-<tag>.jpg
    python flat.py --head attack.3 x0 y0 x1 y1   -> _head-<tag>.png (1:1 crop of the cutout on grey)
"""
import pathlib
import sys

from PIL import Image

D = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/poses')
BG = (150, 150, 150)


def flat(tag):
    im = Image.open(D / f'{tag}.png').convert('RGBA')
    bg = Image.new('RGBA', im.size, BG + (255,))
    bg.alpha_composite(im)
    return bg.convert('RGB')


if __name__ == '__main__':
    if sys.argv[1] == '--head':
        tag = sys.argv[2]
        box = tuple(map(int, sys.argv[3:7]))
        flat(tag).crop(box).save(D / f'_head-{tag}.png')
        print(D / f'_head-{tag}.png')
    else:
        for tag in sys.argv[1:]:
            flat(tag).save(D / f'_flat-{tag}.jpg', quality=92)
            print(D / f'_flat-{tag}.jpg', Image.open(D / f'{tag}.png').size)
