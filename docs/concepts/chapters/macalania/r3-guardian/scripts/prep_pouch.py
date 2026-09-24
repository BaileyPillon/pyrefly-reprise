# Pouch OPTION pilot prep (FFX only, research 9.3 "a belt pouch that is visibly full"): crude pouch painted on the raw crop, mask around it.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi
BOX = (270, 440, 526, 696)
raw = Image.open('raw.png').convert('RGB')
cr = raw.crop(BOX); d = ImageDraw.Draw(cr)
ox, oy = BOX[0], BOX[1]
P = lambda pts: [(x - ox, y - oy) for x, y in pts]
# belt strap: from under the sleeve edge, slanting across the robe
d.line(P([(362, 500), (440, 492)]), fill=(70, 38, 22), width=7)
# pouch body (bulging, rounded) and flap
d.rounded_rectangle([(372 - ox, 505 - oy), (432 - ox, 588 - oy)], radius=14, fill=(128, 62, 36), outline=(45, 22, 12), width=3)
d.polygon(P([(370, 503), (434, 503), (430, 536), (402, 544), (374, 536)]), fill=(150, 78, 44), outline=(45, 22, 12))
d.ellipse([(398 - ox, 530 - oy), (408 - ox, 540 - oy)], fill=(200, 160, 70), outline=(60, 40, 10))
cr.save('p-init.png')
m = Image.new('L', cr.size, 0); dm = ImageDraw.Draw(m)
dm.rounded_rectangle([(364 - ox, 486 - oy), (442 - ox, 596 - oy)], radius=16, fill=255)
M = np.array(m) > 0
# keep the forearm and the hand out of the mask (skin = blue dominant)
arr = np.array(raw.crop(BOX)).astype(int); skin = (arr[:, :, 2] > arr[:, :, 0] + 25) & (arr[:, :, 2] > 90)
skin = ndi.binary_dilation(skin, iterations=2)
M &= ~skin
Image.fromarray((M * 255).astype(np.uint8)).save('p-M.png')
Image.fromarray((M * 255).astype(np.uint8)).resize((1024, 1024), Image.BILINEAR).filter(ImageFilter.GaussianBlur(6)).save('p-mask1024.png')
look = cr.copy(); lk = np.array(look); lk[M] = (lk[M] * 0.6 + np.array([255, 0, 255]) * 0.4).astype(np.uint8)
Image.fromarray(lk).resize((512, 512), Image.NEAREST).save('p-look.png'); print(M.sum())
