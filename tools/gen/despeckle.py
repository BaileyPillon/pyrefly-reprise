"""Drop detached junk from a cutout, re-crop, and fix the sidecar.

`isnet-anime` keeps anything opaque it believes is foreground. On subjects the
model was not trained for -- "no humans" props, floating monsters, anything
rendered against drifting smoke -- that regularly means the sprite ships with
a cloud, a splash or a stray blob floating beside it. `qc.py` reports it as
BG-RETAINED; the crop box then spans the junk as well, so the sprite is bigger
than the character and `baselineY` can land on the blob instead of the body.

This keeps the largest connected run of opaque pixels and throws the rest away:

    python_embeded\\python.exe -s tools/gen/despeckle.py \\
        public/art/characters/yu-yevon/idle.png

    # write somewhere else, leaving the source alone
    ... tools/gen/despeckle.py in.png --out out.png

`--keep-frac F` also keeps any component at least F times the area of the
largest one. The default of 0 keeps only the largest, which is what you want
for a stray cloud. Raise it when a sprite legitimately has detached parts -- a
thrown weapon, an orbiting rune -- or they will be deleted too. Check the
reported component areas before trusting it.

Sidecar bookkeeping, matching what rembg.py writes:

  * `cropBox` is in SOURCE canvas coordinates, so the new crop is composed onto
    the old origin rather than replacing it.
  * `baselineY` is recomputed as the lowest remaining content row, expressed in
    the newly cropped image.
  * `despeckled` records that the file is a hand edit and the seed no longer
    reproduces it -- the same warning `flip.py` writes for a mirror.
"""
import argparse
import datetime
import json
import os
import sys

from PIL import Image


def components(mask, w, h):
    """Label 4-connected runs of set pixels. Iterative; these images are big."""
    seen = bytearray(w * h)
    out = []
    for start in range(w * h):
        if seen[start] or not mask[start]:
            continue
        stack = [start]
        seen[start] = 1
        pixels = []
        while stack:
            p = stack.pop()
            pixels.append(p)
            x, y = p % w, p // w
            if x > 0 and not seen[p - 1] and mask[p - 1]:
                seen[p - 1] = 1
                stack.append(p - 1)
            if x < w - 1 and not seen[p + 1] and mask[p + 1]:
                seen[p + 1] = 1
                stack.append(p + 1)
            if y > 0 and not seen[p - w] and mask[p - w]:
                seen[p - w] = 1
                stack.append(p - w)
            if y < h - 1 and not seen[p + w] and mask[p + w]:
                seen[p + w] = 1
                stack.append(p + w)
        out.append(pixels)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--out", dest="dst", default=None)
    ap.add_argument("--margin", type=int, default=16)
    ap.add_argument("--alpha-threshold", type=int, default=8)
    ap.add_argument("--keep-frac", type=float, default=0.0,
                    help="also keep components >= this fraction of the largest")
    args = ap.parse_args()

    dst = args.dst or args.src
    img = Image.open(args.src).convert("RGBA")
    w, h = img.size
    alpha = img.getchannel("A")
    mask = bytearray(1 if a >= args.alpha_threshold else 0 for a in alpha.getdata())

    comps = components(mask, w, h)
    if not comps:
        raise SystemExit("[despeckle] nothing opaque in this image")
    comps.sort(key=len, reverse=True)
    biggest = len(comps[0])
    keep = [c for c in comps if len(c) == biggest or
            (args.keep_frac > 0 and len(c) >= args.keep_frac * biggest)]
    dropped = [len(c) for c in comps if c not in keep]

    keepmask = bytearray(w * h)
    for c in keep:
        for p in c:
            keepmask[p] = 1

    a = bytearray(alpha.getdata())
    for i in range(w * h):
        if not keepmask[i]:
            a[i] = 0
    newalpha = Image.new("L", (w, h))
    newalpha.putdata(bytes(a))
    img.putalpha(newalpha)

    bbox = newalpha.point(lambda v: 255 if v >= args.alpha_threshold else 0).getbbox()
    left, top, right, bottom = bbox
    m = args.margin
    crop = (max(0, left - m), max(0, top - m), min(w, right + m), min(h, bottom + m))
    out = img.crop(crop)
    out.save(dst, "PNG", optimize=True)

    side = os.path.splitext(args.src)[0] + ".json"
    dside = os.path.splitext(dst)[0] + ".json"
    meta = {}
    if os.path.exists(side):
        with open(side, encoding="utf-8") as fh:
            meta = json.load(fh)
    old = meta.get("cropBox") or [0, 0, w, h]
    meta["width"] = out.width
    meta["height"] = out.height
    meta["baselineY"] = bottom - crop[1]
    # cropBox is in SOURCE canvas coordinates: compose onto the old origin.
    meta["cropBox"] = [old[0] + crop[0], old[1] + crop[1],
                       old[0] + crop[2], old[1] + crop[3]]
    meta["despeckled"] = True
    meta["despeckledAt"] = datetime.datetime.now().isoformat(timespec="seconds")
    meta["despeckledDropped"] = dropped
    with open(dside, "w", encoding="utf-8") as fh:
        fh.write(json.dumps(meta, indent=2) + "\n")

    print(json.dumps({
        "out": dst.replace("\\", "/"),
        "kept": [len(c) for c in keep],
        "dropped": dropped,
        "width": out.width,
        "height": out.height,
        "baselineY": meta["baselineY"],
    }))


if __name__ == "__main__":
    main()
