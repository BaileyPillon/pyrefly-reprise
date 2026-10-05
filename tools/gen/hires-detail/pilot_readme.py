"""pilot_readme.py: the QC and GPU tables of the figure-detail pilot README, from masters/<subject>-<state>/results.json. Prints markdown."""
import json
import os
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/closeup-art/tools')
import qc

OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-detail'
ITEMS = ['tidus/idle', 'tidus/attack', 'yuna-gunner/idle', 'seymour-flux-body/idle']
NAMES = {'r39': 'R39 (library master as shipped)', 'd1-045-s1': 'D1 0.45 seed 1', 'd1-045-s2': 'D1 0.45 seed 2', 'd1-055-s1': 'D1 0.55 seed 1', 'd1-055-s2': 'D1 0.55 seed 2',
         'd2-s1': 'D2 Klein seed 1', 'd2-s2': 'D2 Klein seed 2'}


def f(v, n=3):
    return '-' if v is None else (f'{v:.{n}f}' if isinstance(v, float) else str(v))


D1KEY = {'d1-045-s1': 'd45s424242', 'd1-045-s2': 'd45s20261004', 'd1-055-s1': 'd55s424242', 'd1-055-s2': 'd55s20261004'}


def d1_gpu(item, name):
    d = json.load(open('D:/Tools/pyrefly-scratch/2026-10-04/r39-art/exp/pilot-d1-gpu.json'))
    e = d.get(f'{item}|{D1KEY[name]}')
    if not e:
        return None
    tiles = e['tiles'] or 55   # one Yuna Gunner run was killed and redone after the log line; ~55 s like its siblings
    return round((tiles + e['fh_last']) / 60, 2)


def main():
    gtot = 0.0
    for item in ITEMS:
        p = f'{OUT}/masters/{item.replace("/", "-")}/results.json'
        if not os.path.exists(p):
            continue
        r = json.load(open(p))
        print(f'\n#### {item}\n')
        print('| master | SSIM | dE mean | dE p95 | low dE | edge corr | refine SSIM | rim bias | silhouette IoU | flagged by the release thresholds | GPU min | with E: IoU, mean edge move (px at 4x) |')
        print('|---|---|---|---|---|---|---|---|---|---|---|---|')
        for k in NAMES:
            if k not in r:
                continue
            q = r[k]['qc']
            try:
                flags = qc.judge({x: v for x, v in q.items() if v is not None and x in ('alpha_iou', 'alpha_mae', 'shift_px', 'ssim', 'dE_mean', 'dE_p95', 'low_dE', 'palette_w1', 'edge_corr', 'refine_ssim')}, 'figure')
            except Exception as e:
                flags = [f'?{e}']
            e = r[k]['E']
            g = r[k].get('gpu')
            gm = d1_gpu(item, k) if k.startswith('d1-') else (g['total_min'] if g else None)
            gtot += gm or 0
            print(f'| {NAMES[k]} | {f(q["ssim"])} | {f(q["dE_mean"], 2)} | {f(q["dE_p95"], 1)} | {f(q["low_dE"], 2)} | {f(q["edge_corr"])} | {f(q.get("refine_ssim"))} | {f(q["rim_bias"], 2)} | {f(q["alpha_iou"], 4)} | '
                  f'{", ".join(flags) if flags else "none"} | {f(gm, 2) if gm is not None else "0 (existing)"} | {f(e["alpha_iou_vs_approved_up"], 4)}, {f(e["edge_displacement_px_at_S"], 2)} |')
    print(f'\nGPU minutes of the masters above (tiles + face/hands, or Klein + upscale; the ESRGAN plain images are not in it): {gtot:.1f}')


if __name__ == '__main__':
    main()
