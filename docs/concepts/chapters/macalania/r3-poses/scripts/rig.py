"""Macalania r3 poses (FFX only): layer warps of an r3 idle's own pixels.
Every output pixel is either the idle's pixel (unchanged), an idle pixel moved by a warp, or a HOLE
(listed in the returned mask) that a later masked repaint fills. Run with
D:/Tools/sd-scripts/.venv/Scripts/python.exe (the python with OpenCV)."""
import numpy as np, cv2

def load(p):
    return cv2.imread(p, cv2.IMREAD_UNCHANGED).astype(np.float32) / 255.0

def save(p, im):
    cv2.imwrite(p, np.clip(im * 255.0 + 0.5, 0, 255).astype(np.uint8))

def mask(p):
    return cv2.imread(p, 0) > 127

def grid(h, w):
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    return xs, ys

def smooth(t):
    t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)

def rot_inv(xs, ys, cx, cy, ang_deg, weight=1.0):
    """Inverse map of a rotation by ang (deg, + = clockwise on screen) about (cx, cy), scaled by weight."""
    a = -np.deg2rad(ang_deg) * weight
    dx, dy = xs - cx, ys - cy
    c, s = np.cos(a), np.sin(a)
    return (cx + c * dx - s * dy).astype(np.float32), (cy + s * dx + c * dy).astype(np.float32)

def rot_fwd(x, y, cx, cy, ang_deg):
    a = np.deg2rad(ang_deg); dx, dy = x - cx, y - cy
    return cx + np.cos(a) * dx - np.sin(a) * dy, cy + np.sin(a) * dx + np.cos(a) * dy

def warp(im, layer, sx, sy):
    """Sample the layer (binary mask) of im at (sx, sy); nearest-safe: colour by cubic on premultiplied, alpha from the layer."""
    a = im[..., 3] * layer
    pm = im[..., :3] * a[..., None]
    src = np.dstack([pm, a]).astype(np.float32)
    out = cv2.remap(src, sx, sy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    out = np.clip(out, 0, 1)
    al = out[..., 3]
    col = np.where(al[..., None] > 1e-4, out[..., :3] / np.maximum(al[..., None], 1e-4), 0)
    al = np.where(al > 0.5, 1.0, 0.0)  # binary alpha (house convention)
    return np.dstack([np.clip(col, 0, 1), al]).astype(np.float32)

def over(top, base):
    at = top[..., 3:4]; ab = base[..., 3:4]
    ao = at + ab * (1 - at)
    c = (top[..., :3] * at + base[..., :3] * ab * (1 - at)) / np.maximum(ao, 1e-6)
    return np.concatenate([c, ao], -1)

def holes(result, idle, removed, close=21):
    """Pixels the idle had opaque inside the removed parts, now empty, and enclosed by the figure."""
    body = (result[..., 3] > 0.5).astype(np.uint8)
    closed = cv2.morphologyEx(body, cv2.MORPH_CLOSE, np.ones((close, close), np.uint8)) > 0
    h = removed & (result[..., 3] < 0.5) & closed & (idle[..., 3] > 0.5)
    return h | pockets(result, h) & cv2.dilate(removed.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)

def pockets(result, filled=None, max_area=2500):
    """Transparent pockets fully enclosed by the figure (not connected to the canvas border)."""
    bg = (result[..., 3] < 0.5) if filled is None else (result[..., 3] < 0.5) & ~filled
    bg = bg.astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(bg, connectivity=4)
    H, W = bg.shape; out = np.zeros(bg.shape, bool)
    for i in range(1, n):
        x, y, w, h, a = st[i]
        if a <= max_area and x > 0 and y > 0 and x + w < W and y + h < H:
            out |= lab == i
    return out

def prefill(im, hole, radius=6):
    """Telea inpaint of the holes (colour only), alpha set opaque there: the pre-fill a masked repaint starts from."""
    rgb = np.clip(im[..., :3] * 255, 0, 255).astype(np.uint8)
    known_bg = (im[..., 3] < 0.5) & ~hole
    rgb[known_bg] = 0
    m = hole.astype(np.uint8) * 255
    f = cv2.inpaint(rgb, m, radius, cv2.INPAINT_TELEA).astype(np.float32) / 255
    out = im.copy(); out[hole, :3] = f[hole]; out[hole, 3] = 1.0
    return out

def on_bg(im, g=0.45):
    a = im[..., 3:4]; return im[..., :3] * a + g * (1 - a)

def despeck(im, min_area=300):
    """Drop small opaque islands left behind by a moved part (not connected to the figure)."""
    op = (im[..., 3] > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(op, connectivity=8)
    out = im.copy(); dropped = 0
    for i in range(1, n):
        if st[i, 4] < min_area:
            out[lab == i] = 0; dropped += int(st[i, 4])
    return out, dropped
