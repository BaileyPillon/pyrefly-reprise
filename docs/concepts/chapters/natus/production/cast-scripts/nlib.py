"""Shared helpers for the Seymour Natus hero cast (FFX only). Pixel ops only; no GPU here."""
import numpy as np, cv2
from PIL import Image

REPO = 'D:/Final Fantasy'
SCR = 'D:/Tools/pyrefly-scratch/natus-cast'
OUT = 'D:/Tools/pyrefly-scratch/natus-cast/out'
IDLE = f'{REPO}/public/art/characters/seymour-natus/idle.png'

def load(p):
    return np.array(Image.open(p).convert('RGBA'))

def save(a, p):
    Image.fromarray(a.astype(np.uint8)).save(p)

def poly_mask(shape, pts):
    m = np.zeros(shape[:2], np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
    return m

def rect_along(shape, a, b, width):
    """Mask of a rectangle of `width` along segment a->b."""
    a, b = np.float32(a), np.float32(b)
    d = b - a; n = np.float32([-d[1], d[0]]) / (np.linalg.norm(d) + 1e-6) * width / 2
    return poly_mask(shape, [a + n, b + n, b - n, a - n])

def affine(src_a, src_b, dst_a, dst_b):
    """Similarity transform (rotation+translation, scale from segment lengths) mapping a->a', b->b'."""
    sa, sb, da, db = map(np.float64, (src_a, src_b, dst_a, dst_b))
    vs, vd = sb - sa, db - da
    ang = np.arctan2(vd[1], vd[0]) - np.arctan2(vs[1], vs[0])
    s = np.linalg.norm(vd) / np.linalg.norm(vs)
    c, si = np.cos(ang) * s, np.sin(ang) * s
    R = np.array([[c, -si], [si, c]])
    t = da - R @ sa
    return np.hstack([R, t[:, None]])

def warp_rgba(img, M, shape, mask=None):
    """Warp premultiplied so edges stay clean; `mask` (0-255) limits the source piece."""
    a = img.astype(np.float32)
    al = a[:, :, 3:4] / 255.0
    if mask is not None:
        al = al * (mask[:, :, None].astype(np.float32) / 255.0)
    pre = np.concatenate([a[:, :, :3] * al, al * 255], 2)
    w = cv2.warpAffine(pre, M, (shape[1], shape[0]), flags=cv2.INTER_LANCZOS4, borderValue=0)
    w = np.clip(w, 0, 255)
    alw = w[:, :, 3:4] / 255.0
    rgb = np.where(alw > 1e-3, w[:, :, :3] / np.maximum(alw, 1e-3), 0)
    return np.concatenate([np.clip(rgb, 0, 255), w[:, :, 3:4]], 2)

def over(top, bottom):
    """Porter-Duff over, float RGBA 0-255."""
    ta, ba = top[:, :, 3:4] / 255.0, bottom[:, :, 3:4] / 255.0
    oa = ta + ba * (1 - ta)
    rgb = (top[:, :, :3] * ta + bottom[:, :, :3] * ba * (1 - ta)) / np.maximum(oa, 1e-6)
    return np.concatenate([rgb, oa * 255], 2)

def on_bg(a, col=(255, 255, 255)):
    al = a[:, :, 3:4].astype(np.float32) / 255.0
    return (a[:, :, :3] * al + np.float32(col) * (1 - al)).astype(np.uint8)

def to_lab(rgb):
    lab = cv2.cvtColor(rgb.reshape(-1, 1, 3).astype(np.uint8), cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)
    lab[:, 0] *= 100 / 255; lab[:, 1:] -= 128
    return lab

def invented_share(idle_rgba, cand_rgba, region_mask, thr=10.0):
    """Share of opaque region pixels more than dE76 `thr` from every idle colour (quantised idle palette)."""
    idle = idle_rgba[idle_rgba[:, :, 3] > 127][:, :3]
    q = np.unique((idle // 4) * 4 + 2, axis=0)
    pal = to_lab(q)
    sel = (region_mask > 0) & (cand_rgba[:, :, 3] > 127)
    px = cand_rgba[sel][:, :3]
    if len(px) == 0:
        return 0.0, 0
    lab = to_lab(px)
    far = 0
    for i in range(0, len(lab), 4096):
        chunk = lab[i:i + 4096]
        d = np.sqrt(((chunk[:, None, :] - pal[None, :, :]) ** 2).sum(2)).min(1)
        far += int((d > thr).sum())
    return far / len(lab), len(lab)

def mad_outside(a, b, mask):
    """Max abs diff over RGBA outside `mask` (premultiplied-insensitive: compare raw where either alpha>0)."""
    out = mask == 0
    d = np.abs(a.astype(int) - b.astype(int))
    vis = (a[:, :, 3] > 0) | (b[:, :, 3] > 0)
    return int(d[out & vis].max()) if (out & vis).any() else 0, int((d[out].sum(1) > 0).sum())
