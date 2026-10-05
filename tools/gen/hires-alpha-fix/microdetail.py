"""Small invented micro-detail in a master (rivets, beads, extra strands): crops for Bailey, nothing changed.

For a master and its approved 1x painting (bicubic up): the places where the master has a compact, high-contrast feature the painting does not
(a bright or dark blob of 6 to 400 px, 45+ levels from the painting's own tone there, in the interior of the figure), ranked by contrast x area.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import alphafix as af

Image.MAX_IMAGE_PIXELS = None
ART = 'D:/pyrefly-r39-int/public/art'
OUT = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].startswith('D:') else 'D:/Tools/pyrefly-scratch/2026-10-04/r39-repair/microdetail'
os.makedirs(OUT, exist_ok=True)


def blobs(P, M, scale, top=4):
    h, w = P.shape[:2]
    Aup = Image.fromarray(P).resize((w * scale, h * scale), Image.BICUBIC)
    A = np.asarray(Aup, np.float32)
    Mf = M.astype(np.float32)
    inside = af.box_mean((A[..., 3] > 250).astype(np.float32), 25 * scale // 2 * 2 + 1) > 0.99   # solid, 25 1x-px from any edge
    la = af.lum(A[..., :3])
    lm = af.lum(Mf[..., :3])
    # the painting's own tone there: its 9x9 (1x) mean; a feature = the master differs from that tone by 45+ and from the painting itself
    tone = af.box_mean(la, 9 * scale // 2 * 2 + 1)
    d = lm - tone
    dp = la - tone                                                       # the painting's own deviation from its tone
    cand = (np.abs(d) > 45) & (np.abs(dp) < 15) & inside
    # compact components: label by runs
    H, W = cand.shape
    m = np.zeros((H, W + 2), np.int8)
    m[:, 1:-1] = cand
    st = np.argwhere(np.diff(m, axis=1) == 1)
    en = np.argwhere(np.diff(m, axis=1) == -1)
    # group runs into blobs by the 8-connected labelling of af.run_labels is size-only; use a coarse grid instead: count candidate px per 16x16 cell
    cell = 8 * scale
    gh, gw = H // cell, W // cell
    cnt = cand[:gh * cell, :gw * cell].reshape(gh, cell, gw, cell).sum(axis=(1, 3))
    mag = (np.abs(d) * cand)[:gh * cell, :gw * cell].reshape(gh, cell, gw, cell).sum(axis=(1, 3))
    score = mag.copy()
    score[cnt < 6] = 0
    out = []
    for _ in range(top):
        y, x = np.unravel_index(int(np.argmax(score)), score.shape)
        if score[y, x] <= 0:
            break
        out.append((int(x * cell + cell // 2), int(y * cell + cell // 2), float(score[y, x]), int(cnt[y, x])))
        score[max(0, y - 4):y + 5, max(0, x - 4):x + 5] = 0
    return Aup, out


def crop_sheet(name, P, M, scale, cx, cy, half=48, zoom=5):
    Aup = Image.fromarray(P).resize((P.shape[1] * scale, P.shape[0] * scale), Image.BICUBIC)
    box = (max(0, cx - half), max(0, cy - half), min(M.shape[1], cx + half), min(M.shape[0], cy + half))
    a = Aup.crop(box).convert('RGB')
    m = Image.fromarray(M).crop(box)
    base = Image.new('RGBA', m.size, (0, 0, 0, 255))
    m = Image.alpha_composite(base, m).convert('RGB')
    d = Image.fromarray(np.clip(np.abs(np.asarray(a, np.int16) - np.asarray(m, np.int16)) * 4, 0, 255).astype(np.uint8))
    W = (box[2] - box[0]) * zoom
    H = (box[3] - box[1]) * zoom
    sheet = Image.new('RGB', (W * 3 + 20, H + 20), (24, 24, 24))
    for i, im in enumerate((a, m, d)):
        sheet.paste(im.resize((W, H), Image.NEAREST), (i * (W + 10), 20))
    ImageDraw.Draw(sheet).text((4, 4), f'{name}   approved (bicubic up) | master | |difference| x4   window {box}, zoom {zoom}x', fill=(235, 235, 235))
    return sheet


if __name__ == '__main__':
    cases = [a for a in sys.argv[1:] if not a.startswith('D:')]
    report = []
    for c in cases:
        base, scale = c.rsplit('@', 1)
        scale = int(scale.rstrip('x'))
        P = af.load_rgba(f'{ART}/{base}.png')
        M = af.load_rgba(f'{ART}/{base}@{scale}x.png')
        Aup, hits = blobs(P, M, scale)
        for i, (cx, cy, sc, n) in enumerate(hits):
            sheet = crop_sheet(f'{base}@{scale}x #{i + 1}', P, M, scale, cx, cy)
            path = f'{OUT}/{base.replace("/", "_")}@{scale}x-{i + 1}.png'
            sheet.save(path)
            report.append(dict(file=f'{base}@{scale}x.png', rank=i + 1, at=[cx, cy], score=sc, px=n, crop=path))
            print(path, 'at', cx, cy, 'score %.0f px %d' % (sc, n))
    json.dump(report, open(f'{OUT}/report.json', 'w'), indent=1)
