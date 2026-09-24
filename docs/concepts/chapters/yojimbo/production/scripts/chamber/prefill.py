# Paint a rough dormant teleport pad (low carved stone dais) and remove the floating rock,
# using the plate's own pixels for colour and texture. The GPU pass refines this.
import sys, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
CX, CY, RX, RY, SIDE = [float(v) for v in sys.argv[1:6]] if len(sys.argv) > 5 else (1500, 1350, 230, 44, 14)
src = Image.open('src.png').convert('RGB')
a = np.asarray(src).astype(np.float32)
H, W = a.shape[:2]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

def ell(rx, ry, cy=CY):
    return ((xx - CX) / rx) ** 2 + ((yy - cy) / ry) ** 2

# colours sampled from the plate around the pad
box = a[int(CY - RY):int(CY + RY), int(CX - RX):int(CX + RX)].reshape(-1, 3)
floor_mean = box.mean(0)
lum = a.mean(2)
# texture: high-pass of the floor itself, shifted so the dais is not a flat fill
blur = np.asarray(src.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)
detail = (a - blur)
out = a.copy()

stone_top = np.array([150, 140, 138], np.float32)   # lit grey stone, a touch warm like the lit floor
stone_side = np.array([52, 50, 56], np.float32)     # shadowed rim
groove = np.array([70, 66, 70], np.float32)

# side band: union of ellipses from CY to CY+SIDE, minus the top
side = np.zeros((H, W), bool)
for d in range(0, int(SIDE) + 1):
    side |= ell(RX, RY, CY + d) <= 1
top = ell(RX, RY) <= 1
side &= ~top
# light falls from upper right: brighten top to the right-back
shade = 0.82 + 0.25 * np.clip((xx - CX) / RX, -1, 1) * 0.5 + 0.12 * np.clip(-(yy - CY) / RY, -1, 1)
# blend top with floor colour so it belongs to the set
top_col = 0.4 * stone_top + 0.6 * floor_mean
for c in range(3):
    ch = out[..., c]
    ch[top] = top_col[c] * shade[top] + detail[..., c][top] * 1.2
    ch[side] = stone_side[c] + detail[..., c][side] * 0.8
# carved rings and eight spokes
e = ell(RX, RY)
ring = (np.abs(np.sqrt(e) - 0.86) < 0.035) | (np.abs(np.sqrt(e) - 0.56) < 0.03) | (np.abs(np.sqrt(e) - 0.22) < 0.03)
ang = np.arctan2((yy - CY) / RY, (xx - CX) / RX)
spoke = np.zeros_like(ring)
for k in range(8):
    t = k * math.pi / 4
    dang = np.abs(np.angle(np.exp(1j * (ang - t))))
    spoke |= (dang < 0.035) & (np.sqrt(e) > 0.56) & (np.sqrt(e) < 0.86)
cut = top & (ring | spoke)
for c in range(3):
    out[..., c][cut] = out[..., c][cut] * 0.7 + groove[c] * 0.12
# a soft contact shadow under the front rim
shadow = (ell(RX * 1.06, RY * 1.25, CY + SIDE + 4) <= 1) & ~top & ~side
out[shadow] *= 0.78

# floating rock: a harmonic (Laplace) fill from the surrounding wall, then the wall's own grain
rx0, ry0, rx1, ry1 = 338, 430, 402, 560
rm = np.zeros((H, W), bool)
# the rock is a thin diamond; mask an ellipse round it
rm |= (((xx - 370) / 32) ** 2 + ((yy - 495) / 66) ** 2) <= 1
reg = out[ry0 - 20:ry1 + 20, rx0 - 20:rx1 + 20].copy()
mm = rm[ry0 - 20:ry1 + 20, rx0 - 20:rx1 + 20]
reg[mm] = reg[~mm].mean(0)
for _ in range(1500):
    avg = 0.25 * (np.roll(reg, 1, 0) + np.roll(reg, -1, 0) + np.roll(reg, 1, 1) + np.roll(reg, -1, 1))
    reg[mm] = avg[mm]
grain = detail[ry0 - 20 - 150:ry1 + 20 - 150, rx0 - 20:rx1 + 20]
reg[mm] += 0.6 * grain[mm]
out[ry0 - 20:ry1 + 20, rx0 - 20:rx1 + 20] = reg

res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
# feather the edits into the plate
m = Image.new('L', (W, H), 0)
d = ImageDraw.Draw(m)
d.ellipse((CX - RX * 1.08, CY - RY * 1.3, CX + RX * 1.08, CY + RY * 1.3 + SIDE + 8), fill=255)
d.ellipse((370 - 36, 495 - 70, 370 + 36, 495 + 70), fill=255)
m = m.filter(ImageFilter.GaussianBlur(4))
final = Image.composite(res, src, m)
final.save('prefill.png')
json.dump({'pad': {'cx': CX, 'cy': CY, 'rx': RX, 'ry': RY, 'side': SIDE}, 'rock': [rx0, ry0, rx1, ry1]}, open('prefill.json', 'w'))
final.crop((int(CX - 500), int(CY - 250), int(CX + 500), int(CY + 186))).save('v-pad-prefill.png')
