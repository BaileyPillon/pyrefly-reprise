"""Chapter XII frames (FFX only): one staged image of the INSTALLED candidates, Omnis (idle or cast) plus four
Mortiphasm discs with their facing layer, on the options' O-2 geometry (canvas 2050x1560, Omnis 0.86 of its height,
discs 0.34, two each side facing him). Served in place of Chapter III's boss by request interception; nothing in
public/art is changed. usage: compose.py <idle|cast> <out.png> [thetaL1,thetaL2,thetaR1,thetaR2] [--order observed]"""
import sys, numpy as np
from PIL import Image
A = 'D:/Final Fantasy/public/art/characters/'
W0 = 'D:/Tools/pyrefly-scratch/ch1215/omnis/work/'
pose, out = sys.argv[1], sys.argv[2]
thetas = [float(v) for v in (sys.argv[3].split(',') if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else '0,0,0,0'.split(','))]
disc_src = W0 + 'mortiphasm-observed.png' if '--order' in sys.argv else A + 'mortiphasm/idle.png'
CW, CH = 2050, 1560
cv = Image.new('RGBA', (CW, CH), (0, 0, 0, 0))
S = int(CH * 0.34)
disc = Image.open(disc_src).convert('RGBA')
face = Image.open(A + 'mortiphasm-facing/idle.png').convert('RGBA')
k = S / (2 * 318)                                      # disc pixels -> composite (the 318 px radius spans S)
SLOTS = [((0.15, 0.30), 0), ((0.21, 0.66), 0), ((0.85, 0.30), 180), ((0.79, 0.66), 180)]
for ((fx, fy), facing), th in zip(SLOTS, thetas):
    d = disc.rotate(-(facing + th), resample=Image.BICUBIC)   # PIL rotates counter-clockwise; -a = a clockwise
    f = face.rotate(-facing, resample=Image.BICUBIC)
    d.alpha_composite(f)
    size = int(d.width * k)
    d = d.resize((size, size), Image.LANCZOS)
    cv.alpha_composite(d, (int(fx * CW - size / 2), int(fy * CH - size / 2)))
idle = Image.open(A + 'seymour-omnis/idle.png').convert('RGBA')
kf = CH * 0.86 / 1215                                  # the options' scale: the 1215 px cut-out at 0.86 of the canvas
iw, ih = int(idle.width * kf), int(idle.height * kf)
ix = int(CW / 2 - iw / 2)
iy = int(CH * 0.90 - (1212 + 1) * kf)                  # the hem (baselineY 1212) at 0.90 of the canvas
if pose == 'idle':
    f = idle.resize((iw, ih), Image.LANCZOS); pos = (ix, iy)
else:
    c = Image.open(A + 'seymour-omnis/cast.png').convert('RGBA')
    f = c.resize((int(c.width * kf), int(c.height * kf)), Image.LANCZOS); pos = (int(ix - 50 * kf), int(iy - 90 * kf))
cv.alpha_composite(f, pos)
cv.save(out)
print(out, cv.size)
