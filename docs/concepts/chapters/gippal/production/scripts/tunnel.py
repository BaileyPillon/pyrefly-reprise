# O-3 A tunnel mouth (the finals "would add it", README): block in an arched opening in the far wall of the unlit
# den-a3 render, for a masked repaint. Everything outside the mask stays den-a3's own pixels.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src = Image.open('D:/Tools/pyrefly-scratch/gippal-options/renders/den-a3.png').convert('RGB'); W, H = src.size
CX, TOP, BOT, HW = 1255, 170, 672, 175
def arch(hw, top):
    pts = []
    import math
    for i in range(0, 181, 6):
        a = math.radians(180 - i); pts.append((CX + hw * math.cos(a), top + hw - hw * math.sin(a) * 1.0))
    return [(CX - hw, BOT)] + pts + [(CX + hw, BOT)]
rim = Image.new('L', (W, H), 0); ImageDraw.Draw(rim).polygon(arch(HW + 34, TOP - 34), fill=255)
core = Image.new('L', (W, H), 0); ImageDraw.Draw(core).polygon(arch(HW, TOP), fill=255)
blk = src.copy()
blk = Image.composite(Image.new('RGB', (W, H), (34, 52, 70)), blk, rim.filter(ImageFilter.GaussianBlur(10)))
blk = Image.composite(Image.new('RGB', (W, H), (4, 7, 13)), blk, core.filter(ImageFilter.GaussianBlur(6)))
blk.save('work/den-blockin.png')
m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(arch(HW + 80, TOP - 80), fill=255)
m = m.filter(ImageFilter.GaussianBlur(24)); m.save('work/den-tunnel-mask.png')
blk.resize((W // 2, H // 2)).crop((400, 0, 900, 400)).save('work/den-blockin-look.jpg', quality=85)
print(m.getbbox())
