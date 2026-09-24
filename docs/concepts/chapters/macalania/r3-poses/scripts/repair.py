"""Masked repair repaint (FFX only, Ch. VII casts, D-045): repaint ONLY <mask> of <base.png>; the SD init may be a
guided copy <init.png> (same canvas); pixels outside the mask are byte-identical to <base> (MAD 0 by construction:
the feather lies inside the mask), and <protect> pixels inside the mask are pasted back from <base>.
Shared-GPU rule: /queue empty 3 minutes before the prompt. Animagine XL 4.0 Opt, RealESRGAN crop to 1024.
usage: repair.py <base.png> <init.png> <mask.png> <protect.png|-> <out_prefix> <denoise> <seeds,comma> "<pos>" "<neg>" [margin]"""
import sys, json, time, uuid, urllib.request, urllib.parse, os
import numpy as np, cv2
COMFY = 'http://127.0.0.1:8188'
basep, initp, maskp, protp, outp, den, seeds, pos, neg = sys.argv[1:10]
margin = int(sys.argv[10]) if len(sys.argv) > 10 else 48
den = float(den); seeds = [int(s) for s in seeds.split(',')]
B8 = cv2.imread(basep, -1); base = B8.astype(np.float32) / 255
init = cv2.imread(initp, -1).astype(np.float32) / 255
m = (cv2.imread(maskp, 0) > 0) & (B8[..., 3] > 127)
prot = (cv2.imread(protp, 0) > 0) if protp != '-' else np.zeros_like(m)
m &= ~prot
ys, xs = np.nonzero(m)
x0, y0 = max(0, xs.min() - margin), max(0, ys.min() - margin)
x1, y1 = min(m.shape[1], xs.max() + margin + 1), min(m.shape[0], ys.max() + margin + 1)
crop = init[y0:y1, x0:x1]; mc = m[y0:y1, x0:x1].astype(np.float32)
a = crop[..., 3:4]; rgb = crop[..., :3] * a + 0.42 * (1 - a)
s = 1024 / min(crop.shape[:2]); W = int(round(crop.shape[1] * s / 8) * 8); H = int(round(crop.shape[0] * s / 8) * 8)
mbig = cv2.GaussianBlur(cv2.resize(mc, (W, H), interpolation=cv2.INTER_LINEAR), (0, 0), 3)


def get(path):
    return json.loads(urllib.request.urlopen(COMFY + path, timeout=60).read())


def upload(arr, name):
    ok, buf = cv2.imencode('.png', arr); b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n').encode() \
        + buf.tobytes() + f'\r\n--{b}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{b}--\r\n'.encode()
    r = urllib.request.Request(COMFY + '/upload/image', data=body, headers={'Content-Type': f'multipart/form-data; boundary={b}'})
    return json.loads(urllib.request.urlopen(r, timeout=60).read())['name']


tag = os.path.basename(outp)
iname = upload(np.clip(rgb * 255, 0, 255).astype(np.uint8), f'ch7-cast-{tag}-init.png')
mname = upload(np.clip(np.dstack([mbig] * 3) * 255, 0, 255).astype(np.uint8), f'ch7-cast-{tag}-mask.png')
wf = {
    '1': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'animagine-xl-4.0-opt.safetensors'}},
    '2': {'class_type': 'LoadImage', 'inputs': {'image': iname}},
    '3': {'class_type': 'UpscaleModelLoader', 'inputs': {'model_name': 'RealESRGAN_x4plus.pth'}},
    '4': {'class_type': 'ImageUpscaleWithModel', 'inputs': {'upscale_model': ['3', 0], 'image': ['2', 0]}},
    '5': {'class_type': 'ImageScale', 'inputs': {'image': ['4', 0], 'upscale_method': 'lanczos', 'width': W, 'height': H, 'crop': 'disabled'}},
    '6': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['5', 0], 'vae': ['1', 2]}},
    '7': {'class_type': 'LoadImage', 'inputs': {'image': mname}},
    '8': {'class_type': 'ImageToMask', 'inputs': {'image': ['7', 0], 'channel': 'red'}},
    '9': {'class_type': 'SetLatentNoiseMask', 'inputs': {'samples': ['6', 0], 'mask': ['8', 0]}},
    '10': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['1', 1]}},
    '11': {'class_type': 'CLIPTextEncode', 'inputs': {'text': neg, 'clip': ['1', 1]}},
}
for i, sd in enumerate(seeds):
    k, d, sv = str(100 + 3 * i), str(101 + 3 * i), str(102 + 3 * i)
    wf[k] = {'class_type': 'KSampler', 'inputs': {'seed': sd, 'steps': 28, 'cfg': 6, 'sampler_name': 'euler_ancestral', 'scheduler': 'normal',
                                                  'denoise': den, 'model': ['1', 0], 'positive': ['10', 0], 'negative': ['11', 0], 'latent_image': ['9', 0]}}
    wf[d] = {'class_type': 'VAEDecode', 'inputs': {'samples': [k, 0], 'vae': ['1', 2]}}
    wf[sv] = {'class_type': 'SaveImage', 'inputs': {'images': [d, 0], 'filename_prefix': f'pyrefly/ch7-cast-{tag}-s{sd}'}}
calm = None
while True:
    q = get('/queue')
    if q['queue_running'] or q['queue_pending']:
        calm = None
    elif calm is None:
        calm = time.time()
    if calm and time.time() - calm >= 180:
        break
    time.sleep(10)
r = urllib.request.Request(COMFY + '/prompt', data=json.dumps({'prompt': wf, 'client_id': 'ch7-casts'}).encode(), headers={'Content-Type': 'application/json'})
pid = json.loads(urllib.request.urlopen(r, timeout=60).read())['prompt_id']
while True:
    h = get('/history/' + pid)
    if pid in h and h[pid].get('status', {}).get('completed'):
        break
    if pid in h and h[pid].get('status', {}).get('status_str') == 'error':
        raise SystemExit('comfy error ' + json.dumps(h[pid]['status'])[:1500])
    time.sleep(3)
e = h[pid]; msgs = e.get('status', {}).get('messages', [])
t = {mm[0]: mm[1].get('timestamp') for mm in msgs}
secs = ((t.get('execution_success') or 0) - (t.get('execution_start') or 0)) / 1000
# feather INSIDE the mask only: full weight in the interior, 0.35 on the mask's edge ring, 0 outside
er = cv2.erode(mc.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)
kk = np.clip(cv2.GaussianBlur(er, (0, 0), 1.0), 0, 1) * mc
kk = np.maximum(kk, mc * 0.35)[..., None]
res_meta = []
for node, o in e['outputs'].items():
    for img in o.get('images', []):
        sd = int(img['filename'].split('-s')[-1].split('_')[0])
        q = urllib.parse.urlencode({'filename': img['filename'], 'subfolder': img.get('subfolder', ''), 'type': img.get('type', 'output')})
        gen = cv2.imdecode(np.frombuffer(urllib.request.urlopen(COMFY + '/view?' + q).read(), np.uint8), cv2.IMREAD_COLOR).astype(np.float32) / 255
        black = float(gen.mean()) < 0.02
        small = cv2.resize(gen, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA)
        cv2.imwrite(f'{outp}.s{sd}.gen.png', np.clip(small * 255, 0, 255).astype(np.uint8))
        res = base.copy()
        res[y0:y1, x0:x1, :3] = base[y0:y1, x0:x1, :3] * (1 - kk) + small * kk
        o8 = np.clip(res * 255 + 0.5, 0, 255).astype(np.uint8)
        o8[~m] = B8[~m]
        cv2.imwrite(f'{outp}.s{sd}.png', o8)
        res_meta.append(dict(seed=sd, black=black, mean=float(gen.mean()),
                             madOutsideMask=float(np.abs(o8[~m].astype(int) - B8[~m].astype(int)).mean())))
meta = dict(prompt_id=pid, seconds=secs, denoise=den, box=[int(x0), int(y0), int(x1), int(y1)], canvas=[W, H], maskPx=int(m.sum()),
            pos=pos, neg=neg, outputs=res_meta)
json.dump(meta, open(outp + '.repair.json', 'w'), indent=1)
with open(os.path.join(os.path.dirname(os.path.abspath(outp)), 'gpu-log.tsv'), 'a') as f:
    f.write(f'{time.strftime("%Y-%m-%dT%H:%M:%S")}\t{pid}\t{tag}\t{secs:.1f}\n')
print(json.dumps(dict(prompt_id=pid, seconds=secs, box=meta['box'], outputs=res_meta)))
if any(rm['black'] for rm in res_meta):
    print('ALL-BLACK FRAME: bad GPU state, stop'); sys.exit(3)
