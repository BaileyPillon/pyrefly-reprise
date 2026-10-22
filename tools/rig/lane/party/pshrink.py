"""pshrink.py <config name> [rig folder] : store the BASE part images of an exported party rig at a fraction of the master (`party.parts.<part>.base_tex`, default `party.base_tex` 0.5): the PNG, the rim mask and the
box (which says the PNG's size; the texel budget counts it) shrink, the uvs are written explicitly (0..1 of the image from the master crop the mesh was built on), so the mesh and the look are unchanged.
Run after every `rig.py export` (the exporter copies the full-size files back). Variants are cut with their own `tex`. Idempotent: a part that already carries `uvs` is left alone."""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

import pcommon as P  # noqa: E402

name = sys.argv[1]
party = P.load(name)
rig_dir = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else party.rig_dir
rig = json.loads((rig_dir / "rig.json").read_text(encoding="utf8"))
default = float(party.party.get("base_tex", 0.5))
done = 0
for p in rig["parts"]:
    if "uvs" in p:
        continue
    f = float(party.parts.get(p["name"], {}).get("base_tex", default))
    if f >= 0.999:
        continue
    x, y, w, h = p["box"]
    tw, th = max(1, round(w * f)), max(1, round(h * f))
    img = np.asarray(Image.open(rig_dir / p["png"]).convert("RGBA")).astype(np.float32)
    pm = img.copy()
    pm[..., :3] *= pm[..., 3:4] / 255.0
    small = np.asarray(Image.fromarray(pm.astype(np.uint8), "RGBA").resize((tw, th), Image.HAMMING), np.float32)
    small[..., :3] = np.where(small[..., 3:4] > 0, small[..., :3] * 255.0 / np.maximum(small[..., 3:4], 1.0), 0)
    Image.fromarray(np.clip(small, 0, 255).astype(np.uint8), "RGBA").save(rig_dir / p["png"], optimize=True)
    if p.get("rim"):
        rim = Image.open(rig_dir / p["rim"])
        rim.resize((tw, th), Image.BOX).save(rig_dir / p["rim"], optimize=True)
    v = np.array(p["verts"], np.float64).reshape(-1, 2)
    p["uvs"] = [round(float(q), 5) for q in ((v - np.array([x, y])) / np.array([w, h])).reshape(-1)]
    p["box"] = [x, y, tw, th]
    done += 1
(rig_dir / "rig.json").write_text(json.dumps(rig, separators=(",", ":")), encoding="utf8")
print(f"pshrink: {done} base part(s) shrunk (base_tex {default})")
