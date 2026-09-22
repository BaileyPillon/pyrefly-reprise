# Ormi round 3 reference images (FFX-2 only, Leblanc chapter art; method F of
# docs/concepts/chapters/leblanc/pilot2/judge.md).
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/leblanc/sets/ormi/round3/make-refs.py
# refs/idle-square.png : Ormi's installed idle padded to a square on white
#                        (CLIP-Vision centre-crops to a square; a tall idle loses the head)
# refs/idle-head.png   : square crop of idle's head, topknot and collar, 1024x1024
import pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[6]
src = ROOT / "public/art/characters/ormi/idle.png"
im = Image.open(src).convert("RGBA")
flat = Image.new("RGB", im.size, (255, 255, 255))
flat.paste(im, mask=im.split()[-1])

s = max(im.size)
sq = Image.new("RGB", (s, s), (255, 255, 255))
sq.paste(flat, ((s - im.width) // 2, (s - im.height) // 2))
sq.resize((1024, 1024), Image.LANCZOS).save(HERE / "refs/idle-square.png")

head = flat.crop((140, 0, 480, 340)).resize((1024, 1024), Image.LANCZOS)
head.save(HERE / "refs/idle-head.png")
print("refs written", im.size, sq.size, head.size)
