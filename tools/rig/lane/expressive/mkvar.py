"""mkvar.py <config.json> <pose> <maskdir> [--parts a,b,..] [--tex 0.75] [--texpart hair=0.6,..] [--fill name=r,..] [--pad 600] [--meshk 1.6] : writes build.variants.<part>.<pose>.from_painting (a mask spec) for each part (chain-skinned
when the part's build.skin is a chain, rigid otherwise) and fit.keys.<pose>.image.<part> = <pose> into the subject config. Replaces an existing <pose> variant of those parts."""
import json
import sys

a = sys.argv[1:]
cfg_path, pose, maskdir = a[0], a[1], a[2]
g = lambda n, d: a[a.index(n) + 1] if n in a else d  # noqa: E731
cfg = json.load(open(cfg_path, encoding='utf8'))
skin = cfg['build']['skin']
parts = g('--parts', ','.join(skin)).split(',')
tex = float(g('--tex', '1.0'))
texpart = {kv.split('=')[0]: float(kv.split('=')[1]) for kv in g('--texpart', '').split(',') if kv}
fills = {kv.split('=')[0]: float(kv.split('=')[1]) for kv in g('--fill', '').split(',') if kv}
pad = int(g('--pad', '600'))
v = cfg['build'].setdefault('variants', {})
for part in parts:
    sk = skin[part]
    spec = {'pose': pose, 'mask': f'{maskdir}/{pose}.{part}.png', 'mask_pad': pad, 'register': pose, 'scale': 1.0, 'mesh': dict(sk.get('mesh', {'edge': 18, 'inner': 34, 'grow': 10}))}
    meshk = float(g('--meshk', '1.0'))  # a coarser mesh for a piece (vertex budget: a boss with a piece of every part of five poses); 1.6 gives about 0.4 of the vertices
    spec['mesh'] = {k: (round(m * meshk) if meshk != 1.0 else m) for k, m in spec['mesh'].items()}
    if sk.get('type') == 'chain':
        spec['skin'] = 'chain'
    t = texpart.get(part, tex)
    if t != 1.0:
        spec['tex'] = t
    if part in fills:
        spec['fill_joints'] = fills[part]
    v.setdefault(part, {})[pose] = {'from_painting': spec}
    cfg['fit']['keys'].setdefault(pose, {}).setdefault('image', {})[part] = pose
json.dump(cfg, open(cfg_path, 'w', encoding='utf8'), indent=1)
print({p: list(x) for p, x in v.items()})
