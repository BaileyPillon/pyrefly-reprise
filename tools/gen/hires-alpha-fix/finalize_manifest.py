"""Write hires-alpha-fixed/manifest.json from the library's manifest and the batch results, then verify the new library file by file."""
import copy, datetime, glob, hashlib, json, os, sys
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
OLD = 'D:/Tools/pyrefly-art-backup/hires'
NEW = os.environ.get('R39_FIXED_OUT', 'D:/Tools/pyrefly-art-backup/hires-alpha-fixed')
import batch  # PARAMS, VERSION

old = json.load(open(f'{OLD}/manifest.json', encoding='utf8'))
new = copy.deepcopy(old)
results = {}
for f in glob.glob(f'{NEW}/reports/results/*.json'):
    r = json.load(open(f, encoding='utf8'))
    results[r['id']] = r
missing = [a for a in old['assets'] if a not in results]
print('assets', len(old['assets']), 'results', len(results), 'missing', len(missing))
assert not missing, missing[:5]
errors = [a for a, r in results.items() if r['status'] == 'error']
assert not errors, errors[:5]

now = datetime.datetime.now().astimezone().isoformat(timespec='seconds')
counts = {'assets_fixed': 0, 'assets_kept': 0, 'assets_skipped': 0, 'assets_linked': 0, 'outputs_rebuilt': 0, 'outputs_linked': 0}
for aid, rec in new['assets'].items():
    r = results[aid]
    if r['status'] == 'fixed':
        counts['assets_fixed'] += 1
        by = {x['path']: x for x in r['outputs']}
        kept = []
        for o in rec['outputs']:
            ro = by.get(o['path'])
            if ro and ro.get('accepted'):
                assert o['size'] == ro['size'], (aid, o['size'], ro['size'])
                o['bytes_png'] = ro['bytes_png']
                o.pop('bytes_webp_lossless', None)
                o.pop('webp_method', None)
                o['sha256'] = ro['sha256']
                o['alpha_fixed'] = True
                counts['outputs_rebuilt'] += 1
            else:
                counts['outputs_linked'] += 1
                kept.append(o['path'])
        rec['source_sha256'] = r['source_sha256']
        first = next(x for x in r['outputs'] if x.get('accepted'))
        rec['alpha_fix'] = {'applied': True, 'version': batch.VERSION, 'tier_measured': first['scale'], 'before': {k: first['before'].get(k) for k in ('rim_bias', 'rim_mad', 'rim_specks', 'ssim_gray', 'alpha_iou')},
                            'after': {k: first['after'].get(k) for k in ('rim_bias', 'rim_mad', 'rim_specks', 'ssim_gray', 'alpha_iou')},
                            **({'rebuilt_from_cleaned_1x': True} if r.get('cleaned_1x') else {}), **({'kept_outputs': kept} if kept else {})}
    else:
        counts[f'assets_{r["status"]}'] += 1
        counts['outputs_linked'] += len(rec['outputs'])
        why = r.get('note') or '; '.join(x.get('kept_because', '') for x in r['outputs'] if x.get('kept_because')) or 'nothing to repair'
        rec['alpha_fix'] = {'applied': False, 'status': r['status'], 'why': why}
new['alpha_fix'] = {
    'version': batch.VERSION, 'date': now, 'params': batch.PARAMS, 'counts': counts,
    'what': 'Release 39 repair (the independent fidelity check, defect 3): every figure and boss master has its alpha rebuilt from the approved 1x alpha (bicubic upscale, a smooth contour, a one-pixel feather) and the approved rim put back '
            '(the outer band takes the approved colours, bled and upscaled; the interior keeps the master), with colour bled under the transparent pixels beside the silhouette. '
            'The 2x of a 4x asset is the rebuilt 4x reduced (colour and alpha apart). Backdrops, pause and title art are opaque and unchanged (hard links). '
            'An asset whose 1x painting changed since the master was rendered (Evrae) is linked unchanged; the trapped-white assets (D-380) are rebuilt from the cleaned 1x and their source_sha256 is the cleaned painting\'s. '
            'Method and numbers: reports/README-alpha-fix.md; tools: D:/Tools/pyrefly-scratch/2026-10-04/r39-repair (alphafix.py, batch.py), copied to reports/tools/.',
}
json.dump(new, open(f'{NEW}/manifest.json.tmp', 'w', encoding='utf8'), indent=1)
os.replace(f'{NEW}/manifest.json.tmp', f'{NEW}/manifest.json')
print(json.dumps(counts))

# ---- verify the new library file by file
problems = []
paths = set()
for aid, rec in new['assets'].items():
    for o in rec['outputs']:
        p = f'{NEW}/{o["path"]}'
        paths.add(o['path'].replace('\\', '/'))
        if not os.path.exists(p):
            problems.append(f'missing {o["path"]}')
            continue
        if os.path.getsize(p) != o['bytes_png']:
            problems.append(f'size {o["path"]}: file {os.path.getsize(p)} manifest {o["bytes_png"]}')
        if o.get('alpha_fixed'):
            h = hashlib.sha256(open(p, 'rb').read()).hexdigest()
            if h != o['sha256']:
                problems.append(f'sha {o["path"]}')
            with Image.open(p) as im:
                if list(im.size) != list(o['size']):
                    problems.append(f'dimensions {o["path"]}: {im.size} vs {o["size"]}')
        else:
            if not os.path.samefile(p, f'{OLD}/{o["path"]}'):
                problems.append(f'not a link of the library file: {o["path"]}')
orph = []
for root, _, files in os.walk(NEW):
    rel_root = os.path.relpath(root, NEW).replace('\\', '/')
    if rel_root.startswith('reports'):
        continue
    for f in files:
        rel = f if rel_root == '.' else f'{rel_root}/{f}'
        if rel not in paths and rel not in ('manifest.json', 'manifest.json.tmp'):
            orph.append(rel)
print('problems', len(problems), problems[:10])
print('orphan files', len(orph), orph[:10])
json.dump({'counts': counts, 'problems': problems, 'orphans': orph, 'at': now}, open(f'{NEW}/reports/verify-library.json', 'w'), indent=1)
