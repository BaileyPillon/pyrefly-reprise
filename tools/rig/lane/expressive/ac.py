"""ac.py <config.json> <cuts.json> : writes build.variants.<part>.<name>.from_painting from cuts.json ("part:name": {pose, poly, cutline, register, ...}) into the subject config and
sets fit.keys.<key>.image.<part> = <name> for each key in the cut's "show" list (default [name]). Idempotent: the variants of the parts named in cuts.json are replaced."""
import json
import sys

cfg_path, cuts_path = sys.argv[1], sys.argv[2]
cfg = json.load(open(cfg_path, encoding='utf8'))
cuts = json.load(open(cuts_path, encoding='utf8'))
b = cfg.setdefault('build', {})
b['variants'] = {}
for k in cfg['fit']['keys'].values():
    k.pop('image', None)
for key, cut in cuts.items():
    if key.startswith('_'):
        continue
    part, name = key.split(':')
    spec = {k: v for k, v in cut.items() if k not in ('show',)}
    spec.setdefault('register', name)
    spec.setdefault('feather', 14)
    spec.setdefault('mesh', {'edge': 18, 'inner': 34, 'grow': 10})
    b['variants'].setdefault(part, {})[name] = {'from_painting': spec}
    for pose in cut.get('show', [name]):
        cfg['fit']['keys'].setdefault(pose, {}).setdefault('image', {})[part] = name
json.dump(cfg, open(cfg_path, 'w', encoding='utf8'), indent=1)
print('variants:', {p: list(v) for p, v in b['variants'].items()})
