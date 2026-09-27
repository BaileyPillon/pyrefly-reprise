"""Film set (2026-09-27): one ComfyUI job on FLUX.2 Klein 9B in edit mode, the Film direction Bailey picked.
Inputs are OUR OWN renders only (the Film idle picks, and later our own pose picks) as ReferenceLatents;
no retail image, no IP-Adapter, no trace, never mirrored. Base render, then the same detail pass as the
hi-fi round (RealESRGAN x4, resized to HIRES x the base, a low-denoise re-render on the tail of the Flux2
schedule). Saves <out>.base.png, <out>.full.png and <out>.prov.json.

den == 1: a fresh render from noise, conditioned on the reference(s) and the text (poses).
den <  1: img2img from the FIRST reference (scaled to the canvas; same aspect only) on the tail of an 8-step
          schedule, still conditioned on the references (small repairs that must keep the layout).
Rules: submits only while fewer than 3 prompts are pending; never restarts ComfyUI; an all-black frame
raises (stop and report).
Usage: python gen2.py <job.json>   job = {refs:[png], out, seed, size:[w,h], den, hires, hden, pos, key}
"""
import json, sys, time, uuid, urllib.request, urllib.parse, os
import numpy as np
from PIL import Image

API = 'http://127.0.0.1:8188'


def call(path, data=None, raw=False):
    req = urllib.request.Request(API + path, data=data, headers={'Content-Type': 'application/json'} if data and not raw else {})
    with urllib.request.urlopen(req, timeout=60) as r:
        b = r.read()
    return b if raw else json.loads(b)


def upload(p):
    bnd = uuid.uuid4().hex
    name = uuid.uuid4().hex[:8] + '-' + os.path.basename(p)
    body = (f'--{bnd}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\n'
            'Content-Type: image/png\r\n\r\n').encode() + open(p, 'rb').read() + \
        f'\r\n--{bnd}\r\nContent-Disposition: form-data; name="subfolder"\r\n\r\npyrefly-ff7-film\r\n--{bnd}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{bnd}--\r\n'.encode()
    req = urllib.request.Request(API + '/upload/image', data=body, headers={'Content-Type': f'multipart/form-data; boundary={bnd}'})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.loads(r.read())
    return f"{j.get('subfolder')}/{j['name']}" if j.get('subfolder') else j['name']


def wait_queue():
    while True:
        q = call('/queue')
        if len(q['queue_pending']) < 2:   # after our submit, pending stays < 3
            return
        time.sleep(15)


def graph(imgs, w, h, W2, H2, seed, den, hden, pos, prefix):
    g = {'un': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'flux-2-klein-9b-kv-fp8.safetensors', 'weight_dtype': 'default'}},
         'cl': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen_3_8b_fp8mixed.safetensors', 'type': 'flux2', 'device': 'default'}},
         'va': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'flux2-vae.safetensors'}},
         'p': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['cl', 0]}},
         'sa': {'class_type': 'KSamplerSelect', 'inputs': {'sampler_name': 'euler'}},
         'upm': {'class_type': 'UpscaleModelLoader', 'inputs': {'model_name': 'RealESRGAN_x4plus.pth'}}}
    cond = ['p', 0]
    for i, im in enumerate(imgs):
        g[f'img{i}'] = {'class_type': 'LoadImage', 'inputs': {'image': im}}
        g[f'rs{i}'] = {'class_type': 'ImageScaleToTotalPixels', 'inputs': {'image': [f'img{i}', 0], 'upscale_method': 'lanczos', 'megapixels': 1.5, 'resolution_steps': 16}}
        g[f're{i}'] = {'class_type': 'VAEEncode', 'inputs': {'pixels': [f'rs{i}', 0], 'vae': ['va', 0]}}
        g[f'rl{i}'] = {'class_type': 'ReferenceLatent', 'inputs': {'conditioning': cond, 'latent': [f're{i}', 0]}}
        cond = [f'rl{i}', 0]
    g['n'] = {'class_type': 'ConditioningZeroOut', 'inputs': {'conditioning': cond}}
    g['gd1'] = {'class_type': 'CFGGuider', 'inputs': {'model': ['un', 0], 'positive': cond, 'negative': ['n', 0], 'cfg': 1.0}}
    g['no1'] = {'class_type': 'RandomNoise', 'inputs': {'noise_seed': seed}}
    if den >= 1:
        g['lat'] = {'class_type': 'EmptyFlux2LatentImage', 'inputs': {'width': w, 'height': h, 'batch_size': 1}}
        g['sc1'] = {'class_type': 'Flux2Scheduler', 'inputs': {'steps': 4, 'width': w, 'height': h}}
        g['ks1'] = {'class_type': 'SamplerCustomAdvanced', 'inputs': {'noise': ['no1', 0], 'guider': ['gd1', 0], 'sampler': ['sa', 0], 'sigmas': ['sc1', 0], 'latent_image': ['lat', 0]}}
    else:
        g['sc0'] = {'class_type': 'ImageScale', 'inputs': {'image': ['img0', 0], 'upscale_method': 'lanczos', 'width': w, 'height': h, 'crop': 'center'}}
        g['en0'] = {'class_type': 'VAEEncode', 'inputs': {'pixels': ['sc0', 0], 'vae': ['va', 0]}}
        g['sc1'] = {'class_type': 'Flux2Scheduler', 'inputs': {'steps': 8, 'width': w, 'height': h}}
        g['sp1'] = {'class_type': 'SplitSigmas', 'inputs': {'sigmas': ['sc1', 0], 'step': int(round(8 * (1 - den)))}}
        g['ks1'] = {'class_type': 'SamplerCustomAdvanced', 'inputs': {'noise': ['no1', 0], 'guider': ['gd1', 0], 'sampler': ['sa', 0], 'sigmas': ['sp1', 1], 'latent_image': ['en0', 0]}}
    g['dec1'] = {'class_type': 'VAEDecode', 'inputs': {'samples': ['ks1', 0], 'vae': ['va', 0]}}
    g['sv1'] = {'class_type': 'SaveImage', 'inputs': {'filename_prefix': prefix + '-base', 'images': ['dec1', 0]}}
    # detail pass
    g['up'] = {'class_type': 'ImageUpscaleWithModel', 'inputs': {'upscale_model': ['upm', 0], 'image': ['dec1', 0]}}
    g['up2'] = {'class_type': 'ImageScale', 'inputs': {'image': ['up', 0], 'upscale_method': 'lanczos', 'width': W2, 'height': H2, 'crop': 'disabled'}}
    g['p2'] = {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['cl', 0]}}
    g['n2'] = {'class_type': 'ConditioningZeroOut', 'inputs': {'conditioning': ['p2', 0]}}
    g['enc2'] = {'class_type': 'VAEEncode', 'inputs': {'pixels': ['up2', 0], 'vae': ['va', 0]}}
    g['no2'] = {'class_type': 'RandomNoise', 'inputs': {'noise_seed': seed + 1}}
    g['gd2'] = {'class_type': 'CFGGuider', 'inputs': {'model': ['un', 0], 'positive': ['p2', 0], 'negative': ['n2', 0], 'cfg': 1.0}}
    g['sc2'] = {'class_type': 'Flux2Scheduler', 'inputs': {'steps': 8, 'width': W2, 'height': H2}}
    g['sp'] = {'class_type': 'SplitSigmas', 'inputs': {'sigmas': ['sc2', 0], 'step': int(round(8 * (1 - hden)))}}
    g['ks2'] = {'class_type': 'SamplerCustomAdvanced', 'inputs': {'noise': ['no2', 0], 'guider': ['gd2', 0], 'sampler': ['sa', 0], 'sigmas': ['sp', 1], 'latent_image': ['enc2', 0]}}
    g['dec2'] = {'class_type': 'VAEDecodeTiled', 'inputs': {'samples': ['ks2', 0], 'vae': ['va', 0], 'tile_size': 1024, 'overlap': 64, 'temporal_size': 64, 'temporal_overlap': 8}}
    g['sv2'] = {'class_type': 'SaveImage', 'inputs': {'filename_prefix': prefix + '-full', 'images': ['dec2', 0]}}
    return g


def fetch(img, dst):
    q = urllib.parse.urlencode({'filename': img['filename'], 'subfolder': img.get('subfolder', ''), 'type': img.get('type', 'output')})
    open(dst, 'wb').write(call('/view?' + q, raw=True))
    a = np.asarray(Image.open(dst).convert('L'), float)
    if a.mean() < 5:
        raise SystemExit(f'BLACK FRAME {dst}: stop and report (never restart ComfyUI)')


def main():
    job = json.load(open(sys.argv[1]))
    w, h = job['size']
    hires, hden, den, seed = job.get('hires', 1.5), job.get('hden', 0.35), job.get('den', 1.0), job['seed']
    W2, H2 = int(w * hires) // 16 * 16, int(h * hires) // 16 * 16
    stem = job['out']
    os.makedirs(os.path.dirname(stem), exist_ok=True)
    imgs = [upload(p) for p in job['refs']]
    prefix = 'pyrefly-ff7-film/' + os.path.basename(stem)
    g = graph(imgs, w, h, W2, H2, seed, den, hden, job['pos'], prefix)
    lock = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/_work/submit.lock'   # our own runners submit one at a time
    while True:
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            break
        except FileExistsError:
            if time.time() - os.path.getmtime(lock) > 900:   # a stale lock from a killed run: take it over
                os.utime(lock)
                fd = None
                break
            time.sleep(2)
    try:
        wait_queue()
        pid = call('/prompt', json.dumps({'prompt': g, 'client_id': 'pyrefly-ff7-film'}).encode())['prompt_id']
        time.sleep(1)
    finally:
        if fd is not None:
            os.close(fd)
        open(lock + '.free', 'w').write(str(time.time()))
        os.replace(lock, lock + '.released')   # rename, not delete: the next runner may take it
    t0 = time.time()
    while True:
        hst = call('/history/' + pid)
        if pid in hst:
            st = hst[pid].get('status', {})
            if st.get('status_str') == 'error':
                raise SystemExit('ERROR ' + json.dumps(st)[:1200])
            if st.get('completed'):
                break
        time.sleep(3)
    outs = hst[pid]['outputs']
    fetch(outs['sv1']['images'][0], stem + '.base.png')
    fetch(outs['sv2']['images'][0], stem + '.full.png')
    json.dump({'engine': 'flux-2-klein-9b-kv-fp8 (edit mode, ReferenceLatent)', 'references': [r.replace('\\', '/') for r in job['refs']],
               'seed': seed, 'denoise': den, 'baseSize': [w, h],
               'detailPass': {'upscaler': 'RealESRGAN_x4plus.pth', 'size': [W2, H2], 'denoise': hden, 'seed': seed + 1},
               'promptKey': job.get('key'), 'positive': job['pos'], 'seconds': round(time.time() - t0),
               'retailInput': 'none (our own Film renders only; no IP-Adapter, no trace)', 'mirrored': False},
              open(stem + '.prov.json', 'w'), indent=1)
    print('OK', stem, round(time.time() - t0), 's')


main()
