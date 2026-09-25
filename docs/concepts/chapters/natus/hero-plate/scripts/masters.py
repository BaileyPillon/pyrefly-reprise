"""Capture-only 2x masters: options/<k>.png -> options/<k>.2x.webp (lanczos x2, quality 88).

The installed plates' masters go RealESRGAN x4 -> lanczos 0.5 (ch2-yunalesca.json); these are
only served to the captures, and that is disclosed in the README. Owed on a pick.

    python masters.py natus|fa
"""
import sys
from PIL import Image

DIR = {'natus': 'natus', 'fa': 'fallen-aeons'}[sys.argv[1]]
S = f'D:/Tools/pyrefly-scratch/hero-plates/{DIR}/options/'
for k in 'abc':
    im = Image.open(S + f'{k}.png').convert('RGB')
    im.resize((im.width * 2, im.height * 2), Image.LANCZOS).save(S + f'{k}.2x.webp', quality=88)
    print('master', k)
