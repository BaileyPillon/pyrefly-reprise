# O-3 guides: the approved Farplane plate (2x down to 1344x768) with the flower field replaced by a
# rough bright void and stone platform shapes. The masked img2img paints only below the mask line.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
SRC = 'D:/Final Fantasy/public/art/backdrops/farplane.png'
W, H = 1344, 768
plate = Image.open(SRC).convert('RGB').resize((W, H), Image.LANCZOS)
plate.save('o3/plate-1344.png')
P = np.asarray(plate).astype(np.float32)

def mask_img(top_side, top_mid, feather=40):
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    # mask the lower band; keep the spire's base column higher up (x 0.42..0.62)
    poly = [(0, top_side * H), (0.40 * W, top_side * H), (0.44 * W, top_mid * H), (0.62 * W, top_mid * H),
            (0.66 * W, top_side * H), (W, top_side * H), (W, H), (0, H)]
    d.polygon(poly, fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather))

def void_fill(img, y0):
    # bright void: colours sampled from the plate's own sky band just above the horizon, lightened downward
    arr = np.asarray(img).astype(np.float32).copy()
    top = P[int(0.60 * H):int(0.64 * H)].reshape(-1, 3).mean(0)
    rng = np.random.default_rng(3)
    noise = Image.fromarray((rng.random((H // 16, W // 16)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(6))
    nz = np.asarray(noise).astype(np.float32) / 255
    for y in range(int(y0 * H), H):
        t = (y - y0 * H) / (H - y0 * H)
        col = np.array([206, 160, 238]) * (1 - t) + np.array([255, 228, 248]) * t
        v = col[None, :] * (0.88 + 0.28 * nz[y][:, None]); fade = min(1.0, t / 0.18)
        arr[y] = arr[y] * (1 - fade) + v * fade
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

def platform(d, cx, cy, rx, ry, depth, top=(128, 118, 150), side=(70, 58, 96), ring=(96, 86, 122)):
    # jagged rocky underside tapering to a point (a floating island), then the carved top
    import random as _r; _r.seed(int(cx * 7 + cy))
    pts = [(cx - rx, cy)]
    n = 9
    for i in range(1, n):
        x = cx - rx + 2 * rx * i / n
        k = 1 - abs(2 * i / n - 1)
        pts.append((x, cy + depth * (0.6 + 2.4 * k) * _r.uniform(0.8, 1.15)))
    pts.append((cx + rx, cy))
    d.polygon(pts, fill=side)
    d.ellipse((cx - rx, cy - ry + depth * 0.35, cx + rx, cy + ry + depth * 0.35), fill=side)
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=top)
    for k in (0.72, 0.45):
        d.ellipse((cx - rx * k, cy - ry * k, cx + rx * k, cy + ry * k), outline=ring, width=max(2, int(ry * 0.03)))

def texture(img):
    arr = np.asarray(img).astype(np.float32)
    rng = np.random.default_rng(5)
    n = rng.normal(0, 9, arr.shape[:2])
    stone = (arr[..., 2] - arr[..., 0] > 10) & (arr.mean(-1) < 150) & (np.arange(H)[:, None] > 0.62 * H)
    arr[stone] += n[stone][:, None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

# A: one great platform in the foreground over the void
a = void_fill(plate, 0.66); d = ImageDraw.Draw(a)
platform(d, 0.56 * W, 0.94 * H, 0.44 * W, 0.15 * H, 40)
a = texture(a); a = a.filter(ImageFilter.GaussianBlur(1.0)); a.save('o3/guide-a.png'); mask_img(0.64, 0.74).save('o3/mask-a.png')
# B: the foreground platform plus two more receding toward the spire, joined by floating stepping stones
b = void_fill(plate, 0.64); d = ImageDraw.Draw(b)
platform(d, 0.64 * W, 0.705 * H, 0.085 * W, 0.018 * H, 10)
platform(d, 0.30 * W, 0.76 * H, 0.16 * W, 0.035 * H, 18)
for i, (x, y, r) in enumerate([(0.38, 0.745, 0.02), (0.46, 0.73, 0.017), (0.53, 0.72, 0.014), (0.59, 0.712, 0.011)]):
    platform(d, x * W, y * H, r * W, r * 0.25 * H, 5)
for i, (x, y, r) in enumerate([(0.22, 0.80, 0.025), (0.16, 0.83, 0.03)]):
    platform(d, x * W, y * H, r * W, r * 0.25 * H, 6)
platform(d, 0.52 * W, 0.98 * H, 0.72 * W, 0.15 * H, 60)
b = texture(b); b = b.filter(ImageFilter.GaussianBlur(1.0)); b.save('o3/guide-b.png'); mask_img(0.62, 0.69).save('o3/mask-b.png')
print('ok')
