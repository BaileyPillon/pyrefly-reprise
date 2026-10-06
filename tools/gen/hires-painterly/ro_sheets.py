"""ro_sheets.py: one contact sheet per figure (character id) of the painterly library: idle and two other poses, today (top) against painterly (bottom), at battle size, plus index.html for Bailey.

  python ro_sheets.py [--lib DIR] [--group party|bosses|rest|all]
Sheets go to <lib>/sheets/<id>.jpg and <lib>/sheets/index.html (new files; rewritten on each run, they are not masters).
"""
import argparse
import html
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from ro_common import *
import numpy as np
from PIL import Image, ImageDraw, ImageFont

Image.MAX_IMAGE_PIXELS = None
BG = (58, 60, 70)
FONT = ImageFont.truetype('arial.ttf', 15)
H = 640


def flat(im):
    b = Image.new('RGB', im.size, BG)
    b.paste(im, mask=im.getchannel('A'))
    return b


def bbox(im):
    a = np.asarray(im.getchannel('A'))
    ys, xs = np.nonzero(a > 128)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def pair(a, rec, lib):
    S = a['S']
    t = Image.open(f'{EDIR}/{a["id"]}@{S}x.png').convert('RGBA')
    p = Image.open(f'{lib}/{a["id"]}@{S}x.png').convert('RGBA')
    bb = bbox(t)
    out = []
    for im in (t, p):
        c = flat(im.crop(bb))
        out.append(c.resize((max(1, round(c.width * H / c.height)), H), Image.LANCZOS))
    return out


def char_sheet(cid, man, assets, lib, outdir, n_poses=4, h=560):
    """One character: idle plus up to three poses, today (top) against painterly (bottom) at battle height. A by-eye pose is drawn from its D candidate and labelled."""
    ids = sorted([k for k in assets if assets[k]['cid'] == cid], key=lambda i: (STATE_ORDER.index(assets[i]['state']) if assets[i]['state'] in STATE_ORDER else 9, assets[i]['state']))
    def src(i):
        r = man.get(i, {})
        a = assets[i]
        if r.get('status') == 'ok':
            return f'{lib}/{i}@{a["S"]}x.png', r.get('method', '?') + f' s{r.get("seed")}'
        for m in ('D', 'C'):
            for sd in (9101, 9102):
                p = f'{lib}/by-eye/{i}/cand-{m}-s{sd}.png'
                if os.path.exists(p):
                    return p, f'BY EYE ({m} s{sd})'
        return None, None
    ok = [i for i in ids if man.get(i, {}).get('status') == 'ok']
    eye = [i for i in ids if man.get(i, {}).get('status') == 'by-eye']
    pref = ['idle', 'attack', 'ready', 'cast', 'hurt', 'ko']
    pick = ([i for i in ids if assets[i]['state'] == 'idle'] + [i for p in pref[1:] for i in ids if assets[i]['state'] == p])
    pick = [i for i in dict.fromkeys(pick) if src(i)[0]][:n_poses]
    if len(pick) < n_poses:
        pick += [i for i in ids if i not in pick and src(i)[0]][:n_poses - len(pick)]
    cols = []
    for i in pick:
        a = assets[i]
        t = Image.open(f'{EDIR}/{i}@{a["S"]}x.png').convert('RGBA')
        pth, lab = src(i)
        p = Image.open(pth).convert('RGBA')
        if p.size != t.size:
            p = p.resize(t.size, Image.LANCZOS)
        bb = bbox(t)
        two = []
        for im in (t, p):
            c = flat(im.crop(bb))
            two.append(c.resize((max(1, round(c.width * h / c.height)), h), Image.LANCZOS))
        cols.append((i, lab, two))
    W = sum(c[2][0].width + 8 for c in cols)
    sh = Image.new('RGB', (W, 2 * h + 44), (24, 24, 28))
    d = ImageDraw.Draw(sh)
    x = 0
    for i, lab, (t, p) in cols:
        d.text((x + 4, 3), f'{assets[i]["state"]}: today', fill=(235, 235, 235), font=FONT)
        d.text((x + 4, h + 24), f'{assets[i]["state"]}: painterly ({lab})', fill=(255, 120, 120) if 'BY EYE' in lab else (255, 220, 120), font=FONT)
        sh.paste(t, (x, 20))
        sh.paste(p, (x, h + 44))
        x += t.width + 8
    os.makedirs(outdir, exist_ok=True)
    sh.save(f'{outdir}/{cid}.jpg', quality=86)
    return f'{outdir}/{cid}.jpg', len(ok), len(eye)


def char_sheet_all(cid, man, assets, lib, outdir, h=330):
    """Every pose of a character on one sheet (today above, painterly below, small): the review instrument for what the gates cannot see (a prop that turned into another prop, a small part lost)."""
    ids = sorted([k for k in assets if assets[k]['cid'] == cid], key=lambda i: (STATE_ORDER.index(assets[i]['state']) if assets[i]['state'] in STATE_ORDER else 9, assets[i]['state']))
    cols = []
    for i in ids:
        a = assets[i]
        r = man.get(i, {})
        pth = None
        lab = ''
        if r.get('status') == 'ok':
            pth, lab = f'{lib}/{i}@{a["S"]}x.png', f'{r.get("method")} s{r.get("seed")}'
        else:
            for m in ('D', 'C'):
                for sd in (9101, 9102):
                    q = f'{lib}/by-eye/{i}/cand-{m}-s{sd}.png'
                    if pth is None and os.path.exists(q):
                        pth, lab = q, f'BY EYE {m}{sd % 100}'
        if not pth:
            continue
        t = Image.open(f'{EDIR}/{i}@{a["S"]}x.png').convert('RGBA')
        p = Image.open(pth).convert('RGBA')
        if p.size != t.size:
            p = p.resize(t.size, Image.LANCZOS)
        bb = bbox(t)
        two = []
        for im in (t, p):
            c = flat(im.crop(bb))
            two.append(c.resize((max(1, round(c.width * h / c.height)), h), Image.LANCZOS))
        cols.append((a['state'], lab, two))
    if not cols:
        return None
    # wrap into rows of at most ~2400 px
    rows, cur, w = [], [], 0
    for c in cols:
        if w + c[2][0].width + 6 > 2400 and cur:
            rows.append(cur); cur, w = [], 0
        cur.append(c); w += c[2][0].width + 6
    rows.append(cur)
    sh = Image.new('RGB', (2400, len(rows) * (2 * h + 50)), (24, 24, 28))
    d = ImageDraw.Draw(sh)
    for ri, row in enumerate(rows):
        x, y = 0, ri * (2 * h + 50)
        for st, lab, (t, p) in row:
            d.text((x + 3, y + 1), f'{st} today', fill=(235, 235, 235), font=FONT)
            d.text((x + 3, y + h + 24), f'{st} {lab}', fill=(255, 120, 120) if 'BY EYE' in lab else (255, 220, 120), font=FONT)
            sh.paste(t, (x, y + 20)); sh.paste(p, (x, y + h + 44))
            x += t.width + 6
    os.makedirs(outdir, exist_ok=True)
    sh.save(f'{outdir}/{cid}-all-poses.jpg', quality=84)
    return f'{outdir}/{cid}-all-poses.jpg'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lib', default=OUTLIB)
    ap.add_argument('--group', default='all')
    a = ap.parse_args()
    lib = a.lib
    man = load_json(f'{lib}/manifest.json')['assets']
    assets = {x['id']: x for x in plan()}
    by = {}
    for k, r in man.items():
        if r['status'] == 'ok' and k in assets and (a.group == 'all' or assets[k]['group'] == a.group):
            by.setdefault(assets[k]['cid'], []).append(k)
    os.makedirs(f'{lib}/sheets', exist_ok=True)
    rows = []
    for cid, ids in sorted(by.items(), key=lambda kv: (GROUPS.index(assets[kv[1][0]]['group']), kv[0])):
        ids.sort(key=lambda i: (STATE_ORDER.index(assets[i]['state']) if assets[i]['state'] in STATE_ORDER else 9, assets[i]['state']))
        pick = ids[:1] + [i for i in ids[1:] if assets[i]['state'] in ('attack', 'ready', 'cast')][:2]
        if len(pick) < 3:
            pick += [i for i in ids if i not in pick][:3 - len(pick)]
        cols = [pair(assets[i], man[i], lib) for i in pick]
        W = sum(c[0].width + 8 for c in cols)
        sh = Image.new('RGB', (W, 2 * H + 44), (24, 24, 28))
        d = ImageDraw.Draw(sh)
        x = 0
        for i, (t, p) in zip(pick, cols):
            r = man[i]
            d.text((x + 4, 3), f'{assets[i]["state"]}: today', fill=(235, 235, 235), font=FONT)
            d.text((x + 4, H + 24), f'{assets[i]["state"]}: painterly ({r["method"]}, seed {r["seed"]})', fill=(255, 220, 120), font=FONT)
            sh.paste(t, (x, 20))
            sh.paste(p, (x, H + 44))
            x += t.width + 8
        sh.save(f'{lib}/sheets/{cid}.jpg', quality=86)
        n_all = sum(1 for k in assets if assets[k]['cid'] == cid)
        rows.append((assets[ids[0]]['group'], cid, len(ids), n_all, pick))
        print(cid, len(ids), '/', n_all, flush=True)
    with open(f'{lib}/sheets/index.html', 'w', encoding='utf8') as f:
        f.write('<!doctype html><meta charset=utf8><title>Painterly roll-out contact sheets</title><style>body{background:#15131d;color:#eee;font:14px sans-serif;margin:16px}img{max-width:100%}h2{margin-top:28px}</style>')
        f.write(f'<h1>Painterly roll-out ({now()})</h1><p>Top row today (R39 + E), bottom row painterly (D or C), each pose at battle height. {len(rows)} figures.</p>')
        g = None
        for grp, cid, n, tot, pick in rows:
            if grp != g:
                f.write(f'<h2>{html.escape(grp)}</h2>')
                g = grp
            f.write(f'<h3>{html.escape(cid)} ({n} of {tot} poses painted)</h3><img loading=lazy src="{html.escape(cid)}.jpg">')


if __name__ == '__main__':
    main()
