# Oversoul Paragon, option C: a whole-figure low-denoise repaint of a COPY of the locked Paragon idle, so the
# "blue cast" (wiki, Oversoul (Final Fantasy X-2), revid 4041089: "the fiend's body absorbs pyreflies, acquiring a
# blue cast") lives in the paint rather than in an engine tint. Derived from repaint.py (Trema production): the RGBA
# painting is flattened on white, scaled so its long side is LONG, repainted by SDXL only under the figure's alpha
# (VAEEncode + SetLatentNoiseMask), brought back to source size and pasted back ONLY inside the alpha. The alpha is
# the source's, unchanged, so the silhouette, sidecar and anchor stay valid.
# Usage: oversoul_repaint.py in.png outdir seed:denoise[,seed:denoise...] "prompt" "negative"
import sys, json, time, uuid, urllib.request, urllib.parse, os
import numpy as np
from PIL import Image
inp, outdir, runs, pos, neg = sys.argv[1:6]
LONG = 1344
BASE = 'http://127.0.0.1:8188'
src = Image.open(inp).convert('RGBA'); A = src.getchannel('A')
w, h = src.size; s = LONG / max(w, h); W8 = int(round(w * s / 8) * 8); H8 = int(round(h * s / 8) * 8)
flat = Image.new('RGBA', src.size, (255, 255, 255, 255)); flat.alpha_composite(src)
GRADE = float(os.environ.get('GRADE', '0'))  # 0 = the painting as is; k>0 = pre-grade toward a luminance-kept blue cast
fr = np.asarray(flat.convert('RGB')).astype(np.float32) / 255
if GRADE > 0:
    lum = (fr @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
    blue = np.array([0.62, 0.80, 1.18], np.float32)  # cool blue cast, luminance-weighted ~1.0
    if os.environ.get('GRADEMODE') == 'map':  # gradient map: shadows navy, mids blue, highlights pale cyan
        stops = np.array([0, 0.35, 0.7, 1.0], np.float32)
        cols = np.array([[8, 10, 30], [30, 62, 140], [92, 152, 235], [222, 240, 255]], np.float32) / 255
        L = lum[..., 0]; mapped = np.stack([np.interp(L, stops, cols[:, c]) for c in range(3)], -1)
    else:
        mapped = np.clip(lum * blue, 0, 1)
    fr = np.clip(fr * (1 - GRADE) + mapped * GRADE, 0, 1)
    a = (np.asarray(A).astype(np.float32) / 255)[..., None]
    fr = fr * a + (1 - a)  # the white surround stays white
guide = Image.fromarray((fr * 255).round().astype(np.uint8)).resize((W8, H8), Image.LANCZOS)
mbig = A.point(lambda v: 255 if v > 8 else 0).resize((W8, H8), Image.LANCZOS)
tmp = os.path.join(outdir, 'tmp'); os.makedirs(tmp, exist_ok=True)
tag = uuid.uuid4().hex[:8]
gp = f'{tmp}/g-{tag}.png'; mp = f'{tmp}/m-{tag}.png'; guide.save(gp); mbig.save(mp)
def pending():
    q = json.load(urllib.request.urlopen(BASE + '/queue', timeout=10)); return len(q['queue_pending'])
def upload(path, name):
    boundary = uuid.uuid4().hex; data = open(path, 'rb').read()
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n').encode() + data + \
           (f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{boundary}--\r\n').encode()
    req = urllib.request.Request(BASE + '/upload/image', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    return json.load(urllib.request.urlopen(req))['name']
g = upload(gp, f'gpu3-oversoul-g-{tag}.png'); m = upload(mp, f'gpu3-oversoul-m-{tag}.png')
def wf(seed, denoise):
    return {
 '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'animagine-xl-4.0-opt.safetensors'}},
 '2': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['1', 1]}},
 '3': {'class_type': 'CLIPTextEncode', 'inputs': {'text': neg, 'clip': ['1', 1]}},
 '4': {'class_type': 'LoadImage', 'inputs': {'image': g}},
 '5': {'class_type': 'LoadImageMask', 'inputs': {'image': m, 'channel': 'red'}},
 '6': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['4', 0], 'vae': ['1', 2]}},
 '7': {'class_type': 'SetLatentNoiseMask', 'inputs': {'samples': ['6', 0], 'mask': ['5', 0]}},
 '8': {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': ['2', 0], 'negative': ['3', 0], 'latent_image': ['7', 0],
        'seed': seed, 'steps': 30, 'cfg': 6, 'sampler_name': 'euler_ancestral', 'scheduler': 'normal', 'denoise': denoise}},
 '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['1', 2]}},
 '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': 'gpu3-oversoul/repaint'}},
}
def done(p):
    hh = json.load(urllib.request.urlopen(BASE + '/history/' + p, timeout=10))
    return p in hh and (hh[p].get('outputs') or hh[p].get('status', {}).get('status_str') == 'error')
jobs = []
for r in runs.split(','):
    seed, dn = r.split(':'); seed = int(seed); dn = float(dn)
    while len([j for j in jobs if not done(j[2])]) >= 2:
        time.sleep(3)
    while pending() >= 3:
        print('[wait] queue busy', flush=True); time.sleep(15)
    req = urllib.request.Request(BASE + '/prompt', data=json.dumps({'prompt': wf(seed, dn), 'client_id': 'gpu3-oversoul'}).encode(), headers={'Content-Type': 'application/json'})
    pid = json.load(urllib.request.urlopen(req))['prompt_id']; jobs.append((seed, dn, pid)); print('queued', seed, dn, pid, flush=True)

def collect(sd, d, p):
    outp = f'{outdir}/c-{sd}-{int(d*100)}.png'
    while True:
        hh = json.load(urllib.request.urlopen(BASE + '/history/' + p, timeout=10))
        if p in hh and hh[p].get('outputs'): break
        if p in hh and hh[p].get('status', {}).get('status_str') == 'error':
            print('ERROR', sd, json.dumps(hh[p]['status'])[:600], flush=True); return
        time.sleep(3)
    info = hh[p]['outputs']['10']['images'][0]
    msgs = hh[p].get('status', {}).get('messages', [])
    ts = [mm[1].get('timestamp') for mm in msgs if mm[0] in ('execution_start', 'execution_success')]
    exec_s = (ts[-1] - ts[0]) / 1000 if len(ts) >= 2 else None
    url = BASE + '/view?' + urllib.parse.urlencode({'filename': info['filename'], 'subfolder': info['subfolder'], 'type': info['type']})
    rawp = f'{tmp}/raw-{sd}-{int(d*100)}.png'; open(rawp, 'wb').write(urllib.request.urlopen(url).read())
    raw = Image.open(rawp).convert('RGB')
    mx = max(raw.getextrema()[i][1] for i in range(3))
    if mx < 8:
        print('BLACK FRAME: stop rendering and report', sd, flush=True); sys.exit(3)
    small = raw.resize((w, h), Image.LANCZOS).convert('RGBA'); small.putalpha(A)
    small.save(outp)
    json.dump({'seed': sd, 'denoise': d, 'prompt': pos, 'negative': neg, 'model': 'animagine-xl-4.0-opt.safetensors',
               'steps': 30, 'cfg': 6, 'sampler': 'euler_ancestral', 'long': LONG, 'upscaled': [W8, H8], 'input': inp,
               'inputSha256': '0e3972b558c07d71c70eb60f4d71752ea9b91601e81293e39673146f65e569b9 (locked Paragon idle, a copy)',
               'mask': 'source alpha > 8', 'preGrade': GRADE, 'gradeMode': os.environ.get('GRADEMODE', 'lumBlue'), 'alpha': 'source alpha unchanged', 'ipAdapter': 'none (img2img from the painting carries identity)',
               'execSeconds': exec_s}, open(outp[:-4] + '.json', 'w'), indent=1)
    print('saved', outp, 'exec', exec_s, 'maxRGB', mx, flush=True)
for (sd, d, p) in jobs:
    collect(sd, d, p)
