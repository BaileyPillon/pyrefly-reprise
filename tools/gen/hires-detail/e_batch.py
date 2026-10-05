"""e_batch.py: the edge treatment E over every figure master that has alpha, into a NEW library (r39-art lane, driver's order of 2026-10-04 ~22:20).

  python e_batch.py [--workers 4] [--limit N] [--only characters/tidus] [--dry]

Input: the masters installed in the r39-art tree (`public/art/characters/<id>/<state>@4x.png` and `@2x.png`, hard links of the repaired library `hires-alpha-fixed/` and of
`hires-r39-art/`; the `@3x` are derived by the installer, never stored) with the approved 1x painting beside each. Output: D:/Tools/pyrefly-art-backup/hires-E/ in the same layout
(`characters/<id>/<state>@4x.png`, `@2x.png`) plus `manifest.json` (the library manifest shape that `tools/hires-install.mjs --lib` reads), written as NEW files only:
the libraries are hard-linked into running worktrees, nothing is ever rewritten in place.
  * an asset with a 4x master: E on the 4x, the 2x derived from it (colour and alpha reduced apart, as the repair does), so the pair stays consistent;
  * an asset with only a 2x master (wide-only: Sin, Vegnagun, Sinspawn): E at 2x;
  * an approved master (a `@2x` locked in docs/target/approved-hashes.json, the D-315 idle masters and Evrae's E1-H idle@2x) is NEVER changed: its asset keeps the approved 2x
    and only gets an E'd 4x;
  * backdrops, portraits, the pause art and the title art are not figures with alpha: skipped.
BelowNormal priority; a worker waits while less than 7 GB of RAM is free. Resumes: an output that exists and is in the manifest is skipped.
Per master the manifest keeps: the 1x painting's sha256, the input master's sha256, the output's sha256, the alpha IoU against the approved alpha upscaled and the mean edge move (px).
"""
import argparse
import ctypes
import hashlib
import json
import os
import re
import sys
import time
import traceback
from multiprocessing import Pool

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, 'D:/pyrefly-r39-art/tools/gen/hires-alpha-fix')
import edge_e
import alphafix as af

Image.MAX_IMAGE_PIXELS = None
TREE = 'D:/pyrefly-r39-art'
ART = f'{TREE}/public/art'
OUT = 'D:/Tools/pyrefly-art-backup/hires-E'
LIBS = ['D:/Tools/pyrefly-art-backup/hires-alpha-fixed', 'D:/Tools/pyrefly-art-backup/hires-r39-art']
MIN_FREE_GB = 5.0
PNG_LEVEL = 5


def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 22), b''):
            h.update(b)
    return h.hexdigest()


def free_gb():
    class MS(ctypes.Structure):
        _fields_ = [('dwLength', ctypes.c_ulong), ('dwMemoryLoad', ctypes.c_ulong), ('ullTotalPhys', ctypes.c_ulonglong), ('ullAvailPhys', ctypes.c_ulonglong),
                    ('ullTotalPageFile', ctypes.c_ulonglong), ('ullAvailPageFile', ctypes.c_ulonglong), ('ullTotalVirtual', ctypes.c_ulonglong),
                    ('ullAvailVirtual', ctypes.c_ulonglong), ('ullAvailExtendedVirtual', ctypes.c_ulonglong)]
    m = MS()
    m.dwLength = ctypes.sizeof(MS)
    ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
    return m.ullAvailPhys / 1e9


def _init():
    try:
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)   # BELOW_NORMAL
    except Exception:
        pass


def approved_masters():
    """The `@2x` masters locked in approved-hashes.json (rel paths like characters/tidus/idle@2x.png)."""
    d = json.load(open(f'{TREE}/docs/target/approved-hashes.json', encoding='utf8'))
    out = set()
    for sname, s in d['sets'].items():
        for k in s:
            if isinstance(k, str) and k.startswith('public/art/characters/') and '@' in k and k.endswith('.png'):
                out.add(k[len('public/art/'):])
    return out


def plan(only=''):
    appr = approved_masters()
    chars = f'{ART}/characters'
    jobs = []
    for cid in sorted(os.listdir(chars)):
        d = f'{chars}/{cid}'
        if not os.path.isdir(d):
            continue
        states = {}
        for f in os.listdir(d):
            m = re.match(r'^(.+)@([24])x\.png$', f)
            if m and os.path.exists(f'{d}/{m.group(1)}.png'):
                states.setdefault(m.group(1), {})[int(m.group(2))] = f
        for st, sc in sorted(states.items()):
            rid = f'characters/{cid}/{st}'
            if only and not rid.startswith(only):
                continue
            jobs.append({'id': rid, 'cid': cid, 'state': st, 'has4': 4 in sc, 'has2': 2 in sc,
                         'approved2': f'characters/{cid}/{st}@2x.png' in appr, 'approved4': f'characters/{cid}/{st}@4x.png' in appr})
    return jobs


def write_png(arr, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + '.tmp'
    Image.fromarray(arr, 'RGBA').save(tmp, format='PNG', compress_level=PNG_LEVEL)
    os.replace(tmp, dst)


def work(job):
    t0 = time.time()
    while free_gb() < MIN_FREE_GB:
        time.sleep(20)
    rec = {'id': job['id'], 'status': 'error', 'outputs': []}
    try:
        base = f'{ART}/{job["id"]}'
        P = np.asarray(Image.open(f'{base}.png').convert('RGBA'))
        h, w = P.shape[:2]
        rec['source_sha256'] = sha256(f'{base}.png')
        if job['has4'] and not job['approved4']:
            S, inp = 4, f'{base}@4x.png'
        elif job['has2'] and not job['approved2'] and not job['has4']:
            S, inp = 2, f'{base}@2x.png'
        else:
            rec['status'] = 'skipped'
            rec['note'] = 'only an approved master is installed here: it stays as approved'
            return rec
        M = np.asarray(Image.open(inp).convert('RGBA'))
        if M.shape[:2] != (h * S, w * S):
            rec['note'] = f'master {M.shape[1]}x{M.shape[0]} is not {S} x {w}x{h}'
            return rec
        rec['input_sha256'] = sha256(inp)
        N, met = edge_e.apply_E(P, M, S)
        del M
        outs = [(S, N)]
        if S == 4 and job['has2'] and not job['approved2']:
            outs.append((2, af.reduce_half(N)))
        for sc, arr in outs:
            rel = f'{job["id"]}@{sc}x.png'
            dst = f'{OUT}/{rel}'
            write_png(arr, dst)
            rec['outputs'].append({'path': rel, 'scale': sc, 'bytes_png': os.path.getsize(dst), 'size': [int(arr.shape[1]), int(arr.shape[0])], 'sha256': sha256(dst),
                                   **({'derived_from': '4x with E (premultiplied reduce, colour and alpha apart)'} if sc == 2 and S == 4 else {})})
        rec['E'] = {k: met[k] for k in ('alpha_iou_vs_approved_up', 'edge_displacement_px_at_S', 'edge_displacement_px_1x', 'decontaminated_px', 'S')}
        rec['status'] = 'ok'
    except Exception as e:  # noqa
        rec['error'] = repr(e)
        rec['trace'] = traceback.format_exc()[-1200:]
    rec['seconds'] = round(time.time() - t0, 1)
    return rec


def load_lib_records():
    recs = {}
    for lib in LIBS:
        p = f'{lib}/manifest.json'
        if os.path.exists(p):
            for k, v in json.load(open(p, encoding='utf8'))['assets'].items():
                recs[k] = v
    return recs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--only', default='')
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()
    jobs = plan(a.only)
    mp = f'{OUT}/manifest.json'
    man = json.load(open(mp, encoding='utf8')) if os.path.exists(mp) else {'version': 1, 'what': 'edge treatment E over the repaired figure masters (r39-art, 2026-10-04): a new library, written as new files; see tools/gen/hires-detail/edge_e.py',
                                                                            'created': time.strftime('%Y-%m-%d %H:%M:%S'), 'params': {'sigma_1x': 0.8, 'delta_1x': 0.6, 'ramp_px': 1.5, 'band_1x': 2.5, 'bleed_px': 24}, 'assets': {}}
    todo = [j for j in jobs if man['assets'].get(j['id'], {}).get('status') not in ('ok', 'skipped')]
    if a.limit:
        todo = todo[:a.limit]
    est = 0
    for j in todo:
        for sc in (4, 2):
            p = f'{ART}/{j["id"]}@{sc}x.png'
            if os.path.exists(p) and not (sc == 4 and j['approved4']) and not (sc == 2 and j['approved2']):
                est += os.path.getsize(p)
    print(f'{len(jobs)} assets, {len(todo)} to do; estimate {est / 1e9:.1f} GB of PNG (inputs; outputs are about the same); workers {a.workers}; free RAM {free_gb():.1f} GB', flush=True)
    if a.dry:
        return
    os.makedirs(OUT, exist_ok=True)
    lib = load_lib_records()
    log = open(f'{OUT}/batch.log', 'a', encoding='utf8')
    t0 = time.time()
    n = 0
    counts = {}
    with Pool(a.workers, initializer=_init, maxtasksperchild=3) as pool:
        for r in pool.imap_unordered(work, todo, chunksize=1):
            n += 1
            counts[r['status']] = counts.get(r['status'], 0) + 1
            rec = dict(lib.get(r['id'], {'id': r['id']}))
            rec['edge_E'] = {k: v for k, v in r.items() if k not in ('trace',)}
            if r['status'] == 'ok':
                rec['outputs'] = r['outputs']
                rec['source_sha256'] = r['source_sha256']
                rec['status'] = 'ok'
                rec['flags'] = []
            else:
                rec['status'] = r['status']
            man['assets'][r['id']] = rec
            man['updated'] = time.strftime('%Y-%m-%d %H:%M:%S')
            tmp = mp + '.tmp'
            json.dump(man, open(tmp, 'w', encoding='utf8'), indent=1)
            os.replace(tmp, mp)
            line = f'[{n}/{len(todo)} {time.time() - t0:.0f}s] {r["id"]} {r["status"]} {r.get("seconds", "")}s ' + (r.get('error') or r.get('note') or '') + \
                   (f' iou {r["E"]["alpha_iou_vs_approved_up"]} move {r["E"]["edge_displacement_px_at_S"]}px' if r.get('E') else '')
            print(line, flush=True)
            log.write(line + '\n')
            log.flush()
    print('done', counts, f'{time.time() - t0:.0f}s', flush=True)


if __name__ == '__main__':
    main()
