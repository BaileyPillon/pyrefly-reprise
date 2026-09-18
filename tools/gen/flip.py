"""Mirror a sprite horizontally, and fix up its sidecar.

Why this exists: the v3 facing contract (docs/handoff/art3-contract.md) asks
for party art angled to the right and enemy art angled to the left, and the
one thing an SDXL text encoder is genuinely unreliable about is left versus
right. A batch of three regularly comes back with a variant that is perfect on
costume, cutout and body angle and simply points the wrong way. Rerolling
throws away a good render to buy a coin flip; mirroring it is exact and takes a
second.

    D:\\Tools\\ComfyUI\\python_embeded\\python.exe -s tools/gen/flip.py \\
        public/art/characters/tidus/idle.png

    # or write somewhere else, leaving the source alone
    ... tools/gen/flip.py in.png --out out.png

What it touches in the sidecar:

  * `width`, `height`, `baselineY` are unchanged — a horizontal mirror moves no
    row, and `baselineY` is a row.
  * `cropBox` is mirrored inside the source canvas, so it still describes where
    the content sat in the original render.
  * `facing` flips right <-> left (`none` is left alone and warned about: a
    straight-on render has no facing to flip, and mirroring it is a no-op the
    caller probably did not mean).

    Careful here. The `facing` the generator writes is what was *asked for*,
    not what came out, and the whole reason this script exists is that those
    two disagree often. When you are mirroring precisely because the render
    ignored the request, flipping the field moves it further from the truth —
    pass `--set-facing right|left` and say what the image now actually shows.
  * `flipped: true` and `flippedAt` are recorded, because a mirrored sprite is
    a hand edit and the next person needs to know the seed will not reproduce
    the file.

Mirroring is only safe when nothing in the frame is chiral. Check before you
flip: Auron's coat is worn off his LEFT shoulder, Kimahri's broken horn is one
specific horn, and any legible text or asymmetric insignia becomes nonsense in
a mirror. For those, reroll instead.
"""
import argparse
import datetime
import json
import os
import sys

from PIL import Image

OPPOSITE = {"right": "left", "left": "right"}


def sidecar_for(path):
    return os.path.splitext(path)[0] + ".json"


def flip_sidecar(meta, quiet=False, set_facing=None):
    facing = meta.get("facing")
    if set_facing:
        meta["facing"] = set_facing
        meta["facingObserved"] = True
    elif facing in OPPOSITE:
        meta["facing"] = OPPOSITE[facing]
    elif facing is not None and not quiet:
        print(
            f"[flip] note: facing={facing!r} is not left/right, leaving it alone",
            file=sys.stderr,
        )

    box = meta.get("cropBox")
    source = meta.get("source") or {}
    src_w = source.get("width")
    if isinstance(box, (list, tuple)) and len(box) == 4 and src_w:
        left, top, right, bottom = box
        meta["cropBox"] = [src_w - right, top, src_w - left, bottom]

    meta["flipped"] = not meta.get("flipped", False)
    meta["flippedAt"] = datetime.datetime.now().astimezone().isoformat()
    meta["flipNote"] = (
        "Mirrored horizontally by tools/gen/flip.py to satisfy the v3 facing "
        "contract. Re-running the recorded seed reproduces the UNmirrored image."
    )
    return meta


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("--out", help="defaults to overwriting the source")
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument(
        "--set-facing",
        dest="set_facing",
        choices=["right", "left", "none"],
        help="write this into the sidecar instead of flipping the recorded "
        "value: what the mirrored image ACTUALLY shows",
    )
    a = ap.parse_args()

    dst = a.out or a.src
    im = Image.open(a.src)
    im = im.transpose(Image.FLIP_LEFT_RIGHT)
    im.save(dst)

    src_meta = sidecar_for(a.src)
    if os.path.exists(src_meta):
        with open(src_meta, "r", encoding="utf-8") as fh:
            meta = json.load(fh)
        meta = flip_sidecar(meta, quiet=a.quiet, set_facing=a.set_facing)
        with open(sidecar_for(dst), "w", encoding="utf-8") as fh:
            json.dump(meta, fh, indent=2)
            fh.write("\n")

    print(json.dumps({"ok": True, "out": dst, "size": list(im.size)}))


if __name__ == "__main__":
    main()
