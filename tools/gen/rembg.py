"""Cut a generated character out of its background and crop it to content.

Runs in ComfyUI's *embedded* python (it already has Pillow; rembg is pip
installed alongside it) — never the system python:

    D:\\Tools\\ComfyUI\\python_embeded\\python.exe -s tools/gen/rembg.py \\
        --in raw.png --out idle.png --margin 16

Prints one line of JSON on stdout describing the result so the Node client can
write the sidecar:

    {"width":..,"height":..,"baselineY":..,"cropBox":[l,t,r,b],
     "sourceWidth":..,"sourceHeight":..,"model":"isnet-anime"}

`baselineY` is the bottom row of actual alpha content in the *cropped* image —
the character's feet. The engine uses it to plant the sprite on the ground
plane instead of guessing from the image box.
"""

import argparse
import io
import json
import os
import sys

# Keep the u2net/isnet weights on D: with everything else.
os.environ.setdefault("U2NET_HOME", r"D:\Tools\ComfyUI\rembg-models")

from PIL import Image  # noqa: E402
from rembg import new_session, remove  # noqa: E402

# isnet-anime is trained on illustration/anime line art; on cel-shaded SDXL
# output it beats general u2net badly around hair spikes and thin weapons.
PREFERRED_MODELS = ("isnet-anime", "u2net")


def build_session():
    last = None
    for name in PREFERRED_MODELS:
        try:
            return new_session(name), name
        except Exception as exc:  # network hiccup on first-run weight download
            last = exc
            print(f"[rembg] model {name!r} unavailable: {exc}", file=sys.stderr)
    raise SystemExit(f"[rembg] no usable model: {last}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="src", required=True)
    ap.add_argument("--out", dest="dst", required=True)
    ap.add_argument("--margin", type=int, default=16)
    ap.add_argument("--alpha-threshold", type=int, default=8,
                    help="alpha below this counts as empty when finding content")
    args = ap.parse_args()

    session, model_name = build_session()

    with open(args.src, "rb") as fh:
        raw = fh.read()

    cut = remove(
        raw,
        session=session,
        post_process_mask=True,
    )
    img = Image.open(io.BytesIO(cut)).convert("RGBA")
    source_w, source_h = img.size

    # Bounding box of pixels that are meaningfully opaque. getbbox() on the
    # alpha band alone would count 1/255 halo pixels as content.
    alpha = img.getchannel("A")
    mask = alpha.point(lambda a: 255 if a >= args.alpha_threshold else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise SystemExit("[rembg] nothing left after background removal")

    left, top, right, bottom = bbox
    m = args.margin
    crop = (
        max(0, left - m),
        max(0, top - m),
        min(source_w, right + m),
        min(source_h, bottom + m),
    )
    out = img.crop(crop)

    os.makedirs(os.path.dirname(os.path.abspath(args.dst)) or ".", exist_ok=True)
    out.save(args.dst, "PNG", optimize=True)

    print(
        json.dumps(
            {
                "width": out.width,
                "height": out.height,
                # Feet = last content row, expressed in the cropped image.
                "baselineY": bottom - crop[1],
                "cropBox": list(crop),
                "contentBox": [left, top, right, bottom],
                "sourceWidth": source_w,
                "sourceHeight": source_h,
                "model": model_name,
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
