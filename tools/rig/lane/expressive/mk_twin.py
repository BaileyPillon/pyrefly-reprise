"""mk_twin.py <twin config name> <of config name> <twin art id> [--targets-from <work folder>] : lane.py twin without its export into the shipped folder: the config (registered, shifted, variants included), cut, build, the base's keys (claims dropped) and the targets.
The rig itself is then built with `rig.py variants` and `rig.py export --out D:/pyrefly-art-rigs/<name>`."""
import json
import pathlib
import shutil
import subprocess
import sys

sys.path.insert(0, 'D:/pyrefly-rig-valefor/tools/rig')
sys.path.insert(0, 'D:/pyrefly-rig-valefor/tools/rig/lane')
import lane_twin
from rig_common import SUBJECTS, WORK_ROOT, Subject

name, of, twin_id = sys.argv[1:4]
tfrom = sys.argv[sys.argv.index('--targets-from') + 1] if '--targets-from' in sys.argv else None
PY = 'D:/Tools/ComfyUI/python_embeded/python.exe'
REPO = 'D:/pyrefly-rig-valefor'
base_path = SUBJECTS / f'{of}.json'
base = json.loads(base_path.read_text(encoding='utf8'))
cfg = lane_twin.twin_config(base, twin_id, of, None)
base_sub = Subject(of, config_path=base_path)
shifts = lane_twin.registrations(base_sub.dir_chars, base_sub.art / 'characters' / twin_id, list((base.get('landmarks') or {}).keys()))
print('registration:', shifts)
cfg, skipped = lane_twin.shift_config(cfg, {p: (dx, dy) for p, (dx, dy, _) in shifts.items()})
cfg['_twin_shift'] = {p: [dx, dy, iou] for p, (dx, dy, iou) in shifts.items()}
print('NOT MOVED:', skipped)
dest = SUBJECTS / f'{name}.json'
if dest.exists():
    raise SystemExit(f'{dest} exists')
dest.write_text(json.dumps(cfg, indent=1), encoding='utf8')
work = WORK_ROOT / name
(work / 'fit').mkdir(parents=True, exist_ok=True)
base_keys = json.loads((WORK_ROOT / of / 'fit' / 'keys.json').read_text())
(work / 'fit' / 'keys.json').write_text(json.dumps(lane_twin.twin_keys(base_keys, base.get('subject', of), twin_id), separators=(',', ':')))
if tfrom:
    for d in ('targets', 'targets_costume'):
        if (WORK_ROOT / tfrom / d).exists():
            shutil.copytree(WORK_ROOT / tfrom / d, work / d, dirs_exist_ok=True)
for step in ('cut', 'build'):
    r = subprocess.run([PY, '-I', 'tools/rig/rig.py', step, '--subject', name], cwd=REPO, capture_output=True, text=True)
    print(step, r.returncode, (r.stdout + r.stderr).strip().splitlines()[-1] if (r.stdout + r.stderr).strip() else '')
    if r.returncode:
        print(r.stdout, r.stderr)
        sys.exit(r.returncode)
