import sys, glob, json
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from ro_common import *
import ro_sheets
L = OUTLIB
man = load_json(f'{L}/manifest.json')['assets']
assets = {x['id']: x for x in plan()}
for f in sorted(glob.glob(f'{RW}/chars/*.json')):
    cid = json.load(open(f))['cid']
    print(ro_sheets.char_sheet_all(cid, man, assets, L, 'D:/Tools/pyrefly-art-backup/candidates/2026-10-05-painterly-cast/sheets'), flush=True)
