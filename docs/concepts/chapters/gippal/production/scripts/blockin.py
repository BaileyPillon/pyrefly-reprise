# Gippal mortar: the ring clamp becomes the sourced "rounded saw blade" (visual bible 1.23.5). Block-in only:
# a grey toothed disc drawn BEHIND the barrel and the hand, over the ring. The masked repaint then paints it in style.
import math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src = Image.open('D:/Tools/pyrefly-scratch/gippal-options/renders/gippal-a2.png').convert('RGBA')
W, H = src.size
CX, CY, R = 192, 236, 74
disc = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(disc)
pts = []
N = 20
for i in range(N * 2):
    a = math.pi * i / N
    r = R + 9 if i % 2 == 0 else R - 3
    pts.append((CX + r * math.cos(a), CY + r * math.sin(a)))
d.polygon(pts, fill=(78, 80, 90, 255))
d.ellipse((CX - R + 6, CY - R + 6, CX + R - 6, CY + R - 6), fill=(170, 174, 184, 255))
d.ellipse((CX - R + 22, CY - R + 22, CX + R - 22, CY + R - 22), fill=(140, 144, 154, 255))
d.ellipse((CX - 20, CY - 20, CX + 20, CY + 20), fill=(90, 92, 100, 255))
d.ellipse((CX - 9, CY - 9, CX + 9, CY + 9), fill=(200, 170, 90, 255))
# keep: barrel (left), the fist and forearm, anything right of the forearm
keep = Image.new('L', (W, H), 0); k = ImageDraw.Draw(keep)
k.rectangle((0, 212, 163, H), fill=255)                     # barrel column
k.polygon([(160, 268), (205, 262), (235, 300), (300, 290), (330, 330), (300, 360), (200, 350), (160, 330)], fill=255)  # fist + wrist
k.rectangle((255, 280, W, H), fill=255)
keepA = np.asarray(keep) > 0
A = np.asarray(src).copy()
D = np.asarray(disc)
out = A.copy()
put = (D[..., 3] > 0) & ~(keepA & (A[..., 3] > 40))
out[put] = D[put]
Image.fromarray(out, 'RGBA').save('work/gip-blockin.png')
m = Image.fromarray((put * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(3))
m.save('work/gip-disc-mask.png')
bg = Image.new('RGBA', (W, H), (200, 200, 200, 255)); bg.alpha_composite(Image.fromarray(out, 'RGBA'))
bg.crop((80, 120, 420, 360)).resize((680, 480), Image.LANCZOS).convert('RGB').save('work/gip-blockin-zoom.jpg', quality=90)
print('ok', int(put.sum()))
