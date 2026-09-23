"""Seam-band-only repaint (FFX only), METHOD-CHECK step 2.5: crop the region, upscale to a
1024-ish canvas on flat grey, img2img Animagine XL 4.0 Opt with SetLatentNoiseMask over the
band mask only, low denoise; Lanczos back; composite inside the band only (feathered).
One prompt at a time; waits for the shared queue to be empty for 3 minutes first.
usage: seam_repaint.py <rgba.png> <band_mask.png (L, white = repaint)> <x0,y0,x1,y1> <denoise> <seed> <out.png> "<tags>" """
import sys, json, time, uuid, urllib.request, urllib.parse, io, os
import numpy as np, cv2
COMFY = 'http://127.0.0.1:8188'
src, maskp, box, den, seed, out, tags = sys.argv[1:8]
x0, y0, x1, y1 = map(int, box.split(',')); den = float(den); seed = int(seed)
im = cv2.imread(src, -1).astype(np.float32) / 255
band = cv2.imread(maskp, 0).astype(np.float32) / 255
crop = im[y0:y1, x0:x1]; bc = band[y0:y1, x0:x1]
s = 1024 / min(crop.shape[:2]); W = int(round(crop.shape[1] * s / 8) * 8); H = int(round(crop.shape[0] * s / 8) * 8)
a = crop[..., 3:4]; rgb = crop[..., :3] * a + 0.5 * (1 - a)
big = cv2.resize(rgb, (W, H), interpolation=cv2.INTER_LANCZOS4)
bm = cv2.resize(bc, (W, H), interpolation=cv2.INTER_LINEAR)
def get(path):
    return json.loads(urllib.request.urlopen(COMFY + path, timeout=60).read())
def upload(arr, name):
    ok, buf = cv2.imencode('.png', arr)
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n').encode() + buf.tobytes() + f'\r\n--{b}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{b}--\r\n'.encode()
    r = urllib.request.Request(COMFY + '/upload/image', data=body, headers={'Content-Type': f'multipart/form-data; boundary={b}'})
    return json.loads(urllib.request.urlopen(r, timeout=60).read())['name']
# the shared-GPU rule: queue empty for 3 minutes
calm = None
while True:
    q = get('/queue')
    if q['queue_running'] or q['queue_pending']: calm = None
    elif calm is None: calm = time.time()
    if calm and time.time() - calm >= 180: break
    time.sleep(10)
iname = upload(np.clip(big * 255, 0, 255).astype(np.uint8), f'evrae-r3-{seed}-init.png')
mname = upload(np.clip(np.dstack([bm] * 3) * 255, 0, 255).astype(np.uint8), f'evrae-r3-{seed}-mask.png')
neg = 'lowres, bad anatomy, text, error, worst quality, low quality, low score, bad score, average score, jpeg artifacts, signature, watermark, username, blurry, artist name, human, person, flat color, vector art, gradient, sticker'
pos = 'no humans, evrae \(ff10\), final fantasy x, monster, eastern dragon, sea serpent, ' + tags + ', painterly, official art, soft shading, detailed scales, masterpiece, high score, great score, absurdres'
wf = {
 '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'animagine-xl-4.0-opt.safetensors'}},
 '2': {'class_type': 'LoadImage', 'inputs': {'image': iname}},
 '3': {'class_type': 'LoadImageMask', 'inputs': {'image': mname, 'channel': 'red'}},
 '4': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['2', 0], 'vae': ['1', 2]}},
 '5': {'class_type': 'SetLatentNoiseMask', 'inputs': {'samples': ['4', 0], 'mask': ['3', 0]}},
 '6': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['1', 1]}},
 '7': {'class_type': 'CLIPTextEncode', 'inputs': {'text': neg, 'clip': ['1', 1]}},
 '8': {'class_type': 'KSampler', 'inputs': {'model': ['1', 0], 'positive': ['6', 0], 'negative': ['7', 0], 'latent_image': ['5', 0], 'seed': seed, 'steps': 28, 'cfg': 5.5, 'sampler_name': 'euler_ancestral', 'scheduler': 'normal', 'denoise': den}},
 '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['1', 2]}},
 '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': 'evrae-r3/seam'}},
}
r = urllib.request.Request(COMFY + '/prompt', data=json.dumps({'prompt': wf, 'client_id': 'evrae-r3'}).encode(), headers={'Content-Type': 'application/json'})
pid = json.loads(urllib.request.urlopen(r, timeout=60).read())['prompt_id']
while True:
    h = get('/history/' + pid)
    if pid in h and h[pid].get('outputs'):
        break
    if pid in h and h[pid].get('status', {}).get('status_str') == 'error': raise SystemExit('comfy error ' + json.dumps(h[pid]['status']))
    time.sleep(3)
e = h[pid]
img = [i for o in e['outputs'].values() for i in o.get('images', [])][0]
q = urllib.parse.urlencode({'filename': img['filename'], 'subfolder': img.get('subfolder', ''), 'type': img.get('type', 'output')})
gen = cv2.imdecode(np.frombuffer(urllib.request.urlopen(COMFY + '/view?' + q).read(), np.uint8), cv2.IMREAD_COLOR).astype(np.float32) / 255
msgs = e.get('status', {}).get('messages', [])
ts = [m[1].get('timestamp') for m in msgs if m[0] in ('execution_start', 'execution_success')]
secs = (ts[-1] - ts[0]) / 1000 if len(ts) >= 2 else None
small = cv2.resize(gen, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
k = cv2.GaussianBlur(bc, (0, 0), 1.2)[..., None]
res = im.copy()
res[y0:y1, x0:x1, :3] = crop[..., :3] * (1 - k) + small * k
save = np.clip(res * 255 + 0.5, 0, 255).astype(np.uint8)
cv2.imwrite(out, save)
if gen.mean() < 0.02: print('ALL-BLACK FRAME: bad GPU state, stop'); sys.exit(3)
json.dump({'prompt_id': pid, 'seconds': secs, 'seed': seed, 'denoise': den, 'box': [x0, y0, x1, y1], 'canvas': [W, H], 'tags': tags}, open(out.replace('.png', '.json'), 'w'), indent=1)
print(json.dumps({'prompt_id': pid, 'seconds': secs, 'mean': float(gen.mean())}))
