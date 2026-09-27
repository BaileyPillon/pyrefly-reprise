"""Repair round (2026-09-27): raise v4-d.1's short flat-top into the canon hi-top fade.

v4-d.1 has every other canon detail the judge asked for (gun-arm grafted on the RIGHT forearm, bare
left fist with metal bands, skull tattoo on the LEFT shoulder, two dog tags, hoop earring in the LEFT
ear), but its hair is a low flat-top. Canon (FF Wiki "Barret Wallace" revid 4042820): a hi-top fade.
This paints a taller flat-topped block of hair onto the render's own crown (measured: the hair spans
x ~370-468 at y ~155-190 in the 832x1216 raw) and writes a mask over only the crown, for a latent
inpaint (tools/gen/inpaint.mjs --latent). The face, the body and the gun are outside the mask.
Usage: python barret-hair-paintover.py <v4-d.1.raw.png> <out_dir> -> barret-hair-paint.png, barret-hair-mask.png
"""
import os, sys
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
TOP = int(os.environ.get("HAIR_TOP", "112"))  # first try 84 was hat-tall; 112 is ~40 px above the old crown
im = Image.open(src).convert('RGB')
d = ImageDraw.Draw(im)
# tall flat-topped block, slightly wider at the top, sides straight: rows get lighter toward the top
for i, y in enumerate(range(TOP, 176)):
    t = i / (176 - TOP)
    c = int(16 + 22 * (1 - t))
    d.line([(372 - 2 * (1 - t), y), (466 + 2 * (1 - t), y)], fill=(c, c - 2, c - 2))
m = Image.new('L', im.size, 0)
ImageDraw.Draw(m).rectangle([352, TOP - 20, 486, 184], fill=255)
m = m.filter(ImageFilter.GaussianBlur(5))
os.makedirs(out, exist_ok=True)
im.save(os.path.join(out, 'barret-hair-paint.png'))
m.save(os.path.join(out, 'barret-hair-mask.png'))
print('ok')
