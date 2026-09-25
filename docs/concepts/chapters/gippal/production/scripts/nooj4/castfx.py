# Re-derive the cast: transplant the idle's shoulder fix onto the opaque cast at the cast's paste offset (440, 20),
# only where the cast still holds the idle's own unmoved pixels (never inside the rotated forearm or the joint repaint).
import numpy as np
from PIL import Image
o = np.asarray(Image.open('work/nooj3-idle-opaque.png').convert('RGBA')).astype(np.int16)
f = np.asarray(Image.open('work/fx-idle-opaque.png').convert('RGBA')).astype(np.int16)
c = np.asarray(Image.open('work/nooj3-cast-opaque.png').convert('RGBA')).astype(np.int16).copy()
PL, PT = 440, 20; H, W = o.shape[:2]
reg = c[PT:PT + H, PL:PL + W]
changed = np.any(o != f, -1)
same = np.all(reg == o, -1) | ((reg[..., 3] == 0) & (o[..., 3] == 0))
apply = changed & same
blocked = changed & ~same
reg[apply] = f[apply]
c[PT:PT + H, PL:PL + W] = reg
print('changed', int(changed.sum()), 'applied', int(apply.sum()), 'blocked', int(blocked.sum()))
if blocked.any():
    ys, xs = np.nonzero(blocked); print('blocked bbox', xs.min(), xs.max(), ys.min(), ys.max())
Image.fromarray(c.astype(np.uint8), 'RGBA').save('work/fx-cast-opaque.png')
