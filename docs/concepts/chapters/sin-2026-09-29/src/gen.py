"""Sin art options, 2026-09-29 (FFX only). One ComfyUI job per call. Copied from round 3's gen.py
(docs/concepts/chapters/sin-2026-09-27/head-round3/src/gen.py), with the queue rule widened to the overnight brief's.

  whole:   python gen.py whole <engine> <init.png> <out-stem> <seed> <denoise> <hires> <hiresDenoise> <promptKey>
           our code-drawn sketch (or our own painting) -> img2img base (1344x768) -> RealESRGAN x4, resized to
           hires x base -> low-denoise re-render.
  mouth:   python gen.py mouth <comp_base.png> <mask_base.png> <plate_full.png> <mask_full.png> <out-stem> <seed> <denoise> <hiresDenoise> <promptKey>
           a masked repaint INTO a plate: the plate (base size) with our sketch pasted inside the mask -> masked
           img2img -> upscaled and set into the full plate -> masked low-denoise re-render. Outside the mask every
           pixel stays the plate's own.
Engines: zimg = z_image_turbo_bf16_v2 (+ qwen_3_4b, ae VAE); sdxl = animagine-xl-4.0-opt (the house checkpoint).
GPU rules (overnight brief, AGENTS.md rule 12): submit only while fewer than 3 prompts are queued in ComfyUI in total
(running + pending, shared with the other art agent); one prompt of ours at a time; batch size 1; never restarts
ComfyUI; an all-black frame stops the run.
No retail image is an input: the only image inputs are our code-drawn sketches and our own paintings.
"""
import json, sys, time, uuid, urllib.request, urllib.parse, os
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prompts import PROMPTS

API = 'http://127.0.0.1:8188'
FULL = (2352, 1344)


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
        f'\r\n--{bnd}\r\nContent-Disposition: form-data; name="subfolder"\r\n\r\npyrefly-sin-0929\r\n--{bnd}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{bnd}--\r\n'.encode()
    req = urllib.request.Request(API + '/upload/image', data=body, headers={'Content-Type': f'multipart/form-data; boundary={bnd}'})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.loads(r.read())
    return f"{j.get('subfolder')}/{j['name']}" if j.get('subfolder') else j['name']


def wait_queue():
    # The overnight brief: fewer than 3 prompts queued in total (running + pending, ours and the other art agent's).
    while True:
        q = call('/queue')
        if len(q['queue_pending']) + len(q['queue_running']) < 3:
            return
        time.sleep(1)


def model_nodes(engine, pos, neg):
    if engine == 'sdxl':
        return {'ck': {'class_type': 'CheckpointLoaderSimple', 'inputs': {'ckpt_name': 'animagine-xl-4.0-opt.safetensors'}},
                'p': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['ck', 1]}},
                'n': {'class_type': 'CLIPTextEncode', 'inputs': {'text': neg, 'clip': ['ck', 1]}}}, ['ck', 0], ['ck', 2]
    return {'un': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'z_image_turbo_bf16_v2.safetensors', 'weight_dtype': 'default'}},
            'ms': {'class_type': 'ModelSamplingAuraFlow', 'inputs': {'model': ['un', 0], 'shift': 3.0}},
            'cl': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen_3_4b.safetensors', 'type': 'lumina2', 'device': 'default'}},
            'va': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
            'p': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['cl', 0]}},
            'n': {'class_type': 'CLIPTextEncode', 'inputs': {'text': '', 'clip': ['cl', 0]}}}, ['ms', 0], ['va', 0]


def ks(engine, model, latent, seed, den, hi=False):
    if engine == 'sdxl':
        i = {'seed': seed, 'steps': 30, 'cfg': 4.5 if hi else 5.0, 'sampler_name': 'dpmpp_2m' if hi else 'euler_ancestral',
             'scheduler': 'karras' if hi else 'normal', 'denoise': den}
    else:
        i = {'seed': seed, 'steps': 10, 'cfg': 1.0, 'sampler_name': 'res_multistep', 'scheduler': 'simple', 'denoise': den}
    i.update({'model': model, 'positive': ['p', 0], 'negative': ['n', 0], 'latent_image': latent})
    return {'class_type': 'KSampler', 'inputs': i}


TILED = {'tile_size': 1024, 'overlap': 64, 'temporal_size': 64, 'temporal_overlap': 8}


def graph_whole(engine, img, w, h, W2, H2, seed, den, hden, pos, neg, prefix):
    g, model, vae = model_nodes(engine, pos, neg)
    g.update({'img': {'class_type': 'LoadImage', 'inputs': {'image': img}},
              'scl': {'class_type': 'ImageScale', 'inputs': {'image': ['img', 0], 'upscale_method': 'lanczos', 'width': w, 'height': h, 'crop': 'disabled'}},
              'enc1': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['scl', 0], 'vae': vae}},
              'ks1': ks(engine, model, ['enc1', 0], seed, den),
              'dec1': {'class_type': 'VAEDecode', 'inputs': {'samples': ['ks1', 0], 'vae': vae}},
              'sv1': {'class_type': 'SaveImage', 'inputs': {'filename_prefix': prefix + '-base', 'images': ['dec1', 0]}},
              'upm': {'class_type': 'UpscaleModelLoader', 'inputs': {'model_name': 'RealESRGAN_x4plus.pth'}},
              'up': {'class_type': 'ImageUpscaleWithModel', 'inputs': {'upscale_model': ['upm', 0], 'image': ['dec1', 0]}},
              'up2': {'class_type': 'ImageScale', 'inputs': {'image': ['up', 0], 'upscale_method': 'lanczos', 'width': W2, 'height': H2, 'crop': 'disabled'}},
              'enc2': {'class_type': 'VAEEncodeTiled', 'inputs': {'pixels': ['up2', 0], 'vae': vae, **TILED}},
              'ks2': ks(engine, model, ['enc2', 0], seed + 1, hden, True),
              'dec2': {'class_type': 'VAEDecodeTiled', 'inputs': {'samples': ['ks2', 0], 'vae': vae, **TILED}},
              'sv2': {'class_type': 'SaveImage', 'inputs': {'filename_prefix': prefix + '-full', 'images': ['dec2', 0]}}})
    return g


def graph_mouth(img, msk, full, mskf, seed, den, hden, pos, prefix):
    g, model, vae = model_nodes('zimg', pos, '')
    g.update({'img': {'class_type': 'LoadImage', 'inputs': {'image': img}},
              'm1': {'class_type': 'LoadImageMask', 'inputs': {'image': msk, 'channel': 'red'}},
              'enc1': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['img', 0], 'vae': vae}},
              'nm1': {'class_type': 'SetLatentNoiseMask', 'inputs': {'samples': ['enc1', 0], 'mask': ['m1', 0]}},
              'ks1': ks('zimg', model, ['nm1', 0], seed, den),
              'dec1': {'class_type': 'VAEDecode', 'inputs': {'samples': ['ks1', 0], 'vae': vae}},
              'sv1': {'class_type': 'SaveImage', 'inputs': {'filename_prefix': prefix + '-base', 'images': ['dec1', 0]}},
              'upm': {'class_type': 'UpscaleModelLoader', 'inputs': {'model_name': 'RealESRGAN_x4plus.pth'}},
              'up': {'class_type': 'ImageUpscaleWithModel', 'inputs': {'upscale_model': ['upm', 0], 'image': ['dec1', 0]}},
              'up2': {'class_type': 'ImageScale', 'inputs': {'image': ['up', 0], 'upscale_method': 'lanczos', 'width': FULL[0], 'height': FULL[1], 'crop': 'disabled'}},
              'full': {'class_type': 'LoadImage', 'inputs': {'image': full}},
              'mf': {'class_type': 'LoadImageMask', 'inputs': {'image': mskf, 'channel': 'red'}},
              'cmp': {'class_type': 'ImageCompositeMasked', 'inputs': {'destination': ['full', 0], 'source': ['up2', 0], 'x': 0, 'y': 0, 'resize_source': False, 'mask': ['mf', 0]}},
              'enc2': {'class_type': 'VAEEncodeTiled', 'inputs': {'pixels': ['cmp', 0], 'vae': vae, **TILED}},
              'nm2': {'class_type': 'SetLatentNoiseMask', 'inputs': {'samples': ['enc2', 0], 'mask': ['mf', 0]}},
              'ks2': ks('zimg', model, ['nm2', 0], seed + 1, hden, True),
              'dec2': {'class_type': 'VAEDecodeTiled', 'inputs': {'samples': ['ks2', 0], 'vae': vae, **TILED}},
              'sv2': {'class_type': 'SaveImage', 'inputs': {'filename_prefix': prefix + '-full', 'images': ['dec2', 0]}}})
    return g


def fetch(img, dst):
    q = urllib.parse.urlencode({'filename': img['filename'], 'subfolder': img.get('subfolder', ''), 'type': img.get('type', 'output')})
    open(dst, 'wb').write(call('/view?' + q, raw=True))
    a = np.asarray(Image.open(dst).convert('L'), float)
    if a.mean() < 5:
        raise SystemExit(f'BLACK FRAME {dst}: stop and report (never restart ComfyUI)')


def run(g, stem):
    wait_queue()
    pid = call('/prompt', json.dumps({'prompt': g, 'client_id': 'pyrefly-sin-0929'}).encode())['prompt_id']
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
    return round(time.time() - t0)


def main():
    mode = sys.argv[1]
    if mode == 'whole':
        engine, sketch, stem, seed, den, hires, hden, key = sys.argv[2:10]
        seed, den, hires, hden = int(seed), float(den), float(hires), float(hden)
        P = PROMPTS[key]; w, h = P['size']
        W2, H2 = int(w * hires) // 16 * 16, int(h * hires) // 16 * 16
        os.makedirs(os.path.dirname(stem), exist_ok=True)
        g = graph_whole(engine, upload(sketch), w, h, W2, H2, seed, den, hden, P['pos'], P.get('neg', ''), 'pyrefly-sin-0929/' + os.path.basename(stem))
        secs = run(g, stem)
        prov = {'mode': 'whole', 'engine': engine, 'sketch': sketch.replace('\\', '/'), 'seed': seed, 'denoise': den, 'baseSize': [w, h],
                'detailPass': {'upscaler': 'RealESRGAN_x4plus.pth', 'size': [W2, H2], 'denoise': hden, 'seed': seed + 1}}
    else:
        comp, msk, full, mskf, stem, seed, den, hden, key = sys.argv[2:11]
        seed, den, hden = int(seed), float(den), float(hden)
        P = PROMPTS[key]
        g = graph_mouth(upload(comp), upload(msk), upload(full), upload(mskf), seed, den, hden, P['pos'], 'pyrefly-sin-0929/' + os.path.basename(stem))
        secs = run(g, stem)
        prov = {'mode': 'mouth', 'engine': 'zimg', 'composite': comp.replace('\\', '/'), 'mask': msk.replace('\\', '/'), 'stage0Full': full.replace('\\', '/'),
                'seed': seed, 'denoise': den, 'detailPass': {'size': list(FULL), 'denoise': hden, 'seed': seed + 1, 'masked': True}}
    prov.update({'promptKey': key, 'positive': P['pos'], 'negative': P.get('neg', ''), 'seconds': secs,
                 'retailInput': 'none (our own code-drawn sketches and our own renders only; no IP-Adapter)', 'mirrored': False})
    json.dump(prov, open(stem + '.prov.json', 'w'), indent=1)
    print('OK', stem, secs, 's')


main()
