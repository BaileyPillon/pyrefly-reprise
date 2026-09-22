# Anima attempt 3 init frames (FFX only; anima-method-check.md): the approved
# idle cutout on its own 832x1216 white frame, rotated as a whole.
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/macalania/production/puppet.py
import json, pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
src = ROOT / "public/art/characters/anima/idle.png"
side = json.loads(src.with_suffix(".json").read_text(encoding="utf-8"))
im = Image.open(src).convert("RGBA")
W, H = side["source"]["width"], side["source"]["height"]
x0, y0 = side["cropBox"][:2]
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
layer.paste(im, (x0, y0), im)
pivot = (x0 + im.width // 2, y0 + side["baselineY"])
# She faces left (toward the party). hurt: recoil away (top to the right, clockwise).
# ko: droop toward the party and sink.
# Scaled to 0.88 about the pivot first, so the rotated horns and skirt stay
# inside the frame (the first pass clipped a horn tip and the skirt).
S = 0.88
small = layer.resize((int(W * S), int(H * S)), Image.LANCZOS)
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ox, oy = int(pivot[0] * (1 - S)), int(pivot[1] * (1 - S)) - 20
layer.paste(small, (ox, oy), small)
for name, angle, dx, dy in (("hurt", -10, -80, 0), ("ko", 14, 0, 0)):
    rot = layer.rotate(angle, resample=Image.BICUBIC, center=pivot, translate=(dx, dy))
    out = Image.new("RGB", (W, H), (255, 255, 255))
    out.paste(rot, (0, 0), rot)
    (HERE / "refs").mkdir(exist_ok=True)
    out.save(HERE / "refs" / f"anima-{name}-init.png")
    print(name, angle, dx, dy)
