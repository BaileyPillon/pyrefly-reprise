"""Decision sheets for the boss action poses (split out of bosses.py to keep each file under 400
lines). `python bosses.py sheet2 <boss> <slot> <folder> <n,n,...>` calls sheet2 here."""
from __future__ import annotations

import json

from PIL import Image, ImageDraw, ImageFont

from bosses import ART, CFG, HERE, OUT, REPO


# ------------------------------------------------------------------ sheets
def font(sz):
    for f in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def place_on(bg, fig, h, x_frac=0.62, ground=0.86):
    """The figure at in-battle height h over the backdrop crop, feet on a ground line."""
    fig = fig.crop(fig.getbbox())
    fig = fig.resize((max(1, int(fig.width * h / fig.height)), h), Image.LANCZOS)
    x = int(bg.width * x_frac - fig.width / 2); y = int(bg.height * ground - fig.height)
    bg = bg.copy(); bg.alpha_composite(fig, (max(0, x), max(0, y)))
    return bg


def sheet(boss):
    c = CFG[boss]
    picks = json.load(open(HERE / 'looks.json', encoding='utf8')).get(boss, {})
    idle = Image.open(ART / c['art'] / 'idle.png').convert('RGBA')
    bdp = Image.open(REPO / 'public' / 'art' / 'backdrops' / f"{c['backdrop']}.png").convert('RGBA')
    bw = 520; bg = bdp.resize((bw, int(bdp.height * bw / bdp.width)), Image.LANCZOS)
    bg = bg.crop((0, max(0, bg.height - 360), bw, bg.height)) if bg.height > 360 else bg
    F, Fs = font(26), font(18)
    parts = []
    for pose in c['poses']:
        d = OUT / boss / pose
        cands = sorted(d.glob('cand-*.png'), key=lambda p: int(p.stem.split('-')[1]))
        cands = [p for p in cands if p.stem.count('-') == 1]
        if not cands:
            continue
        tile_h = 420
        row_imgs = [('idle (installed)', idle)]
        for p in cands:
            n = int(p.stem.split('-')[1])
            row_imgs.append((f'c{n}', Image.open(p).convert('RGBA')))
        colw = 300
        W = 20 + colw * len(row_imgs)
        H = 60 + tile_h + 12 + bg.height + 70
        sh = Image.new('RGB', (W, H), (24, 26, 34)); dr = ImageDraw.Draw(sh)
        pk = picks.get(pose, {})
        title = f"{c['title']} - {pose}   pick: {pk.get('pick', '-')}   judge: {pk.get('judge', '-')}"
        dr.text((16, 14), title, fill=(236, 214, 150), font=F)
        for i, (lab, im) in enumerate(row_imgs):
            x0 = 10 + i * colw
            t = im.crop(im.getbbox()); sc = min((colw - 16) / t.width, tile_h / t.height)
            t = t.resize((max(1, int(t.width * sc)), max(1, int(t.height * sc))), Image.LANCZOS)
            cell = Image.new('RGBA', (colw - 8, tile_h), (0, 0, 0, 0))
            half = Image.new('RGBA', (colw - 8, tile_h), (128, 128, 128, 255))
            ImageDraw.Draw(half).rectangle([0, tile_h // 2, colw, tile_h], fill=(28, 36, 64, 255))
            half.alpha_composite(t, ((colw - 8 - t.width) // 2, tile_h - t.height))
            sh.paste(half.convert('RGB'), (x0, 56))
            col = (140, 230, 140) if lab == f"c{pk.get('pick', '')}".replace('cc', 'c') else (230, 230, 230)
            dr.text((x0 + 6, 58), lab, fill=col, font=Fs)
            g = place_on(bg, im, int(bg.height * 0.78), x_frac=0.5)
            g = g.resize((colw - 8, int(g.height * (colw - 8) / g.width)), Image.LANCZOS)
            sh.paste(g.convert('RGB'), (x0, 56 + tile_h + 12))
        note = pk.get('note', '')
        dr.text((16, H - 56), note[:200], fill=(210, 210, 210), font=Fs)
        dr.text((16, H - 30), f"{c['game']}. Candidates only; nothing installed. Split grey/navy = 1:1 read; lower row = over {c['backdrop']} at battle scale.",
                fill=(150, 150, 160), font=Fs)
        if W > 2000:
            sh = sh.resize((2000, int(H * 2000 / W)), Image.LANCZOS)
        out = HERE / f'{boss}-{pose}.jpg'
        q = 85
        sh.save(out, quality=q)
        while out.stat().st_size > 1_000_000 and q > 40:
            q -= 8; sh.save(out, quality=q)
        parts.append(out.name)
    print(json.dumps({'sheets': parts}))


# ------------------------------------------------------------------ v2 sheets (explicit candidates, game-scale row)
def sheet2(boss, slot, folder, ns_arg):
    """One phone-readable part per slot: the installed idle and each candidate at 1:1 proportion on
    split grey/navy; below, each over the chapter backdrop at game scale (pixel scale taken from the
    hat/head-match scale, so a lunge shows lower than the idle, as it will in battle); below that the
    looks (maker + second look) from looks.json. Under 1 MB, at most 2000 px wide and tall."""
    c = CFG[boss]
    looks = json.load(open(HERE / 'looks.json', encoding='utf8')).get(boss, {}).get(slot, {})
    ns = [int(x) for x in ns_arg.split(',')]
    idle = Image.open(ART / c['art'] / 'idle.png').convert('RGBA')
    idle_h = idle.getbbox()[3] - idle.getbbox()[1]
    bdp = Image.open(REPO / 'public' / 'art' / 'backdrops' / f"{c['backdrop']}.png").convert('RGBA')
    colw, tile_h, bg_h = 372, 440, 300
    bw = colw - 8
    bgs = bdp.resize((bw, int(bdp.height * bw / bdp.width)), Image.LANCZOS)
    bgs = bgs.crop((0, max(0, bgs.height - bg_h), bw, bgs.height)); bg_h = bgs.height
    k = bg_h * 0.74 / idle_h                      # the idle stands 74% of the backdrop crop
    F, Fs, Ft = font(26), font(17), font(15)
    items = [('idle (installed)', idle, 1.0, None)]
    for n in ns:
        side = json.load(open(OUT / boss / folder / f'cand-{n}.json'))
        pcs = side.get('composite', {}).get('pieces', [])
        sc = next((p['scale'] for p in pcs if p.get('piece') in ('hat', 'head')), side.get('composite', {}).get('scale', 1.0))
        items.append((f'c{n}', Image.open(OUT / boss / folder / f'cand-{n}.png').convert('RGBA'), sc, looks.get('cands', {}).get(str(n), {})))
    W = 16 + colw * len(items)
    text_h = 230
    H = 58 + tile_h + 10 + bgs.height + 10 + text_h + 40
    sh = Image.new('RGB', (W, H), (22, 24, 32)); dr = ImageDraw.Draw(sh)
    dr.text((14, 12), f"{c['title']}: {slot}   maker pick: {looks.get('pick', '-')}", fill=(236, 214, 150), font=F)
    for i, (lab, im, sc, lk) in enumerate(items):
        x0 = 8 + i * colw
        t = im.crop(im.getbbox()); z = min((colw - 16) / t.width, tile_h / t.height)
        t = t.resize((max(1, int(t.width * z)), max(1, int(t.height * z))), Image.LANCZOS)
        half = Image.new('RGBA', (colw - 8, tile_h), (128, 128, 128, 255))
        ImageDraw.Draw(half).rectangle([0, tile_h // 2, colw, tile_h], fill=(28, 36, 64, 255))
        half.alpha_composite(t, ((colw - 8 - t.width) // 2, tile_h - t.height))
        sh.paste(half.convert('RGB'), (x0, 52))
        good = lk and lk.get('verdict') == 'PASS'
        col = (140, 230, 140) if good else ((240, 150, 140) if lk else (230, 230, 230))
        dr.text((x0 + 6, 54), lab + (f"  {lk.get('score', '')} {lk.get('verdict', '')}" if lk else ''), fill=col, font=Fs)
        fig = im.crop(im.getbbox())
        h = max(1, int(fig.height / sc * k)); fig = fig.resize((max(1, int(fig.width * h / fig.height)), h), Image.LANCZOS)
        g = bgs.copy(); g.alpha_composite(fig, (int(bw * 0.55 - fig.width / 2), int(bg_h * 0.9 - fig.height)))
        sh.paste(g.convert('RGB'), (x0, 52 + tile_h + 10))
        ty = 52 + tile_h + 10 + bgs.height + 8
        txt = (lk or {}).get('look', 'Approved idle, for identity and scale.' if lk is None else '')
        words, line, lines = txt.split(), '', []
        for w in words:
            if dr.textlength(line + ' ' + w, font=Ft) > colw - 14:
                lines.append(line); line = w
            else:
                line = (line + ' ' + w).strip()
        lines.append(line)
        for j, L in enumerate(lines[:12]):
            dr.text((x0 + 4, ty + j * 18), L, fill=(215, 215, 215), font=Ft)
    dr.text((14, H - 30), f"{c['game']}. Candidates only, nothing installed. Top: each figure fit to its tile on grey/navy. Middle: over {c['backdrop']} at game scale.",
            fill=(150, 150, 160), font=Ft)
    if W > 2000:
        sh = sh.resize((2000, int(H * 2000 / W)), Image.LANCZOS)
    out = HERE / f'{boss}-{slot}.jpg'
    q = 88
    sh.save(out, quality=q)
    while out.stat().st_size > 1_000_000 and q > 40:
        q -= 6; sh.save(out, quality=q)
    print(json.dumps({'sheet': out.name, 'size': sh.size, 'bytes': out.stat().st_size}))
