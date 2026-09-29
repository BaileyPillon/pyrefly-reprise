"""Sin art options, 2026-09-29 (FFX only): from the picked paintings, compose every frame background (compose.py,
compose_bk.py) and write frames/jobs.json for render.mjs (the stand-in HUD in frame.html).

The picks are an agent's look after LOOKING at every render (the verdicts are in sheet.json's method section).
Core positions are our sketches' (sketch.py, sketch_link3.py); compose.py finds the painted core near them.

  python make_frames.py
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin'
B = f'{C}/frames-bg'
PY = sys.executable

PICKS = {
    # (painting, core x,y from the sketch, core radius): option A, the clawed arm; option B, the pectoral fin
    'fin-a-l-near': ('fins/fin-a-l-near-3', (0.875, 0.60), 0.06),
    'fin-a-l-far': ('fins/fin-a-l-far-2', None, 0),
    'fin-a-r-near': ('fins/fin-a-r-near-1', (0.845, 0.16), 0.06),
    'fin-a-r-far': ('fins/fin-a-r-far-2', None, 0),
    'fin-b-l-near': ('fins/fin-b-l-near-1', (0.875, 0.60), 0.06),
    'fin-b-l-far': ('fins/fin-b-l-far-2', None, 0),
    'fin-b-r-near': ('fins/fin-b-r-near-2', (0.845, 0.16), 0.06),
    'fin-b-r-far': ('fins/fin-b-r-far-2', None, 0),
    'genais-a': ('link3/genais-a-4', (0.78, 0.25), 0.07),
    'genais-a-shell': ('link3/genais-a-4-shell-1', (0.78, 0.25), 0.07),
    'genais-b': ('link3/genais-b-4', (0.83, 0.14), 0.035),
    'genais-b-shell': ('link3/genais-b-4-shell-1', (0.83, 0.14), 0.035),
    'bk-a': ('backdrop/bk-a-8', None, 0),
    'bk-b': ('backdrop/bk-b-4', None, 0),
}
# the turn-order icon's window on each painting (normalised centre of the foe)
ICON = {'fin-a-l-near': (0.84, 0.35), 'fin-a-r-near': (0.80, 0.30), 'fin-b-l-near': (0.82, 0.40), 'fin-b-r-near': (0.80, 0.35),
        'fin-a-l-far': (0.78, 0.33), 'fin-a-r-far': (0.74, 0.28), 'fin-b-l-far': (0.78, 0.33), 'fin-b-r-far': (0.74, 0.28),
        'genais-a': (0.61, 0.55), 'genais-b': (0.64, 0.50)}
CORE_ICON = {'genais-a': (0.78, 0.25), 'genais-b': (0.83, 0.15)}


def run(*a):
    r = subprocess.run([PY, *a], cwd=HERE, capture_output=True, text=True)
    print((r.stdout + r.stderr).strip())
    if r.returncode:
        raise SystemExit('failed: ' + ' '.join(a))


def main(only=None):
    os.makedirs(B, exist_ok=True)
    jobs = []
    for key, (stem, core, rad) in PICKS.items():
        if only and not key.startswith(only):
            continue
        src = f'{C}/{stem}.full.png'
        if key.startswith('fin'):
            opt, side, rng = key.split('-')[1:4]
            near = rng == 'near'
            states = [('', 'dim')] + ([('-charge', 'charge')] if near and side == 'l' else [])
            for suf, st in states:
                out = f'{B}/{key}{suf}.jpg'
                extra = ['near'] if near else []
                if core:
                    extra += [f'{st}={core[0]},{core[1]}', f'r={rad}']
                run('compose.py', src, out, 'deck', *extra)
                icx, icy = ICON[key]
                jobs.append({'out': f'frames/{key}{suf}.jpg', 'q': {'kind': 'fin', 'img': out, 'side': side, 'range': rng,
                             'charge': '1' if st == 'charge' else '0', 'opt': opt.upper(), 'icx': icx, 'icy': icy}})
        elif key.startswith('genais'):
            opt = key.split('-')[1]
            shell = key.endswith('shell')
            out = f'{B}/{key}.jpg'
            run('compose.py', src, out, f'{"charge" if shell else "dim"}={core[0]},{core[1]}', f'r={rad}')
            icx, icy = ICON[f'genais-{opt}']; cx, cy = CORE_ICON[f'genais-{opt}']
            jobs.append({'out': f'frames/{key}.jpg', 'q': {'kind': 'link3', 'img': out, 'shell': '1' if shell else '0',
                         'charge': '1' if shell else '0', 'opt': opt.upper(), 'icx': icx, 'icy': icy, 'icx2': cx, 'icy2': cy}})
        else:
            out = f'{B}/{key}.jpg'
            run('compose_bk.py', src, out)
            jobs.append({'out': f'frames/{key}.jpg', 'q': {'kind': 'bk', 'img': out, 'opt': key[-1].upper()}})
    json.dump(jobs, open(os.path.join(HERE, 'jobs.json'), 'w'), indent=1)
    print(len(jobs), 'jobs')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
