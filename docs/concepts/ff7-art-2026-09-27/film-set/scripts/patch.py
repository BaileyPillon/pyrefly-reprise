"""Film set: local repair by crop. Cut a padded crop around a fault from OUR OWN render, re-render that crop with
FLUX.2 Klein edit mode (gen2.py, the crop as the only reference, an edit instruction), scale it back and paste
only the fault box (feathered) into the picture. Used for the backdrop's glyph-like marks and small costume
faults. Never mirrors, never uses any retail image.
Usage: python patch.py <src.png> <out.png> <x0> <y0> <x1> <y1> <pad> <seed> <instruction...>"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
PY = 'D:/Tools/ComfyUI/python_embeded/python.exe'
src, out = sys.argv[1], sys.argv[2]
x0, y0, x1, y1, pad, seed = map(int, sys.argv[3:9])
text = ' '.join(sys.argv[9:])
im = Image.open(src).convert('RGBA')
W, H = im.size
cx0, cy0, cx1, cy1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
crop = im.crop((cx0, cy0, cx1, cy1))
cw, ch = crop.size
k = 1024 / max(cw, ch)
bw, bh = int(cw * k) // 16 * 16, int(ch * k) // 16 * 16
stem = os.path.splitext(out)[0] + '.patch'
crop.convert('RGB').resize((bw, bh), Image.LANCZOS).save(stem + '.in.png')
job = {'refs': [stem + '.in.png'], 'out': stem, 'seed': seed, 'size': [bw, bh], 'den': 1.0, 'hires': 1.0, 'hden': 0.2,
       'pos': 'Edit this picture. ' + text + ' Keep everything else exactly the same: framing, perspective, colours, lighting, line work and style.',
       'key': 'patch'}
json.dump(job, open(stem + '.job.json', 'w'), indent=1)
r = subprocess.run([PY, '-s', os.path.join(HERE, 'gen2.py'), stem + '.job.json'], capture_output=True, text=True)
if r.returncode:
    raise SystemExit(r.stdout + r.stderr)
fix = Image.open(stem + '.full.png').convert('RGBA').resize((cw, ch), Image.LANCZOS)
m = Image.new('L', (cw, ch), 0)
f = int(os.environ.get('FEATHER', max(4, pad // 3)))   # feather width in px (FEATHER overrides)
m.paste(255, (x0 - cx0 - f // 2, y0 - cy0 - f // 2, x1 - cx0 + f // 2, y1 - cy0 + f // 2))
m = m.filter(ImageFilter.GaussianBlur(f / 2))
if im.getbands() == ('R', 'G', 'B', 'A'):
    fa = np.asarray(fix).copy()
    fa[..., 3] = np.asarray(crop)[..., 3]          # keep the source alpha
    fix = Image.fromarray(fa)
res = im.copy()
res.paste(Image.composite(fix, crop, m), (cx0, cy0))
res.save(out)
print(json.dumps({'step': 'patch', 'box': [x0, y0, x1, y1], 'pad': pad, 'seed': seed, 'instruction': text}))
