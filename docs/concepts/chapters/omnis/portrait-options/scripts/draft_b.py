"""Option B draft (FFX only): A's pick (a.q4) plus a PIL-drafted red lining on the high collar and the shoulder band,
the red of the idle's own runes; then a masked img2img inside the feathered box only (gen.mjs --mode inpaint)."""
from PIL import Image, ImageDraw, ImageFilter
im = Image.open('work/a.q4.png').convert('RGB'); d = ImageDraw.Draw(im)
RED, DK = (178, 36, 48), (96, 14, 28)
col = [(470, 770), (488, 668), (518, 585), (556, 505), (598, 452)]
d.line(col, fill=DK, width=24, joint='curve'); d.line(col, fill=RED, width=16, joint='curve')
sh = [(540, 572), (620, 578), (700, 598), (770, 640)]
d.line(sh, fill=DK, width=18, joint='curve'); d.line(sh, fill=RED, width=11, joint='curve')
im.save('work/b2.init.png'); im.crop((400, 400, 832, 850)).save('look/b2-draft.jpg', quality=90)
m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rectangle((470, 420, 810, 820), fill=255)
m = m.filter(ImageFilter.GaussianBlur(10)); Image.merge('RGB', (m, m, m)).save('work/b2.mask.png'); m.save('work/b2.maskL.png')
