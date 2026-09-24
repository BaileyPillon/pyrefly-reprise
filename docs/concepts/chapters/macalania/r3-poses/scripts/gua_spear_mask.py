"""Guado Guardian (FFX only): the whole spear as one mask, from the fitted shaft axis (the maroon shaft
pixels, cv2.fitLine) plus SAM's spear mask. usage: gua_spear_mask.py <maskdir>"""
import sys, numpy as np, cv2
md = sys.argv[1]
im = cv2.imread('D:/Final Fantasy/public/art/characters/guado-guardian/idle.png', -1)
op = im[..., 3] > 127
hsv = cv2.cvtColor(im[..., :3], cv2.COLOR_BGR2HSV).astype(int)
Hh, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
mar = ((Hh >= 160) | (Hh <= 6)) & (S > 90) & (V > 40) & (V < 200) & op
ys, xs = np.nonzero(mar); sel = (xs > 150) & (xs < 650) & (ys > 450) & (ys < 760)
vx, vy, x0, y0 = cv2.fitLine(np.stack([xs[sel], ys[sel]], 1).astype(np.float32), cv2.DIST_HUBER, 0, .01, .01).ravel()
Y, X = np.mgrid[0:im.shape[0], 0:im.shape[1]]
k = (X - x0) * (-vy) + (Y - y0) * vx
m = np.zeros_like(op)
m |= (X >= 140) & (X < 560) & (np.abs(k + 1) <= 10.5)
m |= (X < 140) & (np.abs(k) <= 18)
m |= (X >= 560) & (X < 650) & (np.abs(k + 1) <= 11.5)
m |= (X >= 640) & (Y > 660) & (Y < 815)
sam = cv2.imread(f'{md}/spear.m1.png', 0) > 127
m = (m | (sam & (np.abs(k) <= 30))) & op
# over the robe (x 140..650) keep robe-coloured fringe pixels out: ochre (R-G 35..80) and pale yellow highlights
B_, G_, R_ = [im[..., i].astype(int) for i in range(3)]
robe = (((R_ - G_) >= 35) & ((R_ - G_) <= 80) & (G_ > 60) & (B_ < G_)) | ((R_ > 200) & (G_ > 150) & (B_ < 210))
robe &= (X >= 140) & (X < 540) & (np.abs(k + 1) >= 6)   # only at the band's edges: the shaft core keeps its own gold fittings
m &= ~robe
arm = cv2.imread(f'{md}/arm.m1.png', 0) > 127
m &= ~arm
cv2.imwrite(f'{md}/spear.full.png', m.astype(np.uint8) * 255)
print(dict(axis=[float(vx), float(vy), float(x0), float(y0)], px=int(m.sum())))
