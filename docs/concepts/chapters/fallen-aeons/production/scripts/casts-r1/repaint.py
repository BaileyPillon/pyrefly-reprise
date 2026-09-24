# Crop-upscale masked repaint (method r3 step 2.5): the crop of an RGBA painting is flattened on white, upscaled so
# its long side is 1024, repainted by SDXL only under the mask (VAEEncode + SetLatentNoiseMask), brought back down,
# and pasted into the original ONLY inside the feathered mask. Pixels outside the mask stay exactly as they were.
# Usage: repaint.py in.png mask.png out.png x0,y0,x1,y1 seed denoise "prompt" "negative" [--alpha keep|mask]
import sys, json, time, uuid, urllib.request, urllib.parse
import numpy as np
from PIL import Image, ImageFilter
inp, maskp, out, box, seed, denoise, pos, neg = sys.argv[1:9]
alpha_mode = sys.argv[10] if len(sys.argv) > 10 and sys.argv[9] == '--alpha' else 'keep'
BASE = 'http://127.0.0.1:8188'
x0, y0, x1, y1 = map(int, box.split(','))
src = Image.open(inp).convert('RGBA'); M = Image.open(maskp).convert('L')
crop = src.crop((x0, y0, x1, y1)); mcrop = M.crop((x0, y0, x1, y1))
w, h = crop.size; s = 1024 / max(w, h); W8 = int(round(w * s / 8) * 8); H8 = int(round(h * s / 8) * 8)
flat = Image.new('RGBA', crop.size, (255, 255, 255, 255)); flat.alpha_composite(crop)
guide = flat.convert('RGB').resize((W8, H8), Image.LANCZOS)
mbig = mcrop.resize((W8, H8), Image.LANCZOS)
tmpdir = 'D:/Tools/pyrefly-scratch/sisters-casts/tmp'
tag = uuid.uuid4().hex[:8]
gp = f'{tmpdir}/g-{tag}.png'; mp = f'{tmpdir}/m-{tag}.png'; guide.save(gp); mbig.save(mp)
def pending():
    return len(json.load(urllib.request.urlopen(BASE + '/queue', timeout=10))['queue_pending'])
def upload(path, name):
    boundary = uuid.uuid4().hex; data = open(path, 'rb').read()
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n').encode() + data + \
           (f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{boundary}--\r\n').encode()
    req = urllib.request.Request(BASE + '/upload/image', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    return json.load(urllib.request.urlopen(req))['name']
while pending() >= 3:
    print('[wait] queue busy'); time.sleep(15)
g = upload(gp, f'sc-g-{tag}.png'); m = upload(mp, f'sc-m-{tag}.png')
wf = {
 '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'animagine-xl-4.0-opt.safetensors'}},
 '2': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['1', 1]}},
 '3': {'class_type': 'CLIPTextEncode', 'inputs': {'text': neg, 'clip': ['1', 1]}},
 '4': {'class_type': 'LoadImage', 'inputs': {'image': g}},
 '5': {'class_type': 'LoadImageMask', 'inputs': {'image': m, 'channel': 'red'}},
 '6': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['4', 0], 'vae': ['1', 2]}},
 '7': {'class_type': 'SetLatentNoiseMask', 'inputs': {'samples': ['6', 0], 'mask': ['5', 0]}},
 '8': {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': ['2', 0], 'negative': ['3', 0], 'latent_image': ['7', 0],
        'seed': int(seed), 'steps': 30, 'cfg': 6, 'sampler_name': 'euler_ancestral', 'scheduler': 'normal', 'denoise': float(denoise)}},
 '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['1', 2]}},
 '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': 'sisters-casts/repaint'}},
}
req = urllib.request.Request(BASE + '/prompt', data=json.dumps({'prompt': wf, 'client_id': 'sisters-casts'}).encode(), headers={'Content-Type': 'application/json'})
pid = json.load(urllib.request.urlopen(req))['prompt_id']; t0 = time.time()
while True:
    hh = json.load(urllib.request.urlopen(BASE + '/history/' + pid, timeout=10))
    if pid in hh and hh[pid].get('outputs'): break
    if pid in hh and hh[pid].get('status', {}).get('status_str') == 'error':
        print('ERROR', json.dumps(hh[pid]['status'])[:800]); sys.exit(1)
    time.sleep(2)
info = hh[pid]['outputs']['10']['images'][0]
msgs = hh[pid].get('status', {}).get('messages', [])
ts = [m[1].get('timestamp') for m in msgs if m[0] in ('execution_start', 'execution_success')]
exec_s = (ts[-1] - ts[0]) / 1000 if len(ts) >= 2 else None
url = BASE + '/view?' + urllib.parse.urlencode({'filename': info['filename'], 'subfolder': info['subfolder'], 'type': info['type']})
rawp = out[:-4] + '.raw.png'; open(rawp, 'wb').write(urllib.request.urlopen(url).read())
raw = Image.open(rawp).convert('RGB')
mx = max(raw.getextrema()[i][1] for i in range(3))
if mx < 8:
    print('BLACK FRAME: stop rendering and report'); sys.exit(3)
small = raw.resize((w, h), Image.LANCZOS)
res = src.copy()
patch = Image.new('RGBA', (w, h)); patch.paste(small, (0, 0))
if alpha_mode == 'keep':
    patch.putalpha(crop.getchannel('A'))
else:
    patch.putalpha(Image.fromarray(np.maximum(np.asarray(crop.getchannel('A')), np.asarray(mcrop)).astype(np.uint8)))
base = res.crop((x0, y0, x1, y1))
blended = Image.composite(patch, base, mcrop)
res.paste(blended, (x0, y0))
res.save(out)
json.dump({'seed': int(seed), 'denoise': float(denoise), 'prompt': pos, 'negative': neg, 'model': 'animagine-xl-4.0-opt.safetensors',
           'steps': 30, 'cfg': 6, 'sampler': 'euler_ancestral', 'box': [x0, y0, x1, y1], 'upscaled': [W8, H8], 'input': inp, 'mask': maskp,
           'execSeconds': exec_s}, open(out[:-4] + '.json', 'w'), indent=1)
print('saved', out, 'exec', exec_s, 'wall', round(time.time() - t0, 1), 'maxRGB', mx)
