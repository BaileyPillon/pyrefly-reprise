"""Matte, clean, frame and measure ONE approved Art Room figure for the experimental Leblanc chapter (branch exp-leblanc; FFX-2 only).

Run by `tools/exp-install.mjs install` with ComfyUI's embedded python (numpy, scipy, PIL, rembg; nothing is downloaded):

    D:/Tools/ComfyUI/python_embeded/python.exe -s tools/exp-art/figure.py --src IN.png --out OUT.png [--matte auto|keep|key|rembg]
        [--margin 16] [--haze 16] [--facing right|left|front] [--feet-row N]

It writes OUT.png (8-bit RGBA, straight alpha) and prints ONE line of JSON on stdout: the measurements the sidecar and the registration need.

What the house figure is (measured off the shipped paintings, `docs/handoff/exp-leblanc.md` section 2):

- a TIGHT crop of the figure with a 16 px margin on every side (the engine's sizing counts the canvas above the head as height);
- the alpha is what the engine reads: the figure opaque (>= 250), a one- or two-pixel antialiased edge, nothing else. No haze, no glow,
  no cast shadow, no ground, no specks. The colour under the edge is the figure's own (never a halo's), and a ring of the figure's colour
  is bled under the transparent pixels beside it so bilinear and mip filtering never blend in black or grey;
- `baselineY` is the bottom row of the content (the soles), counted in the cropped image.

The Art Room's images carry real alpha (0..254, some of them a faint glow at alpha 1 to 7 around the figure: the `haze` below). An
opaque image (no transparency) is cut one of two ways, then cleaned the same way:

- `key`: the image is a figure on ONE flat colour (the Art Room's idle sheets of Leblanc, Logos and Ormi: mid-grey and warm ochre, measured:
  the border ring is within 5 to 11 of its median in RGB distance). The background is found by a flood from the border (plus any enclosed
  gap that is exactly the background colour: the sliver between a ribbon and a neck), the matte is choked by one pixel and feathered, so
  the edge carries no ring of the background's colour (rembg's mask is hard, keeps the blended edge pixels and left a gold strip behind
  Logos's ribbon, see `docs/handoff/exp-leblanc.md` section 6);
- `rembg`: isnet-anime, the house cutter (`tools/gen/rembg.py`), for an image whose background is not flat.
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
FLAT_P99 = 14.0  # a border ring this flat (99th percentile of the RGB distance to its median) is a flat background: `key` is the cutter
POCKET_MIN = 10  # px: an enclosed pocket of the background colour smaller than this is a pinhole in the figure, not a gap
POCKET_THICK = 2.4  # px: the inscribed radius that makes a region near the background colour a blob (a gap), not a curve of anti-aliasing
POCKET_TINT = 24.0  # the median distance a blob may sit from the background colour (the sheet's glow tints the air in the gaps)
KEY_CHOKE = 1  # px the keyed matte is pulled in (the blended edge pixels of the source sit outside the true outline)
KEY_FEATHER = 0.75  # sigma of the soft edge (px)


def sha256_file(path: str) -> str:
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()


def has_real_alpha(a: np.ndarray) -> bool:
    """A cut-out: a real share of the pixels is transparent and the four corners are too."""
    h, w = a.shape
    corners = [a[0, 0], a[0, w - 1], a[h - 1, 0], a[h - 1, w - 1]]
    return float((a < 8).mean()) > 0.10 and all(int(c) < 8 for c in corners)


def border_ring(rgb: np.ndarray, width: int = 8) -> np.ndarray:
    return np.concatenate([rgb[:width].reshape(-1, 3), rgb[-width:].reshape(-1, 3), rgb[:, :width].reshape(-1, 3), rgb[:, -width:].reshape(-1, 3)]).astype(np.float32)


def flat_background(rgb: np.ndarray) -> tuple[np.ndarray, float] | None:
    """The colour of a flat background (median of the border ring) and how noisy it is (99.5th percentile of the distance), or None when the ring is not flat."""
    ring = border_ring(rgb)
    med = np.median(ring, axis=0)
    d = np.linalg.norm(ring - med, axis=1)
    n = float(np.percentile(d, 99.5))
    return (med, n) if float(np.percentile(d, 99)) <= FLAT_P99 else None


def key_matte(rgb: np.ndarray, med: np.ndarray, noise: float, tinted: bool = False) -> tuple[np.ndarray, dict]:
    """Alpha of a figure on one flat colour: flood the background from the border, choke by KEY_CHOKE px, feather. Returns (alpha uint8, stats).

    `tinted` also takes a BLOB of nearly the background colour that is enclosed (the sheet's glow tints the air between a figure's legs a little) as a gap; it is
    off by default because a shaded part of a figure on a grey sheet (Dr. Goon's olive suit in the shade) is a blob of nearly the background colour too.
    """
    d = np.linalg.norm(rgb.astype(np.float32) - med, axis=2)
    t_fg = max(26.0, 3.0 * noise)  # a pixel this far from the background colour is the figure
    t_pocket = max(14.0, noise + 8.0)  # an enclosed pocket must be this close to it at its MEDIAN pixel to count as background
    cand = d <= t_fg
    lab, n = ndi.label(cand)  # 4-connected
    if n == 0:
        raise SystemExit("[figure] key matte: no background found")
    border = np.zeros_like(cand)
    border[0, :] = border[-1, :] = border[:, 0] = border[:, -1] = True
    touching = np.unique(lab[border & cand])
    bg = np.isin(lab, touching[touching > 0])
    # Enclosed pockets that are the background colour (a sliver between a ribbon and a neck, the loops of a lock of hair, the gap between a hand
    # and a fan): background too. A pocket's own blended rim sits outside `cand` and the plate's glow tints it, so it is judged by its MEDIAN pixel.
    # A pocket is any enclosed region that is the background colour to within t_pocket at its median pixel; with `tinted`, also a BLOB (an inscribed circle
    # of POCKET_THICK px or more, medianed within POCKET_TINT of it: the sheet's glow tints the air between the legs). A one-pixel curve of anti-aliasing where an
    # ink line meets a light fill passes through grey too, but it is thin: it stays figure.
    sizes = np.asarray(ndi.sum(cand, lab, range(1, n + 1)))
    med_d = np.asarray(ndi.median(d, lab, range(1, n + 1)))
    thick = np.asarray(ndi.maximum(ndi.distance_transform_edt(cand), lab, range(1, n + 1)))
    enclosed = 0
    for i in range(1, n + 1):
        if i in touching:
            continue
        if sizes[i - 1] >= POCKET_MIN and (med_d[i - 1] <= t_pocket or (tinted and thick[i - 1] >= POCKET_THICK and med_d[i - 1] <= POCKET_TINT)):
            bg |= lab == i
            enclosed += 1
    fg = ~bg
    # specks of noise inside the background and pinholes inside the figure
    lab2, n2 = ndi.label(fg, structure=np.ones((3, 3)))
    sizes2 = np.asarray(ndi.sum(fg, lab2, range(1, n2 + 1)))
    big = int(np.argmax(sizes2)) + 1
    fg = np.isin(lab2, [i for i in range(1, n2 + 1) if sizes2[i - 1] >= 24 or i == big])
    holes = ndi.binary_fill_holes(fg) & ~fg
    hl, hn = ndi.label(holes)
    small = [i for i in range(1, hn + 1) if (hl == i).sum() < POCKET_MIN]
    if small:
        fg |= np.isin(hl, small)
    fg1 = ndi.binary_erosion(fg, structure=ndi.generate_binary_structure(2, 1), iterations=KEY_CHOKE) if KEY_CHOKE else fg
    alpha = ndi.gaussian_filter(fg1.astype(np.float32), KEY_FEATHER)
    alpha = np.where(fg1, np.maximum(alpha, 0.0), alpha)
    a = np.clip(np.round(alpha * 255.0), 0, 255).astype(np.uint8)
    return a, {"background": [int(round(float(x))) for x in med], "noise": round(noise, 1), "tFg": round(t_fg, 1), "enclosedGaps": enclosed, "chokePx": KEY_CHOKE, "featherSigma": KEY_FEATHER, "pockets": "tinted" if tinted else "flat"}



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
    ap.add_argument("--matte", choices=["auto", "keep", "key", "rembg"], default="auto")
    ap.add_argument("--pockets", choices=["flat", "tinted"], default="flat", help="key matte only: `tinted` also clears glow-tinted enclosed gaps (Leblanc's legs); the default clears only gaps of the background colour")
    ap.add_argument("--margin", type=int, default=16)
    ap.add_argument("--haze", type=int, default=16)
    ap.add_argument("--feet-row", type=float, default=None, help="the row of the soles when a thick weapon hangs lower (the registration's feetRow)")
    args = ap.parse_args()

    src = Image.open(args.src)
    rgba = np.asarray(src.convert("RGBA")).copy()
    source = {"file": os.path.basename(args.src), "size": list(src.size), "mode": src.mode, "sha256": sha256_file(args.src)}
    real = has_real_alpha(rgba[..., 3])
    flat = None if real else flat_background(rgba[..., :3])
    how = args.matte if args.matte != "auto" else ("keep" if real else ("key" if flat else "rembg"))
    key_stats: dict = {}
    if how == "key":
        flat = flat or flat_background(rgba[..., :3])
        if flat is None:
            raise SystemExit("[figure] --matte key: the border of the image is not one flat colour; use --matte rembg")
        rgba[..., 3], key_stats = key_matte(rgba[..., :3], flat[0], flat[1], tinted=args.pockets == "tinted")
    elif how == "rembg":
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
        "matte": {"how": how, "sourceHadRealAlpha": real, **key_stats, **stats},
        "source": source,
        "outSha256": sha256_file(args.out),
    }
    if args.feet_row is not None:
        out["feetRow"] = args.feet_row
    print(json.dumps(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
