"""Sin art options, 2026-09-29 (FFX only), links 1 to 3 and the plates (the head is ../head/): our own layout sketches, drawn in code. No image input of any kind except
our own earlier paintings as the plates the creatures are painted into.

Written references only:
- research/ffx-sin.md 1.1, 9.1, 9.3: links 1 and 2 on the Fahrenheit's deck in flight, Sin alongside; the Fins are
  "Sin's Left Arm" / "Sin's Right Arm" in Japanese; the weak spot is a shine at the base of the arm; the fin's core
  charges visibly before Gravija. Link 3 on Sin's back, where its core sits; Genais is a shelled Sinspawn shaped like
  Sinspawn Geneaux, and its shell state must read at a glance. Sinfall into Bevelle at sunset follows link 3.
- FF Wiki text (read through the MediaWiki API, 2026-09-28): "Sin (Final Fantasy X)" Appearance (a whale-like body
  moved by a pair of clawed arms, hind legs like pectoral fins, a long tail, scales; feathery wing-like protrusions
  purple at the tips in its final form), "Left Fin", "Right Fin", "Sin (core)", "Sinspawn Genais", "Sinspawn Geneaux"
  (a shell that deflects physical attacks and opens).
- research/ffx-evrae-airship.md 12.2 and 12.3: NEAR fills the upper right over the rail and shades the deck; FAR is
  small against clean sky with the whole deck lit. A muted player must still know which state it is.

Sketch space is the base render size, 1344x768, drawn at 2x and reduced. Coordinates below are normalised (0..1).

  python sketch.py <plate_base.png> <out_dir> <what>
      what: flight | fins | back | genais
  writes <name>-comp.png (the plate with our sketch pasted inside the mask), <name>-mask.png (1344x768, grown) and
  <name>-mask-full.png (2352x1344); for `back` a whole sketch back-sketch.png (whole-mode init, no plate).
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H, S = 1344, 768, 2
SW, SH = W * S, H * S
FULL = (2352, 1344)
TIP = (0.47, 0.76)          # the deck's prow tip in the round-3 plate (round 2's prow())


def P(x, y):
    return (x * SW, y * SH)


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def layer():
    return Image.new('RGBA', (SW, SH), (0, 0, 0, 0))


def comp(base, lay, blur=0):
    if blur:
        lay = lay.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(lay)


def deck_poly():
    """Everything below the rail tops of the round-3 plate's deck, normalised (as round 3's rig.json 'deck')."""
    L0, R0 = (-0.08, 0.95), (1.08, 0.95)
    pts = []
    for side, rng_ in ((L0, range(10, -1, -1)), (R0, range(0, 11))):
        for i in rng_:
            t = i / 10
            x = TIP[0] + (side[0] - TIP[0]) * t; y = TIP[1] + (side[1] - TIP[1]) * t - (0.03 + 0.07 * t) - 0.008
            pts.append((x, y))
    return pts + [(1.08, 1.0), (-0.08, 1.0)]


def deck_mask(grow=0):
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon([(x * W, y * H) for x, y in deck_poly()], fill=255)
    if grow:
        m = m.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    return m


# ---- shared painters ------------------------------------------------------------------------------------------------
GREY, GREY_D, GREY_L = (86, 82, 94), (56, 52, 64), (150, 138, 128)
VIOLET, VIOLET_HI = (150, 80, 230), (236, 200, 255)


def scales(d, poly_bbox, rng, col, n=60, size=0.03, alpha=150):
    x0, y0, x1, y1 = poly_bbox
    for _ in range(n):
        x, y = rng.uniform(x0, x1), rng.uniform(y0, y1)
        s = size * rng.uniform(0.7, 1.3)
        d.arc([*P(x - s, y - s * 0.6), *P(x + s, y + s * 0.6)], 20, 160, fill=col + (alpha,), width=5)


def glow(base, c, r, col=VIOLET, hi=VIOLET_HI, strength=1.0):
    g = layer(); d = ImageDraw.Draw(g)
    d.ellipse([*P(c[0] - r * 2.2, c[1] - r * 2.2 * 16 / 9), *P(c[0] + r * 2.2, c[1] + r * 2.2 * 16 / 9)], fill=col + (int(110 * strength),))
    d.ellipse([*P(c[0] - r, c[1] - r * 16 / 9), *P(c[0] + r, c[1] + r * 16 / 9)], fill=hi + (int(230 * strength),))
    comp(base, g, 22)
    k = layer(); d = ImageDraw.Draw(k)
    d.ellipse([*P(c[0] - r * 0.8, c[1] - r * 0.8 * 16 / 9), *P(c[0] + r * 0.8, c[1] + r * 0.8 * 16 / 9)], fill=(250, 238, 255, 255))
    comp(base, k, 3)


def claws(d, pts, col=(26, 22, 28)):
    for (x, y, a, L) in pts:
        a = math.radians(a)
        tip = (x + L * math.cos(a), y + L * math.sin(a))
        n = (-math.sin(a) * L * 0.28, math.cos(a) * L * 0.28)
        mid = (x + L * 0.5 * math.cos(a) + n[0] * 0.6, y + L * 0.5 * math.sin(a) + n[1] * 0.6)
        d.polygon([P(x - n[0], y - n[1]), P(*mid), P(*tip), P(x + n[0], y + n[1])], fill=col + (255,))


def ribbed_fin(d, root_a, root_b, tip_pts, rib_n, dark, mid):
    d.polygon([P(*root_a)] + [P(*p) for p in tip_pts] + [P(*root_b)], fill=dark + (255,))
    for i, p in enumerate(tip_pts):
        u = i / max(1, len(tip_pts) - 1)
        r = (root_a[0] + (root_b[0] - root_a[0]) * u, root_a[1] + (root_b[1] - root_a[1]) * u)
        d.line([P(*r), P(*p)], fill=mid + (255,), width=7)


# ---- flight plate (links 1 and 2) -----------------------------------------------------------------------------------
def flight(base):
    """Late afternoon over the approach to Bevelle: open sky, cloud bands, a sea of cloud below with the white city's
    outskirts showing far below through the gaps, and no tower. Only above the deck."""
    rng = np.random.default_rng(929)
    yf = np.linspace(0, 1, SH)
    stops = [(0, (86, 118, 178)), (0.25, (150, 170, 206)), (0.45, (238, 196, 150)), (0.60, (252, 214, 168)), (1, (226, 204, 190))]
    col = np.stack([np.interp(yf, [s[0] for s in stops], [s[1][k] for s in stops]) for k in range(3)], axis=1)
    a = np.broadcast_to(col[:, None, :], (SH, SW, 3)).astype(float).copy()
    yy, xx = np.mgrid[0:SH, 0:SW]
    dd = np.hypot(xx - 0.02 * SW, yy - 0.30 * SH) / (0.55 * SW)
    a += (np.clip(1 - dd, 0, 1) ** 2)[..., None] * np.array((50, 38, 12), float)
    sky = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA')
    c = layer(); d = ImageDraw.Draw(c)
    for (y0, y1, colr, n, al) in ((0.08, 0.22, (236, 226, 232), 12, 120), (0.30, 0.42, (250, 222, 190), 10, 130)):
        for _ in range(n):
            y = rng.uniform(y0, y1); x = rng.uniform(-0.1, 1.1); w = rng.uniform(0.12, 0.33); h = rng.uniform(0.012, 0.03)
            d.ellipse([*P(x - w, y - h), *P(x + w, y + h)], fill=colr + (al,))
    comp(sky, c, 10)
    # the sea of cloud from the horizon (0.56) down, with a few gaps showing pale city blocks far below
    s = layer(); d = ImageDraw.Draw(s)
    d.rectangle([*P(0, 0.56), *P(1, 1)], fill=(244, 224, 206, 255))
    for _ in range(40):
        y = rng.uniform(0.56, 0.9); x = rng.uniform(-0.1, 1.1); w = rng.uniform(0.05, 0.2) * (0.5 + y); h = w * 0.18
        d.ellipse([*P(x - w, y - h), *P(x + w, y + h)], fill=lerp((255, 236, 214), (206, 180, 176), rng.uniform(0, 1)) + (255,))
    for _ in range(26):                                  # city blocks glimpsed through gaps, far below, left of centre
        x = rng.uniform(0.02, 0.45); y = rng.uniform(0.62, 0.74); w = rng.uniform(0.006, 0.016); h = w * 0.7
        d.rectangle([*P(x, y - h), *P(x + w, y)], fill=(250, 246, 238, 255))
        d.rectangle([*P(x + w * 0.2, y - h), *P(x + w * 0.8, y - h * 0.6)], fill=(96, 120, 170, 255))
    comp(sky, s, 2)
    keep = np.asarray(deck_mask().resize((SW, SH), Image.BILINEAR), float) / 255      # never over the deck
    sky.putalpha(Image.fromarray(((1 - keep) * 255).astype(np.uint8)))
    base.alpha_composite(sky)


# ---- the Fins (links 1 and 2), NEAR and FAR --------------------------------------------------------------------------
def clip(lay, polys):
    """Keep only what lies inside the silhouettes (the scale arcs are scattered over a bounding box)."""
    m = Image.new('L', (SW, SH), 0); dm = ImageDraw.Draw(m)
    for pts in polys:
        dm.polygon([P(*p) for p in pts], fill=255)
    lay.putalpha(Image.fromarray(np.minimum(np.asarray(lay.split()[3]), np.asarray(m))))


def body_flank(d, pts, rng, bbox):
    d.polygon([P(*p) for p in pts], fill=GREY_D + (255,))
    scales(d, bbox, rng, lerp(GREY_D, GREY_L, 0.35), 70, 0.028, 160)


def fin_near(base, opt, side):
    """NEAR: the arm fills the upper right over the rail. Left: Sin's flank below the ship on the right, the arm rising.
    Right: Sin is on the ship's other side and higher, its flank at the upper right, the arm reaching down."""
    rng = np.random.default_rng(1100 + (opt == 'b') * 7 + (side == 'r') * 3)
    lay = layer(); d = ImageDraw.Draw(lay)
    if side == 'l':
        flank = [(0.80, 1.0), (0.84, 0.66), (0.92, 0.46), (1.02, 0.36), (1.02, 1.0)]
        core = (0.875, 0.60)
        if opt == 'a':          # the clawed arm, a ribbed fin along its back edge
            arm = [(0.86, 0.70), (0.80, 0.52), (0.72, 0.34), (0.66, 0.20), (0.62, 0.13), (0.68, 0.10), (0.75, 0.16),
                   (0.82, 0.30), (0.90, 0.48), (0.95, 0.60)]
            fin = ((0.76, 0.18), (0.93, 0.56), [(0.80, 0.06), (0.88, 0.14), (0.95, 0.26), (1.0, 0.40), (1.02, 0.52)])
            cl = [(0.63, 0.13, 205, 0.10), (0.62, 0.16, 168, 0.11), (0.65, 0.19, 132, 0.10), (0.69, 0.11, 240, 0.09)]   # v2: a spread hand
        else:                   # the pectoral fin: a long tapering blade, claws on its leading edge
            arm = [(0.93, 0.66), (0.84, 0.56), (0.74, 0.42), (0.62, 0.24), (0.54, 0.14), (0.60, 0.06), (0.70, 0.08),
                   (0.78, 0.20), (0.88, 0.36), (1.0, 0.50)]          # v2: the tip a broad paddle, not a point
            fin = ((0.66, 0.18), (0.98, 0.46), [(0.68, 0.10), (0.76, 0.12), (0.84, 0.17), (0.92, 0.24), (1.0, 0.32)])
            cl = [(0.55, 0.13, 200, 0.05), (0.58, 0.08, 230, 0.05), (0.63, 0.06, 250, 0.05), (0.69, 0.07, 275, 0.05)]
    else:
        flank = [(0.70, -0.02), (0.78, 0.10), (0.90, 0.20), (1.02, 0.24), (1.02, -0.02)]
        core = (0.845, 0.16)
        if opt == 'a':
            arm = [(0.80, 0.14), (0.76, 0.28), (0.72, 0.42), (0.66, 0.54), (0.61, 0.60), (0.66, 0.64), (0.73, 0.58),
                   (0.80, 0.46), (0.86, 0.32), (0.90, 0.18)]
            fin = ((0.86, 0.26), (0.84, 0.40), [(0.94, 0.32), (0.99, 0.42), (0.97, 0.52), (0.90, 0.56)])
            cl = [(0.62, 0.60, 110, 0.06), (0.64, 0.63, 80, 0.06), (0.68, 0.63, 60, 0.05), (0.61, 0.57, 150, 0.05)]
        else:
            arm = [(0.90, 0.16), (0.80, 0.26), (0.70, 0.38), (0.60, 0.50), (0.55, 0.58), (0.60, 0.60), (0.70, 0.52),
                   (0.80, 0.42), (0.90, 0.32), (1.0, 0.26)]
            fin = ((0.64, 0.52), (0.98, 0.30), [(0.66, 0.62), (0.74, 0.60), (0.82, 0.54), (0.90, 0.46), (1.0, 0.40)])
            cl = [(0.64, 0.46, 210, 0.05), (0.72, 0.36, 220, 0.05), (0.80, 0.28, 225, 0.05), (0.57, 0.56, 170, 0.05)]
    body_flank(d, flank, rng, (0.8, 0.3, 1.0, 1.0) if side == 'l' else (0.72, 0.0, 1.0, 0.22))
    ribbed_fin(d, fin[0], fin[1], fin[2], 0, (48, 44, 58), (92, 86, 100))
    d.polygon([P(*p) for p in arm], fill=GREY + (255,))
    xs = [p[0] for p in arm]; ys = [p[1] for p in arm]
    scales(d, (min(xs), min(ys), max(xs), max(ys)), rng, GREY_D, 40, 0.022, 170)
    d.line([P(*p) for p in arm[:5]], fill=GREY_L + (220,), width=8)
    claws(d, cl)
    clip(lay, [flank, arm, [fin[0]] + fin[2] + [fin[1]]] + [[(x - 0.05, y - 0.05), (x + 0.05, y - 0.05), (x + 0.05, y + 0.05), (x - 0.05, y + 0.05)] for x, y, _, _ in cl])
    comp(base, lay, 0.8)
    glow(base, core, 0.028, strength=0.8)
    return [flank, arm, [fin[0]] + fin[2] + [fin[1]]], core


def fin_far(base, opt, side):
    """FAR: the whole whale-like body side-on across the sky, small and hazy, the arm/fin reaching towards the ship."""
    rng = np.random.default_rng(1200 + (opt == 'b') * 7 + (side == 'r') * 3)
    lay = layer(); d = ImageDraw.Draw(lay)
    sgn = 1 if side == 'l' else -1          # left: the head to the right; right: the head to the left
    cx, cy = (0.74, 0.30) if side == 'l' else (0.74, 0.24)
    def X(u):
        return cx + sgn * u
    body = [(X(0.22), cy - 0.02), (X(0.20), cy - 0.07), (X(0.12), cy - 0.10), (X(0.0), cy - 0.11), (X(-0.12), cy - 0.08),
            (X(-0.22), cy - 0.04), (X(-0.30), cy - 0.02), (X(-0.36), cy - 0.05), (X(-0.37), cy + 0.02), (X(-0.30), cy + 0.04),
            (X(-0.20), cy + 0.07), (X(-0.06), cy + 0.10), (X(0.10), cy + 0.09), (X(0.20), cy + 0.05)]
    d.polygon([P(*p) for p in body], fill=lerp(GREY_D, (200, 186, 190), 0.25) + (255,))
    scales(d, (cx - 0.3, cy - 0.08, cx + 0.2, cy + 0.08), rng, lerp(GREY_D, (220, 200, 200), 0.1), 50, 0.012, 150)
    d.ellipse([*P(X(0.17) - 0.006, cy - 0.03), *P(X(0.17) + 0.006, cy - 0.018)], fill=(250, 190, 90, 255))
    if opt == 'a':
        arm = [(X(0.06), cy + 0.06), (X(0.02), cy + 0.16), (X(-0.02), cy + 0.25), (X(-0.06), cy + 0.30),
               (X(-0.02), cy + 0.31), (X(0.03), cy + 0.25), (X(0.08), cy + 0.16), (X(0.11), cy + 0.08)]
        fin = [(X(0.02), cy + 0.10), (X(-0.08), cy + 0.13), (X(-0.12), cy + 0.20), (X(-0.06), cy + 0.26)]
    else:
        arm = [(X(0.08), cy + 0.07), (X(0.0), cy + 0.14), (X(-0.10), cy + 0.22), (X(-0.18), cy + 0.27),
               (X(-0.15), cy + 0.22), (X(-0.06), cy + 0.13), (X(0.02), cy + 0.06)]
        fin = [(X(0.04), cy + 0.08), (X(-0.06), cy + 0.10), (X(-0.14), cy + 0.16), (X(-0.18), cy + 0.25)]
    d.polygon([P(*p) for p in fin], fill=(60, 56, 70, 255))
    d.polygon([P(*p) for p in arm], fill=lerp(GREY, (210, 196, 196), 0.15) + (255,))
    tail = [(X(-0.36), cy - 0.05), (X(-0.46), cy - 0.12), (X(-0.44), cy - 0.02), (X(-0.46), cy + 0.06), (X(-0.37), cy + 0.02)]
    d.polygon([P(*p) for p in tail], fill=lerp(GREY_D, (210, 196, 200), 0.35) + (255,))
    clip(lay, [body, arm, fin, tail])
    comp(base, lay, 1.0)
    core = (X(0.07), cy + 0.075)
    glow(base, core, 0.008, strength=0.7)
    # a veil of haze over the whole creature: it is far away
    hz = layer(); ImageDraw.Draw(hz).rectangle([*P(0, 0), *P(1, 0.62)], fill=(240, 214, 200, 40))
    m = Image.new('L', (SW, SH), 0); dm = ImageDraw.Draw(m)
    for pts in (body, arm, fin, tail):
        dm.polygon([P(*p) for p in pts], fill=255)
    hz.putalpha(Image.fromarray(np.minimum(np.asarray(hz.split()[3]), np.asarray(m))))
    base.alpha_composite(hz)
    return [body, arm, fin, tail], core


# ---- job prep: paste a sketch into a plate inside its silhouette, write the masks ------------------------------------
def prep(plate_base, sk, name, out, grow=21, keep_deck=True):
    """Where the sketch differs from the plate is the silhouette; grown `grow` px so the paint can shape the edges.
    `keep_deck` clears the mask over the round-3 deck, so the deck is never repainted."""
    # compare against the plate after the same 2x round trip the sketch took, so resampling alone never counts
    rt = plate_base.convert('RGB').resize((SW, SH), Image.LANCZOS).resize((W, H), Image.LANCZOS)
    a = np.asarray(sk.convert('RGB'), float); b = np.asarray(rt, float)
    core = Image.fromarray(((np.abs(a - b).max(axis=2) > 16) * 255).astype(np.uint8))
    core = core.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    paste = core.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
    Image.composite(sk.convert('RGB'), plate_base.convert('RGB'), paste).save(f'{out}/{name}-comp.png')
    m = core.filter(ImageFilter.MaxFilter(grow)).filter(ImageFilter.GaussianBlur(3))
    if keep_deck:
        dm = np.asarray(deck_mask(2).filter(ImageFilter.GaussianBlur(2)), float) / 255
        m = Image.fromarray((np.asarray(m, float) * (1 - dm)).astype(np.uint8))
    m.save(f'{out}/{name}-mask.png')
    m.resize(FULL, Image.BILINEAR).save(f'{out}/{name}-mask-full.png')
    print(name, 'silhouette px', int((np.asarray(core) > 0).sum()))


def draw_on(plate_base, fn, *a):
    im = plate_base.convert('RGBA').resize((SW, SH), Image.LANCZOS)
    r = fn(im, *a)
    out = im.convert('RGB').resize((W, H), Image.LANCZOS)
    return out, r


def main():
    plate, out, what = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(out, exist_ok=True)
    import sketch_link3 as l3
    if what == 'back':
        l3.back_sketch().save(f'{out}/back-sketch.png'); print('back-sketch'); return
    base = Image.open(plate).convert('RGB').resize((W, H), Image.LANCZOS)
    if what == 'flight':
        sk, _ = draw_on(base, flight)
        prep(base, sk, 'flight', out, grow=9)
    elif what == 'fins':
        for opt in 'ab':
            for side in 'lr':
                for rng_ in ('near', 'far'):
                    sk, _ = draw_on(base, fin_near if rng_ == 'near' else fin_far, opt, side)
                    prep(base, sk, f'fin-{opt}-{side}-{rng_}', out, grow=25)
    elif what == 'genais':
        for opt in 'ab':
            sk, _ = draw_on(base, l3.genais, opt, False)
            prep(base, sk, f'genais-{opt}', out, grow=25, keep_deck=False)
            sk, _ = draw_on(base, l3.genais, opt, True)
            prep(base, sk, f'genais-{opt}-shelled', out, grow=25, keep_deck=False)
    else:
        raise SystemExit('unknown ' + what)


if __name__ == '__main__':
    main()
