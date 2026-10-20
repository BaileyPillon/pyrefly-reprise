"""rb.py <config name> [--gate-only] [--art DIR] : variants -> export (no gate) -> gate --json -> claims rewritten into fit/keys.json -> export + gate (the stamp). Scratch driver of the rig-expressive lane (generalised from the Bahamut pilot's rebuild.py).
The rig goes to D:/pyrefly-art-rigs/<config name>, the work folder is D:/pyrefly-art-rigs-work/<config name>."""
import json
import subprocess
import sys

sys.path.insert(0, 'D:/pyrefly-rig-valefor/tools/rig')
sys.path.insert(0, 'D:/pyrefly-rig-valefor/tools/rig/lane')
import lane_fit

REPO = 'D:/pyrefly-rig-valefor'
PY = 'D:/Tools/ComfyUI/python_embeded/python.exe'
name = sys.argv[1]
ART = sys.argv[sys.argv.index('--art') + 1] if '--art' in sys.argv else 'D:/pyrefly-art-r55'
RIG = f'D:/pyrefly-art-rigs/{name}'
WORK = f'D:/pyrefly-art-rigs-work/{name}'


def run(cmd):
    r = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr)


if '--gate-only' not in sys.argv:
    for step in (['variants'], ['export', '--out', RIG, '--no-gate']):
        c, out = run([PY, '-I', 'tools/rig/rig.py', *step, '--subject', name])
        print(out.strip() if step[0] == 'variants' else out.strip().splitlines()[-1] if c == 0 else out)
        if c:
            sys.exit(c)
c, out = run(['node', 'tools/rig-gate.mjs', '--rig', RIG, '--art', ART, '--check', '--json', WORK + '/gate-check.json'])
g = json.load(open(WORK + '/gate-check.json'))
g = g[0] if isinstance(g, list) else g
keys = json.load(open(WORK + '/fit/keys.json'))
keys, changes = lane_fit.rewrite_claims(keys, g)
json.dump(keys, open(WORK + '/fit/keys.json', 'w'), separators=(',', ':'))
print('claims:', changes)
c, out = run([PY, '-I', 'tools/rig/rig.py', 'export', '--subject', name, '--out', RIG, '--no-gate'])
c, out = run(['node', 'tools/rig-gate.mjs', '--rig', RIG, '--art', ART])
print(out)
sys.exit(c)
