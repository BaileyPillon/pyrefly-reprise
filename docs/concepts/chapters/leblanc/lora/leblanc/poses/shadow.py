"""Remove a painted ground shadow from a ko cut-out's alpha (FFX-2 only, Chapter 6). No re-render.

The ko frame paints a hard black shadow under the body and boots and isnet-anime keeps it
(lora/leblanc/judge.md, ko: style 6); the engine draws its own shadow, so the two would double.
The shadow is flat near-black and thick; the figure's own black is line art (thin) or the fan.
So: near-black pixels (max RGB <= --dark) -> a morphological opening (--open px) keeps only the
thick black areas -> connected pieces of at least --area px that are not inside an --keep box
(the fan) -> dilated by 2 px and cleared from the alpha, with a 1 px feather at the edge.

    python shadow.py <tag> [--dark 40] [--open 9] [--area 250] [--island 600] [--keep x0,y0,x1,y1 ...]
      reads  D:/Tools/pyrefly-lora/leblanc/poses/<tag>.png (the cut-out)
      writes <tag>.noshadow.png, <tag>.noshadow.mask.png (what was cleared) and prints the count
Boxes are in the cut-out's pixels.
"""
import pathlib
import sys

import numpy as np
from PIL import Image, ImageFilter

D = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/poses')


def label(mask):
    """4-connected components without scipy: returns (labels, sizes)."""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    sizes = [0]
    cur = 0
    for y0 in range(h):
        for x0 in np.nonzero(mask[y0] & (lab[y0] == 0))[0]:
            if lab[y0, x0]:
                continue
            cur += 1
            n = 0
            stack = [(y0, x0)]
            lab[y0, x0] = cur
            while stack:
                y, x = stack.pop()
                n += 1
                for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = cur
                        stack.append((yy, xx))
            sizes.append(n)
    return lab, sizes


def main():
    a = sys.argv[1:]
    tag = a[0]
    opt = {'dark': 40, 'open': 9, 'area': 250, 'island': 600}
    keep = []
    i = 1
    while i < len(a):
        k = a[i][2:]
        if k == 'keep':
            keep.append(tuple(map(int, a[i + 1].split(','))))
        else:
            opt[k] = int(a[i + 1])
        i += 2
    im = Image.open(D / f'{tag}.png').convert('RGBA')
    arr = np.array(im)
    rgb, alpha = arr[..., :3].astype(int), arr[..., 3]
    dark = (rgb.max(axis=2) <= opt['dark']) & (alpha > 0)
    m = Image.fromarray((dark * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MinFilter(opt['open'])).filter(ImageFilter.MaxFilter(opt['open']))
    thick = (np.array(m) > 0) & dark
    lab, sizes = label(thick)
    out = np.zeros_like(thick)
    for li, n in enumerate(sizes):
        if li == 0 or n < opt['area']:
            continue
        ys, xs = np.nonzero(lab == li)
        cy, cx = ys.mean(), xs.mean()
        if any(x0 <= cx <= x1 and y0 <= cy <= y1 for x0, y0, x1, y1 in keep):
            continue
        out[ys, xs] = True
    grow = Image.fromarray((out * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))
    # clear only near-black (or already translucent) pixels inside the grown mask, so line art that
    # borders the shadow keeps its colour pixels; feather by one pixel
    g = (np.array(grow) > 0) & ((rgb.max(axis=2) <= opt['dark'] + 30) | (alpha < 255))
    feather = np.array(Image.fromarray((g * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1))) / 255.0
    new_alpha = (alpha * (1 - feather)).round().astype(np.uint8)
    # the shadow's own outline and tips can survive as thin floating slivers: drop every opaque
    # island under --island px (8-connected at alpha >= 32) that is not the figure
    solid = new_alpha >= 32
    ilab, isizes = label(solid)
    big = max(isizes[1:]) if len(isizes) > 1 else 0
    dropped = 0
    for li, n in enumerate(isizes):
        if li and n < opt.get('island', 600) and n < big:
            new_alpha[ilab == li] = 0
            dropped += n
    faint = (new_alpha > 0) & (new_alpha < 32)
    near = np.array(Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    new_alpha[faint & ~near] = 0
    arr[..., 3] = new_alpha
    print('islands dropped px:', dropped)
    # re-crop the way tools/gen/rembg.py does (content = alpha >= 8, margin 16) and report the new
    # cut-out box, so the sidecar's width, height and baselineY describe the shadow-free figure
    out_im = Image.fromarray(arr)
    content = out_im.getchannel('A').point(lambda v: 255 if v >= 8 else 0).getbbox()
    l, t, r, b = content
    crop = (max(0, l - 16), max(0, t - 16), min(out_im.width, r + 16), min(out_im.height, b + 16))
    out_im = out_im.crop(crop)
    out_im.save(D / f'{tag}.noshadow.png', optimize=True)
    meta_path = D / f'{tag}.json'
    if meta_path.exists():
        import json
        old = json.loads(meta_path.read_text())['cutout']
        ox, oy = old['cropBox'][0], old['cropBox'][1]
        new = dict(old, width=out_im.width, height=out_im.height, baselineY=b - crop[1],
                   cropBox=[ox + crop[0], oy + crop[1], ox + crop[2], oy + crop[3]],
                   contentBox=[ox + l, oy + t, ox + r, oy + b], shadowRemoved='shadow.py')
        (D / f'{tag}.noshadow.cutout.json').write_text(json.dumps(new))
        print('cutout', json.dumps(new))
    Image.fromarray((g * 255).astype(np.uint8)).save(D / f'{tag}.noshadow.mask.png')
    print(tag, 'cleared px:', int(g.sum()), 'pieces:', int(sum(1 for li, n in enumerate(sizes) if li and n >= opt['area'])))


if __name__ == '__main__':
    main()
