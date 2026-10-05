"""lib_backdrops.py: record the six faithful backdrop masters in the r39 library manifest (from the reports fd_full.py wrote)."""
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from r39lib import *

GAME = {'gagazet': 'FFX only', 'garden-of-pain': 'FFX only', 'via-purifico': 'FFX only', 'road-to-the-farplane': 'FFX-2 only', 'road-to-the-farplane-links': 'FFX-2 only',
        'title': None}
NOTE = {'title': 'drawn by no screen today (the title screen shows title/keyart.png); a clean master so the held list is empty and the file is not a defect'}
for k in GAME:
    r = json.load(open(f'{OUTLIB}/reports/{k}.json', encoding='utf8'))
    dst = f'{OUTLIB}/backdrops/{k}@2x.png'
    rec = {'id': f'backdrops/{k}@2x', 'src': f'public/art/backdrops/{k}.png', 'prio': 'P1', 'class': 'backdrop', 'tier': 'faithful', 'scale': 2,
           'outputs': [{'path': f'backdrops/{k}@2x.png', 'scale': 2, 'bytes_png': os.path.getsize(dst), 'size': r['size'], 'sha256': sha256(dst)}],
           'flags': r['flags'], 'status': 'ok' if not r['flags'] else 'flagged',
           'recipe': 'faithful detail (r39-art, fd.py): RealESRGAN_x4plus 2x as a detail source only; its detail relative to the bicubic carrier is limited per pixel to an amplitude the painting itself allows '
                     f'(a0 {r["recipe"]["a0"]} + kappa {r["recipe"]["kappa"]} x the local rms of the painting\'s fine detail), thin dark lines the painting does not imply are blended back to a bounded adaptive unsharp master; tones are the painting\'s own',
           'game': GAME[k], 'source_sha256': r['source_sha256'], 'qc': r['qc'], 'lines': r['lines'], 'lines_old_library_master': r['lines_old_library_master'],
           'finished_at': now(), 'replaces_held': 'the library master of 2026-10-04 (HELD_BACKDROPS in tools/hires-install.mjs)'}
    if k in NOTE:
        rec['note'] = NOTE[k]
    lib_put(rec)
    say(f'{k}: recorded, status {rec["status"]}, {rec["outputs"][0]["bytes_png"] / 1e6:.1f} MB')
