"""Geometry helpers of the rig pipeline (tools/rig): masks, label maps, classical fills, meshes, skin weights, chains.

Everything here works on OUR OWN approved paintings only (no retail asset, no generative model), in the painting's pixel space (origin top-left, y down).
Run with ComfyUI's embedded Python:  D:/Tools/ComfyUI/python_embeded/python.exe -I <script>   (numpy, PIL, scipy, skimage, numba).
Ported from the 2026-10-15 prototype (quality-leap/proto-25d/tools/rigtools.py and rig_export.py) and made subject-independent.
"""
from __future__ import annotations

import json
import math
import pathlib

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

# --------------------------------------------------------------------------- basic image helpers


def load_rgba(path) -> np.ndarray:
    return np.array(Image.open(path).convert("RGBA"))


def save_rgba(arr: np.ndarray, path) -> None:
    pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(arr.astype(np.uint8), "RGBA").save(path)


def save_mask(m: np.ndarray, path) -> None:
    pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray((m.astype(np.uint8) * 255), "L").save(path)


def upsample_mask(m: np.ndarray, size_wh, smooth: float = 1.2) -> np.ndarray:
    """A binary mask resampled to size (w, h): bicubic on the 0..255 mask, a light blur, then a 0.5 threshold, so the edge stays smooth."""
    im = Image.fromarray((m.astype(np.uint8) * 255), "L").resize(size_wh, Image.BICUBIC)
    if smooth > 0:
        im = im.filter(ImageFilter.GaussianBlur(smooth))
    return np.array(im) > 127


def poly_mask(shape_hw, polys, scale: float = 1.0) -> np.ndarray:
    """Union of polygons given as [[x,y],...] lists in 1x coordinates, drawn at `scale`."""
    h, w = shape_hw
    im = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(im)
    for p in polys:
        d.polygon([(x * scale, y * scale) for x, y in p], fill=255)
    return np.array(im) > 127


def grow(m: np.ndarray, r: float) -> np.ndarray:
    """The mask dilated by a disc of radius r px (exact, via the distance transform: fast at any radius)."""
    if r <= 0:
        return m
    return ndi.distance_transform_edt(~m) <= r


def shrink(m: np.ndarray, r: float) -> np.ndarray:
    if r <= 0:
        return m
    return ndi.distance_transform_edt(m) > r


def clean_mask(m: np.ndarray, min_island: int = 60, close: int = 2, fill_holes: bool = True) -> np.ndarray:
    """Drop specks, close pin holes, fill enclosed holes (SAM leaves holes along fur and straps)."""
    m = m.copy()
    if close > 0:
        m = shrink(grow(m, close), close)
    if fill_holes:
        m = ndi.binary_fill_holes(m)
    lab, n = ndi.label(m)
    if n:
        sizes = ndi.sum(m, lab, range(1, n + 1))
        for i, s in enumerate(sizes, start=1):
            if s < min_island:
                m[lab == i] = False
    return m


def largest_components(m: np.ndarray, keep: int = 1, min_frac: float = 0.0) -> np.ndarray:
    lab, n = ndi.label(m)
    if n <= keep:
        return m
    sizes = np.array(ndi.sum(m, lab, range(1, n + 1)))
    order = np.argsort(sizes)[::-1]
    out = np.zeros_like(m)
    for j, idx in enumerate(order):
        if j < keep or sizes[idx] >= min_frac * sizes[order[0]]:
            out |= lab == (idx + 1)
    return out


def nearest_label(labels: np.ndarray, valid: np.ndarray, maxdist: float | None = None, sources=None) -> np.ndarray:
    """Fill `labels` (0 = none) at every `valid` pixel from the nearest labelled pixel (Euclidean), up to maxdist (px).
    `sources`: only pixels carrying one of these labels may spread (thin parts such as a tail must not swallow the strays around them)."""
    known = labels > 0 if sources is None else np.isin(labels, list(sources))
    if known.all():
        return labels
    dist, (iy, ix) = ndi.distance_transform_edt(~known, return_indices=True)
    out = labels.copy()
    take = valid & (labels == 0)
    if maxdist is not None:
        take &= dist <= maxdist
    out[take] = labels[iy[take], ix[take]]
    return out


def dilate_rgb(rgba: np.ndarray, iters: int = 6) -> np.ndarray:
    """Spread the colour of opaque pixels into the transparent ones (so bilinear/mip filtering at an edge never pulls in a grey or black fringe)."""
    out = rgba.copy()
    a = out[..., 3]
    known = a > 8
    if known.all() or not known.any():
        return out
    dist, (iy, ix) = ndi.distance_transform_edt(~known, return_indices=True)
    fill = (~known) & (dist <= iters + 0.5)
    for c in range(3):
        ch = out[..., c]
        ch[fill] = ch[iy[fill], ix[fill]]
    return out


def defringe_alpha(rgba: np.ndarray, lo: int = 40, hi: int = 215, sat_max: float = 0.28, grey_min: float = 0.30) -> np.ndarray:
    """Remove the pale grey matte ring of the paintings' outer edge: a semi-transparent, desaturated, light pixel gets its alpha pushed down.
    Interior pixels (alpha 255) are never touched."""
    out = rgba.copy()
    a = out[..., 3].astype(np.float32)
    rgb = out[..., :3].astype(np.float32) / 255.0
    mx = rgb.max(-1)
    mn = rgb.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    semi = (a > 0) & (a < hi)
    ring = semi & (sat < sat_max) & (mx > grey_min)
    # a smooth push toward transparent
    k = np.clip((a - lo) / max(1.0, hi - lo), 0, 1)
    a2 = np.where(ring, a * (k ** 1.6), a)
    out[..., 3] = np.clip(a2, 0, 255).astype(np.uint8)
    return out


# --------------------------------------------------------------------------- fills


def norm_conv(vals: np.ndarray, known: np.ndarray, sigma: float):
    """Gaussian-weighted sums of `vals` (HxWxC float) over the `known` pixels and of the known weight itself, at any sigma, quickly:
    large sigmas are computed on a block-averaged copy and sampled back."""
    f = max(1, int(sigma // 6))
    kf = known.astype(np.float32)
    if f == 1:
        num = np.stack([ndi.gaussian_filter(vals[..., c] * kf, sigma) for c in range(vals.shape[-1])], -1)
        return num, ndi.gaussian_filter(kf, sigma)
    h, w = known.shape
    hh, ww = (h + f - 1) // f * f, (w + f - 1) // f * f
    pad = ((0, hh - h), (0, ww - w))
    kp = np.pad(kf, pad)
    outn = []
    for c in range(vals.shape[-1]):
        vp = np.pad(vals[..., c] * kf, pad)
        vs = vp.reshape(hh // f, f, ww // f, f).mean((1, 3))
        outn.append(ndi.zoom(ndi.gaussian_filter(vs, sigma / f), f, order=1)[:h, :w])
    ks = kp.reshape(hh // f, f, ww // f, f).mean((1, 3))
    den = ndi.zoom(ndi.gaussian_filter(ks, sigma / f), f, order=1)[:h, :w]
    return np.stack(outn, -1), den


def extend_fill(rgb: np.ndarray, known: np.ndarray, zone: np.ndarray, sigmas=(5, 14, 36, 90)) -> np.ndarray:
    """Colours for `zone` pixels not in `known`, by normalised convolution of the known pixels' colours (small sigma first).
    Works on a crop around the zone and the known pixels near it."""
    out = rgb.astype(np.float32).copy()
    need = zone & ~known
    if not need.any():
        return out
    ys, xs = np.nonzero(need | zone)
    m = int(3 * max(sigmas)) + 8
    y0, y1 = max(0, ys.min() - m), min(known.shape[0], ys.max() + m)
    x0, x1 = max(0, xs.min() - m), min(known.shape[1], xs.max() + m)
    sl = (slice(y0, y1), slice(x0, x1))
    vals = rgb[sl].astype(np.float32)
    kn = known[sl]
    nd = need[sl]
    done = kn.copy()
    res = vals.copy()
    for s in sigmas:
        num, den = norm_conv(vals, kn, s)
        ok = nd & ~done & (den > 0.03)
        if not ok.any():
            continue
        res[ok] = num[ok] / den[ok][:, None]
        done |= ok
    left = nd & ~done
    if left.any() and kn.any():  # beyond every sigma's reach: the nearest known colour
        _, (iy, ix) = ndi.distance_transform_edt(~kn, return_indices=True)
        res[left] = vals[iy[left], ix[left]]
    out[sl] = res
    return out



def dump_json(obj, path) -> None:
    pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(path).write_text(json.dumps(obj, separators=(",", ":")))


from rig_mesh import build_mesh, centerline_chain, chain_weights, grid_mesh, mask_contours, outer_edge_mask, resample_polyline, seg_dist  # noqa: E402,F401
