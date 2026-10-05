"""r39lib.py: the r39 art lane's helpers on top of the closeup-art library (cc.py, hires_lib.py, qc.py).

Everything that touches the GPU goes through gpu_run(): it honours PAUSE-GPU (the driver creates it while the critic measures frame times),
shares the closeup-art gpu.lock with the hires driver (one prompt in flight, ours or theirs), and never re-rolls an all-black frame.
Embedded python only: D:/Tools/ComfyUI/python_embeded/python.exe -s
"""
import json
import os
import sys
import time

TOOLS = 'D:/Tools/pyrefly-scratch/2026-10-04/closeup-art/tools'
sys.path.insert(0, TOOLS)
import numpy as np
from PIL import Image

import cc
from cc import run_graph, upload, png_bytes, BlackFrame, jget

Image.MAX_IMAGE_PIXELS = None

R39 = 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art'
PAUSE = f'{R39}/PAUSE-GPU'
ART = 'D:/pyrefly-r39-art/public/art'
CAND = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-r39'
CKPT = cc.CKPT


def now():
    return time.strftime('%Y-%m-%d %H:%M:%S')


def say(msg):
    print(f'{now()} {msg}', flush=True)


def _pid_alive(pid):
    try:
        import ctypes
        h = ctypes.windll.kernel32.OpenProcess(0x1000, False, int(pid))  # PROCESS_QUERY_LIMITED_INFORMATION
        if not h:
            return False
        code = ctypes.c_ulong()
        ctypes.windll.kernel32.GetExitCodeProcess(h, ctypes.byref(code))
        ctypes.windll.kernel32.CloseHandle(h)
        return code.value == 259  # STILL_ACTIVE
    except Exception:
        return True


def clear_stale_lock():
    """cc.run_graph keeps a lock file (one prompt in flight, ours or the hires driver's). A process killed mid-prompt leaves it behind and
    everyone then waits 15 minutes; if the owner is gone, move the file aside."""
    try:
        if os.path.exists(cc.LOCKF):
            pid = open(cc.LOCKF).read().strip()
            if pid.isdigit() and not _pid_alive(pid):
                os.replace(cc.LOCKF, cc.LOCKF + f'.stale-{int(time.time())}')
                say(f'cleared a stale GPU lock of dead pid {pid}')
    except OSError:
        pass


def gpu_gate():
    """Block while the driver's PAUSE-GPU file exists (the job in flight has already finished)."""
    clear_stale_lock()
    announced = False
    while os.path.exists(PAUSE):
        if not announced:
            say('PAUSE-GPU present: waiting')
            announced = True
        time.sleep(30)
    if announced:
        say('PAUSE-GPU gone: continuing')


def gpu_run(graph, out_nodes, tag='job', timeout=1800):
    gpu_gate()
    return run_graph(graph, out_nodes, tag=tag, timeout=timeout)


def g_esrgan(crop_name, model, out_w, out_h):
    """<model> x4 on the uploaded image, Lanczos to out_w x out_h."""
    return {'40': {'class_type': 'LoadImage', 'inputs': {'image': crop_name, 'upload': 'image'}},
            '42': {'class_type': 'UpscaleModelLoader', 'inputs': {'model_name': model}},
            '43': {'class_type': 'ImageUpscaleWithModel', 'inputs': {'upscale_model': ['42', 0], 'image': ['40', 0]}},
            '44': {'class_type': 'ImageScale', 'inputs': {'image': ['43', 0], 'upscale_method': 'lanczos', 'width': out_w, 'height': out_h, 'crop': 'disabled'}},
            '9': {'class_type': 'PreviewImage', 'inputs': {'images': ['44', 0]}}}


def esrgan_image(im, model, scale, tag='esrgan', name=None):
    """One whole-image (or crop) ESRGAN pass at `scale`x (Lanczos from the model's 4x). im: PIL RGB. Returns PIL RGB.
    The upload name is per process: ComfyUI's input/ folder is shared, and two of our processes on one name overwrite each other's tiles."""
    n = upload(png_bytes(im), name or f'r39-up-{os.getpid()}.png')
    ims, gpu = gpu_run(g_esrgan(n, model, im.width * scale, im.height * scale), ['9'], tag=tag)
    return ims[0], gpu


def esrgan_tiled(im, model, scale, tile=512, margin=24, tag='esrgan-tiled', progress=None):
    """Tiled ESRGAN of a big 1x image (memory-light, seam-free: tiles overlap by `margin` px at 1x and only their cores are kept).
    Returns (PIL RGB at `scale`x, gpu seconds)."""
    w, h = im.size
    out = np.zeros((h * scale, w * scale, 3), np.uint8)
    gpu_total = 0.0
    k = 0
    for y0 in range(0, h, tile):
        for x0 in range(0, w, tile):
            x1, y1 = min(w, x0 + tile), min(h, y0 + tile)
            cx0, cy0, cx1, cy1 = max(0, x0 - margin), max(0, y0 - margin), min(w, x1 + margin), min(h, y1 + margin)
            crop = im.crop((cx0, cy0, cx1, cy1))
            up, gpu = esrgan_image(crop, model, scale, tag=f'{tag}/{k}')
            gpu_total += gpu or 0
            a = np.asarray(up)
            ox, oy = (x0 - cx0) * scale, (y0 - cy0) * scale
            out[y0 * scale:y1 * scale, x0 * scale:x1 * scale] = a[oy:oy + (y1 - y0) * scale, ox:ox + (x1 - x0) * scale]
            k += 1
            if progress:
                progress(k)
    return Image.fromarray(out, 'RGB'), gpu_total


def lanczos_up(im, scale):
    return im.resize((im.width * scale, im.height * scale), Image.LANCZOS)


def sha256(path):
    import hashlib
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


# ----------------------------------------------------------------------------------------------- the r39 library (write-once masters + manifest)
OUTLIB = 'D:/Tools/pyrefly-art-backup/hires-r39-art'


def lib_load():
    p = f'{OUTLIB}/manifest.json'
    if os.path.exists(p):
        return json.load(open(p, encoding='utf8'))
    return {'version': 1, 'created': now(), 'what': 'Release 39 art lane (r39-art, 2026-10-04): masters re-made after the repair, in the hires library manifest shape '
            '(tools/hires-install.mjs reads it with --lib). Write-once; every file is also hard-linked or copied into public/art by the installer, never edited.', 'assets': {}}


def lib_save(man):
    man['updated'] = now()
    p = f'{OUTLIB}/manifest.json'
    os.makedirs(OUTLIB, exist_ok=True)
    tmp = p + '.tmp'
    with open(tmp, 'w', encoding='utf8') as f:
        json.dump(man, f, indent=1)
    os.replace(tmp, p)


def lib_put(rec):
    man = lib_load()
    man['assets'][rec['id']] = rec
    lib_save(man)
