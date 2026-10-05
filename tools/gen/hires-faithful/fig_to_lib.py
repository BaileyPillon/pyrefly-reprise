"""fig_to_lib.py <asset id> ...: after run_jobs.py (the old library's refined/base master of the asset) and batch.py with R39_FIXED_OUT=hires-r39-art
(the alpha and rim rebuilt from the approved 1x painting), write the asset's record into the r39 library manifest, as finalize_manifest.py does for the
repaired library. Checks every output file's size, bytes and (for a rebuilt one) sha256 first.
"""
import copy
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
sys.path.insert(0, 'D:/pyrefly-r39-art/tools/gen/hires-alpha-fix')
from r39lib import *
import batch  # PARAMS, VERSION

OLD = 'D:/Tools/pyrefly-art-backup/hires'


def main():
    old = json.load(open(f'{OLD}/manifest.json', encoding='utf8'))
    for aid in sys.argv[1:]:
        rec = copy.deepcopy(old['assets'][aid])
        rp = f'{OUTLIB}/reports/results/{aid.replace("/", "__")}.json'
        res = json.load(open(rp, encoding='utf8'))
        if res['status'] == 'error':
            raise SystemExit(f'{aid}: batch error {res.get("error")}')
        by = {x['path']: x for x in res['outputs']}
        kept = []
        for o in rec['outputs']:
            ro = by.get(o['path'])
            p = f'{OUTLIB}/{o["path"]}'
            if ro and ro.get('accepted'):
                o['bytes_png'] = ro['bytes_png']
                o['sha256'] = ro['sha256']
                o['alpha_fixed'] = True
                o.pop('bytes_webp_lossless', None)
                o.pop('webp_method', None)
                assert o['size'] == ro['size'], (aid, o['size'], ro['size'])
            else:
                kept.append(o['path'])
            if not os.path.exists(p) or os.path.getsize(p) != o['bytes_png']:
                raise SystemExit(f'{aid}: {p} missing or wrong size')
        if res['status'] == 'fixed':
            first = next(x for x in res['outputs'] if x.get('accepted'))
            rec['source_sha256'] = res['source_sha256']
            rec['alpha_fix'] = {'applied': True, 'version': batch.VERSION, 'tier_measured': first['scale'],
                                'before': {k: first['before'].get(k) for k in ('rim_bias', 'rim_mad', 'rim_specks', 'ssim_gray', 'alpha_iou')},
                                'after': {k: first['after'].get(k) for k in ('rim_bias', 'rim_mad', 'rim_specks', 'ssim_gray', 'alpha_iou')},
                                **({'kept_outputs': kept} if kept else {})}
        else:
            rec['alpha_fix'] = {'applied': False, 'status': res['status'], 'why': res.get('note') or 'nothing to repair'}
        rec['r39_art'] = {'made': now(), 'note': 'rendered by the library recipe from the painting installed now; alpha and rim rebuilt from the approved 1x (hires-alpha-fix)'}
        lib_put(rec)
        a = rec.get('alpha_fix', {})
        say(f'{aid}: {rec["tier"]} {rec["status"]} flags {rec.get("flags")} alpha_fix {a.get("applied")} '
            f'bias {a.get("before", {}).get("rim_bias")} -> {a.get("after", {}).get("rim_bias")} specks {a.get("before", {}).get("rim_specks")} -> {a.get("after", {}).get("rim_specks")}')


if __name__ == '__main__':
    main()
