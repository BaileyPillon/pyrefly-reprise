"""Layer-cutting helpers for the living-portrait layered rig
(docs/concepts/pause-until-dawn/prototype-v2/). No SAM, no MediaPipe on this
machine (docs/plans/pause-living-portraits-techniques.md Part 1): masks are
hand-authored polygons in JSON, read off the source at native pixel
resolution with tools/gen/yaw-keys-sheet.py's ``grid`` command, then combined
with the source's own alpha (every key here is already a clean rembg cutout
against a transparent background) so a layer's edge never has to be traced
more precisely than the polygon needs to be — the true silhouette edge does
the fine work, the polygon only says which part of the silhouette this layer
owns.

Run with a Python that has PIL and numpy (this repo's system python or
ComfyUI's embedded interpreter both qualify; unlike inpaint-support.py this
tool does not need ComfyUI itself, only the packages).

Subcommands:

``layer``   cut one polygon-masked, alpha-intersected, feathered layer out of
            a source image; trims to the mask's own bounding box (padded) and
            records that box in a sidecar JSON next to the PNG/WebP output.
``overlay`` draw one or more named polygons over the source, semi-transparent
            and colour-coded, so a boundary can be checked by eye before
            anything is cut (the brief's "render an overlay, look, refine").
``fillhole`` a cheap, non-generative fill for a small region a moving layer
            reveals (a neighbour-pixel clone with light blur), for cases too
            small or too cheap to justify a diffusion inpaint call — the
            brief explicitly allows filling an iris/sclera hole "from
            neighbouring sclera pixels" as an alternative to inpainting.
``trim``    crop an already-cut RGBA image to its own alpha bounding box
            (padded) and record the box — used for layers cut by a plain
            alpha slice (e.g. the iris disc) rather than a polygon.
"""

from __future__ import annotations

import argparse
import json
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

CHECKER = (34, 34, 38)

PALETTE = [
    (255, 80, 80), (80, 200, 255), (255, 210, 40), (120, 255, 120),
    (255, 120, 255), (120, 180, 255), (255, 160, 80), (180, 255, 220),
]


def _polygon_mask(size: tuple[int, int], polygon: list[list[float]], feather: float) -> Image.Image:
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in polygon], fill=255)
    if feather > 0:
        m = m.filter(ImageFilter.GaussianBlur(radius=feather))
    return m


def _load(path: str) -> Image.Image:
    return Image.open(path).convert("RGBA")


def cmd_layer(args) -> None:
    src = _load(args.source)
    spec = json.load(open(args.spec, encoding="utf-8"))
    entry = spec[args.name] if args.name in spec else next(l for l in spec["layers"] if l["name"] == args.name)
    polygon = entry["polygon"]
    feather = entry.get("feather", args.feather)
    mask = _polygon_mask(src.size, polygon, feather)
    if entry.get("subtract"):
        for other in entry["subtract"]:
            sub_entry = spec[other] if other in spec else next(l for l in spec["layers"] if l["name"] == other)
            sub_mask = _polygon_mask(src.size, sub_entry["polygon"], sub_entry.get("feather", args.feather))
            mask = Image.fromarray(np.clip(np.array(mask).astype(int) - np.array(sub_mask).astype(int), 0, 255).astype("uint8"))

    src_arr = np.array(src)
    mask_arr = np.array(mask).astype(np.float32) / 255.0
    # Intersect with the source's own alpha: the polygon says *which part* of
    # the already-clean silhouette this layer owns; it never invents opacity
    # the source cutout didn't have.
    out_alpha = (src_arr[:, :, 3].astype(np.float32) / 255.0) * mask_arr
    out = src_arr.copy()
    out[:, :, 3] = np.clip(out_alpha * 255.0, 0, 255).astype(np.uint8)
    out_im = Image.fromarray(out, "RGBA")

    ys, xs = np.where(out_alpha > (args.alpha_floor / 255.0))
    if len(xs) == 0:
        raise SystemExit(f"layer '{args.name}' is empty at this alpha floor — check the polygon")
    pad = args.pad
    x0, x1 = max(0, xs.min() - pad), min(src.width, xs.max() + 1 + pad)
    y0, y1 = max(0, ys.min() - pad), min(src.height, ys.max() + 1 + pad)
    cropped = out_im.crop((x0, y0, x1, y1))

    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    if args.out.lower().endswith(".webp"):
        cropped.save(args.out, "WEBP", lossless=args.lossless, quality=args.quality, method=6)
    else:
        cropped.save(args.out)
    meta = {
        "layer": args.name,
        "source": os.path.relpath(args.source, REPO_ROOT).replace("\\", "/"),
        "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)],
        "canvas": [src.width, src.height],
        "feather": feather,
        "polygon": polygon,
        "subtract": entry.get("subtract", []),
    }
    with open(os.path.splitext(args.out)[0] + ".json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
        f.write("\n")
    print(f"{args.out} box={meta['box']} bytes={os.path.getsize(args.out)}")


def cmd_overlay(args) -> None:
    src = _load(args.source).convert("RGB")
    d = ImageDraw.Draw(src, "RGBA")
    spec = json.load(open(args.spec, encoding="utf-8"))
    layers = spec["layers"] if "layers" in spec else [{"name": k, **v} for k, v in spec.items()]
    names = args.names or [l["name"] for l in layers]
    for i, l in enumerate(layers):
        if l["name"] not in names:
            continue
        color = PALETTE[i % len(PALETTE)]
        d.polygon([tuple(p) for p in l["polygon"]], fill=color + (90,), outline=color + (255,), width=3)
        cx = sum(p[0] for p in l["polygon"]) / len(l["polygon"])
        cy = sum(p[1] for p in l["polygon"]) / len(l["polygon"])
        d.text((cx, cy), l["name"], fill=(255, 255, 255))
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    src.save(args.out)
    print(f"{args.out} {src.size} layers={[l['name'] for l in layers if l['name'] in names]}")


def cmd_fillhole(args) -> None:
    """Neighbour-clone fill for a small revealed hole (e.g. sclera behind an
    iris cutout, or a sliver of forehead behind a moved strand): samples an
    annulus just outside the hole, blurs it, and composites it back into the
    hole only. Cheap, non-generative, appropriate for small/soft regions —
    the brief's own allowed alternative to a diffusion inpaint for exactly
    this case."""
    src = _load(args.source)
    x, y, w, h = args.box
    grow = args.grow
    region = src.crop((x - grow, y - grow, x + w + grow, y + h + grow)).convert("RGB")
    blurred = region.filter(ImageFilter.GaussianBlur(radius=max(w, h) / 3))
    fill = blurred.resize((w, h), Image.LANCZOS)
    out = src.copy()
    patch = fill.convert("RGBA")
    patch.putalpha(255)
    out.paste(patch, (x, y))
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    out.save(args.out)
    print(f"{args.out} filled box={args.box} grow={grow}")


def cmd_trim(args) -> None:
    src = _load(args.source)
    arr = np.array(src)
    ys, xs = np.where(arr[:, :, 3] > args.alpha_floor)
    if len(xs) == 0:
        raise SystemExit("image is fully transparent at this alpha floor")
    pad = args.pad
    x0, x1 = max(0, xs.min() - pad), min(src.width, xs.max() + 1 + pad)
    y0, y1 = max(0, ys.min() - pad), min(src.height, ys.max() + 1 + pad)
    cropped = src.crop((x0, y0, x1, y1))
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    cropped.save(args.out)
    meta = {"source": os.path.relpath(args.source, REPO_ROOT).replace("\\", "/"), "box": [int(x0), int(y0), int(x1 - x0), int(y1 - y0)], "canvas": [src.width, src.height]}
    with open(os.path.splitext(args.out)[0] + ".json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
        f.write("\n")
    print(f"{args.out} box={meta['box']}")


REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)

    la = sub.add_parser("layer")
    la.add_argument("--source", required=True)
    la.add_argument("--spec", required=True, help="JSON: {layers:[{name,polygon,feather?,subtract?}, ...]}")
    la.add_argument("--name", required=True)
    la.add_argument("--out", required=True)
    la.add_argument("--feather", type=float, default=3.0)
    la.add_argument("--pad", type=int, default=4)
    la.add_argument("--alpha-floor", type=int, default=8)
    la.add_argument("--lossless", action="store_true")
    la.add_argument("--quality", type=int, default=95)
    la.set_defaults(fn=cmd_layer)

    ov = sub.add_parser("overlay")
    ov.add_argument("--source", required=True)
    ov.add_argument("--spec", required=True)
    ov.add_argument("--names", nargs="*", default=None)
    ov.add_argument("--out", required=True)
    ov.set_defaults(fn=cmd_overlay)

    fh = sub.add_parser("fillhole")
    fh.add_argument("--source", required=True)
    fh.add_argument("--box", nargs=4, type=int, required=True, metavar=("X", "Y", "W", "H"))
    fh.add_argument("--grow", type=int, default=14)
    fh.add_argument("--out", required=True)
    fh.set_defaults(fn=cmd_fillhole)

    tr = sub.add_parser("trim")
    tr.add_argument("--source", required=True)
    tr.add_argument("--out", required=True)
    tr.add_argument("--pad", type=int, default=4)
    tr.add_argument("--alpha-floor", type=int, default=8)
    tr.set_defaults(fn=cmd_trim)

    args = ap.parse_args(argv)
    args.fn(args)


if __name__ == "__main__":
    main(None)
