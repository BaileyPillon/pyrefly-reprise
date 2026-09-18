"""Clear a flat white backdrop that `isnet-anime` kept as part of the subject.

The failure this fixes, and why it is easy to miss: the style block asks for a
white cyclorama, and on dynamic poses the checkpoint often paints a *shape* —
a spotlight oval, a flat panel behind a cast animation, a wedge under a lunge —
in pure white rather than leaving the background empty. rembg mattes it as
subject, because it is subject-coloured and subject-adjacent. The sprite then
looks perfect in every viewer that shows it on white, `qc.py` calls it `ok`
because there is no halo, and the defect only appears when the sprite is
composited over a backdrop in the game, as an opaque white slab.

The fix is a flood fill inwards from the frame edge over pixels that are both
**near-white** and **unsaturated**, which is what a painted cyclorama is and
what shaded hair is not. Silver hair survives because it carries line work and
a blue-violet shadow ramp; the flat panel does not. Run it, then look at the
result composited on magenta — this is a heuristic, not a matte.

    python_embeded/python.exe -s tools/gen/unbackdrop.py \\
        public/art/characters/yunalesca-1/attack.png --margin 16

`--cut` is the per-channel floor for "white" (default 244) and `--spread` the
maximum channel spread for "unsaturated" (default 10). Lower `--cut` eats more,
including hair; raise it if a subject's own whites start disappearing.

Sidecar handling matches tools/gen/despeckle.py: `width`, `height`,
`baselineY` are recomputed, `cropBox` re-derived in source coordinates, and an
`unbackdropped` block records that the seed no longer reproduces the file. Run
this BEFORE tools/gen/flip.py, so the crop maths still agrees with the source
canvas about left and right.
"""
import argparse
import datetime
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

ALPHA_FLOOR = 8


def sidecar_for(path):
    return os.path.splitext(path)[0] + ".json"


def flood_from_border(rgba, cut, spread):
    """Clear near-white unsaturated pixels reachable from the frame edge."""
    h, w = rgba.shape[:2]
    rgb = rgba[:, :, :3].astype(np.int16)
    lo = rgb.min(axis=2)
    hi = rgb.max(axis=2)
    whiteish = (lo >= cut) & ((hi - lo) <= spread)
    # Fully transparent pixels are already background and conduct the fill.
    clear = rgba[:, :, 3] <= ALPHA_FLOOR
    passable = whiteish | clear

    seen = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if passable[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if passable[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and passable[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))

    doomed = seen & whiteish & (rgba[:, :, 3] > ALPHA_FLOOR)
    removed = int(doomed.sum())
    rgba[doomed] = 0
    return rgba, removed


def clear_enclosed_panels(rgba, cut, spread, min_fraction, min_solidity):
    """Clear flat-white blobs the border fill could not reach.

    A cast animation often paints its glow panel *inside* the figure's own
    outline — behind a sleeve, ringed by hair — so nothing connects it to the
    frame edge and the flood in `flood_from_border` leaves it. Telling those
    apart from the subject's own whites is a shape question, not a colour one:
    a painted panel is a fat blob that fills most of its bounding box, while
    white hair is long, thin and wispy and fills very little of its own. So
    only components that are both large and *solid* are removed.
    """
    from scipy import ndimage

    h, w = rgba.shape[:2]
    rgb = rgba[:, :, :3].astype(np.int16)
    lo = rgb.min(axis=2)
    hi = rgb.max(axis=2)
    opaque = rgba[:, :, 3] > ALPHA_FLOOR
    whiteish = opaque & (lo >= cut) & ((hi - lo) <= spread)

    labels, count = ndimage.label(whiteish)
    if not count:
        return rgba, 0
    subject = int(opaque.sum())
    removed = 0
    for i in range(1, count + 1):
        blob = labels == i
        area = int(blob.sum())
        if area < subject * min_fraction:
            continue
        ys, xs = np.where(blob)
        bbox = (ys.max() - ys.min() + 1) * (xs.max() - xs.min() + 1)
        if area / bbox < min_solidity:
            continue
        rgba[blob] = 0
        removed += area
    return rgba, removed


def content_box(alpha):
    rows = np.where(alpha.max(axis=1) > ALPHA_FLOOR)[0]
    cols = np.where(alpha.max(axis=0) > ALPHA_FLOOR)[0]
    if not len(rows) or not len(cols):
        return None
    return int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--out", help="defaults to overwriting the source")
    ap.add_argument("--margin", type=int, default=16)
    ap.add_argument("--cut", type=int, default=244)
    ap.add_argument("--spread", type=int, default=10)
    ap.add_argument(
        "--max-removed-fraction",
        type=float,
        default=0.5,
        help="refuse to save if this much of the opaque subject would go",
    )
    ap.add_argument(
        "--enclosed",
        action="store_true",
        help="also clear flat-white blobs the border fill cannot reach, when "
        "they are large and solid enough to be a painted panel rather than hair",
    )
    ap.add_argument("--enclosed-min-fraction", type=float, default=0.012)
    ap.add_argument("--enclosed-min-solidity", type=float, default=0.55)
    a = ap.parse_args()

    dst = a.out or a.src
    im = Image.open(a.src).convert("RGBA")
    rgba = np.array(im)
    opaque_before = int((rgba[:, :, 3] > ALPHA_FLOOR).sum())

    rgba, removed = flood_from_border(rgba, a.cut, a.spread)
    if a.enclosed:
        rgba, extra = clear_enclosed_panels(
            rgba, a.cut, a.spread, a.enclosed_min_fraction, a.enclosed_min_solidity
        )
        removed += extra
    share = removed / opaque_before if opaque_before else 0.0
    if share > a.max_removed_fraction:
        print(json.dumps({"ok": False, "reason": "would remove too much",
                          "removedFraction": round(share, 4)}))
        return 2

    cleaned = Image.fromarray(rgba, "RGBA")
    box = content_box(rgba[:, :, 3])
    if box is None:
        print(json.dumps({"ok": False, "reason": "nothing left"}))
        return 2
    left, top, right, bottom = box
    left = max(0, left - a.margin)
    top = max(0, top - a.margin)
    right = min(cleaned.width, right + a.margin)
    bottom = min(cleaned.height, bottom + a.margin)
    out = cleaned.crop((left, top, right, bottom))
    out.save(dst)

    alpha = np.array(out.getchannel("A"))
    rows = np.where(alpha.max(axis=1) > ALPHA_FLOOR)[0]
    baseline = int(rows[-1]) + 1 if len(rows) else out.height

    src_meta = sidecar_for(a.src)
    if os.path.exists(src_meta):
        with open(src_meta, "r", encoding="utf-8") as fh:
            meta = json.load(fh)
        old_box = meta.get("cropBox")
        if isinstance(old_box, (list, tuple)) and len(old_box) == 4:
            meta["cropBox"] = [old_box[0] + left, old_box[1] + top,
                               old_box[0] + right, old_box[1] + bottom]
        meta["width"], meta["height"] = out.size
        meta["baselineY"] = baseline
        meta["unbackdropped"] = {
            "at": datetime.datetime.now().astimezone().isoformat(),
            "pixelsRemoved": removed,
            "removedFraction": round(share, 4),
            "cut": a.cut,
            "spread": a.spread,
            "note": "Flat white backdrop the cutout kept, cleared by "
            "tools/gen/unbackdrop.py. The recorded seed reproduces the render, "
            "not this file.",
        }
        with open(sidecar_for(dst), "w", encoding="utf-8") as fh:
            json.dump(meta, fh, indent=2)
            fh.write("\n")

    print(json.dumps({"ok": True, "out": dst, "size": list(out.size),
                      "baselineY": baseline, "pixelsRemoved": removed,
                      "removedFraction": round(share, 4)}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
