import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from ro_common import *
import ro_cpu
Image.MAX_IMAGE_PIXELS = None


def lum(im, k):
    a = np.asarray(im.getchannel('A'), dtype=np.float32) / 255.0
    g = np.asarray(im.convert('L'), dtype=np.float32) * a + 60.0 * (1 - a)
    h, w = im.height // k, im.width // k
    return g[:h * k, :w * k].reshape(h, k, w, k).mean((1, 3)), a[:h * k, :w * k].reshape(h, k, w, k).mean((1, 3))


def local_struct(Tm, M, k=4, cell=24, sigma=1.2):
    lt, at = lum(Tm, k); lc, ac = lum(M, k)
    gt = np.hypot(*np.gradient(gaussian_filter(lt, sigma))); gc = np.hypot(*np.gradient(gaussian_filter(lc, sigma)))
    h, w = lt.shape
    n = bad = 0
    worst = []
    for y in range(0, h - cell + 1, cell):
        for x in range(0, w - cell + 1, cell):
            if at[y:y+cell, x:x+cell].mean() < 0.7: continue
            a, b = gt[y:y+cell, x:x+cell].ravel(), gc[y:y+cell, x:x+cell].ravel()
            if a.std() < 1.0 or a.mean() < 2.0: continue
            c = float(np.corrcoef(a, b)[0, 1]) if b.std() > 1e-6 else 0.0
            n += 1
            if c < 0.30: bad += 1
            worst.append(c)
    return round(bad / max(1, n), 4), round(float(np.percentile(worst, 5)), 3) if worst else None, n

if __name__ == '__main__':
    L = 'D:/Tools/pyrefly-art-backup/hires-painterly'
    for i in sys.argv[1:]:
        a = [x for x in plan() if x['id'] == i][0]
        print(i.split('/')[-2:], local_struct(ro_cpu.today(a), Image.open(f'{L}/{i}@{a["S"]}x.png').convert('RGBA'), a['S']))
