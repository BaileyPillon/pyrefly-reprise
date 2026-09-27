"""Hi-fi round (2026-09-27): one ComfyUI job = our own code-drawn sketch -> a base render -> a 2x-class
detail pass (RealESRGAN x4 upscale, resized to HIRES x the base, then a low-denoise re-render at that
size). Saves <out>.base.png, <out>.full.png (the detail pass) and <out>.prov.json.

Engines (all local, nothing downloaded):
  sdxl  - animagine-xl-4.0-opt (the house checkpoint), img2img from the sketch   [direction 1: house]
  zimg  - z_image_turbo_bf16_v2 (+ qwen_3_4b, ae VAE), img2img from the sketch      [direction 2: key art]
  klein - flux-2-klein-9b-kv-fp8 (+ qwen_3_8b, flux2 VAE), the sketch as a ReferenceLatent (edit mode),
          detail pass as img2img on the tail of the Flux2 schedule                [direction 3: anime film]
Rules: submits only while fewer than 3 prompts are pending; never restarts ComfyUI; an all-black
frame raises (stop and report). No retail image is an input: the only image input is our sketch.
Usage: python gen.py <engine> <sketch.png> <out-stem> <seed> <denoise> <hires> <hiresDenoise> <promptKey>
"""
import json, sys, time, uuid, urllib.request, urllib.parse, os
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from prompts import PROMPTS

API = 'http://127.0.0.1:8188'


def call(path, data=None, raw=False):
    req = urllib.request.Request(API + path, data=data, headers={'Content-Type': 'application/json'} if data and not raw else {})
    with urllib.request.urlopen(req, timeout=60) as r:
        b = r.read()
    return b if raw else json.loads(b)


def upload(p):
    bnd = uuid.uuid4().hex
    body = (f'--{bnd}\r\nContent-Disposition: form-data; name="image"; filename="{os.path.basename(p)}"\r\n'
            'Content-Type: image/png\r\n\r\n').encode() + open(p, 'rb').read() + \
        f'\r\n--{bnd}\r\nContent-Disposition: form-data; name="subfolder"\r\n\r\npyrefly-ff7-hifi\r\n--{bnd}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{bnd}--\r\n'.encode()
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


def graph(engine, img, w, h, W2, H2, seed, den, hden, pos, neg, prefix):
    g = {'img': {'class_type': 'LoadImage', 'inputs': {'image': img}},
         'scl': {'class_type': 'ImageScale', 'inputs': {'image': ['img', 0], 'upscale_method': 'lanczos', 'width': w, 'height': h, 'crop': 'disabled'}},
         'upm': {'class_type': 'UpscaleModelLoader', 'inputs': {'model_name': 'RealESRGAN_x4plus.pth'}},
         'sv1': {'class_type': 'SaveImage', 'inputs': {'filename_prefix': prefix + '-base', 'images': ['dec1', 0]}},
         'up': {'class_type': 'ImageUpscaleWithModel', 'inputs': {'upscale_model': ['upm', 0], 'image': ['dec1', 0]}},
         'up2': {'class_type': 'ImageScale', 'inputs': {'image': ['up', 0], 'upscale_method': 'lanczos', 'width': W2, 'height': H2, 'crop': 'disabled'}},
         'sv2': {'class_type': 'SaveImage', 'inputs': {'filename_prefix': prefix + '-full', 'images': ['dec2', 0]}}}
    if engine == 'sdxl':
        g.update({
            'ck': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'animagine-xl-4.0-opt.safetensors'}},
            'p': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['ck', 1]}},
            'n': {'class_type': 'CLIPTextEncode', 'inputs': {'text': neg, 'clip': ['ck', 1]}},
            'enc1': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['scl', 0], 'vae': ['ck', 2]}},
            'ks1': {'class_type': 'KSampler', 'inputs': {'seed': seed, 'steps': 30, 'cfg': 5.0, 'sampler_name': 'euler_ancestral', 'scheduler': 'normal', 'denoise': den, 'model': ['ck', 0], 'positive': ['p', 0], 'negative': ['n', 0], 'latent_image': ['enc1', 0]}},
            'dec1': {'class_type': 'VAEDecode', 'inputs': {'samples': ['ks1', 0], 'vae': ['ck', 2]}},
            'enc2': {'class_type': 'VAEEncodeTiled', 'inputs': {'pixels': ['up2', 0], 'vae': ['ck', 2], 'tile_size': 1024, 'overlap': 64, 'temporal_size': 64, 'temporal_overlap': 8}},
            'ks2': {'class_type': 'KSampler', 'inputs': {'seed': seed + 1, 'steps': 30, 'cfg': 4.5, 'sampler_name': 'dpmpp_2m', 'scheduler': 'karras', 'denoise': hden, 'model': ['ck', 0], 'positive': ['p', 0], 'negative': ['n', 0], 'latent_image': ['enc2', 0]}},
            'dec2': {'class_type': 'VAEDecodeTiled', 'inputs': {'samples': ['ks2', 0], 'vae': ['ck', 2], 'tile_size': 1024, 'overlap': 64, 'temporal_size': 64, 'temporal_overlap': 8}}})
    elif engine == 'zimg':
        g.update({
            'un': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'z_image_turbo_bf16_v2.safetensors', 'weight_dtype': 'default'}},
            'ms': {'class_type': 'ModelSamplingAuraFlow', 'inputs': {'model': ['un', 0], 'shift': 3.0}},
            'cl': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen_3_4b.safetensors', 'type': 'lumina2', 'device': 'default'}},
            'va': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
            'p': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['cl', 0]}},
            'n': {'class_type': 'CLIPTextEncode', 'inputs': {'text': '', 'clip': ['cl', 0]}},
            'enc1': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['scl', 0], 'vae': ['va', 0]}},
            'ks1': {'class_type': 'KSampler', 'inputs': {'seed': seed, 'steps': 10, 'cfg': 1.0, 'sampler_name': 'res_multistep', 'scheduler': 'simple', 'denoise': den, 'model': ['ms', 0], 'positive': ['p', 0], 'negative': ['n', 0], 'latent_image': ['enc1', 0]}},
            'dec1': {'class_type': 'VAEDecode', 'inputs': {'samples': ['ks1', 0], 'vae': ['va', 0]}},
            'enc2': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['up2', 0], 'vae': ['va', 0]}},
            'ks2': {'class_type': 'KSampler', 'inputs': {'seed': seed + 1, 'steps': 10, 'cfg': 1.0, 'sampler_name': 'res_multistep', 'scheduler': 'simple', 'denoise': hden, 'model': ['ms', 0], 'positive': ['p', 0], 'negative': ['n', 0], 'latent_image': ['enc2', 0]}},
            'dec2': {'class_type': 'VAEDecodeTiled', 'inputs': {'samples': ['ks2', 0], 'vae': ['va', 0], 'tile_size': 1024, 'overlap': 64, 'temporal_size': 64, 'temporal_overlap': 8}}})
    elif engine == 'klein':
        steps2 = 8
        g.update({
            'un': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'flux-2-klein-9b-kv-fp8.safetensors', 'weight_dtype': 'default'}},
            'cl': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen_3_8b_fp8mixed.safetensors', 'type': 'flux2', 'device': 'default'}},
            'va': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'flux2-vae.safetensors'}},
            'p': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['cl', 0]}},
            'enc0': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['scl', 0], 'vae': ['va', 0]}},
            'pr': {'class_type': 'ReferenceLatent', 'inputs': {'conditioning': ['p', 0], 'latent': ['enc0', 0]}},
            'n': {'class_type': 'ConditioningZeroOut', 'inputs': {'conditioning': ['pr', 0]}},
            'lat': {'class_type': 'EmptyFlux2LatentImage', 'inputs': {'width': w, 'height': h, 'batch_size': 1}},
            'no1': {'class_type': 'RandomNoise', 'inputs': {'noise_seed': seed}},
            'gd1': {'class_type': 'CFGGuider', 'inputs': {'model': ['un', 0], 'positive': ['pr', 0], 'negative': ['n', 0], 'cfg': 1.0}},
            'sa': {'class_type': 'KSamplerSelect', 'inputs': {'sampler_name': 'euler'}},
            'sc1': {'class_type': 'Flux2Scheduler', 'inputs': {'steps': 4, 'width': w, 'height': h}},
            'ks1': {'class_type': 'SamplerCustomAdvanced', 'inputs': {'noise': ['no1', 0], 'guider': ['gd1', 0], 'sampler': ['sa', 0], 'sigmas': ['sc1', 0], 'latent_image': ['lat', 0]}},
            # den < 1: img2img on the tail of an 8-step schedule from the sketch itself (layout held harder)
            'sc1b': {'class_type': 'Flux2Scheduler', 'inputs': {'steps': 8, 'width': w, 'height': h}},
            'sp1': {'class_type': 'SplitSigmas', 'inputs': {'sigmas': ['sc1b', 0], 'step': int(round(8 * (1 - den)))}},
            'dec1': {'class_type': 'VAEDecode', 'inputs': {'samples': ['ks1', 0], 'vae': ['va', 0]}},
            'p2': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['cl', 0]}},
            'n2': {'class_type': 'ConditioningZeroOut', 'inputs': {'conditioning': ['p2', 0]}},
            'enc2': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['up2', 0], 'vae': ['va', 0]}},
            'no2': {'class_type': 'RandomNoise', 'inputs': {'noise_seed': seed + 1}},
            'gd2': {'class_type': 'CFGGuider', 'inputs': {'model': ['un', 0], 'positive': ['p2', 0], 'negative': ['n2', 0], 'cfg': 1.0}},
            'sc2': {'class_type': 'Flux2Scheduler', 'inputs': {'steps': steps2, 'width': W2, 'height': H2}},
            'sp': {'class_type': 'SplitSigmas', 'inputs': {'sigmas': ['sc2', 0], 'step': int(round(steps2 * (1 - hden)))}},
            'ks2': {'class_type': 'SamplerCustomAdvanced', 'inputs': {'noise': ['no2', 0], 'guider': ['gd2', 0], 'sampler': ['sa', 0], 'sigmas': ['sp', 1], 'latent_image': ['enc2', 0]}},
            'dec2': {'class_type': 'VAEDecodeTiled', 'inputs': {'samples': ['ks2', 0], 'vae': ['va', 0], 'tile_size': 1024, 'overlap': 64, 'temporal_size': 64, 'temporal_overlap': 8}}})
    if engine == 'klein' and den < 1:
        g['ks1']['inputs'].update({'sigmas': ['sp1', 1], 'latent_image': ['enc0', 0]})
    return g


def fetch(img, dst):
    q = urllib.parse.urlencode({'filename': img['filename'], 'subfolder': img.get('subfolder', ''), 'type': img.get('type', 'output')})
    open(dst, 'wb').write(call('/view?' + q, raw=True))
    a = np.asarray(Image.open(dst).convert('L'), float)
    if a.mean() < 5:
        raise SystemExit(f'BLACK FRAME {dst}: stop and report (never restart ComfyUI)')


def main():
    engine, sketch, stem, seed, den, hires, hden, key = sys.argv[1:9]
    seed, den, hires, hden = int(seed), float(den), float(hires), float(hden)
    P = PROMPTS[key]
    w, h = P['size']
    W2, H2 = int(w * hires) // 16 * 16, int(h * hires) // 16 * 16
    os.makedirs(os.path.dirname(stem), exist_ok=True)
    img = upload(sketch)
    prefix = 'pyrefly-ff7-hifi/' + os.path.basename(stem)
    g = graph(engine, img, w, h, W2, H2, seed, den, hden, P['pos'], P.get('neg', ''), prefix)
    wait_queue()
    pid = call('/prompt', json.dumps({'prompt': g, 'client_id': 'pyrefly-ff7-hifi'}).encode())['prompt_id']
    t0 = time.time()
    while True:
        hst = call('/history/' + pid)
        if pid in hst:
            st = hst[pid].get('status', {})
            if st.get('status_str') == 'error':
                raise SystemExit('ERROR ' + json.dumps(st)[:800])
            if st.get('completed'):
                break
        time.sleep(3)
    outs = hst[pid]['outputs']
    fetch(outs['sv1']['images'][0], stem + '.base.png')
    fetch(outs['sv2']['images'][0], stem + '.full.png')
    json.dump({'engine': engine, 'sketch': sketch.replace('\\', '/'), 'seed': seed, 'denoise': den, 'baseSize': [w, h],
               'detailPass': {'upscaler': 'RealESRGAN_x4plus.pth', 'size': [W2, H2], 'denoise': hden, 'seed': seed + 1},
               'promptKey': key, 'positive': P['pos'], 'negative': P.get('neg', ''), 'seconds': round(time.time() - t0),
               'retailInput': 'none (our own code-drawn sketch only; no IP-Adapter)', 'mirrored': False},
              open(stem + '.prov.json', 'w'), indent=1)
    print('OK', stem, round(time.time() - t0), 's')


main()
