"""Per-part surface-normal maps for a rig (format v2 `normal`, additive; HD-2D look; both games, shared plumbing; 2026-10-21).

The HD-2D look lights a painted figure with the painting's own normal map (`D:/pyrefly-art-maps`, `MAPS-README.txt`: tangent space of the billboard, OpenGL, R = +X image right, G = +Y image up, B = +Z toward
the viewer, flat (128, 128, 255) where the painting is transparent). A rig draws no painting, only parts cut FROM paintings, so each part needs the matching piece of the map:

  * a BASE part is cut from the idle painting's master (`rig_build.export_part`): its normal piece is the same window of `idle@Sx.normal.png`;
  * a VARIANT (`rig_vcut.variant_record`) is cut from a pose painting registered into the idle's frame: its normal piece is the same window of THAT pose's map, put through the same registration
    (the resize of a pose the model registered at another scale) and cropped by the same box.

Both are pieces of an image that is already in the painting's own orientation, so nothing is rotated at cut time. (The pieces are not turned or mirrored anywhere in the cut: a rig bends them with bones at run time,
and each look is drawn in the orientation of the key it was cut for.)

The piece is written as an OPAQUE 8-bit RGB PNG `<part>[.<variant>].normal.png`, at `scale` (default 0.3) times the master crop, or at the colour PNG's own scale when that is smaller (a variant at `tex` 0.4 has a normal piece at
0.4): a normal map is smooth (the look's shading is a third of the painting's at most), and at 0.3 a texel is 3.3 master px, about 1.7 screen px at 1440p; 0.5 (the painting maps' own base size) costs 5.4 Mpx for Bahamut, 0.3 about 2 Mpx. The shader reads the same uvs it reads the colour with, so the sizes need not match.
Nothing is premultiplied or dilated: the colour PNG's alpha decides where the part is, the normal under it is the painting's own.

Config (`build.normals`): `{ "dir": "D:/pyrefly-art-maps", "scale": 0.3 }`. Absent: no normal pieces are written and the rig is exactly what it was.
"""
from __future__ import annotations

import pathlib

import numpy as np
from PIL import Image

FLAT = (128, 128, 255)


def settings(sub) -> dict | None:
    """`build.normals` of the subject config, or None when the subject asks for no normal pieces."""
    n = (sub.cfg.get("build") or {}).get("normals")
    if not n:
        return None
    n = {"dir": n} if isinstance(n, str) else dict(n)
    n.setdefault("scale", 0.3)
    return n


def map_path(sub, cfg: dict, pose: str) -> pathlib.Path:
    s = sub.scale
    name = f"{pose}@{s}x.normal.png" if s > 1 else f"{pose}.normal.png"
    return pathlib.Path(cfg["dir"]) / "characters" / sub.id / name


def load_map(sub, cfg: dict, pose: str, size_wh: tuple[int, int]) -> np.ndarray:
    """The pose's normal map as H x W x 3 uint8 RGB. Refuses a map that is not its painting's size (`size_wh`, the painting @Sx as the cut reads it): a map of another size would light the wrong pixels."""
    p = map_path(sub, cfg, pose)
    if not p.exists():
        raise SystemExit(f"rig normals: {p} is missing (the maps folder has no normal map for {sub.id}/{pose}; build.normals.dir)")
    im = Image.open(p).convert("RGB")
    if im.size != tuple(size_wh):
        raise SystemExit(f"rig normals: {p} is {im.size[0]}x{im.size[1]}, the painting it lights is {size_wh[0]}x{size_wh[1]}")
    return np.asarray(im, np.uint8)


def register(nrm: np.ndarray, ax: float, ay: float) -> np.ndarray:
    """The map put through the same resize the painting got when the pose model registered it at another scale than the idle (`rig_vcut.variant_record`); bilinear, as the vectors are smooth. Identity at 1."""
    if abs(ax - 1) <= 1e-6 and abs(ay - 1) <= 1e-6:
        return nrm
    h0, w0 = nrm.shape[:2]
    size = (max(1, round(w0 * ax)), max(1, round(h0 * ay)))
    return np.asarray(Image.fromarray(nrm, "RGB").resize(size, Image.BILINEAR), np.uint8)


def window(nrm: np.ndarray, y0: int, y1: int, x0: int, x1: int) -> np.ndarray:
    """The crop's window of the map, flat where the window runs off the map (it never does for a crop of the painting itself)."""
    h, w = nrm.shape[:2]
    out = np.empty((y1 - y0, x1 - x0, 3), np.uint8)
    out[:] = FLAT
    yy0, yy1, xx0, xx1 = max(0, y0), min(h, y1), max(0, x0), min(w, x1)
    if yy1 > yy0 and xx1 > xx0:
        out[yy0 - y0 : yy1 - y0, xx0 - x0 : xx1 - x0] = nrm[yy0:yy1, xx0:xx1]
    return out


def piece_size(crop_wh: tuple[int, int], cfg: dict, colour_scale: float = 1.0) -> tuple[int, int]:
    """The normal piece's size for a master crop `crop_wh` whose colour PNG is at `colour_scale` of it: the config's scale, or the colour's when that is smaller."""
    f = min(float(cfg.get("scale", 0.3)), float(colour_scale))
    return max(1, round(crop_wh[0] * f)), max(1, round(crop_wh[1] * f))


def save_piece(path: pathlib.Path, crop: np.ndarray, size_wh: tuple[int, int]) -> tuple[int, int]:
    """Resize the crop to `size_wh` (area-weighted when smaller, so a thin ridge is averaged and not skipped) and write it as opaque RGB. Returns the size written."""
    im = Image.fromarray(crop, "RGB")
    if im.size != tuple(size_wh):
        im = im.resize(tuple(size_wh), Image.HAMMING if size_wh[0] < im.size[0] or size_wh[1] < im.size[1] else Image.BILINEAR)
    im.save(path, optimize=True)
    return im.size
