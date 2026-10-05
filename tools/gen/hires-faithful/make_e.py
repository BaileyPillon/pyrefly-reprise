"""make_e.py: whole-backdrop ESRGAN images at 2x (Lanczos from the model's 4x) for the held backdrops, both models. usage: make_e.py [keys...]"""
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from r39lib import *

keys = sys.argv[1:] or ['gagazet', 'garden-of-pain', 'via-purifico', 'road-to-the-farplane', 'road-to-the-farplane-links', 'title']
os.makedirs(f'{R39}/work/e', exist_ok=True)
for k in keys:
    src = Image.open(f'{ART}/backdrops/{k}.png').convert('RGB')
    for tag, model in (('x4plus', 'RealESRGAN_x4plus.pth'), ('anime6b', 'RealESRGAN_x4plus_anime_6B.pth')):
        dst = f'{R39}/work/e/{k}-{tag}-2x.png'
        if os.path.exists(dst):
            continue
        t0 = time.time()
        up, gpu = esrgan_tiled(src, model, 2, tile=512, margin=24, tag=f'{k}/{tag}')
        up.save(dst, 'PNG', compress_level=1)
        say(f'{k} {tag}: {up.size} gpu {gpu:.1f}s wall {time.time() - t0:.1f}s')
