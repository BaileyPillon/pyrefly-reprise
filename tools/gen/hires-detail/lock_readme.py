"""lock_readme.py: the tables of the painterly identity-lock README (markdown on stdout): GPU minutes, the Tidus lock-strength study, the main numbers per subject and method, the seed gaps."""
import json
import os
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')

LWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/lock-work'
OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-05-painterly-lock'
ITEMS = ['tidus/idle', 'seymour-flux-body/idle', 'yuna-gunner/idle']
NAME = {'today': 'Today (R39 + E)', 's2': 'S2, last round', 'mr': 'A refs only', 'l1': 'B refs + light init lock', 'l2': 'C = B + palette lock', 'l3': 'D = B + face pass + palette lock'}
SWEEP = [('S2 last round', 'S2, last round (no references, no lock)', '-'), ('mr', 'A: references only (pure generation)', 'none'),
         ('sA', 'init lock, noise 0.828 (1 step)', '0.828'), ('sB', 'init lock, 0.7', '0.7'), ('sC', 'init lock, 0.55', '0.55'), ('sD', 'init lock, 0.4', '0.4'),
         ('sF', 'init lock, 0.935', '0.935'), ('sE', 'init lock, 0.977', '0.977'), ('sG', 'B: init lock, 0.99', '0.99'),
         ('sGn', 'init lock 0.99 without any extra reference', '0.99'), ('sH', 'init lock 0.977 + last round\'s S2 as a finish reference', '0.977'), ('sI', 'init lock 0.99 + the S2 finish reference', '0.99')]


def gpu():
    tot = {}
    rows = []
    for it in ITEMS:
        p = f'{LWORK}/{it.replace("/", "-")}/gpu.json'
        if not os.path.exists(p):
            continue
        d = json.load(open(p))
        for k, v in d.items():
            tag = k.split('-')[0]
            if isinstance(v, dict) and 'gpu_s' in v:
                tot[tag] = tot.get(tag, 0) + (v['gpu_s'] or 0)
    print('| stage | GPU seconds |')
    print('|---|---|')
    for k in sorted(tot):
        print(f'| {k} | {tot[k]:.0f} |')
    print(f'\nproductive GPU time in these records: {sum(tot.values()) / 60:.1f} minutes (the ESRGAN steps are the `-up4` keys inside the totals above).')


def sweep():
    p = f'{LWORK}/tidus-idle/sweep-results.json'
    r = json.load(open(p))
    print('| variant | noise start | finish margin | silhouette IoU | face likeness | costume cells moved > 20 dE | dE mean | SSIM |')
    print('|---|---|---|---|---|---|---|---|')
    for key, lab, sg in SWEEP:
        a, b = r.get(key), r.get(key + ' s2')
        if not a:
            continue

        def f(m, fmt):
            return fmt.format(a[m]) + (' / ' + fmt.format(b[m]) if b else '')
        print(f'| {lab} | {sg} | {f("finish_margin", "{:+.3f}")} | {f("alpha_iou", "{:.3f}")} | {f("face_cos", "{:.3f}")} | {f("cells_over20", "{:.1%}")} | {f("dE_mean", "{:.1f}")} | {f("ssim", "{:.2f}")} |')
    print('\n(two numbers = seed 9101 / seed 9102 where both were run)')


def main_tables():
    p = f'{OUT}/numbers.json'
    r = json.load(open(p))
    for it in ITEMS:
        d = r.get(it, {})
        print(f'\n#### {it}\n')
        print('| method | silhouette IoU | face likeness (CLIP) | facial structure | finish margin | finish kept | cells moved > 20 dE | dE mean | dE p95 | palette W1 | SSIM |')
        print('|---|---|---|---|---|---|---|---|---|---|---|')
        m = d['s2-s9101']['finish_margin']

        def kept(key):
            return ' / '.join(f'{(d[f"{key}-{s}"]["finish_margin"] + m) / (2 * m):.0%}' for s in ('s9101', 's9102') if f'{key}-{s}' in d)
        for key in ('s2', 'mr', 'l1', 'l2', 'l3'):
            a, b = d.get(f'{key}-s9101'), d.get(f'{key}-s9102')
            if not a:
                continue

            def f(m, fmt):
                return fmt.format(a[m]) + (' / ' + fmt.format(b[m]) if b else '')
            print(f'| {NAME[key]} | {f("alpha_iou", "{:.3f}")} | {f("face_cos", "{:.3f}")} | {f("head_struct", "{:.2f}")} | {f("finish_margin", "{:+.3f}")} | {kept(key)} | {f("cells_over20", "{:.1%}")} | {f("dE_mean", "{:.1f}")} | {f("dE_p95", "{:.1f}")} | {f("palette_w1", "{:.2f}")} | {f("ssim", "{:.2f}")} |')
        print('\n| method | seed gap: face likeness between the two seeds | whole-figure likeness between the seeds | silhouette IoU between the seeds |')
        print('|---|---|---|---|')
        for key in ('s2', 'mr', 'l1', 'l2', 'l3'):
            g = d.get(f'{key}-gap')
            if g:
                print(f'| {NAME[key]} | {g["face_cos"]:.3f} | {g["figure_cos"]:.3f} | {g["silhouette_iou"]:.3f} |')


if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if which in ('gpu', 'all'):
        gpu()
    if which in ('sweep', 'all'):
        print()
        sweep()
    if which in ('main', 'all'):
        main_tables()
