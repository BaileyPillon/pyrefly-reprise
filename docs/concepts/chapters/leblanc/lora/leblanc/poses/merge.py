"""Merge region repaints of one frame (FFX-2 only, Chapter 6).

repaint.mjs runs one region at a time from the same source frame and composites only inside its
feathered mask, so the best seed of each region can be combined exactly: start from <base-tag> and
paste each <src-tag> through the mask that produced it.

    python merge.py <base-tag> <out-tag> <src-tag>=<mask-file> [...]
      (files in D:/Tools/pyrefly-lora/leblanc/poses; the mask is repaint.mjs's <tag>.<name>.mask.png)
"""
import json
import pathlib
import sys

from PIL import Image

D = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/poses')


def main():
    base, out, parts = sys.argv[1], sys.argv[2], sys.argv[3:]
    im = Image.open(D / f'{base}.raw.png').convert('RGB')
    for p in parts:
        src, mask = p.split('=')
        s = Image.open(D / f'{src}.raw.png').convert('RGB')
        m = Image.open(D / mask).convert('L')
        im = Image.composite(s, im, m)
    im.save(D / f'{out}.raw.png')
    (D / f'{out}.merge.json').write_text(json.dumps({'base': base, 'parts': parts}, indent=1))
    print(out, 'from', base, '+', parts)


if __name__ == '__main__':
    main()
