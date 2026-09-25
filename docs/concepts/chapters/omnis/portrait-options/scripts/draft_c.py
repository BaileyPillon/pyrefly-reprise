"""Option C draft (FFX only): A's pick (a.q4) plus a PIL-drafted stole in the O-1 A idle's own strip colours (blue to
pale blue with red runes) over the shoulder and hanging down the chest; then a masked img2img inside the feathered box."""
from PIL import Image, ImageDraw, ImageFilter
import math
im = Image.open('work/a.q4.png').convert('RGB'); d = ImageDraw.Draw(im)
DK, BL, PL, RED = (22, 30, 78), (60, 96, 190), (150, 184, 236), (178, 36, 48)
def band(pts, w):
    d.line(pts, fill=DK, width=w + 8, joint='curve'); d.line(pts, fill=BL, width=w, joint='curve')
    d.line(pts, fill=PL, width=max(4, w // 3), joint='curve')
sh = [(520, 540), (610, 560), (700, 590), (790, 650)]
fr = [(500, 600), (478, 720), (458, 840), (446, 960), (440, 1060)]
band(sh, 46); band(fr, 50)
def rune(x, y, s):  # a small angular glyph, like the idle's red runes
    d.line([(x - s, y - s), (x, y + s), (x + s, y - s)], fill=RED, width=4); d.line([(x, y - s * 1.4), (x, y + s)], fill=RED, width=4)
for (x, y) in [(612, 566), (702, 596), (478, 740), (460, 860), (447, 985)]: rune(x, y, 9)
im.save('work/c2.init.png'); im.crop((380, 480, 832, 1100)).save('look/c2-draft.jpg', quality=90)
m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rectangle((400, 490, 815, 1100), fill=255)
ImageDraw.Draw(m).rectangle((380, 430, 520, 600), fill=0)  # keep the chin and jaw
m = m.filter(ImageFilter.GaussianBlur(10)); Image.merge('RGB', (m, m, m)).save('work/c2.mask.png'); m.save('work/c2.maskL.png')
