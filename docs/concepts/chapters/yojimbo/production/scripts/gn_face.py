# Lady Ginnem (FFX only): the picked concept pixels (ginnem-a, seed 904101; option B = this painting plus the unsent glow).
# Repair 1 (sourced: wiki Ginnem revid 3963153, "white makeup on her face"): lift the face's skin toward white.
# Pixel-only colour op inside a face box; line art, eyes, brows, forehead mark, lips and hair untouched.
import numpy as np, json, colorsys
from PIL import Image
from scipy import ndimage as ndi
im = np.array(Image.open('ginnem-a.png')).astype(np.float32)
rgb = im[..., :3]; al = im[..., 3] > 0
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
H, W = al.shape
face = np.zeros((H, W), bool); face[55:200, 250:372] = True
mx = rgb.max(2); mn = rgb.min(2)
skin = face & al & (r >= 205) & (r >= g) & (g >= b - 4) & ((r - b) <= 48) & (mn >= 170)
# hair is the same warm hue but darker and more saturated: keep anything with r-b > 48 or min < 170
skin = ndi.binary_opening(skin, iterations=1)
lab, n = ndi.label(skin); sz = ndi.sum(skin, lab, range(1, n + 1))
skin = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s >= 200])
k = 0.55  # share of the way to the white target
target = np.array([250, 247, 246], np.float32)
soft = ndi.gaussian_filter(skin.astype(np.float32), 1.0) * skin  # no feather outside the mask
out = rgb.copy()
out[skin] = rgb[skin] + (target - rgb[skin]) * (k * soft[skin])[:, None]
res = im.copy(); res[..., :3] = out
Image.fromarray(res.clip(0, 255).astype(np.uint8)).save('ginnem-face.png')
m = (skin * 255).astype(np.uint8); Image.fromarray(m).save('ginnem-face-mask.png')
print(json.dumps({'face_px': int(skin.sum())}))
