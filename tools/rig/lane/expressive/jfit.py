"""jfit.py <config name> <pose> [--margin 6] [--prior 0.03] [--maxd 0.4] [--write] : nudge a key's bone ROTATIONS so that every joint the hole test watches sits deep enough inside the pose's painting (signed distance to the figure's
edge >= the disc's radius + margin), staying as close as it can to the key's own rotations. Needed when a key shows pieces cut from the painting (variants): the pieces land exactly where the painting has them whatever the bones
are, so the bones are free to put their pivots where the hole test wants them. Prints the joints before and after. --write replaces the key's rotations in D:/pyrefly-art-rigs-work/<name>/fit/keys.json (a copy is kept as keys.before-jfit.json).
Env XID (the art id) and XWORK are set from the config name by the caller: XID=shiva XWORK=shiva-x. Needs the exported rig (rig.json) for the model and `joints.mjs` output in <work>/joints.json."""
import json
import shutil
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent))
from scipy import ndimage as ndi
from scipy.optimize import least_squares
from xl import *

a = sys.argv[1:]
name, pose = a[0], a[1]
g = lambda n, d: ((type(d) if d is not None else str)(a[a.index(n) + 1])) if n in a else d  # noqa: E731
margin, prior, maxd = g('--margin', 6.0), g('--prior', 0.03), g('--maxd', 0.4)
work = pathlib.Path('D:/pyrefly-art-rigs-work') / name
rigdir = pathlib.Path('D:/pyrefly-art-rigs') / name
rig, T, model = load_model(rigdir)
keys = json.load(open(work / 'fit' / 'keys.json'))
J = json.load(open(work / 'joints.json'))
sx = J['frame']['sx']
_hidden = set((json.load(open(f'D:/pyrefly-rig-valefor/tools/rig/subjects/{name}.json', encoding='utf8'))['fit']['keys'].get(pose, {}).get('hide') or []))
_only = set(g('--only', '').split(',')) - {''}
joints = {j['name']: j['r'] / sx for j in J['joints'] if not all(m in _hidden for m in j['meet']) and (not _only or j['name'] in _only)}  # master px; a joint none of whose parts the key shows is not watched
build = json.load(open(work / 'build' / 'build.json'))
rest = {b['name']: (b['x'], b['y']) for b in build['bones']}
PAD = 600
al = np.asarray(painting_in_master(pose, pad=PAD).split()[3]) >= 76
inside = ndi.distance_transform_edt(al)
outside = ndi.distance_transform_edt(~al)
sd = (inside - outside).astype(np.float32)


MASKDIR = g('--masks', None)
sdm = {}  # joint -> signed distance map of the union of the masks of the parts meeting there (the pivot must be deep inside ITS pieces, not just anywhere in the figure)
if MASKDIR:
    for j in J['joints']:
        if j['name'] not in joints:
            continue
        union = np.zeros(al.shape, bool)
        for pn in j['meet']:
            f = pathlib.Path(MASKDIR) / f'{pose}.{pn}.png'
            if f.exists() and pn not in _hidden:
                union |= np.asarray(Image.open(f).convert('L')) > 127
        union &= al
        sdm[j['name']] = (ndi.distance_transform_edt(union) - ndi.distance_transform_edt(~union)).astype(np.float32)


def sdist(p, jn=None):
    m = sdm.get(jn, sd)
    return float(ndi.map_coordinates(m, [[p[1] + PAD], [p[0] + PAD]], order=1, mode='nearest')[0])


cfg = json.load(open(f'D:/pyrefly-rig-valefor/tools/rig/subjects/{name}.json', encoding='utf8'))
lm_bind = {n: (v[0], v[1]) for n, v in (cfg['build'].get('landmarks') or {}).items()}  # name -> (bone, rest 1x px)
marks = {n: v for n, v in (cfg.get('landmarks') or {}).get(pose, {}).items() if n in lm_bind and (not g('--marks', '') or n in g('--marks', '').split(','))}
_ax, _bx, _ay, _by = maps(T, pose)
mm = lambda m: (_ax * 2.0 * m[0] + _bx, _ay * 2.0 * m[1] + _by)  # a mark (the pose painting's 1x px) in master px of the idle frame
OFFW = float(g('--offw', 0.3))
LM_FREE = float(g('--lmfree', 45.0))  # master px of drift from a mark that costs nothing (the gate's limit is 0.06 of the idle's height, about 130 master px)
key = keys[pose]
_free = set(g('--bones', '').split(',')) - {''}
bones = sorted(key['bones'])
FROZEN = [b for b in bones if _free and b not in _free]
rot0 = np.array([key['bones'][n].get('rot', 0.0) for n in bones])
# every bone's offset (dx, dy) is free too (--alloff), else only the pelvis': a pivot the rotations cannot bring into the painting is moved by an offset (the variants register through whatever the bones are)
ALLOFF = '--alloff' in a
obones = ([b for b in bones if (not _free or b in _free)] if ALLOFF else ['pelvis'])
off0 = np.array([key['bones'].get(n, {}).get(c, 0.0) for n in obones for c in ('dx', 'dy')])
nb = len(bones)


def pivots(x):
    rots = x[:nb]
    k2 = json.loads(json.dumps(key))
    for n, r in zip(bones, rots):
        k2['bones'][n]['rot'] = float(r)
    for i, n in enumerate(obones):
        k2['bones'].setdefault(n, {})['dx'] = float(x[nb + 2 * i])
        k2['bones'][n]['dy'] = float(x[nb + 2 * i + 1])
    pose_key(model, rig, k2)
    out = {}
    for nm, (bn, (lx, ly)) in lm_bind.items():
        if nm in marks:
            Mq = bone_matrix(model, bn) @ np.array([lx * 2.0, ly * 2.0, 1.0])
            out['@' + nm] = (float(Mq[0]), float(Mq[1]))
    for jn in joints:
        M = bone_matrix(model, jn)
        q = M @ np.array([rest[jn][0], rest[jn][1], 1.0])
        out[jn] = (float(q[0]), float(q[1]))
    return out


def bone_matrix(model, nm):
    k = model.k[model.idx[nm]]
    return np.array([[k[0], k[2], k[4]], [k[1], k[3], k[5]], [0, 0, 1]], np.float64)


def resid(x):
    pv = pivots(x)
    r = [max(0.0, joints[jn] + margin - sdist(pv[jn], jn)) for jn in joints]
    for nm, (mx, my) in marks.items():
        px, py = pv['@' + nm]
        qx, qy = mm((mx, my))
        r.append(max(0.0, float(np.hypot(px - qx, py - qy)) - LM_FREE))
        if nm.startswith(('toe', 'foot', 'sole')):  # the planted-feet rule: the lowest foot landmark stays on its bind row (its rest row, the key's root.dy aside)
            r.append(4.0 * max(0.0, abs(py - (lm_bind[nm][1][1] * 2.0 + key.get('root', {}).get('dy', 0.0))) - 6.0))
    r += list(150.0 * np.sqrt(prior) * (x[:nb] - rot0))
    r += list(OFFW * np.sqrt(prior) * (x[nb:] - off0))
    return np.array(r)


def report(x, tag):
    pv = pivots(x)
    print(tag)
    for nm, (mx, my) in marks.items():
        px, py = pv['@' + nm]
        qx, qy = mm((mx, my))
        print(f'  mark {nm:8s} off by {np.hypot(px - qx, py - qy):6.1f} master px')
    for jn in joints:
        s = sdist(pv[jn], jn)
        print(f'  {jn:8s} pivot ({pv[jn][0]:.0f}, {pv[jn][1]:.0f})  depth {s:6.1f}  needs {joints[jn]:.1f}  {"OK" if s >= joints[jn] else "HOLE"}')


x00 = np.concatenate([rot0, off0])
frozen_idx = [i for i, b in enumerate(bones) if b in FROZEN]
report(x00, 'before')
OFFMAX = float(g('--offmax', 80.0))
lo, hi = np.concatenate([rot0 - maxd, off0 - OFFMAX]), np.concatenate([rot0 + maxd, off0 + OFFMAX])
for i in frozen_idx:
    lo[i], hi[i] = rot0[i] - 1e-9, rot0[i] + 1e-9
best = None
for trial in range(6):
    x0 = x00 + (0 if trial == 0 else np.random.default_rng(trial).normal(0, 0.05, x00.shape) * np.concatenate([np.ones(nb), np.full(len(off0), 100.0)]))
    sol = least_squares(resid, np.clip(x0, lo, hi), bounds=(lo, hi), diff_step=1e-3, max_nfev=300)
    if best is None or sol.cost < best.cost:
        best = sol
    if sol.cost < 1.0:
        break
xb = best.x
rots = xb[:nb]
report(xb, f'after (cost {best.cost:.2f}); max rotation change {np.abs(rots - rot0).max():.3f} rad at {bones[int(np.abs(rots - rot0).argmax())]}; max offset change {np.abs(xb[nb:] - off0).max() if len(off0) else 0:.1f}')
if '--write' in a:
    shutil.copy(work / 'fit' / 'keys.json', work / 'fit' / 'keys.before-jfit.json') if not (work / 'fit' / 'keys.before-jfit.json').exists() else None
    for n, r in zip(bones, rots):
        keys[pose]['bones'][n]['rot'] = round(float(r), 4)
    for i, n in enumerate(obones):
        keys[pose]['bones'].setdefault(n, {})['dx'] = round(float(xb[nb + 2 * i]), 2)
        keys[pose]['bones'][n]['dy'] = round(float(xb[nb + 2 * i + 1]), 2)
    json.dump(keys, open(work / 'fit' / 'keys.json', 'w'), separators=(',', ':'))
    print('written')
