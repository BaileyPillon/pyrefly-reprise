"""Aggregate the batch results: rim bias, rim MAD, alpha IoU, SSIM, edge specks before -> after, over every rebuilt master and over the
independent check's sample of 279 (first state and one action pose of each subject, 2x and 4x)."""
import glob, json, os, sys, statistics as st
import numpy as np

NEW = os.environ.get('R39_FIXED_OUT', 'D:/Tools/pyrefly-art-backup/hires-alpha-fixed')
OUT = 'D:/Tools/pyrefly-scratch/2026-10-04/r39-repair'
res = [json.load(open(f, encoding='utf8')) for f in glob.glob(f'{NEW}/reports/results/*.json')]
print(len(res), 'asset results', {k: sum(1 for r in res if r['status'] == k) for k in sorted({r['status'] for r in res})})

rows = []  # one per output that has before/after
for r in res:
    for o in r['outputs']:
        if 'before' in o:
            rows.append(dict(id=r['id'], path=o['path'], scale=o['scale'], accepted=o['accepted'], before=o['before'], after=o['after'], kept=o.get('kept_because')))
print(len(rows), 'outputs measured;', sum(1 for x in rows if x['accepted']), 'rebuilt;', sum(1 for x in rows if not x['accepted']), 'kept as the library had them')


def agg(sub, label):
    sub = [x for x in sub if 'rim_bias' in x['before'] and 'rim_bias' in x['after']]
    if not sub:
        return None
    def col(which, key):
        return np.array([x[which][key] for x in sub], float)
    d = {'n': len(sub)}
    for key in ('rim_bias', 'rim_mad', 'rim_bad_frac', 'rim_specks', 'ssim_gray', 'ssim_vis', 'alpha_iou', 'alpha_mad', 'alpha_islands'):
        try:
            b, a = col('before', key), col('after', key)
        except Exception:
            continue
        d[key] = dict(before_median=float(np.nanmedian(b)), after_median=float(np.nanmedian(a)), before_mean=float(np.nanmean(b)), after_mean=float(np.nanmean(a)))
        if key == 'rim_specks':
            d[key].update(before_total=int(np.nansum(b)), after_total=int(np.nansum(a)))
        if key == 'alpha_islands':
            d[key].update(before_total=int(np.nansum(b)), after_total=int(np.nansum(a)))
    bb, ba = col('before', 'rim_bias'), col('after', 'rim_bias')
    d['bias_below_-8'] = dict(before=int((bb < -8).sum()), after=int((ba < -8).sum()))
    d['bias_below_-5'] = dict(before=int((bb < -5).sum()), after=int((ba < -5).sum()))
    d['bias_abs_over_1'] = dict(before=int((np.abs(bb) > 1).sum()), after=int((np.abs(ba) > 1).sum()))
    d['bias_min_max'] = dict(before=[float(bb.min()), float(bb.max())], after=[float(ba.min()), float(ba.max())])
    d['label'] = label
    return d


out = {'all_rebuilt': agg([x for x in rows if x['accepted']], 'every rebuilt master (2x and 4x)'),
       'all_rebuilt_4x': agg([x for x in rows if x['accepted'] and x['scale'] == 4], 'every rebuilt 4x master'),
       'all_rebuilt_2x': agg([x for x in rows if x['accepted'] and x['scale'] == 2], 'every rebuilt 2x master (library 2x, derived from the 4x or 2x only)'),
       'all_measured': agg(rows, 'every measured master, kept or rebuilt')}
# the check's 279
chk = json.load(open('D:/Tools/pyrefly-scratch/2026-10-04/r39-check/likeness/edgeband.json'))
want = {r['label'] for r in chk if 'bias' in r}
sample = []
for x in rows:
    m = x['path']  # characters/sid/state@Nx.png
    parts = m.split('/')
    if len(parts) == 3 and parts[0] == 'characters':
        label = f"{parts[1]}/{parts[2].replace('.png', '')}"
        if label in want:
            sample.append(dict(x, label=label))
out['check_sample_279'] = agg(sample, f'the independent check\'s sample ({len(sample)} of {len(want)} found)')
out['check_sample_missing'] = sorted(want - {x['label'] for x in sample})[:40]
print(json.dumps(out, indent=1)[:6000])
json.dump(out, open(f'{OUT}/summary.json', 'w'), indent=1)

# worst rims before, 4x outputs, one per asset
w4 = [x for x in rows if x['scale'] == 4 and 'rim_bias' in x['before']]
w4.sort(key=lambda x: x['before']['rim_bias'])
worst = [dict(id=x['id'], path=x['path'], bias_before=x['before']['rim_bias'], bias_after=x['after']['rim_bias'], mad_before=x['before']['rim_mad'], mad_after=x['after']['rim_mad'], specks_before=x['before']['rim_specks'], specks_after=x['after']['rim_specks'], accepted=x['accepted']) for x in w4[:40]]
json.dump(worst, open(f'{OUT}/worst40.json', 'w'), indent=1)
for w in worst[:25]:
    print('%-44s bias %6.2f -> %5.2f  mad %5.2f -> %5.2f  specks %4d -> %3d  %s' % (w['id'], w['bias_before'], w['bias_after'], w['mad_before'], w['mad_after'], w['specks_before'], w['specks_after'], '' if w['accepted'] else 'KEPT'))
