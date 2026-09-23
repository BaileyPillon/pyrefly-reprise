"""Evrae r3 derive helpers (FFX only). Premultiplied warps of idle-near's own pixels.
Run with D:/Tools/sd-scripts/.venv/Scripts/python.exe (the python with OpenCV)."""
import numpy as np, cv2
IDLE = r'D:/Final Fantasy/public/art/characters/evrae/idle-near.png'

def load(p=IDLE):
    im = cv2.imread(p, cv2.IMREAD_UNCHANGED).astype(np.float32) / 255.0
    return im  # BGRA float

def save(p, im):
    cv2.imwrite(p, np.clip(im * 255.0 + 0.5, 0, 255).astype(np.uint8))

def premul(im):
    o = im.copy(); o[..., :3] *= o[..., 3:4]; return o

def unpremul(im):
    o = im.copy(); a = np.maximum(o[..., 3:4], 1e-6); o[..., :3] = np.where(o[..., 3:4] > 1e-4, o[..., :3] / a, 0); return o

def remap(im, sx, sy, up=2):
    """Inverse warp: out(q) = im(sx(q), sy(q)); done on an `up`x Lanczos canvas, down once (INTER_AREA)."""
    h, w = im.shape[:2]
    pm = premul(im)
    big = cv2.resize(pm, (w * up, h * up), interpolation=cv2.INTER_LANCZOS4)
    bsx = cv2.resize(sx, (w * up, h * up), interpolation=cv2.INTER_LINEAR) * up + (up - 1) / 2
    bsy = cv2.resize(sy, (w * up, h * up), interpolation=cv2.INTER_LINEAR) * up + (up - 1) / 2
    out = cv2.remap(big, bsx.astype(np.float32), bsy.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    out = cv2.resize(out, (w, h), interpolation=cv2.INTER_AREA)
    out = np.clip(out, 0, 1)
    out[..., 3] = np.where(out[..., 3] < 0.02, 0, out[..., 3])
    return unpremul(out)

def grid(h, w):
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    return xs, ys

def smooth(t):
    t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)

def rot_field(xs, ys, cx, cy, ang_deg, weight):
    """Inverse map of a rotation by ang about (cx,cy), blended by weight in [0,1]."""
    a = -np.deg2rad(ang_deg) * weight
    dx, dy = xs - cx, ys - cy
    c, s = np.cos(a), np.sin(a)
    return cx + c * dx - s * dy, cy + s * dx + c * dy

def on_grey(im, g=0.5):
    a = im[..., 3:4]; return im[..., :3] * a + g * (1 - a)

def to_lab(bgr):
    return cv2.cvtColor(np.clip(bgr, 0, 1).astype(np.float32), cv2.COLOR_BGR2Lab)

def from_lab(lab):
    return np.clip(cv2.cvtColor(lab.astype(np.float32), cv2.COLOR_Lab2BGR), 0, 1)
