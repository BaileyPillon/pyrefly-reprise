"""Reference + init images from the picked Evrae concept (B), FFX only.
1. Remove the concept's stray second head (a detached island near 430,330) so
   neither the adapter nor img2img learns a two-headed wyrm.
2. Square-pad on white so IP-Adapter's 224 centre-crop sees the whole creature
   (docs/plans/leblanc-art-method-check.md §2.2).
3. A 1216x832 white-flattened init of the one-head concept for img2img."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
src = Image.open("docs/concepts/chapters/evrae/renders/evrae-b.png").convert("RGBA")
a = np.array(src)
lab, n = ndi.label(a[..., 3] > 8)
head2 = lab[330, 430]
assert head2 != 0 and head2 != lab[160, 280], "second-head island not where expected"
a[lab == head2, 3] = 0
one = Image.fromarray(a, "RGBA")
one.save("docs/concepts/chapters/evrae/redo/refs/evrae-b-onehead.png")
w, h = one.size
s = max(w, h) + 32
sq = Image.new("RGBA", (s, s), (255, 255, 255, 255)); sq.alpha_composite(one, ((s - w) // 2, (s - h) // 2))
sq.convert("RGB").save("docs/concepts/chapters/evrae/redo/refs/evrae-b-square.png")
init = Image.new("RGBA", (1216, 832), (255, 255, 255, 255)); init.alpha_composite(one, ((1216 - w) // 2, (832 - h) // 2))
init.convert("RGB").save("docs/concepts/chapters/evrae/redo/refs/evrae-b-init.png")
print("removed island px", int((lab == head2).sum()), "of", n)
