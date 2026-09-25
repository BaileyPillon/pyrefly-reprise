"""Write <opt>.2x.webp (2688x1536) next to each option PNG: a lanczos upscale for the
captures only (the installed plates' RealESRGAN route is owed on a pick).
  python make2x.py <key>"""
import sys
from PIL import Image
key = sys.argv[1]
d = f'D:/Tools/pyrefly-scratch/hero-plates/{key}/options/'
for k in (sys.argv[2] if len(sys.argv) > 2 else 'abc'):
    Image.open(d + f'{k}.png').convert('RGB').resize((2688, 1536), Image.LANCZOS).save(d + f'{k}.2x.webp', quality=88)
    print('2x', k)
