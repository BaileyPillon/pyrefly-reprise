# Macalania production reference images (FFX only; method F of
# docs/concepts/chapters/leblanc/pilot2/judge.md): a square pad of the source
# on white (CLIP-Vision centre-crops to a square, so a tall figure loses its
# head otherwise) and a square head crop, both 1024x1024.
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/macalania/production/make-refs.py <src.png> <out-prefix> <x0,y0,x1,y1>
# e.g. make-refs.py docs/concepts/chapters/macalania/renders/seymour-b.png seymour-concept 180,0,480,300
import pathlib, sys
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[4]
src, prefix, box = sys.argv[1], sys.argv[2], tuple(int(v) for v in sys.argv[3].split(","))
im = Image.open(ROOT / src).convert("RGBA")
flat = Image.new("RGB", im.size, (255, 255, 255))
flat.paste(im, mask=im.split()[-1])
s = max(im.size)
sq = Image.new("RGB", (s, s), (255, 255, 255))
sq.paste(flat, ((s - im.width) // 2, (s - im.height) // 2))
sq.resize((1024, 1024), Image.LANCZOS).save(HERE / "refs" / f"{prefix}-square.png")
x0, y0, x1, y1 = box
side = max(x1 - x0, y1 - y0)
head = flat.crop((x0, y0, x0 + side, y0 + side)).resize((1024, 1024), Image.LANCZOS)
head.save(HERE / "refs" / f"{prefix}-head.png")
print("refs written", prefix, im.size, box)
