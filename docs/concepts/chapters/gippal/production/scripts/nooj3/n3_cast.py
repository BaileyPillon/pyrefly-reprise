# Nooj shade hero cast from the attempt-3 idle (r3 derive, as the chapter's other casts): the right (flesh, gloved)
# forearm, hand and cane turn ANG degrees clockwise about the elbow as one rigid layer of the idle's own pixels, so the
# cane swings out and up toward the party. The elbow seam gets one masked repaint (see n3_cast_rep.sh).
import sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
ANG = float(sys.argv[1]); PL = int(sys.argv[2]); EX, EY = int(sys.argv[3]), int(sys.argv[4])
src = Image.open('work/nooj3-idle-opaque.png').convert('RGBA')
PT, PB, PR = 20, 20, 20
W, H = src.width + PL + PR, src.height + PT + PB
im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); im.paste(src, (PL, PT), src)
A = np.asarray(im).astype(np.float32)
yy, xx = np.mgrid[0:H, 0:W]; X = xx - PL; Y = yy - PT
alpha = A[..., 3]
M = (((X < EX + 5) & (Y > EY - 45) & (Y < 420)) | ((X < 150) & (Y >= 420))) & (alpha > 0)
rest = A.copy(); rest[..., 3] = np.where(M, 0, rest[..., 3])
E = (EX + PL, EY + PT)
layer = A * M[..., None]
L = Image.fromarray(layer.astype(np.uint8), 'RGBA').rotate(-ANG, resample=Image.BICUBIC, center=E)
res = Image.alpha_composite(Image.fromarray(rest.astype(np.uint8), 'RGBA'), L)
res.save('work/n3-cast-rot.png')
jm = Image.new('L', (W, H), 0); ImageDraw.Draw(jm).ellipse((E[0] - 30, E[1] - 30, E[0] + 30, E[1] + 30), fill=255)
jm.save('work/n3-cast-mask.png')
bg = Image.new('RGBA', (W, H), (128, 128, 128, 255)); bg.alpha_composite(res)
bg.convert('RGB').resize((W // 2, H // 2)).save('work/n3-cast-rot.jpg', quality=88)
bg.crop((E[0] - 150, E[1] - 150, E[0] + 150, E[1] + 150)).convert('RGB').resize((600, 600)).save('work/n3-cast-joint.jpg', quality=92)
print('size', W, H, 'pivot', E, 'moved px', int(M.sum()), 'bbox', res.getbbox())
