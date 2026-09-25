# Nooj shade idle, fur-shoulder fix (bible 1.23.4: "Over his right shoulder is a purple sleeve with fur at the top").
# On the opaque attempt-3 idle: (1) remove the fur from the LEFT (machina, screen-right) shoulder and block in a metal
# shoulder cap in the render's own blue-metal colours; (2) on the RIGHT (cloth, screen-left) shoulder, recolour the
# shoulder and upper arm (above y 288, the cast's static zone) to the bible's purple ramp and block in a ragged grey fur
# crest along the top. Writes work/fx-pre.png plus a repaint mask per shoulder. Alpha = the block-in's own shapes.
import numpy as np, random, math
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage
src = np.asarray(Image.open('work/nooj3-idle-opaque.png').convert('RGBA')).astype(np.float32)
A = src.copy(); H, W = A.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]
rgb = A[..., :3]; lum = rgb.mean(-1); sat = rgb.max(-1) - rgb.min(-1); al = A[..., 3]
def poly(pts):
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255); return np.asarray(m) > 0
# ---- (1) left (machina) shoulder
roi = (xx >= 385) & (xx <= 530) & (yy >= 110) & (yy <= 305)
light = roi & (al > 0) & (lum > 140) & (sat < 120) & (rgb[..., 2] < rgb[..., 0] + 25)
lab, n = ndimage.label(light); sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
fur = np.isin(lab, 1 + np.nonzero(sz > 200)[0])
fur = ndimage.binary_fill_holes(ndimage.binary_closing(fur, iterations=4))
grow = ndimage.binary_dilation(fur, iterations=4) & roi & (al > 0) & ~(rgb[..., 2] > rgb[..., 0] + 20) & (lum > 35)
tuft = (xx >= 470) & (yy >= 250) & (yy <= 305) & (al > 0) & (rgb[..., 0] > rgb[..., 2] + 15) & (rgb[..., 0] > 90)
fur = fur | grow | tuft
S = poly([(385, 196), (402, 200), (424, 214), (450, 226), (472, 236), (487, 248), (494, 266), (496, 305), (385, 305)])
fillL = fur & S
A[fur & ~S, 3] = 0
# fill: trapezius (left of x 425, above the ring) dark red suit; cap blue metal with a top highlight
trap = fillL & (xx < 425)
cap = fillL & (xx >= 425)
A[trap, :3] = [150, 44, 34]; A[trap, 3] = 255
t = ((yy - 226) / 60.0).clip(0, 1)
capcol = np.stack([40 + 60 * (1 - t), 70 + 90 * (1 - t), 170 + 60 * (1 - t)], -1)
A[cap, :3] = capcol[cap]; A[cap, 3] = 255
# ink outline along the new top edge
newa = A[..., 3] > 128
edge = newa & ~ndimage.binary_erosion(newa, iterations=3) & ndimage.binary_dilation(fillL, iterations=1)
A[edge, :3] = [12, 10, 16]
maskL = ndimage.binary_dilation(fur, iterations=6)
# ---- (2) right (cloth) shoulder: purple sleeve + fur crest
sl = poly([(262, 203), (286, 211), (276, 240), (262, 262), (250, 288), (200, 288), (231, 250), (247, 218)]) & (al > 128)
dark = ['#3E1A4E', '#6A2E80', '#9A5AD0']
c0, c1, c2 = [np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) for h in dark]
u = ((xx - 200) / 90.0 + (yy - 200) / 200.0).clip(0, 1)            # lighter toward the chest side (key light)
l = (lum / 255.0)[..., None]
col = np.where(u[..., None] < 0.5, c0 + (c1 - c0) * (u[..., None] * 2), c1 + (c2 - c1) * ((u[..., None] - 0.5) * 2))
col = col * (0.75 + 0.5 * l)
outline = sl & (lum < 25) & ~ndimage.binary_erosion(al > 128, iterations=3)
A[sl & ~outline, :3] = col[sl & ~outline]
# fur crest along the top of the sleeve, ragged outer edge
random.seed(7)
F = Image.new('L', (W, H), 0); d = ImageDraw.Draw(F)
path = [(281, 205), (268, 206), (254, 214), (242, 226), (232, 241), (223, 256), (216, 268)]
for i in range(len(path) - 1):
    (x0, y0), (x1, y1) = path[i], path[i + 1]
    for k in range(6):
        f = k / 6; x = x0 + (x1 - x0) * f; y = y0 + (y1 - y0) * f
        r = 11 + 3 * math.sin(i * 1.7 + k)
        d.ellipse((x - r, y - r, x + r, y + r), fill=255)
        nx, ny = -(y1 - y0), (x1 - x0); nn = math.hypot(nx, ny); nx, ny = nx / nn, ny / nn   # outward normal (up-left)
        if nx > 0: nx, ny = -nx, -ny
        L = r + random.uniform(4, 13); w = random.uniform(2.5, 4.5)
        tx, ty = x + nx * L + random.uniform(-3, 3), y + ny * L + random.uniform(-3, 3)
        d.polygon([(x - ny * w, y + nx * w), (tx, ty), (x + ny * w, y - nx * w)], fill=255)
Fm = (np.asarray(F) > 0) & (xx <= 283)
g0 = np.array([0x8E, 0x8C, 0x97], np.float32); g1 = np.array([0xC4, 0xC2, 0xCC], np.float32)
dist = ndimage.distance_transform_edt(Fm)
v = (dist / 10).clip(0, 1)[..., None]
noise = np.random.RandomState(3).rand(H, W, 1) * 18
fcol = g0 + (g1 - g0) * (1 - v * 0.6) + noise
A[Fm, :3] = fcol[Fm]; A[Fm, 3] = 255
fe = Fm & ~ndimage.binary_erosion(Fm, iterations=2)
A[fe & ~(src[..., 3] > 128), :3] = [70, 66, 80]
# keep the hair strands in front of the far shoulder (dark brown pixels right of x 276)
hair = (xx >= 270) & (xx <= 310) & (yy < 215) & (src[..., 3] > 128) & (lum < 90)
A[hair] = src[hair]
maskR = ndimage.binary_dilation(sl | Fm, iterations=6) & ~hair
lab2, n2 = ndimage.label(A[..., 3] > 20); sz2 = ndimage.sum(np.ones_like(lab2), lab2, range(1, n2 + 1))
A[(lab2 > 0) & (lab2 != 1 + int(np.argmax(sz2))), 3] = 0
out = Image.fromarray(A.clip(0, 255).astype(np.uint8), 'RGBA'); out.save('work/fx-pre.png')
for nm, m in (('L', maskL), ('R', maskR)):
    Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5)).save(f'work/fx-mask{nm}.png')
    print(nm, 'mask px', int(m.sum()), 'bbox', xx[m].min(), xx[m].max(), yy[m].min(), yy[m].max())
print('fur removed px', int((fur & ~S).sum()), 'cap fill', int(fillL.sum()), 'sleeve', int(sl.sum()), 'crest', int(Fm.sum()))
bg = Image.new('RGBA', (W, H), (128, 128, 128, 255)); bg.alpha_composite(out)
bg.crop((150, 100, 560, 360)).resize((820, 520), Image.LANCZOS).convert('RGB').save('look/fx-pre.jpg', quality=90)
