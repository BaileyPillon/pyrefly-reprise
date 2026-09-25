# Alpha of the repainted saw = the block-in's own disc shape (antialiased), so the white ground the repaint saw outside
# the teeth never becomes opaque; everywhere else the original alpha is kept exactly.
import sys, numpy as np
from PIL import Image, ImageFilter
seed = sys.argv[1]
orig = np.asarray(Image.open('D:/Tools/pyrefly-scratch/gippal-options/renders/gippal-a2.png').convert('RGBA'))
blk = np.asarray(Image.open('work/gip-blockin.png').convert('RGBA'))
rep = np.asarray(Image.open(f'work/gip-saw-{seed}.png').convert('RGBA')).copy()
shape = Image.fromarray(((blk[..., 3] > 0) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
sa = np.asarray(shape).astype(np.float32)
a = np.maximum(orig[..., 3].astype(np.float32), sa)
rep[..., 3] = a.astype(np.uint8)
# de-fringe: in the new edge band pull near-white pixels toward the tooth grey
band = (sa > 0) & (sa < 250) & (orig[..., 3] < 40)
lum = rep[..., :3].mean(-1)
wh = band & (lum > 150)
rep[wh, :3] = (rep[wh, :3] * 0.35 + np.array([78, 80, 90]) * 0.65).astype(np.uint8)
Image.fromarray(rep, 'RGBA').save('work/gip-idle-clean.png')
bg = Image.new('RGBA', rep.shape[1::-1], (60, 70, 90, 255)); bg.alpha_composite(Image.fromarray(rep, 'RGBA'))
bg.crop((60, 110, 360, 380)).resize((600, 540), Image.LANCZOS).convert('RGB').save('work/gip-saw-fixed.jpg', quality=90)
diff = np.abs(rep.astype(int) - orig.astype(int)).sum(-1) > 0
print('changed px', int(diff.sum()), 'of opaque', int((orig[..., 3] > 128).sum()))
