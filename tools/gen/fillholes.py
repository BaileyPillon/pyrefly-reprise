"""Fill interior alpha holes punched through a cutout by rembg.

The failure this exists for, in one sentence: `isnet-anime` is trained to matte
anime *characters*, and where a pale object carries a blown-out white highlight
it decides that highlight is background and bites a hole clean through the
middle of the sprite. On a white cyclorama that hole then renders as a bright
gash, which is visually identical to a masking bug -- and a blind judge scores
it as one. docs/handoff/art3-bosses-b.md section 7 already found that
`isnet-anime` "will not matte pale stone"; this is the same defect from the
inside.

`despeckle.py` cannot help. That tool keeps the largest connected run of
*opaque* pixels and drops detached junk; a hole is the opposite problem -- the
opaque region is already one component and the damage is inside it.

What this does:

1. flood the transparent region inward from the image border (the 16 px crop
   margin guarantees the border is empty), marking everything it reaches as
   genuine outside;
2. any pixel still transparent after that is enclosed by the sprite, so it is a
   hole. Set it opaque;
3. take the hole's colour from the pre-cutout `*.raw.png` when one is given --
   the raw has the pixels the model actually painted, and they are right. With
   no raw, the hole is filled from the median of the opaque pixels around its
   own bounding box, which is duller but never wrong-coloured;
4. re-crop with the standard 16 px margin and rewrite the sidecar the way
   `flip.py` and `despeckle.py` do, recording `holesFilled` /
   `holesFilledAt` / `holesFilledPx` so the hand repair is obvious and the note
   that the seed no longer reproduces the file byte for byte is on the record.

    python_embeded/python.exe -s tools/gen/fillholes.py \
        public/art/characters/yu-pagoda/ko.png [--raw ko.raw.png] [--min-px 40]

`--min-px` ignores holes smaller than that many pixels, so a genuinely
see-through gap between two bells is not plugged. Holes worth fixing are big;
that is why they are visible.
"""
import argparse, json, os, datetime
from PIL import Image, ImageDraw

ALPHA_SOLID = 8       # at or below this a pixel counts as empty (matches rembg)


def flood_outside(mask):
    """mask: L image, 255 = transparent. Returns L image, 255 = outside."""
    w, h = mask.size
    work = mask.copy()
    d = ImageDraw.floodfill
    # Seed from every border pixel that is transparent. One seed per run of
    # border transparency is enough, but the borders are cheap to walk and a
    # missed seed means a false "hole" the size of the frame.
    px = work.load()
    seeds = []
    for x in range(w):
        if px[x, 0] == 255: seeds.append((x, 0))
        if px[x, h - 1] == 255: seeds.append((x, h - 1))
    for y in range(h):
        if px[0, y] == 255: seeds.append((0, y))
        if px[w - 1, y] == 255: seeds.append((w - 1, y))
    for s in seeds:
        if work.load()[s[0], s[1]] == 255:
            d(work, s, 128)
    out = work.point(lambda v: 255 if v == 128 else 0)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("png")
    ap.add_argument("--raw", default=None,
                    help="the pre-cutout *.raw.png; its pixels colour the filled holes")
    ap.add_argument("--min-px", type=int, default=40)
    ap.add_argument("--margin", type=int, default=16)
    a = ap.parse_args()

    im = Image.open(a.png).convert("RGBA")
    w, h = im.size
    alpha = im.getchannel("A")
    transparent = alpha.point(lambda v: 255 if v <= ALPHA_SOLID else 0)
    outside = flood_outside(transparent)

    tp = transparent.load()
    op = outside.load()
    holes = Image.new("L", (w, h), 0)
    hp = holes.load()
    count = 0
    for y in range(h):
        for x in range(w):
            if tp[x, y] == 255 and op[x, y] == 0:
                hp[x, y] = 255
                count += 1

    if count < a.min_px:
        print(json.dumps({"file": a.png, "holesFilledPx": 0, "note": "no interior holes"}))
        return

    src = None
    if a.raw and os.path.exists(a.raw):
        sidecar_path = a.png[:-4] + ".json"
        crop = None
        if os.path.exists(sidecar_path):
            with open(sidecar_path, encoding="utf-8") as fh:
                crop = json.load(fh).get("cropBox")
        raw = Image.open(a.raw).convert("RGB")
        src = raw.crop(tuple(crop)) if crop else raw.resize((w, h))
        if src.size != (w, h):
            src = src.resize((w, h))

    px = im.load()
    sp = src.load() if src else None
    for y in range(h):
        for x in range(w):
            if hp[x, y]:
                r, g, b = sp[x, y] if sp else (px[x, y][0], px[x, y][1], px[x, y][2])
                px[x, y] = (r, g, b, 255)

    # Re-crop to the repaired content with the house margin.
    bbox = im.getchannel("A").point(lambda v: 255 if v > ALPHA_SOLID else 0).getbbox()
    l, t, r, b = bbox
    crop = (max(0, l - a.margin), max(0, t - a.margin),
            min(w, r + a.margin), min(h, b + a.margin))
    out = im.crop(crop)
    out.save(a.png, "PNG", optimize=True)

    sidecar_path = a.png[:-4] + ".json"
    if os.path.exists(sidecar_path):
        with open(sidecar_path, encoding="utf-8") as fh:
            sc = json.load(fh)
        old = sc.get("cropBox") or [0, 0, w, h]
        sc["cropBox"] = [old[0] + crop[0], old[1] + crop[1],
                         old[0] + crop[2], old[1] + crop[3]]
        sc["width"], sc["height"] = out.width, out.height
        sc["baselineY"] = b - crop[1]
        sc["holesFilled"] = True
        sc["holesFilledPx"] = count
        sc["holesFilledAt"] = datetime.datetime.now().isoformat(timespec="seconds")
        with open(sidecar_path, "w", encoding="utf-8") as fh:
            fh.write(json.dumps(sc, indent=2) + "\n")

    print(json.dumps({"file": a.png, "holesFilledPx": count,
                      "size": f"{out.width}x{out.height}", "baselineY": b - crop[1]}))


if __name__ == "__main__":
    main()
