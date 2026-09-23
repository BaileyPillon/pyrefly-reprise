"""Living-portrait v4 (FFX-2 only): the 20 shared landmarks on every v4 key.

    python -s tools/gen/rig-v4lm.py predict   # model guess -> art/v4/warp/predicted.json
    python -s tools/gen/rig-v4lm.py sheet [--src landmarks|predicted] [--keys yaw-40,...]
                                              # 2x crops of the face with the points and a
                                              # 10 px grid, for reading by eye (shots in
                                              # art/v4/warp/read/)
    python -s tools/gen/rig-v4lm.py silhouette  # hairSide_R/_L measured on row 180 of the
                                              # final head masks (after rig-sam.py)

The guess turns the frontal's own points (art/v3/warp/landmarks.json keys.frontal)
about the head axis x = 473 with the face depth rig-lora-init.py painted the keys
from (face ellipsoid + nose ridge), so it is where the init put each feature; the
sampler moved some by a few px, so every point is then read off the 2x sheet and
written into art/v4/warp/landmarks.json by hand (the file records which were moved).
Sign: negative yaw = the face turned toward screen-left.
"""
from __future__ import annotations

import importlib.util
import json
import math
import pathlib
import sys

import numpy as np
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
_s = importlib.util.spec_from_file_location("riglib", HERE / "rig-lib.py")
L = importlib.util.module_from_spec(_s); _s.loader.exec_module(L)
_i = importlib.util.spec_from_file_location("riginit", HERE / "rig-lora-init.py")
I = importlib.util.module_from_spec(_i); _i.loader.exec_module(I)

V4 = L.ART / "v4"
WARP = V4 / "warp"
KEYS = {-85: "yaw-85", -60: "yaw-60", -40: "yaw-40", -20: "yaw-20", 20: "yaw+20", 40: "yaw+40", 60: "yaw+60", 85: "yaw+85"}


def key_image(yaw: int) -> Path:
    if yaw == 0:
        return L.PLATE
    for fin in (pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v4/final") / f"{KEYS[yaw]}.png", V4 / "keys/final" / f"{KEYS[yaw]}.webp"):
        if fin.exists():
            return fin
    picks = L.read_json(V4 / "keys/picks-rig.json")
    return V4 / "keys/picked" / picks[str(yaw)]


Path = pathlib.Path


def frontal():
    spec = L.read_json(L.V3 / "warp/landmarks.json")
    return spec["order"], spec["keys"]["frontal"]


def predict():
    order, pts = frontal()
    out = {"_readme": "rig-v4lm.py predict: the frontal points turned with the init's face depth (not read yet)", "order": order, "keys": {}}
    for yaw in KEYS:
        t = math.radians(yaw)
        row = []
        for name, (x, y) in zip(order, pts):
            z = float(I.face_z(np.float64(x), np.float64(y)))
            if name.startswith(("cheek", "jaw", "eyeOuter")):
                z = max(z, 0.0)
            xp, zp = I.rot(float(x), z, t)
            # a point turned behind the face's silhouette sits on it
            row.append([round(xp, 1), float(y)])
        out["keys"][str(yaw)] = row
    out["keys"]["0"] = [list(map(float, p)) for p in pts]
    L.write_json(out, WARP / "predicted.json")
    print("wrote", WARP / "predicted.json")


def sheet(src: str, only: list[str] | None):
    spec = L.read_json(WARP / f"{src}.json")
    order = spec["order"]
    (WARP / "read").mkdir(parents=True, exist_ok=True)
    for yaw_s, pts in spec["keys"].items():
        yaw = int(yaw_s)
        if only and KEYS.get(yaw, "yaw0") not in only:
            continue
        src_im = Image.open(key_image(yaw)).convert("RGBA")
        im = Image.new("RGBA", src_im.size, (255, 255, 255, 255))
        im.alpha_composite(src_im)
        im = im.convert("RGB")
        x0, y0, x1, y1 = 100, 300, 800, 800
        c = im.crop((x0, y0, x1, y1)).resize(((x1 - x0) * 2, (y1 - y0) * 2), Image.LANCZOS)
        d = ImageDraw.Draw(c)
        for gx in range(x0, x1, 10):
            d.line([((gx - x0) * 2, 0), ((gx - x0) * 2, c.height)], fill=(0, 0, 0) if gx % 50 else (255, 0, 0), width=1 if gx % 50 else 1)
        for gy in range(y0, y1, 10):
            d.line([(0, (gy - y0) * 2), (c.width, (gy - y0) * 2)], fill=(0, 0, 0) if gy % 50 else (255, 0, 0), width=1)
        for gx in range(x0, x1, 50):
            d.text(((gx - x0) * 2 + 2, 2), str(gx), fill=(255, 255, 0))
        for gy in range(y0, y1, 50):
            d.text((2, (gy - y0) * 2 + 2), str(gy), fill=(255, 255, 0))
        for i, (name, (x, y)) in enumerate(zip(order, pts)):
            if not (x0 <= x < x1 and y0 <= y < y1):
                continue
            X, Y = (x - x0) * 2, (y - y0) * 2
            d.ellipse([X - 5, Y - 5, X + 5, Y + 5], outline=(0, 255, 0), width=2)
            d.text((X + 7, Y - 7), f"{i}", fill=(0, 255, 0))
        c = c.convert("RGB")
        name = KEYS.get(yaw, "yaw0")
        c.save(WARP / "read" / f"{name}.{src}.jpg", quality=88)
        print("sheet", name)


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        raise SystemExit(__doc__)
    if a[0] == "predict":
        predict()
    elif a[0] == "sheet":
        src = a[a.index("--src") + 1] if "--src" in a else "predicted"
        only = a[a.index("--keys") + 1].split(",") if "--keys" in a else None
        sheet(src, only)
    else:
        raise SystemExit(__doc__)
