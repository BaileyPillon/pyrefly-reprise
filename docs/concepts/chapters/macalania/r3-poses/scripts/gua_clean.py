"""Guardian cast repair, cleanup pass on the picked seed (FFX only), still inside the repair mask only:
(1) the gold contour the sampler drew on the wrist's inner edge -> the idle's ink (the outline it stands for);
(2) residual dark specks and pale fringe dots touching the shaft over the robe -> Telea fill from the robe around.
usage: gua_clean.py <picked.png> <out.png>"""
import sys, numpy as np, cv2
pick, out = sys.argv[1:3]
im = cv2.imread(pick, -1); H, W = im.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]
mask = cv2.imread('D:/Tools/pyrefly-scratch/ch7-casts/gua.mask.png', 0) > 0
shaft = cv2.imread('D:/Tools/pyrefly-scratch/ch7-casts/gua.protect.png', 0) > 0
b, g, r = [im[..., i].astype(int) for i in range(3)]
lum = (b + g + r) / 3
# (1) gold: warm and bright (R > B + 60, G > B + 30, lum > 110) inside the wrist ellipse
wrist = np.zeros((H, W), np.uint8); cv2.ellipse(wrist, (352, 512), (34, 26), 0, 0, 360, 255, -1)
gold = (wrist > 0) & mask & (r > b + 60) & (g > b + 30) & (lum > 110)
gold = cv2.dilate(gold.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & (wrist > 0) & mask & (r > b + 25)
ink = np.array([35, 33, 28], np.float32)
res = im.copy()
res[gold, :3] = ink.astype(np.uint8)
# (2) specks: pixels touching the shaft (within 3 px, outside it) whose luminance departs from the robe median by > 40
med = cv2.medianBlur(im[..., :3], 9).astype(np.float32).mean(-1)
ring = (cv2.dilate(shaft.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0) & ~shaft & (im[..., 3] > 127)
robe = (r > b + 25)  # robe browns and the shaft's maroon both warm; keep to the ring outside the shaft
odd = ring & (np.abs(lum - med) > 40) & (yy > 600)
odd = cv2.dilate(odd.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & ring
res_rgb = cv2.inpaint(np.ascontiguousarray(res[..., :3]), odd.astype(np.uint8) * 255, 3, cv2.INPAINT_TELEA)
res[odd, :3] = res_rgb[odd]
# (3) pale fringe dots on the shaft's own edge over the robe (a halo the idle's cut-out carried): -> Telea
edge = shaft & ~(cv2.erode(shaft.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0) & (yy > 600)
lum2 = res[..., :3].astype(np.float32).mean(-1); med2 = cv2.medianBlur(res[..., :3], 7).astype(np.float32).mean(-1)
pale = edge & (lum2 > med2 + 35)
fix2 = cv2.inpaint(np.ascontiguousarray(res[..., :3]), pale.astype(np.uint8) * 255, 2, cv2.INPAINT_TELEA)
res[pale, :3] = fix2[pale]
changed = gold | odd | pale
cv2.imwrite(out, res)
cv2.imwrite(out.replace('.png', '.cleanmask.png'), changed.astype(np.uint8) * 255)
print('paleEdgePx', int(pale.sum()), 'goldPx', int(gold.sum()), 'speckPx', int(odd.sum()), 'outsideRepairMask', int((changed & ~mask).sum()))
