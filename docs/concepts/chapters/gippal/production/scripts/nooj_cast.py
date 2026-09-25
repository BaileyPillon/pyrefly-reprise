# Nooj hero cast (r3 derive): the machina forearm, hand and cane rotate as one rigid layer about the elbow, so the cane
# swings up and out toward the party. The torso the forearm uncovers is pre-filled by diffusion for a masked repaint.
import sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
ANG = float(sys.argv[1])
src = Image.open('renders/nooj2.3.png').convert('RGBA')
PL, PT, PB, PR = int(sys.argv[2]) if len(sys.argv) > 2 else 380, 40, 30, 40
W, H = src.width + PL + PR, src.height + PT + PB
im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); im.paste(src, (PL, PT), src)
A = np.asarray(im).astype(np.float32)
yy, xx = np.mgrid[0:H, 0:W]; X = xx - PL; Y = yy - PT
alpha = A[..., 3]
fore = Image.new('L', (W, H), 0)
ImageDraw.Draw(fore).polygon([(x + PL, y + PT) for x, y in [(105, 368), (165, 358), (196, 342), (222, 350), (236, 385), (228, 420), (195, 432), (112, 440), (105, 440)]], fill=255)
foreM = np.asarray(fore) > 0
M = (((X < 110) & (Y >= 360)) | foreM) & (alpha > 0)
rest = A.copy(); rest[..., 3] = np.where(M, 0, rest[..., 3])
body = rest[..., 3] > 200
vac = foreM & (alpha > 30) & (X >= 168)
known = body.copy(); col = rest[..., :3].copy()
for it in range(4000):
    s = ndimage.uniform_filter(col * known[..., None], size=(3, 3, 1)); k = ndimage.uniform_filter(known.astype(np.float32), size=3)
    upd = vac & ~known & (k > 0.001)
    if not upd.any(): break
    col[upd] = s[upd] / k[upd][:, None]; known |= upd
rest[..., :3] = np.where(vac[..., None], col, rest[..., :3]); rest[..., 3] = np.where(vac, 255, rest[..., 3])
E = (212 + PL, 385 + PT)
layer = A * M[..., None]
L = Image.fromarray(layer.astype(np.uint8), 'RGBA').rotate(ANG, resample=Image.BICUBIC, center=E)
res = Image.alpha_composite(Image.fromarray(rest.astype(np.uint8), 'RGBA'), L)
bb = res.getbbox(); print('bbox', bb)
res.save('work/nooj-cast-rot.png')
vm = ndimage.binary_dilation(vac, iterations=5)
jm = Image.new('L', (W, H), 0); ImageDraw.Draw(jm).ellipse((E[0] - 34, E[1] - 34, E[0] + 34, E[1] + 34), fill=255)
Image.fromarray((((np.asarray(jm) > 0) | vm) * 255).astype(np.uint8)).save('work/nooj-cast-mask.png')
bg = Image.new('RGBA', (W, H), (120, 130, 150, 255)); bg.alpha_composite(res); bg.convert('RGB').resize((W // 2, H // 2)).save('work/nooj-cast-rot.jpg', quality=85)
print('size', W, H, 'vac', int(vac.sum()), 'pivot', E)
