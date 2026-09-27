"""Frame-specific procedural effects: the boss's lights, Tail Laser, Braver. All original, from code."""
import math
import numpy as np
from fxlib import F32, blur, grid, remap, noise2, mask_draw, streak, disc, col, smoothstep

WHITE = col(1.0, 1.0, 1.0)
CYAN = col(0.35, 0.95, 1.0)
MAGENTA = col(1.0, 0.25, 0.85)
ORANGE = col(1.0, 0.55, 0.15)
GOLD = col(1.0, 0.82, 0.45)

# Points on the flipped Guard Scorpion paintings, as fractions of the figure box (measured on a grid).
EMIT_UP = (0.584, 0.135)    # tail-up: laser lens face, pointing screen-left
EMIT_IDLE = (0.862, 0.070)  # tail lowered: lens at the top of the tail
EYE_IDLE = (0.172, 0.525)
EYE_UP = (0.205, 0.55)


def fig_pt(an_fig, fig, frac):
    x0 = an_fig['x'] - fig.w / 2
    y0 = an_fig['feet'] - fig.h
    return (x0 + frac[0] * fig.w, y0 + frac[1] * fig.h)


def glow_at(h, w, p, r, color, k, xg=None):
    d = disc(h, w, p, r, r * 0.9, xg)
    return (blur(d, r * 0.6) * k)[..., None] * color


def boss_eye_glow(L, boss_fig, an, up=False):
    h, w = L['H'], L['W']
    xg = grid(h, w)
    sc = boss_fig.w / 760
    eye = fig_pt(an['boss'], boss_fig, EYE_UP if up else EYE_IDLE)
    em = fig_pt(an['boss'], boss_fig, EMIT_UP if up else EMIT_IDLE)
    out = glow_at(h, w, eye, 10 * sc, col(0.7, 1.0, 0.45), 1.3, xg) + glow_at(h, w, eye, 34 * sc, col(0.5, 1.0, 0.4), 0.35, xg)
    out += glow_at(h, w, em, 12 * sc, CYAN, 1.1, xg) + glow_at(h, w, em, 40 * sc, CYAN, 0.3, xg)
    return out


def line_mask(w, h, pts, width):
    return mask_draw(w, h, lambda d, k: d.line([(x * k, y * k) for x, y in pts], fill=255, width=max(1, int(width * k)), joint='curve'))


def sparks(h, w, p, n, seed, spread=(0, 2 * math.pi), length=(12, 60), bias=None, scale=1.0):
    rng = np.random.default_rng(seed)
    segs, heads = [], []
    for _ in range(n):
        a = rng.uniform(*spread)
        if bias is not None and rng.random() < 0.6:
            a = bias + rng.normal(0, 0.55)
        L = rng.uniform(*length) * scale * (rng.random() ** 0.5)
        r0 = rng.uniform(4, 26) * scale
        x0, y0 = p[0] + math.cos(a) * r0, p[1] + math.sin(a) * r0
        x1, y1 = x0 + math.cos(a) * L, y0 + math.sin(a) * L + L * 0.15
        segs.append((x0, y0, x1, y1, rng.uniform(1.0, 2.4) * scale))
        heads.append((x1, y1))

    def draw_segs(d, k):
        for x0, y0, x1, y1, wd in segs:
            d.line([(x0 * k, y0 * k), (x1 * k, y1 * k)], fill=255, width=max(1, int(wd * k)))

    def draw_heads(d, k):
        for x, y in heads:
            r = 1.6 * k * scale
            d.ellipse([x * k - r, y * k - r, x * k + r, y * k + r], fill=255)
    return mask_draw(w, h, draw_segs), mask_draw(w, h, draw_heads)


def impact(h, w, p, seed, scale=1.0, bias=None, hot=CYAN, n=70):
    xg = grid(h, w)
    s, hd = sparks(h, w, p, n, seed, bias=bias, scale=scale)
    out = (s * 1.4 + blur(s, 3) * 0.9)[..., None] * ORANGE + (hd * 2.2 + blur(hd, 2) * 1.0)[..., None] * col(1, 0.95, 0.8)
    out += glow_at(h, w, p, 16 * scale, WHITE, 2.4, xg) + glow_at(h, w, p, 60 * scale, hot, 0.7, xg)
    return out


def lens_flare(h, w, p, scale=1.0, k=1.0):
    xg = grid(h, w)
    out = (streak(h, w, p, 0.0, 380 * scale, 1.6 * scale, xg) * 1.6)[..., None] * col(0.55, 0.9, 1.0)
    for a in (math.pi / 4, -math.pi / 4, math.pi / 2):
        out += (streak(h, w, p, a, 70 * scale, 1.2 * scale, xg) * 1.1)[..., None] * col(0.9, 0.95, 1.0)
    out += glow_at(h, w, p, 22 * scale, WHITE, 2.5, xg) + glow_at(h, w, p, 90 * scale, CYAN, 0.45, xg)
    c = (w / 2, h / 2)
    for t, r, cl, kk in ((0.55, 16, CYAN, 0.16), (1.35, 44, MAGENTA, 0.10), (1.7, 26, col(0.5, 1, 0.6), 0.14), (2.15, 80, CYAN, 0.06)):
        q = (p[0] + t * (c[0] - p[0]), p[1] + t * (c[1] - p[1]))
        out += (disc(h, w, q, r * scale, 2.5 * scale, xg, ring=0.3) * kk)[..., None] * cl
    return out * k


def beam(h, w, e, t, scale=1.0):
    m_core = line_mask(w, h, [e, t], 4.5 * scale)
    m_mid = line_mask(w, h, [e, t], 12 * scale)
    out = m_core[..., None] * WHITE * 3.2
    out += blur(m_mid, 4 * scale)[..., None] * CYAN * 1.8
    out += blur(m_mid, 14 * scale)[..., None] * MAGENTA * 1.1
    out += blur(m_mid, 42 * scale)[..., None] * MAGENTA * 0.5
    return out


def point_on(e, t, x):
    f = (x - e[0]) / (t[0] - e[0])
    return (x, e[1] + f * (t[1] - e[1]))


def tail_laser(img, L, lay, an):
    h, w = L['H'], L['W']
    sc = w / 1600 if w > h else w / 780 * 1.0
    boss = lay['boss_fig']
    e = fig_pt(an['boss'], boss, EMIT_UP)
    cl, br = an['cloud'], an['barret']
    t = (br['x'] - 0.2 * br['w'], br['feet'] - 0.2 * (br['feet'] - br['top']))
    if h > w:  # portrait: aim through Cloud's chest so his face stays readable; Barret is hit lower
        t = (cl['x'], cl['feet'] - 0.46 * cl['h'])
    far = (0, e[1] + (0 - e[0]) * (t[1] - e[1]) / (t[0] - e[0]))
    p_cloud = point_on(e, t, cl['x'])
    if h > w:
        pb = point_on(e, t, br['x'])
        t = (br['x'], min(pb[1], br['feet'] - 12 * sc))
    # heat haze along the beam
    x, y = grid(h, w)
    d = e[1] + (x - e[0]) * (far[1] - e[1]) / (far[0] - e[0]) - y
    haze = np.exp(-(d / (38 * sc)) ** 2) * (x < e[0])
    n = noise2(h, w, 24, 5, 2)
    img = remap(img, x + 3.2 * sc * haze * np.sin(y / 3.0 + n * 8), y + 2.4 * sc * haze * np.cos(x / 4.0 + n * 6))
    # the sweep: afterimages fanning from the floor up into the party
    floor_y = L['y_f'] + 55 * sc
    sweep = np.zeros((h, w, 3), F32)
    for i, f in enumerate(np.linspace(0, 1, 9)[:-1]):
        tgt = ((cl['x'] + 300 * sc) - f * 260 * sc, floor_y - f * 30 * sc)
        tgt = (tgt[0] + (far[0] - tgt[0]) * f * 0.15, tgt[1] + (far[1] - tgt[1]) * f * 0.15)
        m = line_mask(w, h, [e, tgt], 8 * sc)
        sweep += blur(m, 6 * sc)[..., None] * MAGENTA * (0.05 + 0.1 * f) + m[..., None] * CYAN * 0.05 * f
    img = img + sweep
    # molten scorch on the floor where the beam has already passed
    rng = np.random.default_rng(4)
    xs = np.linspace(cl['x'] + 330 * sc, cl['x'] + 40 * sc, 26)
    pts = [(xx, floor_y - (i / 25) * 30 * sc + rng.normal(0, 1.8 * sc)) for i, xx in enumerate(xs)]
    char = blur(line_mask(w, h, pts, 16 * sc), 5 * sc)
    img = img * (1 - 0.55 * char[..., None])
    melt = line_mask(w, h, pts, 5 * sc)
    dc = [(px + rng.normal(0, 14 * sc), py + rng.normal(0, 5 * sc), rng.uniform(1, 2.6) * sc) for px, py in pts for _ in range(3)]
    drops = mask_draw(w, h, lambda d, k: [d.ellipse([(qx - r) * k, (qy - r) * k, (qx + r) * k, (qy + r) * k], fill=255) for qx, qy, r in dc])
    melt = np.clip(melt + drops * 0.8, 0, 1)
    img = img + melt[..., None] * col(1, 0.9, 0.55) * 2.2 + blur(melt, 5 * sc)[..., None] * ORANGE * 1.6 + blur(melt, 18 * sc)[..., None] * col(1, 0.3, 0.1) * 0.6
    # the party takes the hit: a hot flash on both figures
    for key in ('cloud', 'barret'):
        a = lay[key][..., 3]
        img = img + (a * 0.1)[..., None] * col(1.0, 0.55, 0.95)
    img = img + beam(h, w, e, far, sc)
    img = img + impact(h, w, p_cloud, 7, sc * 0.75, bias=math.pi * 0.85)
    img = img + impact(h, w, t, 8, sc * 0.95, bias=math.pi * 0.9)
    img = img + lens_flare(h, w, e, sc)
    img = img + boss_eye_glow(L, boss, an, up=True)
    # the brief screen flash
    img = img * 1.08 + col(0.07, 0.08, 0.1)
    return img, dict(emitter=e, hit_cloud=p_cloud, hit_barret=t)


def arc_mask(w, h, c, r, a0, a1, width0, width1, n=60):
    def draw(d, k):
        for i in range(n):
            f0, f1 = i / n, (i + 1) / n
            aa0 = math.radians(a0 + (a1 - a0) * f0)
            aa1 = math.radians(a0 + (a1 - a0) * f1)
            wd = width0 + (width1 - width0) * f0
            d.line([((c[0] + r * math.cos(aa0)) * k, (c[1] + r * math.sin(aa0)) * k),
                    ((c[0] + r * math.cos(aa1)) * k, (c[1] + r * math.sin(aa1)) * k)], fill=int(80 + 175 * f1), width=max(1, int(wd * k)))
    return mask_draw(w, h, draw)


def braver(img, L, lay, an):
    h, w = L['H'], L['W']
    sc = w / 1600 if w > h else w / 780 * 1.2
    cl = an['cloud']
    boss = lay['boss_fig']
    hit = fig_pt(an['boss'], boss, (0.30, 0.36))
    xg = grid(h, w)
    # speed lines converging on the impact
    rng = np.random.default_rng(12)

    def draw_speed(d, k):
        for _ in range(110):
            a = rng.uniform(0, 2 * math.pi)
            r0 = rng.uniform(330, 520) * sc
            r1 = r0 + rng.uniform(250, 900) * sc
            d.line([((hit[0] + math.cos(a) * r0) * k, (hit[1] + math.sin(a) * r0) * k),
                    ((hit[0] + math.cos(a) * r1) * k, (hit[1] + math.sin(a) * r1) * k)], fill=int(rng.uniform(90, 255)), width=max(1, int(rng.uniform(1, 3.2) * k * sc)))
    img = img + mask_draw(w, h, draw_speed)[..., None] * col(0.75, 0.9, 1.0) * 0.55
    # motion trail: fading cyan afterimages along the leap, only where Cloud is not
    ca = lay['cloud'][..., 3]
    trail = np.zeros((h, w), F32)
    for i, (dx, dy, k) in enumerate(((-70, 60, 0.5), (-140, 125, 0.32), (-205, 195, 0.2), (-265, 270, 0.12))):
        sh = np.zeros_like(ca)
        dx, dy = int(dx * sc), int(dy * sc)
        sh[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] = ca[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)]
        trail += blur(sh, 3 + 3 * i) * k
    img = img + (trail * (1 - ca))[..., None] * col(0.35, 0.8, 1.0) * 1.1
    # the sword arc: from over his head, down onto the machine
    hand = (cl['x'] - 10 * sc, cl['feet'] - 0.55 * cl['h'])
    r = math.hypot(hit[0] - hand[0], hit[1] - hand[1])
    a1 = math.degrees(math.atan2(hit[1] - hand[1], hit[0] - hand[0]))
    arc = arc_mask(w, h, hand, r, a1 - 140, a1, 2 * sc, 16 * sc)
    img = img + arc[..., None] * WHITE * 2.6 + blur(arc, 6 * sc)[..., None] * col(0.45, 0.85, 1.0) * 2.0 + blur(arc, 26 * sc)[..., None] * col(0.4, 0.6, 1.0) * 0.9
    arc2 = arc_mask(w, h, hand, r * 0.82, a1 - 120, a1 - 5, 1 * sc, 8 * sc)
    img = img + blur(arc2, 2 * sc)[..., None] * GOLD * 1.1
    # shockwave rings with a refraction ripple
    x, y = xg
    ex, ey = (x - hit[0]), (y - hit[1]) / 0.55
    rr = np.sqrt(ex * ex + ey * ey) + 1e-3
    disp = np.zeros_like(rr)
    rings = np.zeros_like(rr)
    for R, k in ((80, 1.0), (150, 0.65), (230, 0.38)):
        R *= sc
        band = np.exp(-((rr - R) / (5 * sc)) ** 2)
        rings += band * k
        disp += np.exp(-((rr - R + 10 * sc) / (14 * sc)) ** 2) * 9 * sc * k
    img = remap(img, x - ex / rr * disp, y - ey / rr * disp * 0.55)
    img = img + rings[..., None] * col(0.85, 0.95, 1.0) * 1.4 + blur(rings, 8 * sc)[..., None] * CYAN * 0.8
    # the struck machine flashes hot around the hit
    ba = lay['boss'][..., 3]
    near = np.exp(-((x - hit[0]) ** 2 + (y - hit[1]) ** 2) / (2 * (100 * sc) ** 2))
    img = img + (ba * near * 0.45)[..., None] * col(1, 0.9, 0.8)
    # debris: dark shards with a hot edge, flung out and streaked
    rng = np.random.default_rng(13)
    shards, streaks_ = [], []
    for _ in range(24):
        a = rng.uniform(-math.pi * 0.95, math.pi * 0.2)
        dist = rng.uniform(60, 330) * sc
        cx_, cy_ = hit[0] + math.cos(a) * dist, hit[1] + math.sin(a) * dist * 0.8
        s = rng.uniform(6, 15) * sc
        rot = rng.uniform(0, math.pi)
        shards.append([(cx_ + s * math.cos(rot + q), cy_ + s * 0.6 * math.sin(rot + q)) for q in (0, 2.3, 4.1)])
        streaks_.append(((cx_, cy_), (cx_ - math.cos(a) * s * 2.5, cy_ - math.sin(a) * s * 2)))
    sm = mask_draw(w, h, lambda d, k: [d.polygon([(px * k, py * k) for px, py in p], fill=255) for p in shards])
    st = mask_draw(w, h, lambda d, k: [d.line([(a[0] * k, a[1] * k), (b[0] * k, b[1] * k)], fill=150, width=max(1, int(2 * k))) for a, b in streaks_])
    img = img * (1 - 0.85 * sm[..., None]) + sm[..., None] * col(0.12, 0.04, 0.03) + blur(sm, 1.5)[..., None] * ORANGE * 0.22
    img = img + blur(st, 1.2)[..., None] * col(1.0, 0.75, 0.5) * 0.5
    img = img + impact(h, w, hit, 14, sc * 1.3, hot=col(0.5, 0.8, 1.0), n=120)
    img = img + glow_at(h, w, hit, 150 * sc, col(0.6, 0.85, 1.0), 0.22, xg)
    img = img + lens_flare(h, w, hit, sc * 0.9, k=0.35)
    return img, dict(hit=hit, hand=hand)
