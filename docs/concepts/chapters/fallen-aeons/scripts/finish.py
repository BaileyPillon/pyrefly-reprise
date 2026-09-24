# Paste a masked repaint back onto the full-size approved plate, only inside the (feathered) mask.
import sys
from PIL import Image
raw, mask, out = sys.argv[1:4]
src = Image.open('D:/Final Fantasy/public/art/backdrops/farplane.png').convert('RGB')
r = Image.open(raw).convert('RGB').resize(src.size, Image.LANCZOS)
m = Image.open(mask).convert('L').resize(src.size, Image.LANCZOS)
Image.composite(r, src, m).save(out)
Image.composite(r, src, m).resize((1344, 768), Image.LANCZOS).save(out[:-4] + '-look.jpg', quality=88)
