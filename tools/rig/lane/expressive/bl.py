"""bl.py <out.mp4> <pose> --today <rigdir> --new <rigdir> --crop x0,y0,x1,y1 [--panel 560] [--frames 30] [--lead 12] [--hold 60] : an OFFLINE motion clip of the move from the idle into a pose, no browser: the painting the game draws today
(hard swap of the idle painting for the pose's at half-way), today's rig and the new rig, each blended exactly as the engine blends (rig-pose.mjs: the pose parameters linearly from the idle's rest, the part state of the key from t >= 0.5),
quadInOut eased. The colour render is the fitter's own numpy rasteriser (no engine, no glow, nearest texel): a preview, not the game. Env XID, XWORK."""
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from xl import *

FF = 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg'
a = sys.argv[1:]
out, pose = a[0], a[1]
opt = lambda n, d=None: a[a.index(n) + 1] if n in a else d  # noqa: E731
crop = tuple(int(v) for v in opt('--crop').split(','))
PW = int(opt('--panel', 560))
NB, LEAD, HOLD = int(opt('--frames', 30)), int(opt('--lead', 12)), int(opt('--hold', 60))
W, H = rig_size()
x0, y0, x1, y1 = crop
PH = int(PW * (y1 - y0) / (x1 - x0)) // 2 * 2
PAD = 0


def synth(key, t):
    """The key blended t of the way from the rest pose: every bone's rot, offset and scale, the root, linearly (the engine's blendPose); the part state of the key from t >= 0.5."""
    k = {'bones': {}, 'root': {}}
    for n, tr in key.get('bones', {}).items():
        b = {}
        if 'rot' in tr:
            b['rot'] = tr['rot'] * t
        if 'dx' in tr or 'dy' in tr:
            b['dx'], b['dy'] = tr.get('dx', 0.0) * t, tr.get('dy', 0.0) * t
        if 'sx' in tr or 'sy' in tr:
            sx = tr.get('sx', 1.0)
            sy = tr.get('sy', sx)
            b['sx'], b['sy'] = 1 + (sx - 1) * t, 1 + (sy - 1) * t
        k['bones'][n] = b
    r = key.get('root', {})
    k['root'] = {c: r.get(c, 0.0) * t for c in ('dx', 'dy', 'rot') if c in r}
    if t >= 0.5 and key.get('parts'):
        k['parts'] = key['parts']
    return k


def ease(t):
    return 2 * t * t if t < 0.5 else 1 - 2 * (1 - t) ** 2


def frame_of(model, rig, t):
    pose_key(model, rig, synth(rig['keys'][pose], t))
    r = render_pose(model, W, H, pad=0)
    return over(BG, r)


rigs = []
for label, d in (("B  today's rig (offline preview)", opt('--today')), ('C  the expressive rig (offline preview)', opt('--new'))):
    rig, T, model = load_model(d)
    rigs.append((label, rig, model))
cache = {}
tmp = pathlib.Path(tempfile.mkdtemp(prefix='bl-'))


def panel_rig(i, t):
    key = (i, round(t, 4))
    if key not in cache:
        label, rig, model = rigs[i]
        im = frame_of(model, rig, t).crop((x0, y0, x1, y1)).resize((PW, PH), Image.LANCZOS)
        cache[key] = im
    return cache[key]


paint = {k: over(BG, painting_in_master(k, pad=0).crop((x0, y0, x1, y1)).convert('RGBA')).resize((PW, PH), Image.LANCZOS) for k in ('idle', pose)}
seq = [0.0] * LEAD + [ease((i + 1) / NB) for i in range(NB)] + [1.0] * HOLD
for n, t in enumerate(seq):
    sheet = Image.new('RGB', ((PW * 3 + 8 * 2) // 2 * 2, PH + 44), (11, 10, 18))
    d = ImageDraw.Draw(sheet)
    d.text((10, 6), f'{XID.upper()}  idle into {pose.upper()}  (OFFLINE preview, no game: the same blend the engine uses; the painting set swaps at the half-way)  t = {t:.2f}', fill=(227, 185, 74))
    pan = [paint['idle'] if t < 0.5 else paint[pose], panel_rig(0, t), panel_rig(1, t)]
    titles = ['A  the painting the game draws today', rigs[0][0], rigs[1][0]]
    for j, p in enumerate(pan):
        sheet.paste(p, (j * (PW + 8), 44))
        d.text((j * (PW + 8) + 6, 48), titles[j], fill=(255, 235, 120))
    sheet.save(tmp / f'a{n:04d}.png')
subprocess.run([FF, '-y', '-loglevel', 'error', '-framerate', '60', '-i', str(tmp / 'a%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', out], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print('wrote', out, len(seq), 'frames')
