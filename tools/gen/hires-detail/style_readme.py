"""style_readme.py: the numbers of the style pilot README: GPU minutes per direction, and each master's distance from the approved painting (qc.likeness, the release QC's own measure).

  python style_readme.py > tables.md

The distance table is not a pass/fail: a style direction is allowed to move (that is the point); the numbers say how far it moved. Today = the library master with the edge
treatment E (candidates/2026-10-04-detail/masters/<item>/r39+E@4x.png).
"""
import json
import os
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/closeup-art/tools')
import qc
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ART39 = 'D:/pyrefly-r39-art/public/art'
SWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/style-work'
OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-style'
DETAIL = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-detail'
ITEMS = ['tidus/idle', 'seymour-flux-body/idle', 'yuna-gunner/idle']
DIRS = {'s1': [424242, 20261004], 's2': [9101, 9102], 's3z': [9201, 9202], 's3k': [9101, 9102]}
LABEL = {'s1': 'S1 Premium cel', 's2': 'S2 Painterly', 's3z': 'S3 Semi-real (Z-Image Turbo)', 's3k': 'S3 Semi-real (FLUX.2 Klein)'}


def gpu_table():
    print('| subject | direction | seeds | GPU seconds (model) | GPU seconds (ESRGAN to 4x) |')
    print('|---|---|---|---|---|')
    tot = 0.0
    per = {}
    for it in ITEMS:
        p = f'{SWORK}/{it.replace("/", "-")}/gpu.json'
        if not os.path.exists(p):
            continue
        d = json.load(open(p))
        for dr, seeds in DIRS.items():
            m = u = 0.0
            n = 0
            for sd in seeds:
                a = d.get(f'{dr}-{sd}')
                b = d.get(f'{dr}-{sd}-up4')
                if a:
                    m += a['gpu_s']
                    n += 1
                if b:
                    u += b['gpu_s']
            if n:
                per[dr] = per.get(dr, 0.0) + m + u
                tot += m + u
                print(f'| {it} | {LABEL[dr]} | {n} | {m:.0f} | {u:.0f} |')
    print()
    for dr, v in per.items():
        print(f'- {LABEL[dr]}: {v / 60:.1f} GPU minutes')
    print(f'- **total {tot / 60:.1f} GPU minutes** (the ESRGAN 2x plain images and the Klein reference images were made by the detail pilot and are not counted here)')
    print()


def dist_table():
    for it in ITEMS:
        sid, state = it.split('/')
        P = Image.open(f'{ART39}/characters/{sid}/{state}.png').convert('RGBA')
        md = f'{OUT}/masters/{it.replace("/", "-")}'
        res = json.load(open(f'{md}/results.json')) if os.path.exists(f'{md}/results.json') else {}
        print(f'\n#### {it}\n')
        print('| master | silhouette IoU | SSIM | dE mean | dE p95 | palette W1 | edge corr | E: IoU vs approved, mean edge move (px at 4x) |')
        print('|---|---|---|---|---|---|---|---|')
        rows = [('Today (R39 + E)', f'{DETAIL}/masters/{it.replace("/", "-")}/r39+E@4x.png', None)]
        for dr, seeds in DIRS.items():
            for i, sd in enumerate(seeds):
                rows.append((f'{LABEL[dr]}, seed {i + 1}', f'{md}/{dr}-s{sd}+E@4x.png', f'{dr}-s{sd}'))
        for lab, path, key in rows:
            if not os.path.exists(path):
                continue
            q = qc.likeness(P, Image.open(path).convert('RGBA'))
            e = (res.get(key) or {}).get('E') if key else None
            es = f'{e["alpha_iou_vs_approved_up"]}, {e["edge_displacement_px_at_S"]}' if e else '-'
            print(f'| {lab} | {q["alpha_iou"]} | {q["ssim"]} | {q["dE_mean"]} | {q["dE_p95"]} | {q["palette_w1"]} | {q["edge_corr"]} | {es} |')


if __name__ == '__main__':
    gpu_table()
    dist_table()
