# FF7 art cleanup round (2026-09-27): paintovers and masks on our OWN renders, fed to
# `tools/gen/inpaint.mjs --latent`, plus the composite that pastes an inpaint back through
# its feathered mask (so every pixel outside the mask stays identical to the source).
# No retail input, no mirroring, no IP-Adapter. Game case: FF7 only.
#
# Usage (embedded python):
#   paint.py barret <src.full.png> <scratch-dir>      -> b-{hair,vest,waist,finish}-{paint,mask}.png
#   paint.py cloud  <src.raw.png>  <scratch-dir>      -> c-{far,near}-{paint,mask}.png
#   paint.py gs     <src.png> <scratch-dir> <prefix> <rects...>   rect = x0,y0,x1,y1 (median-filter glyph removal)
#   paint.py composite <src.png> <inpainted.full.png> <mask.png> <out.png> [grow] [blur]
#   paint.py chain <src.png> <out.png> <inpainted:mask> ...   (composite several passes in order)
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

rng = np.random.default_rng(20260927)


def load(p):
    return np.asarray(Image.open(p).convert('RGB')).astype(np.float32)


def save(a, p):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(p)


def box_mask(shape, *rects):
    m = np.zeros(shape[:2], bool)
    for x0, y0, x1, y1 in rects:
        m[y0:y1, x0:x1] = True
    return m


def save_mask(m, p, grow=4, feather=4):
    if grow:
        m = ndimage.binary_dilation(m, iterations=grow)
    im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(feather))
    im.save(p)


def nearest_fill(a, hole, blur=3.0, src_ok=None):
    """Fill `hole` pixels from the nearest usable non-hole pixel, then soften inside the hole."""
    bad = hole if src_ok is None else (hole | ~src_ok)
    _, (iy, ix) = ndimage.distance_transform_edt(bad, return_indices=True)
    out = a[iy, ix]
    if blur:
        sm = np.stack([ndimage.gaussian_filter(out[..., c], blur) for c in range(3)], -1)
        out = np.where(hole[..., None], sm, out)
    return np.where(hole[..., None], out, a)


def lum(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def sat(a):
    mx, mn = a.max(-1), a.min(-1)
    return (mx - mn) / np.maximum(mx, 1)


def median_rect(a, rect, size=11):
    x0, y0, x1, y1 = rect
    p = 8
    sub = a[y0 - p:y1 + p, x0 - p:x1 + p]
    med = np.stack([ndimage.median_filter(sub[..., c], size=size) for c in range(3)], -1)
    a[y0:y1, x0:x1] = med[p:-p, p:-p]


# --------------------------------------------------------------------------- Barret

def barret(src, d):
    a = load(src)
    H, W = a.shape[:2]
    white = a.min(-1) > 238

    # 1. Hair: a hi-top fade with rounded top corners, an uneven top edge and coarse texture,
    #    in place of the flat black block that reads as a hat.
    p = a.copy()
    old = box_mask(a.shape, (362, 104, 476, 172)) & (lum(a) < 60)
    p[old] = 255
    shape = Image.new('L', (W, H), 0)
    dr = ImageDraw.Draw(shape)
    dr.rounded_rectangle((369, 116, 470, 196), radius=16, fill=255)
    top = [(x, 116 + int(rng.integers(-2, 3))) for x in range(384, 458, 6)]
    for x, y in top:
        dr.ellipse((x - 5, y - 3, x + 5, y + 5), fill=255)
    sh = np.asarray(shape.filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32) / 255
    # the hair thins into the fade over the hairline; the face below it is untouched
    sh *= np.clip((184 - np.arange(H, dtype=np.float32)) / 10, 0, 1)[:, None]
    tex = np.zeros((H, W, 3), np.float32) + np.array([30, 25, 23], np.float32)
    yy = np.arange(H, dtype=np.float32)[:, None]
    tex += np.clip((150 - yy) / 40, 0, 1)[..., None] * np.array([14, 11, 9], np.float32)
    ti = Image.fromarray(tex.clip(0, 255).astype(np.uint8))
    td = ImageDraw.Draw(ti)
    for _ in range(1400):
        x, y = int(rng.integers(366, 474)), int(rng.integers(108, 184))
        c = int(rng.integers(6, 70))
        r = int(rng.integers(1, 3))
        td.arc((x - r - 1, y - r, x + r + 1, y + r), int(rng.integers(0, 360)), int(rng.integers(90, 300)),
               fill=(c, int(c * 0.85), int(c * 0.78)))
    tex = np.asarray(ti).astype(np.float32)
    p = p * (1 - sh[..., None]) + tex * sh[..., None]
    save(p, f'{d}/b-hair-paint.png')
    save_mask(box_mask(a.shape, (358, 100, 480, 182)), f'{d}/b-hair-mask.png', grow=2, feather=5)

    # 2. The pale fleece trim at both vest armholes (and the far collar) becomes plain leather;
    #    loose fibres outside the body become background.
    p = a.copy()
    nonwhite = a.min(-1) < 235
    lab, _ = ndimage.label(~nonwhite)
    bg = np.isin(lab, np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    bg &= ~nonwhite  # true background: white connected to the frame edge
    body = ndimage.binary_opening(~bg, structure=np.ones((9, 9)))
    poly = Image.new('L', (W, H), 0)
    ImageDraw.Draw(poly).polygon([(472, 298), (560, 294), (632, 303), (650, 330), (642, 358), (610, 352),
                                  (560, 347), (516, 350), (509, 362), (509, 436), (468, 436), (468, 330)], fill=255)
    region = (np.asarray(poly) > 0) | box_mask(a.shape, (276, 288, 339, 368))
    pale = (lum(a) > 140) & ~bg & region  # includes the pure-white inside of the trim
    fleece_in = ndimage.binary_dilation(pale, iterations=2) & body & region
    # a smooth silhouette in place of the ragged fleece edge (no loose fibres, no notches)
    zone = ndimage.binary_dilation(region, iterations=8)
    sil = ~bg
    sil_s = ndimage.gaussian_filter(ndimage.binary_opening(sil, iterations=3).astype(np.float32), 2.5) > 0.5
    grow_px = zone & sil_s & ~sil
    cut_px = zone & sil & ~sil_s
    vest = np.array([88, 48, 18], np.float32)
    shade = np.clip(lum(a) / 255, 0.35, 1)[..., None]
    fill = fleece_in | grow_px
    p[fill] = (vest * (0.75 + 0.35 * shade))[fill]
    p[cut_px] = 255
    # dark outlines: the new silhouette edge, and the seam where the leather meets the arm
    new_sil = (sil & ~cut_px) | grow_px
    edge = zone & new_sil & ndimage.binary_dilation(~new_sil, iterations=2)
    skin = zone & new_sil & ~fill & (a[..., 0] > 120) & (a[..., 1] > 80) & (lum(a) < 170)
    seam = fill & ndimage.binary_dilation(skin, iterations=2)
    p[edge | seam] = np.array([40, 22, 10], np.float32)
    # the near shoulder's outer contour, upper part: a clean elliptical arc (fitted to the arm's own
    # edge at y = 300, 320, 340 and 420) so the leftover fibres there go and the edge is one clean line
    yy, xx = np.mgrid[0:H, 0:W]
    ell = ((xx - 530) / 95.0) ** 2 + ((yy - 450) / 160.0) ** 2 <= 1
    clip = box_mask(a.shape, (556, 290, 660, 372))
    p[clip & ~ell] = 255
    inside_new = clip & ell & bg & ndimage.binary_dilation(~bg, iterations=4)
    p[inside_new] = vest * 0.95
    arc = clip & ell & ndimage.binary_dilation(~ell, iterations=2)
    p[arc] = np.array([40, 22, 10], np.float32)
    save(p, f'{d}/b-vest-paint.png')
    save_mask(fill | cut_px | edge | (clip & ~ell & ~bg) | inside_new | arc, f'{d}/b-vest-mask.png', grow=5, feather=4)

    # 3. Waist: the navel canister and the diagonal hip strap become several bands of metal
    #    around the waist (FF Wiki, Barret Wallace, revid 4042820).
    p = a.copy()
    strap_zone = box_mask(a.shape, (328, 598, 572, 785))
    strap = strap_zone & (sat(a) < 0.2) & (lum(a) > 68) & ~white
    strap = ndimage.binary_closing(strap, iterations=2)
    body_all = ndimage.binary_fill_holes(~white)
    strap = ndimage.binary_dilation(strap, iterations=4) & strap_zone & body_all
    old_belt = box_mask(a.shape, (330, 512, 566, 628)) & body_all
    hole = strap | old_belt
    # the strap's place is pants again, the canister's place bare stomach (nearest body pixels)
    p = nearest_fill(p, hole, blur=4, src_ok=body_all)
    bands = Image.fromarray(np.clip(p, 0, 255).astype(np.uint8))
    bd = ImageDraw.Draw(bands)
    x0, x1, cx, half = 336, 563, 449.5, 113.5
    for top in (560, 581, 602):
        for x in range(x0, x1):
            bow = 6 * (1 - ((x - cx) / half) ** 2)
            y = top + bow
            for k in range(19):
                t = k / 18
                if k < 2 or k > 16:
                    col = (34, 33, 38)
                else:
                    g = 0.55 + 0.45 * np.exp(-((t - 0.32) / 0.16) ** 2) - 0.25 * t
                    if 0.25 < (x - x0) / (x1 - x0) < 0.4:
                        g += 0.12  # a soft vertical sheen where the light hits the front
                    col = tuple(int(v * g) for v in (190, 190, 198))
                bd.point((x, int(y + k)), fill=col)
    p = np.asarray(bands).astype(np.float32)
    save(p, f'{d}/b-waist-paint.png')
    save_mask(hole | box_mask(a.shape, (334, 556, 566, 630)), f'{d}/b-waist-mask.png', grow=4, feather=4)

    # 4. Finish: soften the glossy boot highlights and the reddish sheen on the far upper arm.
    p = a.copy()
    boots = box_mask(a.shape, (125, 945, 345, 1188), (495, 945, 660, 1188)) & ~white
    sm = np.stack([ndimage.gaussian_filter(a[..., c], 6) for c in range(3)], -1)
    hi = boots & (lum(a) > lum(sm) + 14)
    p[hi] = (sm + 0.35 * (a - sm))[hi]
    save(p, f'{d}/b-finish-paint.png')
    save_mask(boots, f'{d}/b-finish-mask.png', grow=2, feather=3)

    # 5. The far (RIGHT) upper arm: its reddish sheen and white rim streaks become the skin tone
    #    of his near arm. The vest (darker brown) and the gun (teal, black) are left alone.
    p = a.copy()
    lab, _ = ndimage.label(white)
    bg = np.isin(lab, np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) & white
    arm = box_mask(a.shape, (278, 360, 326, 455)) & ~bg
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    red = arm & (r > 40) & (g < 0.42 * r)                       # the red skin, dark or bright
    vestlike = (g > 0.45 * r) & (b < 0.3 * r) & (lum(a) < 120)   # the vest's brown leather
    gunlike = (b > r) | (lum(a) < 20)                           # teal metal and black outlines
    near = ndimage.binary_dilation(red, iterations=3)
    streak = arm & near & (lum(a) > 120) & ~vestlike & ~gunlike   # white and pink rim streaks
    zone = ndimage.binary_closing(red | streak, iterations=2) & arm & ~vestlike & ~gunlike
    # the far arm is on the shadow side: a darker skin tone, with only a soft trace of the old
    # shading, and no rim streaks
    target = np.array([120, 82, 57], np.float32)
    L = np.clip(ndimage.gaussian_filter(lum(a), 3) / 90, 0, 2)[..., None]
    p[zone] = (target * np.clip(0.85 + 0.12 * L, 0.85, 1.05))[zone]
    save(p, f'{d}/b-arm-paint.png')
    save_mask(zone, f"{d}/b-arm-mask.png", grow=3, feather=3)


# --------------------------------------------------------------------------- Cloud

def cloud(src, d):
    a = load(src)
    white = a.min(-1) > 245
    # far (RIGHT) wrist: the grey metal cuff becomes the white SOLDIER wristband
    p = a.copy()
    body = ndimage.binary_fill_holes(~white)
    zone = box_mask(a.shape, (304, 536, 364, 584))
    cuff = zone & body & ((a[..., 2] > a[..., 0] + 8) | ((lum(a) > 165) & (sat(a) < 0.25)))
    cuff = ndimage.binary_closing(cuff, iterations=3) & zone & body
    yy = np.arange(a.shape[0], dtype=np.float32)[:, None, None]
    cloth = np.array([244, 243, 246], np.float32) - np.clip((yy - 548) / 30, 0, 1) * np.array([34, 30, 22], np.float32)
    cloth = np.broadcast_to(cloth, a.shape)
    p[cuff] = cloth[cuff]
    save(p, f'{d}/c-far-paint.png')
    save_mask(cuff, f'{d}/c-far-mask.png', grow=3, feather=3)
    # near (LEFT) forearm: the white wrap above the gear armlet becomes bare forearm
    p = a.copy()
    poly = Image.new('L', (a.shape[1], a.shape[0]), 0)
    ImageDraw.Draw(poly).polygon([(460, 519), (490, 521), (512, 543), (508, 562), (490, 564),
                                  (480, 552), (470, 538), (462, 528)], fill=255)
    zone = np.asarray(poly) > 0
    wrap = zone & body & ((lum(a) > 185) & (sat(a) < 0.14) | (a[..., 2] > a[..., 0] + 8))
    wrap = ndimage.binary_dilation(wrap, iterations=2) & zone & body
    skin_ok = body & ~wrap & (a[..., 0] > 200) & (a[..., 0] > a[..., 2] + 25)
    p = nearest_fill(p, wrap, blur=2.5, src_ok=skin_ok)
    save(p, f'{d}/c-near-paint.png')
    save_mask(wrap, f'{d}/c-near-mask.png', grow=3, feather=3)


# --------------------------------------------------------------------------- Guard Scorpion

def gs(src, d, prefix, rects):
    a = load(src)
    for r in rects:
        median_rect(a, r)
    save(a, f'{d}/{prefix}-paint.png')
    save_mask(box_mask(a.shape, *rects), f'{d}/{prefix}-mask.png', grow=3, feather=3)


# --------------------------------------------------------------------------- composite

def composite_arr(src, out, mask_path, grow=3, blur=2.0):
    m = np.asarray(Image.open(mask_path).convert('L')).astype(np.float32) / 255
    if grow:
        m = ndimage.grey_dilation(m, size=(grow * 2 + 1, grow * 2 + 1))
    if blur:
        m = ndimage.gaussian_filter(m, blur)
    m = np.clip(m, 0, 1)[..., None]
    return src * (1 - m) + out * m


def main(argv):
    cmd = argv[0]
    if cmd == 'barret':
        barret(argv[1], argv[2])
    elif cmd == 'cloud':
        cloud(argv[1], argv[2])
    elif cmd == 'gs':
        gs(argv[1], argv[2], argv[3], [tuple(map(int, r.split(','))) for r in argv[4:]])
    elif cmd == 'composite':
        grow = int(argv[5]) if len(argv) > 5 else 3
        blur = float(argv[6]) if len(argv) > 6 else 2.0
        save(composite_arr(load(argv[1]), load(argv[2]), argv[3], grow, blur), argv[4])
    elif cmd == 'chain':
        a = load(argv[1])
        for pair in argv[3:]:
            # "<inpainted.full.png>::<mask.png>[::x0,y0,x1,y1]": the optional rect clips the mask,
            # so one render can supply one region and another render the next
            inp, mask, *clip = pair.split('::')
            nxt = composite_arr(a, load(inp), mask)
            if clip:
                x0, y0, x1, y1 = map(int, clip[0].split(','))
                a[y0:y1, x0:x1] = nxt[y0:y1, x0:x1]
            else:
                a = nxt
        save(a, argv[2])
    else:
        raise SystemExit(f'unknown command {cmd}')


if __name__ == '__main__':
    main(sys.argv[1:])
