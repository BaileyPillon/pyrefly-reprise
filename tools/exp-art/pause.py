"""Size ONE approved Art Room pause close-up for the experimental Leblanc chapter: the 1x plate and its 2x master (branch exp-leblanc; FFX-2 only).

Run by `tools/exp-install.mjs pause` with ComfyUI's embedded python (torch, spandrel, numpy, PIL; the weights are the ones already on this disk):

    D:/Tools/ComfyUI/python_embeded/python.exe -s tools/exp-art/pause.py --src PLATE.png --out-dir DIR --name exp-leblanc-yuna-ffx2 [--model anime6b|x4plus]

The house pause plate is `pause/<id>.png`, an opaque RGB 1344x768 full-bleed painting (1.75:1), with `pause/<id>.2x.webp`, a 2688x1536 master the pause screen offers
through `srcset` on a big window (`ArtManifest` lists it only when the file is there; the old plates say "PNG is this master downscaled to 1344x768; both are one image").
The Art Room paints a plate at about 1660x948, so the install is that route: crop to 1.75:1 (a few columns, centred), enlarge 4x with RealESRGAN (the same local model
and tiling the figures' tiers and the backdrop plate use, `tiers.py`), reduce by Lanczos to the master (2688x1536, written as a q88 WebP) and again to the 1x plate (1344x768).

Prints one line of JSON: what was cropped, the sizes and the sha256 of what it wrote. Never writes anywhere but --out-dir.
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

W1, H1 = 1344, 768  # the 1x plate; the master is twice that


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--model", choices=list(T.WEIGHTS), default="anime6b")
    ap.add_argument("--tile", type=int, default=384)
    ap.add_argument("--overlap", type=int, default=24)
    ap.add_argument("--webp-quality", type=int, default=88)
    ap.add_argument("--cpu", action="store_true")
    args = ap.parse_args()

    import torch

    device = "cpu" if args.cpu or not torch.cuda.is_available() else "cuda"
    src = Image.open(args.src).convert("RGB")
    w, h = src.size
    aspect = W1 / H1
    # Crop to 1.75:1, centred: columns when the picture is wider than that, rows when it is taller.
    if w / h > aspect:
        cw, ch = int(round(h * aspect)), h
    else:
        cw, ch = w, int(round(w / aspect))
    x0, y0 = (w - cw) // 2, (h - ch) // 2
    crop = src.crop((x0, y0, x0 + cw, y0 + ch))
    rgb = np.asarray(crop)
    model = T.load_model(args.model, device)
    rgb4 = T.upscale_rgb(model, rgb, args.tile, args.overlap, device)

    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    master = T.lanczos(rgb4, (W1 * 2, H1 * 2))
    files = {}
    path2 = out_dir / f"{args.name}.2x.webp"
    Image.fromarray(master, "RGB").save(path2, "WEBP", quality=args.webp_quality, method=6)
    files[path2.name] = {"size": [W1 * 2, H1 * 2], "bytes": path2.stat().st_size, "sha256": T.sha256_file(path2)}
    path1 = out_dir / f"{args.name}.png"
    Image.fromarray(T.lanczos(master, (W1, H1)), "RGB").save(path1, "PNG", compress_level=6)  # the 1x is the master reduced: both are one image
    files[path1.name] = {"size": [W1, H1], "bytes": path1.stat().st_size, "sha256": T.sha256_file(path1)}
    print(
        json.dumps(
            {
                "model": T.WEIGHTS[args.model].name,
                "device": device,
                "source": [w, h],
                "crop": {"box": [x0, y0, x0 + cw, y0 + ch], "columnsTrimmed": w - cw, "rowsTrimmed": h - ch},
                "webpQuality": args.webp_quality,
                "files": files,
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
