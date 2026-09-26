"""Chapter VII pause plate A2: the install master (FFX only).

The 2x master route every installed pause plate uses: RealESRGAN_x4plus x4 in ComfyUI, then
lanczos 0.5, saved as WebP quality 88 (2688x1536). No sampler, no model beyond the upscaler: the
pixels are A2's own. Waits for the shared ComfyUI queue to be empty for 60 s first (one job).

usage: python master_a2.py <a2.png> <out.2x.webp>
"""
import io
import json
import sys
import time
import urllib.parse
import urllib.request
import uuid

from PIL import Image

COMFY = 'http://127.0.0.1:8188'
src, out = sys.argv[1:3]


def get(path):
    return json.loads(urllib.request.urlopen(COMFY + path, timeout=60).read())


def upload(path, name):
    buf = open(path, 'rb').read()
    b = uuid.uuid4().hex
    body = (f'--{b}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\n'
            'Content-Type: image/png\r\n\r\n').encode() + buf + \
        f'\r\n--{b}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{b}--\r\n'.encode()
    r = urllib.request.Request(COMFY + '/upload/image', data=body,
                               headers={'Content-Type': f'multipart/form-data; boundary={b}'})
    return json.loads(urllib.request.urlopen(r, timeout=60).read())['name']


calm = None
while True:
    q = get('/queue')
    if q['queue_running'] or q['queue_pending']:
        calm = None
    elif calm is None:
        calm = time.time()
    if calm and time.time() - calm >= 60:
        break
    time.sleep(5)

iname = upload(src, 'ch7-pause-a2-src.png')
wf = {
    '1': {'class_type': 'LoadImage', 'inputs': {'image': iname}},
    '2': {'class_type': 'UpscaleModelLoader', 'inputs': {'model_name': 'RealESRGAN_x4plus.pth'}},
    '3': {'class_type': 'ImageUpscaleWithModel', 'inputs': {'upscale_model': ['2', 0], 'image': ['1', 0]}},
    '4': {'class_type': 'ImageScaleBy', 'inputs': {'image': ['3', 0], 'upscale_method': 'lanczos', 'scale_by': 0.5}},
    '5': {'class_type': 'SaveImage', 'inputs': {'images': ['4', 0], 'filename_prefix': 'ch7-pause/a2-master'}},
}
r = urllib.request.Request(COMFY + '/prompt', data=json.dumps({'prompt': wf, 'client_id': 'ch7-pause-a2'}).encode(),
                           headers={'Content-Type': 'application/json'})
pid = json.loads(urllib.request.urlopen(r, timeout=60).read())['prompt_id']
while True:
    h = get('/history/' + pid)
    if pid in h and h[pid].get('outputs'):
        break
    if pid in h and h[pid].get('status', {}).get('status_str') == 'error':
        raise SystemExit('comfy error ' + json.dumps(h[pid]['status']))
    time.sleep(2)
img = [i for o in h[pid]['outputs'].values() for i in o.get('images', [])][0]
qs = urllib.parse.urlencode({'filename': img['filename'], 'subfolder': img.get('subfolder', ''),
                             'type': img.get('type', 'output')})
up = Image.open(io.BytesIO(urllib.request.urlopen(COMFY + '/view?' + qs).read())).convert('RGB')
assert up.size == (2688, 1536), up.size
lo, hi = up.getextrema()[0]
assert hi > 16, 'black frame from the upscaler: restart ComfyUI (ART-PIPELINE), do not re-roll'
up.save(out, 'WEBP', quality=88, method=6)
print('master', out, up.size, 'prompt', pid)
