"""style_finish.py: finishes the style pilot unattended (r39-art lane, 2026-10-04 night).

Waits for the GPU chain that is running (style_gpu.py s2, then s3z), frees ComfyUI's models, runs S1 (Animagine, the stage that crashed on a cross-drive link before and is fixed), and
meanwhile runs the CPU mattes for the outputs that exist. When S1 is done: the remaining masters, the per-subject sheets and the four faked 4K battle frames.
The third direction is `s3z` (Z-Image Turbo) unless logs/style-s3.choice says `s3k` (FLUX.2 Klein with the semi-real prompt), in which case S3 is rendered with Klein first.
Writes logs/style-finish.done when everything is finished (or logs/style-finish.failed with the step that failed).
"""
import json
import os
import subprocess
import sys
import time
import urllib.request

import psutil

R = 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art'
PY = 'D:/Tools/ComfyUI/python_embeded/python.exe'
ITEMS = ['tidus/idle', 'seymour-flux-body/idle', 'yuna-gunner/idle']
os.chdir(R)


def say(m):
    print(time.strftime('%H:%M:%S'), m, flush=True)


def chain_running():
    for p in psutil.process_iter(['name', 'cmdline']):
        try:
            c = p.info['cmdline'] or []
            if (p.info['name'] or '').lower().startswith('python') and any('style_gpu.py' in a for a in c):
                return True
        except Exception:
            pass
    return False


def wait_chain(quiet=2, gap=25):
    n = 0
    while n < quiet:
        n = 0 if chain_running() else n + 1
        time.sleep(gap)


def free_models():
    try:
        urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8188/free', data=json.dumps({'unload_models': True, 'free_memory': True}).encode(),
                                                      headers={'Content-Type': 'application/json'}), timeout=30)
        say('ComfyUI models freed')
    except Exception as e:
        say(f'free failed: {e}')


def choice():
    p = f'{R}/logs/style-s3.choice'
    return open(p).read().strip() if os.path.exists(p) else 's3z'


def start(args, logname, s3=None):
    env = dict(os.environ)
    env['STYLE_S3'] = s3 or choice()
    return subprocess.Popen([PY, '-s', *args], stdout=open(f'{R}/logs/{logname}.log', 'a'), stderr=subprocess.STDOUT, env=env, cwd=R)


def fail(step):
    open(f'{R}/logs/style-finish.failed', 'w').write(f'{time.strftime("%H:%M:%S")} {step}\n')
    say(f'FAILED: {step}')
    sys.exit(1)


def main():
    say('waiting for the s2 / s3z chain to finish')
    wait_chain()
    say('chain finished')
    free_models()
    g = start(['tools/style_gpu.py', 's1', *ITEMS], 'style-gpu-s1')
    say(f'S1 started (pid {g.pid}); CPU mattes for what exists meanwhile')
    c = start(['tools/style_cpu.py', 'masters'], 'style-cpu-masters')
    rc_c = c.wait()
    say(f'masters pass 1 exit {rc_c}')
    rc_g = g.wait()
    say(f'S1 exit {rc_g}')
    if rc_g != 0:
        fail('S1 GPU stage (see logs/style-gpu-s1.log)')
    s3 = choice()
    if s3 == 's3k':
        k = start(['tools/style_gpu.py', 's3k', *ITEMS], 'style-gpu-s3k', s3='s3k')
        if k.wait() != 0:
            fail('S3 Klein stage')
    for mode in (['masters'], ['sheets'], ['frames']):
        p = start(['tools/style_cpu.py', *mode], f'style-cpu-{mode[0]}', s3=s3)
        rc = p.wait()
        say(f'{mode[0]} exit {rc}')
        if rc != 0:
            fail(f'style_cpu.py {mode[0]}')
    open(f'{R}/logs/style-finish.done', 'w').write(f'{time.strftime("%H:%M:%S")} S3 = {s3}\n')
    say('all done')


if __name__ == '__main__':
    main()
