# Rebuild the idle's ORIGINAL 832x1216 render frame from the shipped cutout,
# for use as an --img2img init image (method B of the Leblanc identity pilot).
#
# Why this exists: `--img2img` scales the init image to fill the target bucket.
# The shipped idle.png is a tight 591x1118 cutout, so feeding it directly blows
# the figure up to fill 832x1216 edge to edge -- every method-B render then
# trips the cut-out coverage guard (docs/ART-PIPELINE.md §6) on framing alone,
# before anything about identity can be judged. Pasting the cutout back at its
# recorded `cropBox` on a white canvas restores the framing the idle was
# actually rendered in.
#
#   D:\Tools\ComfyUI\python_embeded\python.exe -s \
#     docs/concepts/chapters/leblanc/pilot/make-init.py
import json
import pathlib
from PIL import Image

root = pathlib.Path(__file__).resolve().parents[5]
src = root / "public/art/characters/leblanc/idle.png"
side = json.loads((src.with_suffix(".json")).read_text(encoding="utf-8"))
out = root / "docs/concepts/chapters/leblanc/pilot/idle-init.png"

w = side["source"]["width"]
h = side["source"]["height"]
x0, y0, _x1, _y1 = side["cropBox"]

canvas = Image.new("RGB", (w, h), (255, 255, 255))
sprite = Image.open(src).convert("RGBA")
canvas.paste(sprite, (x0, y0), sprite)
canvas.save(out)
print(f"{out} {canvas.size} paste=({x0},{y0}) sprite={sprite.size}")
