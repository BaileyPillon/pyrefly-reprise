"""The hi-res masters of ONE figure for the experimental Leblanc chapter: `<name>@4x.png` (local RealESRGAN) and `<name>@2x.png` (its reduction).

Run by `tools/exp-install.mjs install` with ComfyUI's embedded python (torch, spandrel, numpy, PIL; the weights are the ones already on this disk):

    D:/Tools/ComfyUI/python_embeded/python.exe -s tools/exp-art/tiers.py --src idle.png --out-dir DIR --name idle [--model anime6b|x4plus] [--tile 384]

The library recipe of release 39 (`tools/hires-install.mjs`) is RealESRGAN, an SDXL refine on top, and a fidelity gate per painting. This is the
cheap half of it, and enough for a painting that is already high resolution (the Art Room's figures are about 1500 px tall): the figure's colour
is enlarged 4x by RealESRGAN (RealESRGAN_x4plus_anime_6B by default, the one trained on line art), its alpha is enlarged apart by Lanczos (so the
edge stays a clean one- or two-pixel line and no glow is invented), and the 2x master is the 4x reduced again by Lanczos on colour and alpha apart
(a straight resize of RGBA premultiplies and turns the colour under alpha 0 into one flat grey; the 1x file keeps a ring of the figure's own colour
under its transparent edge, and so must these). `tools/hires-install.mjs` derives the 3x from the 4x the same way and installs all three.

Prints one line of JSON: the sizes and sha256 of what it wrote. Never writes anywhere but --out-dir.
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

WEIGHTS = {
    "anime6b": pathlib.Path("D:/Tools/ComfyUI/ComfyUI/models/upscale_models/RealESRGAN_x4plus_anime_6B.pth"),
    "x4plus": pathlib.Path("D:/Tools/ComfyUI/ComfyUI/models/upscale_models/RealESRGAN_x4plus.pth"),
}


def sha256_file(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_model(name: str, device: str):
    import torch  # noqa: F401
    from spandrel import ImageModelDescriptor, ModelLoader

    path = WEIGHTS[name]
    if not path.exists():
        raise SystemExit(f"[tiers] the weights are not there: {path}")
    model = ModelLoader().load_from_file(str(path))
    if not isinstance(model, ImageModelDescriptor):
        raise SystemExit(f"[tiers] {path.name} is not an image model")
    if model.scale != 4:
        raise SystemExit(f"[tiers] {path.name} is a {model.scale}x model, a 4x one is needed")
    model.to(device).eval()
    if device == "cuda":
        model.half()
    return model


def upscale_rgb(model, rgb: np.ndarray, tile: int, overlap: int, device: str) -> np.ndarray:
    """4x with overlapping tiles blended by a linear ramp (no seams); `rgb` is uint8 HxWx3."""
    import torch

    h, w, _ = rgb.shape
    s = 4
    out = np.zeros((h * s, w * s, 3), np.float32)
    weight = np.zeros((h * s, w * s, 1), np.float32)
    step = tile - 2 * overlap
    dtype = torch.float16 if device == "cuda" else torch.float32
    ys = list(range(0, max(1, h - tile) + step, step)) if h > tile else [0]
    xs = list(range(0, max(1, w - tile) + step, step)) if w > tile else [0]
    for y in ys:
        for x in xs:
            y0, x0 = min(y, max(0, h - tile)), min(x, max(0, w - tile))
            y1, x1 = min(h, y0 + tile), min(w, x0 + tile)
            patch = rgb[y0:y1, x0:x1].astype(np.float32) / 255.0
            t = torch.from_numpy(patch).permute(2, 0, 1).unsqueeze(0).to(device=device, dtype=dtype)
            with torch.no_grad():
                res = model(t).float().clamp(0, 1).squeeze(0).permute(1, 2, 0).cpu().numpy()
            ph, pw = res.shape[:2]
            ramp_y = np.minimum(np.arange(ph) + 1, np.arange(ph)[::-1] + 1).astype(np.float32)
            ramp_x = np.minimum(np.arange(pw) + 1, np.arange(pw)[::-1] + 1).astype(np.float32)
            ramp = np.minimum(np.minimum.outer(ramp_y, ramp_x), overlap * s) / (overlap * s)
            ramp = np.clip(ramp, 1e-3, 1.0)[..., None]
            oy, ox = y0 * s, x0 * s
            out[oy : oy + ph, ox : ox + pw] += res * ramp
            weight[oy : oy + ph, ox : ox + pw] += ramp
            del t
    out /= np.maximum(weight, 1e-6)
    return np.clip(out * 255.0 + 0.5, 0, 255).astype(np.uint8)


def lanczos(arr: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    mode = "L" if arr.ndim == 2 else "RGB"
    return np.asarray(Image.fromarray(arr, mode).resize(size, Image.LANCZOS))


def join(rgb: np.ndarray, alpha: np.ndarray) -> Image.Image:
    return Image.fromarray(np.dstack([rgb, alpha]), "RGBA")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--model", choices=list(WEIGHTS), default="anime6b")
    ap.add_argument("--tile", type=int, default=384)
    ap.add_argument("--overlap", type=int, default=24)
    ap.add_argument("--cpu", action="store_true")
    args = ap.parse_args()

    import torch

    device = "cpu" if args.cpu or not torch.cuda.is_available() else "cuda"
    src = np.asarray(Image.open(args.src).convert("RGBA"))
    h, w = src.shape[:2]
    model = load_model(args.model, device)
    rgb4 = upscale_rgb(model, src[..., :3], args.tile, args.overlap, device)
    alpha4 = lanczos(src[..., 3], (w * 4, h * 4))
    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    p4 = out_dir / f"{args.name}@4x.png"
    join(rgb4, alpha4).save(p4, "PNG", compress_level=6)
    rgb2 = lanczos(rgb4, (w * 2, h * 2))
    alpha2 = lanczos(alpha4, (w * 2, h * 2))
    p2 = out_dir / f"{args.name}@2x.png"
    join(rgb2, alpha2).save(p2, "PNG", compress_level=6)
    print(
        json.dumps(
            {
                "model": WEIGHTS[args.model].name,
                "device": device,
                "oneX": [w, h],
                "files": {p.name: {"size": list(Image.open(p).size), "bytes": p.stat().st_size, "sha256": sha256_file(p)} for p in (p2, p4)},
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
