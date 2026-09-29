"""Provisional stand-in plates for Chapter XVI, Ixion at Djose (FFX-2 only).

NOT approved art and NOT a proposal for how Djose looks. The scene options for the Djose Chamber and the
Farplane Abyss are a painting round still owed to Bailey (AGENTS.md rule 9). Until a judge-passed option
exists, the chapter shows the stand-ins the concept README names (docs/concepts/chapters/
ixion-djose-2026-09-27/README.md, "What the frames are"), made the same way `scripts/frames.py` made them:

- `backdrops/ffx2-djose-chamber-standin.png`: the Macalania Temple plate (the hall) over the Den of Woe
  plate's stone floor, recoloured to storm-grey stone with a cold violet cast, with a greybox hole where
  the fayth stood (concept A: "the hole in view the whole time"). The hall's floor line sits at 0.44 of the
  height, the Den / Farplane layout, so the scene can use Chapter V's framing, rigs and party slots, which
  are solved against the FFX-2 HUD.
- `backdrops/ffx2-abyss-standin.png`: the Chapter 5 Farplane plate washed toward a white fog.

No GPU, no download, our own paintings only (rule 8). Add-only: every destination must be absent. Run from
the repo root: `python docs/concepts/chapters/ixion-djose-2026-09-27/stand-ins/make_standins.py`.
The sidecar JSON next to each PNG says PROVISIONAL. When the scene options land, the judge-passed recommended
option is installed, add-only, under its own keys (`backdrops/ffx2-djose-chamber-provisional`,
`backdrops/ffx2-abyss-provisional`), and the chapter's two constants (`src/data/ixion-plates.ts`) are pointed
at them: one line each. These stand-ins stay on disk untouched.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from datetime import datetime, timezone

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = os.getcwd()
ART = os.path.join(ROOT, "public", "art", "backdrops")
W, H = 2688, 1536
HORIZON = int(H * 0.44)

CHAMBER = "ffx2-djose-chamber-standin"
ABYSS = "ffx2-abyss-standin"


def load(name: str) -> Image.Image:
    return Image.open(os.path.join(ART, f"{name}.png")).convert("RGB")


def chamber() -> Image.Image:
    hall_src = load("macalania-temple")
    floor_src = load("den-of-woe")
    # The hall: Macalania's arches and braziers down to its floor line (row ~1370 of 1536), lightly squashed
    # so the floor line lands on the Den / Farplane horizon.
    hall = hall_src.crop((0, 520, W, 1370)).resize((W, HORIZON + 40), Image.LANCZOS)
    # The floor: the Den plate's stone clearing, below its own horizon (~0.43).
    floor = floor_src.crop((0, int(H * 0.43), W, H)).resize((W, H - HORIZON + 40), Image.LANCZOS)
    im = Image.new("RGB", (W, H))
    im.paste(floor, (0, HORIZON - 40))
    # A soft seam: the hall fades out over its last 80 rows.
    mask = Image.new("L", (W, HORIZON + 40), 255)
    d = ImageDraw.Draw(mask)
    for i in range(80):
        y = HORIZON + 40 - 80 + i
        d.line((0, y, W, y), fill=int(255 * (1 - i / 80)))
    im.paste(hall, (0, 0), mask)
    # Storm-grey stone with a cold violet cast (the recolour frames.py used, cooler).
    g = ImageOps.autocontrast(im.convert("L"), cutoff=2)
    im = ImageOps.colorize(g, black=(10, 10, 18), mid=(74, 76, 96), white=(206, 210, 226))
    im = ImageEnhance.Contrast(im).enhance(1.05)
    # The hole where the fayth stood: a greybox ellipse on the floor, with a faint pale-violet rim glow.
    cx, cy, rx, ry = int(W * 0.42), int(H * 0.60), 250, 54
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((cx - rx - 30, cy - ry - 12, cx + rx + 30, cy + ry + 12), fill=(196, 188, 236, 90))
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    base = im.convert("RGBA")
    base.alpha_composite(glow)
    hd = ImageDraw.Draw(base)
    hd.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(5, 4, 10, 255), outline=(140, 132, 170, 255), width=3)
    for i in range(1, 4):
        k = 1 - i * 0.2
        hd.ellipse((cx - rx * k, cy - ry * k + ry * 0.22 * i, cx + rx * k, cy + ry * k + ry * 0.22 * i),
                   outline=(52, 44, 80, 255), width=2)
    return base.convert("RGB")


def abyss() -> Image.Image:
    im = load("farplane")
    im = ImageEnhance.Color(im).enhance(0.45)
    fog = Image.new("RGB", im.size, (236, 232, 244))
    return Image.blend(im, fog, 0.35)


def write(name: str, im: Image.Image, method: str, sources: list[str]) -> None:
    png = os.path.join(ART, f"{name}.png")
    side = os.path.join(ART, f"{name}.json")
    for p in (png, side):
        if os.path.exists(p):
            sys.exit(f"refusing to overwrite {p} (add-only)")
    im.save(png, optimize=True)
    sha = hashlib.sha256(open(png, "rb").read()).hexdigest()
    meta = {
        "tag": f"{name}.stand-in",
        "status": "PROVISIONAL",
        "notApproved": True,
        "chapter": "ffx2-ixion-djose (Chapter XVI, FFX-2 only)",
        "method": method,
        "sources": sources,
        "concept": "docs/concepts/chapters/ixion-djose-2026-09-27/README.md (stand-in plates, concept A)",
        "script": "docs/concepts/chapters/ixion-djose-2026-09-27/stand-ins/make_standins.py",
        "sha256": sha,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    with open(side, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(name, im.size, sha[:12])


def main() -> None:
    write(CHAMBER, chamber(),
          "no GPU: Macalania Temple hall over the Den of Woe floor, recoloured storm grey, greybox hole",
          ["backdrops/macalania-temple.png", "backdrops/den-of-woe.png"])
    write(ABYSS, abyss(), "no GPU: the Chapter 5 Farplane plate washed toward white fog (frames.py abyss())",
          ["backdrops/farplane.png"])


if __name__ == "__main__":
    main()
