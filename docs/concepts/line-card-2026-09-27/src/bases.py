"""Prepare the clean base frames for the PR-0211 line-card options.

Every base is a real frame already on disk (no browser, no game run). Where the
source frame still carries the backed-out top-band card, that area is either
patched from a frame of the same camera (V 1600: the checker's revert frame) or
filled smoothly from its borders (V 2000) and flagged as filled in the sheet.

Usage: python bases.py <out_dir>
"""
import sys
import numpy as np
from PIL import Image

OUT = sys.argv[1]
CHK = 'D:/pyrefly-t1-b4a/docs/screenshots/t1-b4a-check/'


def smooth_row(row, k=121):
    ker = np.ones(k, np.float32) / k
    pad = np.pad(row, ((k // 2, k // 2), (0, 0)), mode='edge')
    return np.stack([np.convolve(pad[:, c], ker, mode='valid') for c in range(3)], 1)


def soft_fill(img, x0, y0, x1, y1):
    """Fill [x0,x1) x [y0,y1) by a vertical blend of its heavily smoothed top and
    bottom border rows: a soft sky, no streaks. Detail under it is lost."""
    a = np.asarray(img).astype(np.float32).copy()
    top = smooth_row(a[max(0, y0 - 3), x0 - 60:x1 + 60])[60:-60]
    bot = smooth_row(a[y1 + 3, x0 - 60:x1 + 60])[60:-60]
    h = y1 - y0
    v = (np.arange(h) + 1)[:, None, None] / (h + 1)
    a[y0:y1, x0:x1] = (1 - v) * top[None] + v * bot[None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def coons(img, x0, y0, x1, y1):
    """Fill [x0,x1) x [y0,y1) from its four border lines (Coons patch)."""
    a = np.asarray(img).astype(np.float32).copy()
    top, bot = a[y0 - 1, x0:x1], a[y1, x0:x1]
    left, right = a[y0:y1, x0 - 1], a[y0:y1, x1]
    h, w = y1 - y0, x1 - x0
    v = (np.arange(h) + 1)[:, None, None] / (h + 1)
    u = (np.arange(w) + 1)[None, :, None] / (w + 1)
    c00, c10 = a[y0 - 1, x0 - 1], a[y0 - 1, x1]
    c01, c11 = a[y1, x0 - 1], a[y1, x1]
    lin_v = (1 - v) * top[None] + v * bot[None]
    lin_u = (1 - u) * left[:, None] + u * right[:, None]
    bil = ((1 - u) * (1 - v) * c00 + u * (1 - v) * c10
           + (1 - u) * v * c01 + u * v * c11)
    a[y0:y1, x0:x1] = lin_v + lin_u - bil
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


# FFX, Chapter III, 1600x900: today's presentation audit, a clean fight frame
Image.open('D:/Tools/pyrefly-scratch/pres-audit/braskas-final-aeon/09-10-hit-reaction.jpg') \
    .convert('RGB').save(OUT + '/iii-1600.jpg', quality=92)

# FFX, Chapter III, 2000x1012: the only frame of this size on disk (menu is up)
Image.open('D:/Tools/pyrefly-scratch/eng3/raw/h2-braskas-final-aeon-2000x1012.png') \
    .convert('RGB').save(OUT + '/iii-2000.jpg', quality=92)

# FFX-2, Chapter V, 1600x900: the checker's beat frame (card in the top band)
# with the top band taken from the checker's revert frame of the same camera
# (card at the bottom there), so neither card remains.
beat = Image.open(CHK + 'midbeat-ffx2-vegnagun-shuyin-1600-01.jpg').convert('RGB')
rev = Image.open(CHK + 'revert-pr0211-ch5-1600.jpg').convert('RGB')
beat.paste(rev.crop((0, 0, 1140, 356)), (0, 0))
beat.save(OUT + '/v-1600.jpg', quality=92)

# FFX-2, Chapter V, 2000x1012: the checker's failing frame (Jecht, party framed
# large). No frame of this camera without the card exists, so the card's area
# is filled from its borders; the sheet marks it as filled.
v2 = Image.open(CHK + 'overlap-ffx2-vegnagun-shuyin-2000-01.jpg').convert('RGB')
v2 = soft_fill(v2, 100, 0, 520, 440)
v2 = soft_fill(v2, 520, 156, 1412, 428)
v2.save(OUT + '/v-2000.jpg', quality=92)

# FFX-2, Chapter V, phone 390x844: the Vegnagun colossus build frame, menu up
Image.open('D:/Final Fantasy/docs/screenshots/vegnagun-a/build-phone-1-tail-menu.jpg') \
    .convert('RGB').save(OUT + '/v-390.jpg', quality=92)
print('ok')
