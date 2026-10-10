"""The experimental Leblanc chapter's backdrop plate: the 1x file and its @2x master, from the approved plate (branch `exp-leblanc`; FFX-2 only).

Run by `tools/exp-install.mjs backdrop` with ComfyUI's embedded python (torch, spandrel, numpy, PIL; the weights are the ones already on this disk):

    D:/Tools/ComfyUI/python_embeded/python.exe -s tools/exp-art/plate.py --src PLATE.png --out-dir DIR --name exp-leblanc-last-room [--width 2688] [--model anime6b|x4plus]

The approved plate is a 1672x941 picture (the Art Room's size). The game draws a plate 2688 px wide at 1x and 5376 px wide at @2x (`backdropTiers`:
`ArtTier.ts` draws a master only when it is EXACTLY twice the 1x file), so the picture is enlarged 4x by RealESRGAN (the same local model and tiling the
figures' tiers use, `tiers.py`), and both files are the 4x reduced by Lanczos: 1x = (--width, round(width * h / w)), @2x = twice that. The aspect is the
plate's own (no crop, no stretch); the scene sizes the plane from the image (`Backdrop.ts`: height = width * srcH / srcW), so a plate a few pixels shorter than
Chapter VI's 2688x1536 only moves its rows by a fraction of a world unit.

Prints one line of JSON: the sizes and sha256 of what it wrote. Never writes anywhere but --out-dir.
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import tiers as T  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--width", type=int, default=2688)
    ap.add_argument("--model", choices=list(T.WEIGHTS), default="anime6b")
    ap.add_argument("--tile", type=int, default=384)
    ap.add_argument("--overlap", type=int, default=24)
    ap.add_argument("--cpu", action="store_true")
    args = ap.parse_args()

    import torch

    device = "cpu" if args.cpu or not torch.cuda.is_available() else "cuda"
    src = Image.open(args.src).convert("RGB")
    w, h = src.size
    rgb = np.asarray(src)
    model = T.load_model(args.model, device)
    rgb4 = T.upscale_rgb(model, rgb, args.tile, args.overlap, device)
    w1 = args.width
    h1 = int(round(w1 * h / w))
    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    files = {}
    for name, size in ((f"{args.name}.png", (w1, h1)), (f"{args.name}@2x.png", (w1 * 2, h1 * 2))):
        path = out_dir / name
        Image.fromarray(T.lanczos(rgb4, size), "RGB").save(path, "PNG", compress_level=6)
        files[name] = {"size": list(size), "bytes": path.stat().st_size, "sha256": T.sha256_file(path)}
    print(json.dumps({"model": T.WEIGHTS[args.model].name, "device": device, "source": [w, h], "oneX": [w1, h1], "files": files}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
