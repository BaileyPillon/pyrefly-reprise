import json, glob, sys
out = []
for f in sorted(glob.glob('D:/Tools/pyrefly-scratch/2026-10-05/rollout/chars/*.json'), key=lambda p: json.load(open(p))['finished']):
    d = json.load(open(f))
    if d['announced']:
        continue
    out.append(f"{d['cid']}: {d['poses']} poses, ok {d['ok']} (D {d['D']}, C {d['C']}), by eye {d['by_eye']} {d['by_eye_poses']}, second seed {d['second_seed']}; sheet {d['sheet']}")
    if '--mark' in sys.argv:
        d['announced'] = True; json.dump(d, open(f, 'w'), indent=1)
print('\n'.join(out) if out else 'none')
