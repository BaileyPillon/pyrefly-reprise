# Masked img2img on a guide image through ComfyUI native nodes (SetLatentNoiseMask), one prompt at a time.
# Usage: maskpaint.py guide.png mask.png out.png seed denoise "prompt" "negative"
# The caller composites the result back only inside the mask, so pixels outside stay the approved plate's.
import sys, json, time, uuid, urllib.request, urllib.parse, os
guide, mask, out, seed, denoise, pos, neg = sys.argv[1:8]
BASE = 'http://127.0.0.1:8188'

def pending():
    q = json.load(urllib.request.urlopen(BASE + '/queue', timeout=10))
    return len(q['queue_pending'])

def upload(path, name):
    boundary = uuid.uuid4().hex
    data = open(path, 'rb').read()
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n').encode() + data + \
           (f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{boundary}--\r\n').encode()
    req = urllib.request.Request(BASE + '/upload/image', data=body, headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    return json.load(urllib.request.urlopen(req))['name']

while pending() >= 3:
    print('[wait] queue busy'); time.sleep(15)
tag = uuid.uuid4().hex[:8]
g = upload(guide, f'fa-guide-{tag}.png'); m = upload(mask, f'fa-mask-{tag}.png')
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
 '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': 'fallen-aeons-options/road'}},
}
req = urllib.request.Request(BASE + '/prompt', data=json.dumps({'prompt': wf, 'client_id': 'fa-options'}).encode(), headers={'Content-Type': 'application/json'})
pid = json.load(urllib.request.urlopen(req))['prompt_id']
t0 = time.time()
while True:
    h = json.load(urllib.request.urlopen(BASE + '/history/' + pid, timeout=10))
    if pid in h and h[pid].get('outputs'):
        break
    if pid in h and h[pid].get('status', {}).get('status_str') == 'error':
        print('ERROR', json.dumps(h[pid]['status'])[:800]); sys.exit(1)
    time.sleep(2)
info = h[pid]['outputs']['10']['images'][0]
st = h[pid].get('status', {}).get('messages', [])
url = BASE + '/view?' + urllib.parse.urlencode({'filename': info['filename'], 'subfolder': info['subfolder'], 'type': info['type']})
open(out, 'wb').write(urllib.request.urlopen(url).read())
from PIL import Image
im = Image.open(out).convert('RGB'); mx = max(im.getextrema()[i][1] for i in range(3))
print('saved', out, 'wall', round(time.time() - t0, 1), 's', 'maxRGB', mx)
if mx < 8:
    print('BLACK FRAME: stop rendering and report'); sys.exit(3)
json.dump({'seed': int(seed), 'denoise': float(denoise), 'prompt': pos, 'negative': neg, 'model': 'animagine-xl-4.0-opt.safetensors',
           'steps': 30, 'cfg': 6, 'sampler': 'euler_ancestral', 'guide': guide, 'mask': mask}, open(out[:-4] + '.json', 'w'), indent=1)
