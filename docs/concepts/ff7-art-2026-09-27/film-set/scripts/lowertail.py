"""Film set: the Guard Scorpion idle (tail lowered) painted on the SAME machine as the tail-raised pick, so the game
can swap the two without the body changing. A crop around the tail (and the rear of the body) from our own
raised render goes through FLUX.2 Klein edit mode (gen2.py, the crop as the only reference) with a "lower the
tail" instruction; then only the pixels that changed (the old raised tail, now background, and the new low tail)
are pasted back into the raised render, by a difference mask (smoothed, feathered, restricted to the crop and
kept off the front of the body). Everything outside the mask stays pixel for pixel the raised pick: the shell,
the rust scuffs, the disc, the head, the rifles and the legs. Never mirrors; our own render only.
Usage: python lowertail.py <raised.full.png> <out-stem> <seed> [x0 y0 x1 y1]"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
PY = 'D:/Tools/ComfyUI/python_embeded/python.exe'
src, stem, seed = sys.argv[1], sys.argv[2], int(sys.argv[3])
x0, y0, x1, y1 = (int(t) for t in sys.argv[4:8]) if len(sys.argv) > 7 else (880, 0, 2304, 1440)
im = Image.open(src).convert('RGB')
crop = im.crop((x0, y0, x1, y1))
cw, ch = crop.size
k = 1024 / max(cw, ch)
bw, bh = int(cw * k) // 16 * 16, int(ch * k) // 16 * 16
crop.resize((bw, bh), Image.LANCZOS).save(stem + '.in.png')
pos = ('Edit this picture. Lower the tail of this red robot: the same segmented red tail, with the same dark grey '
       'joints, rust scuffs and the same laser emitter with its glowing cyan lens at the tip, now comes out of the '
       'rear joint and trails back to the RIGHT and slightly down, held LOW, its segments no higher than the top of '
       'the rear leg, curving gently upward only at the very end, with the cyan lens at the tip pointing back and up '
       'to the right. The raised tail is gone completely: above the body there is nothing but the plain dark grey '
       'background, no tail, no lens, no cable. Keep everything else exactly the same: the red shell with its rust '
       'scuffs and rivets, the flat disc housing on the back, the cables, the legs and feet, the colours, the size '
       'and position, the line work and style, the plain dark grey background.')
job = {'refs': [stem + '.in.png'], 'out': stem + '.edit', 'seed': seed, 'size': [bw, bh], 'den': 1.0, 'hires': 1.0,
       'hden': 0.2, 'pos': pos, 'key': 'film-gs-lowertail'}
json.dump(job, open(stem + '.job.json', 'w'), indent=1)
if not (os.environ.get('REUSE') == '1' and os.path.exists(stem + '.edit.full.png')):   # REUSE=1: re-composite only
    r = subprocess.run([PY, '-s', os.path.join(HERE, 'gen2.py'), stem + '.job.json'], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stdout + r.stderr)
fix = Image.open(stem + '.edit.full.png').convert('RGB').resize((cw, ch), Image.LANCZOS)
a, b = np.asarray(crop).astype(float), np.asarray(fix).astype(float)
# Klein moves things by a few px: find the edit's shift on the shell (crop x 150-750, y 450-1050) and undo it
ref = a[450:1050, 150:750].mean(-1)
best = (1e18, 0, 0)
for dy in range(-16, 17, 2):
    for dx in range(-16, 17, 2):
        e = np.abs(np.roll(b, (dy, dx), (0, 1))[450:1050, 150:750].mean(-1) - ref).mean()
        best = min(best, (e, dy, dx))
for dy in range(best[1] - 1, best[1] + 2):
    for dx in range(best[2] - 1, best[2] + 2):
        e = np.abs(np.roll(b, (dy, dx), (0, 1))[450:1050, 150:750].mean(-1) - ref).mean()
        best = min(best, (e, dy, dx))
shift = [int(best[1]), int(best[2])]
b = np.roll(b, shift, (0, 1))
# the source's own studio grey, as a smooth field (blurred known background of the SOURCE, never the steel)
ca, cb = a.max(-1) - a.min(-1), b.max(-1) - b.min(-1)
med_a = np.median(a[ca < 12], 0)
bga = (ca < 12) & (np.abs(a - med_a).max(-1) < 18)
wk = ndimage.gaussian_filter(bga.astype(float), 60)
field = np.stack([ndimage.gaussian_filter(a[..., c] * bga, 60) for c in range(3)], -1) / np.maximum(wk, 1e-3)[..., None]
# the edit's grey is a few levels lighter: where the edit shows plain background, use the source's field
bgb_med = np.median(b[(cb < 12) & (np.abs(b.mean(-1) - np.median(b.mean(-1)[cb < 12])) < 20)], 0)
isbg = ndimage.gaussian_filter(((cb < 14) & (np.abs(b - bgb_med).max(-1) < 14)).astype(float), 1.5)
b = b * (1 - isbg[..., None]) + (field + (b - bgb_med)) * isbg[..., None]
X = np.arange(cw)[None, :] + x0
Y = np.arange(ch)[:, None] + y0
# what the edit may change: the rear joint and everything right of it (x >= REAR), where it differs from the source
REAR = int(os.environ.get('REAR', 1640))
d = np.abs(a - b).max(-1)
m = (ndimage.gaussian_filter(d, 3) > 30) & (X >= REAR)
m = ndimage.binary_closing(m, iterations=10)
m = ndimage.binary_dilation(m, iterations=8) & (X >= REAR - 20)
m |= (X >= 1800) & (Y < 680)                                    # the old raised tail right of the joint: the edit wins
# the old raised tail above the disc housing and the lens: plain background (the source's field), nothing new there
clear = (X >= 1060) & (X < 1800) & (Y < 435)
b[clear] = field[clear]
m |= clear
w = ndimage.gaussian_filter(m.astype(float), 5)
w[clear] = 1.0
out = np.asarray(im).astype(float).copy()
out[y0:y1, x0:x1] = a * (1 - w[..., None]) + b * w[..., None]
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(stem + '.full.png')
mv = (a * 0.4).astype(np.uint8)
mv[m] = [255, 0, 255]
Image.fromarray(mv).resize((cw // 3, ch // 3)).save(stem + '.mask.jpg', quality=80)
prov = json.load(open(stem + '.edit.prov.json'))
prov['postProcess'] = [{'step': 'lowertail', 'script': 'film-set/scripts/lowertail.py', 'source': src.replace('\\', '/'),
                        'crop': [x0, y0, x1, y1], 'maskPixels': int(m.sum()), 'editShiftYX': shift, 'rearX': REAR,
                        'what': 'only the changed pixels (old raised tail cleared, new low tail) pasted into the raised pick'}]
json.dump(prov, open(stem + '.prov.json', 'w'), indent=1)
print(json.dumps({'step': 'lowertail', 'out': stem + '.full.png', 'maskPixels': int(m.sum()), 'shift': shift}))
