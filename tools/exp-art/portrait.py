"""Cut and size ONE approved Art Room dialogue portrait for the experimental Leblanc chapter (branch exp-leblanc; FFX-2 only).

Run by `tools/exp-install.mjs portrait` with ComfyUI's embedded python (numpy, scipy, PIL; nothing is downloaded):

    D:/Tools/ComfyUI/python_embeded/python.exe -s tools/exp-art/portrait.py --src IN.png --out OUT.png
        [--width 832] [--height 1216] [--trim bottom|top|center] [--halo-peel N] [--rim N] [--pockets flat|tinted] [--haze 16]

What the house portrait is (measured off the shipped ones, `public/art/portraits/*.png`, `tools/portraits/measure-face-crops.mjs`): an 8-bit RGBA
832x1216 canvas holding a head-and-shoulders bust that BLEEDS OFF the canvas edges (no margin, no baseline: unlike a figure, a portrait is never
tight-cropped), with a transparent background where the bust does not reach. The Art Room paints a portrait on a flat colour (mid-grey, or ochre for Logos) at
1024x1536 (2:3) or thereabouts, so the install is: key the flat colour out at the source's own resolution, scale to 832 wide, trim to 1216 rows.

The key is `figure.py`'s (`key_matte`: a flood from the border, enclosed gaps of the background colour cleared, a one-pixel choke, a feathered edge), with two
differences that only a bust needs:

- the source is padded by edge replication before the key and cropped back after it, so a figure that touches the canvas edge is not eroded there (a one-pixel
  transparent line down the side of a card would show);
- `--halo-peel N` takes the generator's neutral-grey fringe off the OUTSIDE of the figure (`figure.py`'s `peel_halo`), and `--rim N` cuts N more pixels INSIDE the
  edge for a painting whose rim light leaves a pale band (the Gunner, Leblanc and Brother carry one, `art-2/auto-selected-surfaces.json` qc), always measured in
  SOURCE pixels (the source is about 1.23x the output).

The colour under the soft edge is the nearest solid pixel's (`bleed_colour`), and the resize is done premultiplied (PIL's `RGBa`), so no grey leaks into the
edge when the matte is scaled. Prints ONE line of JSON: sizes, the matte's numbers and the sha256 of what it wrote.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import figure as F  # noqa: E402

PAD = 24  # px of edge replication around the source while it is keyed
CHROMA_TOL = 14.0  # a background pixel is as colourless (or as coloured) as the sheet to within this much ( )


def sha256_file(path: str) -> str:
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()


def bust_background(rgb: np.ndarray, ring: int = 4, min_share: float = 0.08) -> tuple[np.ndarray, float]:
    """The flat colour behind a bust, read from its border: the commonest tight colour cluster of the outer `ring` pixels.

    `figure.flat_background` asks the whole border to be one colour, which a bust that bleeds off the canvas is not (the figure covers a third to
    three quarters of the border). The background is the one colour that many border pixels share: the border is quantised, the modal bin's pixels within a
    small distance of its median are the background, and it must be `min_share` of the ring or there is no flat colour to key. Returns (colour, noise), where
    the noise is the 99.5th percentile distance inside the cluster, as `figure.flat_background` reports it.
    """
    h, w = rgb.shape[:2]
    mask = np.zeros((h, w), bool)
    mask[:ring, :] = mask[-ring:, :] = mask[:, :ring] = mask[:, -ring:] = True
    px = rgb[mask].astype(np.float32)
    bins = (px // 12).astype(np.int32)
    keys = bins[:, 0] * 10000 + bins[:, 1] * 100 + bins[:, 2]
    uniq, counts = np.unique(keys, return_counts=True)
    modal = uniq[int(np.argmax(counts))]
    seed = np.median(px[keys == modal], axis=0)
    d = np.linalg.norm(px - seed, axis=1)
    near = d <= 16.0
    if near.mean() < min_share:
        raise SystemExit(f"[portrait] no flat colour on the border: the commonest colour is only {near.mean():.1%} of it")
    med = np.median(px[near], axis=0)
    d2 = np.linalg.norm(px[near] - med, axis=1)
    return med, float(np.percentile(d2, 99.5))


def rim_cut(alpha: np.ndarray, px: int) -> np.ndarray:
    """Pull the figure's outline in by `px` pixels (the matte's soft edge is kept soft)."""
    if px <= 0:
        return alpha
    fg = alpha >= 128
    fg = ndi.binary_erosion(fg, structure=ndi.generate_binary_structure(2, 1), iterations=px, border_value=1)
    soft = ndi.gaussian_filter(fg.astype(np.float32), F.KEY_FEATHER)
    return np.clip(np.round(np.where(fg, np.maximum(soft, 0.0), soft) * 255.0), 0, 255).astype(np.uint8)


def trim_rows(img: Image.Image, height: int, how: str) -> tuple[Image.Image, int]:
    """Crop to `height` rows: from the bottom (the bust's shoulders are what is lost), the top, or the middle. Returns the image and the first row kept."""
    w, h = img.size
    if h <= height:
        return img, 0
    top = {"bottom": 0, "top": h - height, "center": (h - height) // 2}[how]
    return img.crop((0, top, w, top + height)), top


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--width", type=int, default=832)
    ap.add_argument("--height", type=int, default=1216)
    ap.add_argument("--trim", choices=["bottom", "top", "center"], default="bottom")
    ap.add_argument("--pockets", choices=["flat", "tinted"], default="flat")
    ap.add_argument("--halo-peel", type=int, default=0)
    ap.add_argument("--rim", type=int, default=0)
    ap.add_argument("--haze", type=int, default=16)
    ap.add_argument("--chroma-tol", type=float, default=CHROMA_TOL, help="how far a background pixel's chroma may be from the sheet's (keeps a skin shadow near the sheet's grey from being flooded in off the canvas edge)")
    args = ap.parse_args()

    src = Image.open(args.src)
    rgb = np.asarray(src.convert("RGB")).copy()
    h0, w0 = rgb.shape[:2]
    flat = bust_background(rgb)
    padded = np.pad(rgb, ((PAD, PAD), (PAD, PAD), (0, 0)), mode="edge")
    alpha_p, kstats = F.key_matte(padded, flat[0], flat[1], tinted=args.pockets == "tinted", halo_peel=args.halo_peel, chroma_tol=args.chroma_tol)
    alpha = alpha_p[PAD:-PAD, PAD:-PAD]
    alpha = rim_cut(np.pad(alpha, PAD, mode="edge"), args.rim)[PAD:-PAD, PAD:-PAD] if args.rim > 0 else alpha
    hz = int(((alpha > 0) & (alpha < args.haze)).sum())
    alpha = np.where(alpha < args.haze, 0, alpha).astype(np.uint8)
    out_rgb = F.bleed_colour(rgb, alpha)
    rgba = np.dstack([out_rgb, alpha])

    # Scale to the house width (premultiplied, so the matte's edge carries no grey), then trim to the house height.
    scale = args.width / w0
    new_h = int(round(h0 * scale))
    prem = Image.fromarray(rgba, "RGBA").convert("RGBa").resize((args.width, new_h), Image.LANCZOS).convert("RGBA")
    scaled_size = list(prem.size)
    final, first_row = trim_rows(prem, args.height, args.trim)
    if final.size != (args.width, args.height):
        raise SystemExit(f"[portrait] scaled to {tuple(scaled_size)}, which does not reach {args.width}x{args.height}: the source is not tall enough for the house canvas")
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    final.save(args.out, "PNG", optimize=True)

    fa = np.asarray(final)[..., 3]
    print(
        json.dumps(
            {
                "width": args.width,
                "height": args.height,
                "source": {"file": os.path.basename(args.src), "size": [w0, h0], "mode": src.mode, "sha256": sha256_file(args.src)},
                "scaledTo": scaled_size,
                "trim": {"how": args.trim, "firstRow": first_row, "rows": scaled_size[1] - args.height},
                "matte": {"how": "key", **kstats, "rimPx": args.rim, "hazePixels": hz},
                "transparentShare": round(float((fa == 0).mean()), 4),
                "opaqueShare": round(float((fa >= 250).mean()), 4),
                "softShare": round(float(((fa > 0) & (fa < 250)).mean()), 5),
                "edges": {
                    "top": round(float((fa[0] >= 128).mean()), 3),
                    "bottom": round(float((fa[-1] >= 128).mean()), 3),
                    "left": round(float((fa[:, 0] >= 128).mean()), 3),
                    "right": round(float((fa[:, -1] >= 128).mean()), 3),
                },
                "outSha256": sha256_file(args.out),
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
