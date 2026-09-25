"""Nooj shade attempt 6 (FFX-2 only): crop-upscale masked repaint with the IP-Adapter forced on the padded portrait.

The guide (a raw with a flat block-in painted over the region) is cropped to `box`, upscaled so its long side is 1024,
repainted by SDXL only under the mask (VAEEncode + SetLatentNoiseMask), brought back down, and pasted over `base` ONLY
inside the feathered mask; every pixel outside it stays exactly as it was. The IP-Adapter (METHOD-nooj-2 point 3) sees
the portrait square-padded on white plus its square head crop, batched and concat, ip-adapter-plus SDXL, ease in,
0.2..0.8, forced on; every sidecar records both refs and `forced: true`.

Shared ComfyUI: waits while 3 or more prompts are pending, never restarts it; an all-black frame exits 3 (stop).

  python nooj6_repaint.py --base in.png --guide guide.png --mask mask.png --box x0,y0,x1,y1 --seed N --denoise D \
      --pos "..." --neg "..." --out out.png [--ipa 0.5]
"""
import argparse, json, time, uuid, urllib.request, urllib.parse
from PIL import Image

BASE = 'http://127.0.0.1:8188'
PREP5 = 'D:/Tools/pyrefly-scratch/nooj5/prep'
REFS = [f'{PREP5}/ref-portrait-square.png', f'{PREP5}/ref-portrait-head.png']
CKPT = 'animagine-xl-4.0-opt.safetensors'
STYLE = 'official art, cel shading, soft shading, vibrant colors, detailed, masterpiece, high score, great score, absurdres'
NEG_BASE = ('lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, worst quality, low quality, '
            'jpeg artifacts, signature, watermark, blurry, aura, glow, magic, sparks, particles, motion lines')

ap = argparse.ArgumentParser()
for k in ('base', 'guide', 'mask', 'box', 'pos', 'neg', 'out'):
    ap.add_argument('--' + k, required=True)
ap.add_argument('--seed', type=int, required=True)
ap.add_argument('--denoise', type=float, required=True)
ap.add_argument('--ipa', type=float, default=0.5)
ap.add_argument('--refs', default=','.join(REFS))
a = ap.parse_args()
refs = a.refs.split(',')

x0, y0, x1, y1 = map(int, a.box.split(','))
base = Image.open(a.base).convert('RGB'); guide = Image.open(a.guide).convert('RGB'); M = Image.open(a.mask).convert('L')
crop = guide.crop((x0, y0, x1, y1)); mcrop = M.crop((x0, y0, x1, y1))
w, h = crop.size; s = 1024 / max(w, h); W8 = int(round(w * s / 8) * 8); H8 = int(round(h * s / 8) * 8)
tmp = 'D:/Tools/pyrefly-scratch/nooj6/tmp'
import os; os.makedirs(tmp, exist_ok=True)
tag = uuid.uuid4().hex[:8]
gp, mp = f'{tmp}/g-{tag}.png', f'{tmp}/m-{tag}.png'
crop.resize((W8, H8), Image.LANCZOS).save(gp); mcrop.resize((W8, H8), Image.LANCZOS).save(mp)


def pending():
    return len(json.load(urllib.request.urlopen(BASE + '/queue', timeout=10))['queue_pending'])


def upload(path, name):
    b = uuid.uuid4().hex; data = open(path, 'rb').read()
    body = (f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n').encode() + data + \
           (f'\r\n--{b}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{b}--\r\n').encode()
    req = urllib.request.Request(BASE + '/upload/image', data=body, headers={'Content-Type': f'multipart/form-data; boundary={b}'})
    return json.load(urllib.request.urlopen(req))['name']


def flat_png(path):
    """Refs with alpha are flattened on white (comfy.mjs stageImage does the same)."""
    im = Image.open(path)
    if im.mode == 'RGBA':
        f = Image.new('RGB', im.size, (255, 255, 255)); f.paste(im, mask=im.split()[-1])
        p = f'{tmp}/r-{uuid.uuid4().hex[:8]}.png'; f.save(p); return p
    return path


while pending() >= 3:
    print('[wait] queue busy'); time.sleep(15)
g = upload(gp, f'nooj6-g-{tag}.png'); m = upload(mp, f'nooj6-m-{tag}.png')
rnames = [upload(flat_png(r), f'nooj6-r{i}-{tag}.png') for i, r in enumerate(refs)]
pos = f'{a.pos}, {STYLE}'; neg = f'{NEG_BASE}, {a.neg}'
wf = {
    '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': CKPT}},
    '2': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['1', 1]}},
    '3': {'class_type': 'CLIPTextEncode', 'inputs': {'text': neg, 'clip': ['1', 1]}},
    '4': {'class_type': 'LoadImage', 'inputs': {'image': g}},
    '5': {'class_type': 'LoadImageMask', 'inputs': {'image': m, 'channel': 'red'}},
    '6': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['4', 0], 'vae': ['1', 2]}},
    '7': {'class_type': 'SetLatentNoiseMask', 'inputs': {'samples': ['6', 0], 'mask': ['5', 0]}},
    '21': {'class_type': 'IPAdapterModelLoader', 'inputs': {'ipadapter_file': 'ip-adapter-plus_sdxl_vit-h.safetensors'}},
    '22': {'class_type': 'CLIPVisionLoader', 'inputs': {'clip_name': 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors'}},
    '8': {'class_type': 'KSampler', 'inputs': {'model': ['23', 0], 'positive': ['2', 0], 'negative': ['3', 0], 'latent_image': ['7', 0],
          'seed': a.seed, 'steps': 30, 'cfg': 6, 'sampler_name': 'euler_ancestral', 'scheduler': 'normal', 'denoise': a.denoise}},
    '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['1', 2]}},
    '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': 'pyrefly/nooj6/repaint'}},
}
for i, rn in enumerate(rnames):
    wf[str(200 + i)] = {'class_type': 'LoadImage', 'inputs': {'image': rn}}
batch = ['200', 0]
for i in range(1, len(rnames)):
    wf[str(210 + i)] = {'class_type': 'ImageBatch', 'inputs': {'image1': batch, 'image2': [str(200 + i), 0]}}; batch = [str(210 + i), 0]
wf['23'] = {'class_type': 'IPAdapterAdvanced', 'inputs': {'model': ['1', 0], 'ipadapter': ['21', 0], 'image': batch, 'weight': a.ipa,
            'weight_type': 'ease in', 'combine_embeds': 'concat', 'start_at': 0.2, 'end_at': 0.8, 'embeds_scaling': 'K+V', 'clip_vision': ['22', 0]}}
req = urllib.request.Request(BASE + '/prompt', data=json.dumps({'prompt': wf, 'client_id': 'pyrefly-nooj6'}).encode(), headers={'Content-Type': 'application/json'})
pid = json.load(urllib.request.urlopen(req))['prompt_id']; t0 = time.time()
while True:
    hh = json.load(urllib.request.urlopen(BASE + '/history/' + pid, timeout=10))
    if pid in hh and hh[pid].get('outputs'): break
    if pid in hh and hh[pid].get('status', {}).get('status_str') == 'error':
        print('ERROR', json.dumps(hh[pid]['status'])[:800]); raise SystemExit(1)
    time.sleep(2)
info = hh[pid]['outputs']['10']['images'][0]
url = BASE + '/view?' + urllib.parse.urlencode({'filename': info['filename'], 'subfolder': info['subfolder'], 'type': info['type']})
os.makedirs(os.path.dirname(a.out), exist_ok=True)
rawp = a.out[:-4] + '.patch.png'; open(rawp, 'wb').write(urllib.request.urlopen(url).read())
raw = Image.open(rawp).convert('RGB')
mx = max(raw.getextrema()[i][1] for i in range(3))
if mx < 8:
    open('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/STOP-BLACK.txt', 'a').write(f'{time.ctime()} {a.out} all-black\n')
    print('BLACK FRAME: stop rendering and report'); raise SystemExit(3)
small = raw.resize((w, h), Image.LANCZOS)
res = base.copy(); region = res.crop((x0, y0, x1, y1))
res.paste(Image.composite(small, region, mcrop), (x0, y0))
res.save(a.out)
json.dump({'game': 'ffx2', 'subject': 'nooj-shade', 'status': 'CANDIDATE', 'attempt': 6, 'kind': 'masked repaint',
           'method': 'docs/concepts/chapters/gippal/production/METHOD-nooj-2.md', 'base': a.base, 'guide': a.guide, 'mask': a.mask,
           'box': [x0, y0, x1, y1], 'upscaled': [W8, H8], 'seed': a.seed, 'denoise': a.denoise, 'positive': pos, 'negative': neg,
           'model': CKPT, 'steps': 30, 'cfg': 6, 'sampler': 'euler_ancestral',
           'ipadapter': {'file': 'ip-adapter-plus_sdxl_vit-h.safetensors', 'weight': a.ipa, 'type': 'ease in', 'start': 0.2, 'end': 0.8,
                         'combine': 'concat', 'images': [r.split('/')[-1] for r in refs], 'forced': True},
           'maxRgb': mx, 'seconds': round(time.time() - t0, 1), 'generatedAt': time.strftime('%Y-%m-%dT%H:%M:%S')},
          open(a.out[:-4] + '.json', 'w'), indent=1)
print('saved', a.out, 'maxRGB', mx, 'wall', round(time.time() - t0, 1))
