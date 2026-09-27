"""Film set, repair round: patch.py with IDENTITY references. A padded crop around a fault in OUR OWN render is
re-rendered by FLUX.2 Klein edit mode (gen2.py) with the crop as image 1 and, as images 2.., crops of our own idle
pick (the pauldron, the gatling, the wrist) so the repainted part matches the idle; only the fault box (feathered)
is pasted back. Never mirrors a reference (the idle already faces the same way), never uses a retail image.
A prov file for <out> is written: the source's prov plus a postProcess entry for this patch.
Usage: python patch2.py <src.png> <out.png> <x0> <y0> <x1> <y1> <pad> <seed> <instruction...>
  env REFS="path@x0,y0,x1,y1;path@..."  identity crops (images 2..)   FEATHER=px   WHAT="short note for the sidecar"
  env RECT=1: the pasted mask is the box itself (default); ELLIPSE=1: an ellipse inside the box"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

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
flat = Image.new('RGBA', crop.size, (58, 60, 64, 255))
flat.alpha_composite(crop)
flat.convert('RGB').resize((bw, bh), Image.LANCZOS).save(stem + '.in.png')
refs = [stem + '.in.png']
refnote = []
for i, spec in enumerate([s for s in os.environ.get('REFS', '').split(';') if s.strip()], 2):
    p, box = spec.split('@')
    b = tuple(int(v) for v in box.split(','))
    r = Image.open(p).convert('RGBA').crop(b)
    fl = Image.new('RGBA', r.size, (58, 60, 64, 255))
    fl.alpha_composite(r)
    kk = 768 / max(r.size)
    fl = fl.convert('RGB').resize((max(16, int(r.width * kk)), max(16, int(r.height * kk))), Image.LANCZOS)
    rp = f'{stem}.ref{i}.png'
    fl.save(rp)
    refs.append(rp)
    refnote.append({'image': i, 'from': p.replace('\\', '/'), 'box': list(b)})
job = {'refs': refs, 'out': stem, 'seed': seed, 'size': [bw, bh], 'den': 1.0, 'hires': 1.0, 'hden': 0.2,
       'pos': 'Edit image 1. ' + text + ' Keep everything else in image 1 exactly the same: framing, perspective, pose, colours, lighting, line work and style.',
       'key': 'patch2'}
json.dump(job, open(stem + '.job.json', 'w'), indent=1)
if not (os.environ.get('REUSE') == '1' and os.path.exists(stem + '.full.png')):   # REUSE=1: re-composite an existing render
    r = subprocess.run([PY, '-s', os.path.join(HERE, 'gen2.py'), stem + '.job.json'], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stdout + r.stderr)
fix = Image.open(stem + '.full.png').convert('RGBA').resize((cw, ch), Image.LANCZOS)
m = Image.new('L', (cw, ch), 0)
f = int(os.environ.get('FEATHER', max(4, pad // 3)))
bx = (x0 - cx0 - f // 2, y0 - cy0 - f // 2, x1 - cx0 + f // 2, y1 - cy0 + f // 2)
if os.environ.get('ELLIPSE') == '1':
    ImageDraw.Draw(m).ellipse(bx, fill=255)
else:
    m.paste(255, bx)
m = m.filter(ImageFilter.GaussianBlur(f / 2))
if os.environ.get('MATCH') == '1':
    # Klein drifts the colour of a small crop (warmer, brighter): match the repaint's per-channel mean and spread
    # inside the fault box to the source's, so the pasted part keeps the picture's own palette
    fa = np.asarray(fix).astype(float)
    ca = np.asarray(crop).astype(float)
    bb = (slice(max(0, y0 - cy0), y1 - cy0), slice(max(0, x0 - cx0), x1 - cx0))
    sel = ca[bb][..., 3] > 128
    for c in range(3):
        fs, cs = fa[bb][..., c][sel], ca[bb][..., c][sel]
        if fs.size > 16:
            fa[..., c] = (fa[..., c] - fs.mean()) / max(fs.std(), 1) * cs.std() + cs.mean()
    fix = Image.fromarray(fa.clip(0, 255).astype(np.uint8))
if os.environ.get('KEEPALPHA') == '1':
    fa = np.asarray(fix).copy()
    fa[..., 3] = np.asarray(crop)[..., 3]
    fix = Image.fromarray(fa)
res = im.copy()
res.paste(Image.composite(fix, crop, m), (cx0, cy0))
if im.getextrema()[3] == (255, 255):
    res = res.convert('RGB')
res.save(out)
entry = {'step': 'patch2', 'script': 'film-set/scripts/patch2.py', 'box': [x0, y0, x1, y1], 'pad': pad, 'feather': f,
         'seed': seed, 'colourMatch': os.environ.get('MATCH') == '1', 'identityRefs': refnote, 'instruction': text, 'what': os.environ.get('WHAT', '')}
sp = os.path.splitext(src)[0]
sp = sp[:-5] if sp.endswith('.full') else sp
prov_in = sp + '.prov.json'
op = os.path.splitext(out)[0]
op = op[:-5] if op.endswith('.full') else op
if os.path.exists(prov_in):
    pv = json.load(open(prov_in))
    pv['postProcess'] = pv.get('postProcess', []) + [entry]
    json.dump(pv, open(op + '.prov.json', 'w'), indent=1)
print(json.dumps(entry))
