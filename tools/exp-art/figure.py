"""Matte, clean, frame and measure ONE approved Art Room figure for the experimental Leblanc chapter (branch exp-leblanc; FFX-2 only).

Run by `tools/exp-install.mjs install` with ComfyUI's embedded python (numpy, scipy, PIL, rembg; nothing is downloaded):

    D:/Tools/ComfyUI/python_embeded/python.exe -s tools/exp-art/figure.py --src IN.png --out OUT.png [--matte auto|keep|rembg]
        [--margin 16] [--haze 16] [--facing right|left|front] [--feet-row N]

It writes OUT.png (8-bit RGBA, straight alpha) and prints ONE line of JSON on stdout: the measurements the sidecar and the registration need.

What the house figure is (measured off the shipped paintings, `docs/handoff/exp-leblanc.md` section 2):

- a TIGHT crop of the figure with a 16 px margin on every side (the engine's sizing counts the canvas above the head as height);
- the alpha is what the engine reads: the figure opaque (>= 250), a one- or two-pixel antialiased edge, nothing else. No haze, no glow,
  no cast shadow, no ground, no specks. The colour under the edge is the figure's own (never a halo's), and a ring of the figure's colour
  is bled under the transparent pixels beside it so bilinear and mip filtering never blend in black or grey;
- `baselineY` is the bottom row of the content (the soles), counted in the cropped image.

The Art Room's images carry real alpha (0..254, some of them a faint glow at alpha 1 to 7 around the figure: the `haze` below). An
opaque image (no transparency) is cut with rembg's isnet-anime, the house cutter (`tools/gen/rembg.py`), then cleaned the same way.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import sys
from types import SimpleNamespace

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

os.environ.setdefault("U2NET_HOME", r"D:\Tools\ComfyUI\rembg-models")

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "posescale"))

ALPHA_FLOOR = 8  # what counts as content when the box is measured (tools/gen/rembg.py)
CORE = 128  # a pixel this opaque belongs to a body
EDGE_BAND = 3  # px beyond the body a soft pixel may sit (the antialiased edge); farther is haze


def sha256_file(path: str) -> str:
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()


def has_real_alpha(a: np.ndarray) -> bool:
    """A cut-out: a real share of the pixels is transparent and the four corners are too."""
    h, w = a.shape
    corners = [a[0, 0], a[0, w - 1], a[h - 1, 0], a[h - 1, w - 1]]
    return float((a < 8).mean()) > 0.10 and all(int(c) < 8 for c in corners)


def cut_with_rembg(im: Image.Image) -> Image.Image:
    import io

    from rembg import new_session, remove

    session = None
    for name in ("isnet-anime", "u2net"):
        try:
            session = new_session(name)
            break
        except Exception as exc:  # noqa: BLE001
            print(f"[figure] rembg model {name} unavailable: {exc}", file=sys.stderr)
    if session is None:
        raise SystemExit("[figure] no rembg model available")
    buf = io.BytesIO()
    im.convert("RGB").save(buf, "PNG")
    cut = remove(buf.getvalue(), session=session, post_process_mask=True)
    return Image.open(io.BytesIO(cut)).convert("RGBA")


def clean_alpha(a: np.ndarray, haze: int) -> tuple[np.ndarray, dict]:
    """Zero the haze, keep the body and what hangs off it, drop specks and soft pixels far from a body."""
    stats: dict = {"hazePixels": int(((a > 0) & (a < haze)).sum())}
    a = np.where(a < haze, 0, a).astype(np.uint8)
    core = a >= CORE
    lab, n = ndi.label(core)
    if n == 0:
        raise SystemExit("[figure] no figure left after cleaning: the image has no opaque body")
    sizes = np.asarray(ndi.sum(core, lab, range(1, n + 1)))
    big = int(np.argmax(sizes)) + 1
    main = lab == big
    # Parts kept besides the largest body: a part that is big (a weapon hanging apart, a floating cord) or that lies close to the body.
    reach = ndi.distance_transform_edt(~main)
    keep = main.copy()
    dropped = 0
    for i in range(1, n + 1):
        if i == big:
            continue
        comp = lab == i
        near = float(reach[comp].min())
        if sizes[i - 1] >= 0.02 * sizes[big - 1] or (near <= 10 and sizes[i - 1] >= 24):
            keep |= comp
        else:
            dropped += 1
    stats["specksDropped"] = dropped
    # Soft pixels belong only to the edge of what is kept.
    away = ndi.distance_transform_edt(~keep)
    soft_far = (a > 0) & (a < 250) & (away > EDGE_BAND)
    stats["softFarPixels"] = int(soft_far.sum())
    a = np.where(soft_far | ((~keep) & (away > EDGE_BAND)), 0, a).astype(np.uint8)
    # A dropped speck's own pixels are gone too (they lie beyond the band or were opaque specks).
    speck = (core & ~keep)
    a[speck] = 0
    return a, stats


def bleed_colour(rgb: np.ndarray, a: np.ndarray, band: int = 24) -> np.ndarray:
    """The colour of every pixel that is not fully opaque becomes the nearest opaque pixel's (an edge never carries a halo's colour); beyond `band` px it is black."""
    solid = a >= 250
    if not solid.any():
        return rgb
    dist, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
    out = rgb.copy()
    soft = ~solid
    near = soft & (dist <= band)
    out[near] = rgb[iy[near], ix[near]]
    out[soft & ~near] = 0
    return out


def frame(rgba: np.ndarray, margin: int) -> tuple[np.ndarray, dict]:
    a = rgba[..., 3]
    ys, xs = np.nonzero(a >= ALPHA_FLOOR)
    if len(xs) == 0:
        raise SystemExit("[figure] nothing to frame")
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
    h, w = a.shape
    cx0, cy0, cx1, cy1 = x0 - margin, y0 - margin, x1 + margin, y1 + margin
    out = np.zeros((cy1 - cy0, cx1 - cx0, 4), np.uint8)
    sx0, sy0, sx1, sy1 = max(0, cx0), max(0, cy0), min(w, cx1), min(h, cy1)
    out[sy0 - cy0 : sy1 - cy0, sx0 - cx0 : sx1 - cx0] = rgba[sy0:sy1, sx0:sx1]
    return out, {"cropBox": [cx0, cy0, cx1, cy1], "contentBox": [x0, y0, x1, y1]}


def engine_baseline(a: np.ndarray) -> float:
    """The row the engine plants on the ground (PaintedArt.measureAlpha): the last row with a real run of opaque pixels."""
    need = max(2.0, a.shape[1] * 0.006)
    rows = np.nonzero((a >= 90).sum(1) >= need)[0]
    return float(rows.max() + 1) if len(rows) else float(a.shape[0])


def stance_of(a: np.ndarray, bbox: tuple[int, int, int, int]) -> dict | None:
    """Where the figure stands: `ps_lib.stance_from_hem` (the registration's own rule), on the finished painting."""
    import ps_lib as L  # tools/posescale

    h, w = a.shape
    p = SimpleNamespace(alpha=a > 128, bbox=bbox, h=h, w=w)
    s = L.stance_from_hem(p)
    return None if s is None else {k: round(float(v), 1) for k, v in s.items() if k in ("x", "row", "x0", "x1")}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--matte", choices=["auto", "keep", "rembg"], default="auto")
    ap.add_argument("--margin", type=int, default=16)
    ap.add_argument("--haze", type=int, default=16)
    ap.add_argument("--feet-row", type=float, default=None, help="the row of the soles when a thick weapon hangs lower (the registration's feetRow)")
    args = ap.parse_args()

    src = Image.open(args.src)
    rgba = np.asarray(src.convert("RGBA")).copy()
    source = {"file": os.path.basename(args.src), "size": list(src.size), "mode": src.mode, "sha256": sha256_file(args.src)}
    real = has_real_alpha(rgba[..., 3])
    how = args.matte if args.matte != "auto" else ("keep" if real else "rembg")
    if how == "rembg":
        rgba = np.asarray(cut_with_rembg(src)).copy()
    elif how == "keep" and not real:
        print("[figure] --matte keep on an image with no real alpha: the whole canvas is kept", file=sys.stderr)
    a, stats = clean_alpha(rgba[..., 3], args.haze)
    rgba[..., 3] = a
    rgba[..., :3] = bleed_colour(rgba[..., :3], a)
    framed, boxes = frame(rgba, args.margin)
    fa = framed[..., 3]
    h, w = fa.shape
    cb = [boxes["contentBox"][0] - boxes["cropBox"][0], boxes["contentBox"][1] - boxes["cropBox"][1], boxes["contentBox"][2] - boxes["cropBox"][0], boxes["contentBox"][3] - boxes["cropBox"][1]]
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    Image.fromarray(framed, "RGBA").save(args.out, "PNG", optimize=True)

    bbox = (cb[0], cb[1], cb[2], cb[3])
    st = stance_of(fa, bbox)
    out = {
        "width": w,
        "height": h,
        "baselineY": cb[3],  # the house value: the content's bottom row in the cropped image (tools/gen/rembg.py)
        "engineBaseline": engine_baseline(fa),
        "contentBox": cb,
        "margins": {"left": cb[0], "top": cb[1], "right": w - cb[2], "bottom": h - cb[3]},
        "opaqueShare": round(float((fa >= 250).mean()), 4),
        "softShare": round(float(((fa > 0) & (fa < 250)).mean()), 5),
        "stance": st,
        "matte": {"how": how, "sourceHadRealAlpha": real, **stats},
        "source": source,
        "outSha256": sha256_file(args.out),
    }
    if args.feet_row is not None:
        out["feetRow"] = args.feet_row
    print(json.dumps(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
