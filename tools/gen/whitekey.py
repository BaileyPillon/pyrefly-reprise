"""Luminance-key cutout, for subjects `isnet-anime` refuses to segment.

rembg's `isnet-anime` is trained on anime *figures*. It mattes people and
creatures well, but on an inanimate prop rendered against the style block's
white cyclorama (Yu Pagoda: a pale stone finial) it returns almost no alpha and
the crop collapses to a sliver. These renders are on a flat white background, so
keying on distance-from-white recovers the subject exactly.

Reads the `<pose>.N.raw.png` the generator already keeps beside its output, and
rewrites `<pose>.N.png` plus the `baselineY` in `<pose>.N.json` in place, so the
result is the same contract the engine reads (docs/ART-PIPELINE.md section 5).

    python_embeded/python.exe -s tools/gen/whitekey.py \
        --raw public/art/characters/yu-pagoda/idle.1.raw.png \
        --out public/art/characters/yu-pagoda/idle.1.png \
        --json public/art/characters/yu-pagoda/idle.1.json
"""
import argparse, json, os
from PIL import Image, ImageFilter
import collections


def key(raw, cut=18, feather=1.0):
    """Alpha = how far each pixel is from white, normalised over `cut`."""
    im = raw.convert("RGB")
    w, h = im.size
    px = im.load()
    a = Image.new("L", (w, h), 0)
    ap = a.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            d = 255 - min(r, g, b)          # distance from white
            ap[x, y] = 255 if d >= cut * 2 else (0 if d <= cut else int(255 * (d - cut) / cut))
    if feather:
        a = a.filter(ImageFilter.GaussianBlur(feather))
    return a


def largest_blobs(mask, keep_frac=0.02):
    """Drop specks: keep components at least `keep_frac` of the biggest one."""
    w, h = mask.size
    mp = mask.load()
    seen = [[False] * w for _ in range(h)]
    comps = []
    for y in range(h):
        for x in range(w):
            if mp[x, y] < 32 or seen[y][x]:
                continue
            q = collections.deque([(x, y)])
            seen[y][x] = True
            cells = []
            while q:
                cx, cy = q.popleft()
                cells.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and mp[nx, ny] >= 32:
                        seen[ny][nx] = True
                        q.append((nx, ny))
            comps.append(cells)
    if not comps:
        return mask
    big = max(len(c) for c in comps)
    out = Image.new("L", (w, h), 0)
    op = out.load()
    for c in comps:
        if len(c) >= big * keep_frac:
            for cx, cy in c:
                op[cx, cy] = mp[cx, cy]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--json", dest="js")
    ap.add_argument("--margin", type=int, default=16)
    ap.add_argument("--cut", type=int, default=18)
    a = ap.parse_args()

    raw = Image.open(a.raw)
    alpha = largest_blobs(key(raw, a.cut))
    rgba = raw.convert("RGBA")
    rgba.putalpha(alpha)

    box = alpha.point(lambda v: 255 if v >= 8 else 0).getbbox()
    if not box:
        raise SystemExit(f"whitekey: nothing survived the key in {a.raw}")
    x0, y0, x1, y1 = box
    W, H = rgba.size
    x0, y0 = max(0, x0 - a.margin), max(0, y0 - a.margin)
    x1, y1 = min(W, x1 + a.margin), min(H, y1 + a.margin)
    crop = rgba.crop((x0, y0, x1, y1))
    crop.save(a.out)

    ca = crop.getchannel("A")
    cw, ch = crop.size
    cp = ca.load()
    baseline = max((y for y in range(ch) if any(cp[x, y] > 200 for x in range(0, cw, 2))), default=ch - 1)

    if a.js and os.path.exists(a.js):
        d = json.load(open(a.js, encoding="utf-8"))
        d.update({
            "width": cw, "height": ch, "baselineY": baseline,
            "cropBox": [x0, y0, x1, y1],
            "cutout": "whitekey",
            "cutoutNote": "isnet-anime returned no usable matte for this prop; "
                          "alpha keyed off the white cyclorama instead.",
        })
        json.dump(d, open(a.js, "w", encoding="utf-8"), indent=2)
    print(f"{a.out} {cw}x{ch} baselineY={baseline}")

main()
