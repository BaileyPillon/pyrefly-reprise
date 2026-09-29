"""Sin production art (FFX only, 2026-09-29): list, then install, the staged files (produce.py, plates.py).

  python install.py list      write <SCRATCH>/staged.json (every staged file with its sha256): check.mjs reads it
  python install.py install   copy into D:/Final Fantasy/public/art: NEW FILES ONLY (refuses the whole install if any
                              target exists), and back every file up to D:/Tools/pyrefly-art-backup/approved/2026-09-29-sin/;
                              writes <SCRATCH>/installed.json. Refuses unless the release-29 gate file exists and D: has
                              3 GB free. Never deletes or overwrites anything.
"""
import hashlib
import json
import os
import shutil
import sys
from datetime import datetime, timezone

SCRATCH = 'D:/Tools/pyrefly-scratch/overnight-0929/sin-install'
STAGE = f'{SCRATCH}/stage'
ART = 'D:/Final Fantasy/public/art'
BACKUP = 'D:/Tools/pyrefly-art-backup/approved/2026-09-29-sin'
GATE = 'D:/Tools/pyrefly-scratch/overnight-0929/rel29-deployed.done'


def staged():
    out = []
    for dp, _, fs in os.walk(STAGE):
        for f in sorted(fs):
            p = os.path.join(dp, f)
            rel = os.path.relpath(p, STAGE).replace('\\', '/')
            out.append({'rel': rel, 'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest(), 'bytes': os.path.getsize(p)})
    return sorted(out, key=lambda r: r['rel'])


def main(cmd):
    files = staged()
    if cmd == 'list':
        json.dump({'root': STAGE, 'files': files}, open(f'{SCRATCH}/staged.json', 'w'), indent=1)
        print(len(files), 'staged files,', round(sum(f['bytes'] for f in files) / 2 ** 20, 1), 'MB')
        return
    if cmd != 'install':
        raise SystemExit('list | install')
    if not os.path.exists(GATE):
        raise SystemExit(f'public/art gate closed: {GATE} is missing')
    free = shutil.disk_usage('D:/').free
    if free < 3 * 2 ** 30:
        raise SystemExit(f'D: has {free / 2 ** 30:.1f} GB free, under 3 GB')
    clash = [f['rel'] for f in files if os.path.exists(f'{ART}/{f["rel"]}')]
    if clash:
        raise SystemExit('refusing: these targets already exist (never overwrite): ' + ', '.join(clash))
    stamp = datetime.now(timezone.utc).isoformat()
    for f in files:
        src = f'{STAGE}/{f["rel"]}'
        for root in (ART, BACKUP):
            dst = f'{root}/{f["rel"]}'
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
        got = hashlib.sha256(open(f'{ART}/{f["rel"]}', 'rb').read()).hexdigest()
        if got != f['sha256']:
            raise SystemExit(f'copy mismatch: {f["rel"]}')
        f['mtime'] = datetime.fromtimestamp(os.path.getmtime(f'{ART}/{f["rel"]}'), timezone.utc).isoformat()
    json.dump({'root': ART, 'installedAt': stamp, 'backup': BACKUP, 'files': files}, open(f'{SCRATCH}/installed.json', 'w'), indent=1)
    json.dump({'root': ART, 'installedAt': stamp, 'files': files}, open(f'{BACKUP}/installed.json', 'w'), indent=1)
    print('installed', len(files), 'files; backup', BACKUP)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'list')
