# Pilot 2 reference images (FFX-2 only, Leblanc chapter art).
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/leblanc/pilot2/make-refs.py
# refs/idle-square.png : idle padded to a square on white (the adapter's CLIP-Vision
#                        centre-crops to a square; an unpadded tall idle loses the face)
# refs/idle-head.png   : square crop of idle's head, choker and fan, 1024x1024
# refs/idle-init.png   : idle pasted back at its cropBox on a white 832x1216 canvas
import json, pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
src = ROOT / "public/art/characters/leblanc/idle.png"
side = json.loads(src.with_suffix(".json").read_text(encoding="utf-8"))
im = Image.open(src).convert("RGBA")
flat = Image.new("RGB", im.size, (255, 255, 255))
flat.paste(im, mask=im.split()[-1])

s = max(im.size)
sq = Image.new("RGB", (s, s), (255, 255, 255))
sq.paste(flat, ((s - im.width) // 2, (s - im.height) // 2))
sq.resize((1024, 1024), Image.LANCZOS).save(HERE / "refs/idle-square.png")

head = flat.crop((200, 0, 530, 330)).resize((1024, 1024), Image.LANCZOS)
head.save(HERE / "refs/idle-head.png")

w, h = side["source"]["width"], side["source"]["height"]
x0, y0 = side["cropBox"][:2]
canvas = Image.new("RGB", (w, h), (255, 255, 255))
canvas.paste(im, (x0, y0), im)
canvas.save(HERE / "refs/idle-init.png")
print("refs written", sq.size, head.size, canvas.size)
