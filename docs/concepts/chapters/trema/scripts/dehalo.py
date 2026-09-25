import sys, numpy as np
from collections import deque
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]; seeds = [tuple(map(int, s.split(','))) for s in sys.argv[3:]]
im = Image.open(src).convert('RGBA'); a = np.array(im).astype(int)
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
m = (r > 170) & (g > 120) & (g < 225) & (b > 70) & (b < 190) & (r - b > 45) & (al > 0)
H, W = m.shape; k = np.zeros_like(m); q = deque()
for x, y in seeds:
    if m[y, x] and not k[y, x]: k[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
        yy, xx = y+dy, x+dx
        if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not k[yy, xx]: k[yy, xx] = True; q.append((yy, xx))
kk = np.array(Image.fromarray((k * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5))) > 0
a[..., 3] = np.where(kk, 0, al)
Image.fromarray(a.astype('uint8')).save(out); print(out, int(kk.sum()))
