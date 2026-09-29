"""Provisional stand-in pause hero plate for Chapter XVI, Ixion at Djose (FFX-2 only).

NOT approved art. Every listed chapter's pause card needs an installed hero plate (`pause/<stem>.png`, 1344x768,
plus the 2688x1536 `.2x.webp` master and a sidecar with the focal point). No plate has been painted for this
chapter: that is a painting round for Bailey (AGENTS.md rule 9). Until then this composite stands in: Ixion's
look B idle (Bailey's pick, D-268, locked) large on the right, head and horn toward the left, over the Chamber
stand-in plate blurred and darkened. No GPU, no download, our own paintings only (rule 8). Add-only.

Run from the repo root (after make_standins.py):
    python docs/concepts/chapters/ixion-djose-2026-09-27/stand-ins/make_hero_standin.py
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from datetime import datetime, timezone

from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.getcwd()
ART = os.path.join(ROOT, "public", "art")
STEM = "ch16-ffx2-ixion-djose-standin"
W2, H2 = 2688, 1536
# Ixion's face in his idle (fractions of the painting), read off a 10 percent grid: 0.24-0.30 x 0.33-0.45.
FACE = (0.27, 0.39)
# Where the face lands on the plate (fractions) and how tall he stands (fraction of the plate height).
AT = (0.60, 0.40)
TALL = 1.55


def master() -> Image.Image:
    bg = Image.open(os.path.join(ART, "backdrops", "ffx2-djose-chamber-standin.png")).convert("RGB")
    bg = bg.resize((W2, H2), Image.LANCZOS).filter(ImageFilter.GaussianBlur(10))
    bg = ImageEnhance.Brightness(bg).enhance(0.62).convert("RGBA")
    ix = Image.open(os.path.join(ART, "characters", "x2-ixion", "idle.png")).convert("RGBA")
    s = (H2 * TALL) / ix.height
    ix = ix.resize((round(ix.width * s), round(ix.height * s)), Image.LANCZOS)
    x = round(W2 * AT[0] - ix.width * FACE[0])
    y = round(H2 * AT[1] - ix.height * FACE[1])
    bg.alpha_composite(ix, (x, y)) if x >= 0 and y >= 0 else paste_clipped(bg, ix, x, y)
    return bg.convert("RGB")


def paste_clipped(bg: Image.Image, fg: Image.Image, x: int, y: int) -> None:
    left, top = max(0, -x), max(0, -y)
    crop = fg.crop((left, top, min(fg.width, W2 - x), min(fg.height, H2 - y)))
    bg.alpha_composite(crop, (max(0, x), max(0, y)))


def main() -> None:
    d = os.path.join(ART, "pause")
    png, webp, side = (os.path.join(d, f"{STEM}{e}") for e in (".png", ".2x.webp", ".json"))
    for p in (png, webp, side):
        if os.path.exists(p):
            sys.exit(f"refusing to overwrite {p} (add-only)")
    m = master()
    m.save(webp, "WEBP", quality=90, method=6)
    m.resize((1344, 768), Image.LANCZOS).save(png, optimize=True)
    meta = {
        "subject": "Ixion (FFX-2, look B)",
        "status": "PROVISIONAL",
        "notApproved": True,
        "chapter": "ffx2-ixion-djose (Chapter XVI, FFX-2 only)",
        "composition": "hero",
        "composite": "make_hero_standin.py: characters/x2-ixion/idle.png (D-268, locked) over "
        "backdrops/ffx2-djose-chamber-standin.png blurred and darkened; no GPU",
        "script": "docs/concepts/chapters/ixion-djose-2026-09-27/stand-ins/make_hero_standin.py",
        "focal": {"x": AT[0], "y": AT[1]},
        "sha256": hashlib.sha256(open(png, "rb").read()).hexdigest(),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    with open(side, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(STEM, meta["sha256"][:12])


if __name__ == "__main__":
    main()
