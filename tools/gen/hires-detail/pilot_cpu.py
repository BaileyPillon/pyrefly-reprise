"""pilot_cpu.py: the CPU half of the figure-detail pilot (candidates only).

  python pilot_cpu.py masters <subject/state> ...    finish every method variant that has its GPU output: alpha, rim, QC, and the same with edge treatment E
  python pilot_cpu.py sheets <subject/state> ...     the crop sheets and the 4K-size figure sheets
Masters go to D:/Tools/pyrefly-art-backup/candidates/2026-10-04-detail/masters/<subject>-<state>/<variant>@4x.png (and <variant>+E@4x.png); results.json beside them.
Variants: r39 (the installed master as it ships in release 39), d1-045-s1, d1-045-s2, d1-055-s1, d1-055-s2 (SDXL detail pass + face/hands), d2-s1, d2-s2 (FLUX.2 Klein repaint).
"""
import json
import shutil
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
sys.path.insert(0, 'D:/pyrefly-r39-art/tools/gen/hires-alpha-fix')
from r39lib import *
import hires_lib as H
import alphafix as af
import batch as AB
import qc
import edge_e
from cc import load_rgba, finish_figure2

ART39 = 'D:/pyrefly-r39-art/public/art'
PWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/pilot-work'
OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-detail'
S = 4
VARIANTS = {  # name -> (gpu output file, label)
    'd1-045-s1': ('d1-d45s424242-fh.png', 'D1 0.45 seed 1'), 'd1-045-s2': ('d1-d45s20261004-fh.png', 'D1 0.45 seed 2'),
    'd1-055-s1': ('d1-d55s424242-fh.png', 'D1 0.55 seed 1'), 'd1-055-s2': ('d1-d55s20261004-fh.png', 'D1 0.55 seed 2'),
    'd2-s1': ('d2-8101-rgb.png', 'D2 Klein seed 1'), 'd2-s2': ('d2-8102-rgb.png', 'D2 Klein seed 2'),
}
QKEYS = ('ssim', 'dE_mean', 'dE_p95', 'low_dE', 'palette_w1', 'edge_corr', 'shift_px', 'alpha_iou', 'alpha_mae', 'refine_ssim')


def mdir(item):
    d = f'{OUT}/masters/{item.replace("/", "-")}'
    os.makedirs(d, exist_ok=True)
    return d


def wdir(item):
    return f'{PWORK}/{item.replace("/", "-")}'


def finish(item, name, rgb_path):
    """GPU output (RGB at 4x) -> RGBA master with the approved alpha, the rim rebuilt as for every library master, and the colour bled."""
    sid, state = item.split('/')
    rgba = load_rgba(f'{ART39}/characters/{sid}/{state}.png')
    P = np.asarray(rgba)
    w, h = rgba.size
    plain = np.asarray(Image.open(f'{wdir(item)}/plain.png').convert('RGB'))[:h * S, :w * S]
    ref = np.asarray(Image.open(rgb_path).convert('RGB'))[:h * S, :w * S]
    out = finish_figure2(rgba, ref, plain, S)
    out = H.trim_bleed(out, H.BLEED)
    N, _ = af.repair(P, np.asarray(out), S, **AB.PARAMS)
    return P, N, ref, plain


def quality(P, N, ref=None, plain=None):
    rgba = Image.fromarray(P, 'RGBA')
    q = qc.likeness(rgba, Image.fromarray(N, 'RGBA'))
    if ref is not None and plain is not None:
        q['refine_ssim'] = round(qc.refine_ssim(ref, plain, N[..., 3]), 4)
    m = af.metrics(P, N, S)
    q['rim_bias'] = round(float(m.get('rim_bias', float('nan'))), 3)
    q['rim_specks'] = m.get('rim_specks')
    return q


def save(arr, path):
    tmp = path + '.tmp'
    Image.fromarray(arr, 'RGBA').save(tmp, 'PNG', compress_level=6)
    os.replace(tmp, path)


def masters(item):
    sid, state = item.split('/')
    d = mdir(item)
    resp = f'{d}/results.json'
    res = json.load(open(resp)) if os.path.exists(resp) else {}
    gpu = json.load(open(f'{wdir(item)}/gpu.json')) if os.path.exists(f'{wdir(item)}/gpu.json') else {}
    jobs = [('r39', None)] + [(k, v[0]) for k, v in VARIANTS.items()]
    for name, fn in jobs:
        if name in res and os.path.exists(f'{d}/{name}+E@4x.png'):
            continue
        if name == 'r39':
            p = f'{ART39}/characters/{sid}/{state}@4x.png'
            P = np.asarray(Image.open(f'{ART39}/characters/{sid}/{state}.png').convert('RGBA'))
            N = np.asarray(Image.open(p).convert('RGBA'))
            ref = plain = None
        else:
            src = f'{wdir(item)}/{fn}'
            if not os.path.exists(src):
                continue
            P, N, ref, plain = finish(item, name, src)
        save(N, f'{d}/{name}@4x.png')
        q0 = quality(P, N, ref, plain)
        NE, em = edge_e.apply_E(P, N, S)
        save(NE, f'{d}/{name}+E@4x.png')
        q1 = quality(P, NE)
        rec = {'qc': {k: q0.get(k) for k in QKEYS + ('rim_bias', 'rim_specks')}, 'qc_E': {k: q1.get(k) for k in QKEYS + ('rim_bias', 'rim_specks')}, 'E': em}
        # GPU minutes of this master
        g = None
        if name.startswith('d1-'):
            key = {'d1-045-s1': 'd1-d45s424242', 'd1-045-s2': 'd1-d45s20261004', 'd1-055-s1': 'd1-d55s424242', 'd1-055-s2': 'd1-d55s20261004'}[name]
            r = gpu.get(key)
            if r:
                g = {'tiles_s': r['tiles_gpu_s'], 'face_hands_s': r['fh_gpu_s'], 'plain_s': gpu.get('plain_gpu_s'), 'total_min': round((r['tiles_gpu_s'] + r['fh_gpu_s']) / 60, 2)}
        elif name.startswith('d2-'):
            r = gpu.get({'d2-s1': 'd2-8101', 'd2-s2': 'd2-8102'}[name])
            if r:
                g = {'klein_s': r['klein_gpu_s'], 'up_s': r['up_gpu_s'], 'plain2_s': gpu.get('plain2_gpu_s'), 'total_min': round((r['klein_gpu_s'] + r['up_gpu_s']) / 60, 2)}
        rec['gpu'] = g
        res[name] = rec
        json.dump(res, open(resp, 'w'), indent=1)
        say(f'{item} {name}: qc ssim {q0["ssim"]} dE {q0["dE_mean"]} edge {q0["edge_corr"]} rim {q0["rim_bias"]}; with E: iou {em["alpha_iou_vs_approved_up"]} disp {em["edge_displacement_px_at_S"]} px(4x), decontaminated {em["decontaminated_px"]} px')


if __name__ == '__main__':
    mode = sys.argv[1]
    for it in sys.argv[2:]:
        masters(it) if mode == 'masters' else None
