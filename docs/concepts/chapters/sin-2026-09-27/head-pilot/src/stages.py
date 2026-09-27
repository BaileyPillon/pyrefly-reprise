"""Sin head pilot (FFX only): mouth stages derived from ONE painting, so the clock keeps one identity.

Method (as the Evrae breath-charge derive): the lower jaw of the picked painting is cut out by a
hand-placed polygon and turned about its hinge (shut = turned up, fully open = turned down). The strip
the jaw uncovers is filled first: mouth interior (dark violet with the gravity glow) when it opens,
sky sampled from the same rows when it shuts. Then a low-strength img2img pass of the whole picture
heals the seams (gen.py, denoise 0.42), and ONLY the pixels inside the dilated jaw area are taken from
the healed picture: everything else stays the picked painting's own pixels.

Usage:
  python stages.py edit  <painting.png> <out_dir> <opt> [k,k]  -> <opt>-m<k>.edit.png and <opt>-m<k>.mask.png
  python stages.py blend <painting.png> <out_dir> <opt>   -> <opt>-m<k>.png (needs <opt>-m<k>.full.png from gen.py)
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# per option: hinge (fractions), lower-jaw polygon (fractions), stage angles in degrees (+ opens, - shuts)
JAW = {
    'C': {
        'hinge': (0.755, 0.43),
        # stops above the deck rail (y 0.595) so the rail is never turned with the jaw
        'poly': [(0.335, 0.362), (0.38, 0.39), (0.43, 0.425), (0.50, 0.458), (0.58, 0.49), (0.66, 0.525), (0.72, 0.545),
                 (0.765, 0.47), (0.79, 0.54), (0.78, 0.595), (0.66, 0.595), (0.62, 0.58), (0.52, 0.53), (0.43, 0.475),
                 (0.365, 0.415), (0.335, 0.38)],
        'stages': {0: -7.0, 1: -3.5, 3: 4.0, 4: 8.0},
    },
}


def poly_mask(size, pts):
    W, H = size
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).polygon([(x * W, y * H) for x, y in pts], fill=255)
    return m


def rotate_about(img, ang, cx, cy, resample=Image.BICUBIC):
    # PIL turns counter-clockwise on screen for positive angles; a jaw that points left of its hinge drops
    # (opens) when turned counter-clockwise
    return img.rotate(ang, resample=resample, center=(cx, cy))


def edit(src, out, opt, only=None):
    J = JAW[opt]
    im = Image.open(src).convert('RGB')
    W, H = im.size
    hx, hy = J['hinge'][0] * W, J['hinge'][1] * H
    jaw = poly_mask(im.size, J['poly']).filter(ImageFilter.GaussianBlur(2))
    a = np.asarray(im, float)
    for k, ang in J['stages'].items():
        if only is not None and k not in only:
            continue
        base = a.copy()
        rj = rotate_about(jaw, ang, hx, hy)
        rim = np.asarray(rotate_about(im, ang, hx, hy), float)
        # the old jaw's area, grown by a few pixels so no sliver of its edge survives, less the turned jaw
        grown = np.asarray(jaw.filter(ImageFilter.MaxFilter(9)), float) / 255
        uncovered = grown * (1 - np.asarray(rj, float) / 255)
        if ang > 0:   # opening: the gap is mouth interior; the painting's own throat texture, stretched over it
            x0, y0, x1, y1 = [int(v) for v in (0.52 * W, 0.34 * H, 0.68 * W, 0.46 * H)]
            fill = np.asarray(Image.fromarray(a[y0:y1, x0:x1].astype(np.uint8)).resize((W, H), Image.BICUBIC), float)
        else:         # shutting: the gap is sky and the far city at the front (sampled from the same rows left of
            #           the snout), and the dark neck behind (sampled beside the hinge)
            ref = a[:, int(0.18 * W):int(0.26 * W)].mean(axis=1, keepdims=True)
            sky = np.repeat(ref, W, axis=1)
            body = a[int(0.48 * H):int(0.52 * H), int(0.80 * W):int(0.84 * W)].reshape(-1, 3).mean(axis=0)
            xs = np.arange(W)[None, :, None]
            t = np.clip((xs - 0.55 * W) / (0.13 * W), 0, 1)
            fill = sky * (1 - t) + body * t
        u = uncovered[..., None]
        base = base * (1 - u) + fill * u
        r = (np.asarray(rj, float) / 255)[..., None]
        base = base * (1 - r) + rim * r
        Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).save(os.path.join(out, f'{opt}-m{k}.edit.png'))
        # the area the heal may touch: union of both jaws, dilated
        m = np.maximum(np.asarray(jaw), np.asarray(rj))
        mi = Image.fromarray(m).filter(ImageFilter.MaxFilter(41)).filter(ImageFilter.GaussianBlur(18))
        mi.save(os.path.join(out, f'{opt}-m{k}.mask.png'))
        print(opt, k, ang)


def blend(src, out, opt):
    im = np.asarray(Image.open(src).convert('RGB'), float)
    for k in JAW[opt]['stages']:
        healed = Image.open(os.path.join(out, f'{opt}-m{k}.full.png')).convert('RGB').resize((im.shape[1], im.shape[0]), Image.LANCZOS)
        m = (np.asarray(Image.open(os.path.join(out, f'{opt}-m{k}.mask.png')), float) / 255)[..., None]
        o = im * (1 - m) + np.asarray(healed, float) * m
        Image.fromarray(np.clip(o, 0, 255).astype(np.uint8)).save(os.path.join(out, f'{opt}-m{k}.png'))
        print(os.path.join(out, f'{opt}-m{k}.png'), 'changed share', round(float((m > 0.02).mean()), 3))


if __name__ == '__main__':
    cmd, src, out, opt = sys.argv[1:5]
    os.makedirs(out, exist_ok=True)
    if cmd == 'edit':
        edit(src, out, opt, [int(k) for k in sys.argv[5].split(',')] if len(sys.argv) > 5 else None)
    else:
        blend(src, out, opt)
