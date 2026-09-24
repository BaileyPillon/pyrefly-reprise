# mkmask.py name dil -> work/<name>-rmask.png : vacated footprint (from the guide) dilated, feathered 2 px
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
name, dil = sys.argv[1], int(sys.argv[2])
vac = np.load(f'work/{name}-vac.npy')
extra = sys.argv[3] if len(sys.argv) > 3 else None
m = ndi.binary_dilation(vac, iterations=dil)
if extra:
    m |= np.asarray(Image.open(extra)) > 127
im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))
im.save(f'work/{name}-rmask.png'); print('mask px', int(m.sum()))
