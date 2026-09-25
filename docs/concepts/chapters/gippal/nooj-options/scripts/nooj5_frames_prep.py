"""Look-only B-treated copies of the three option pairs for the engine frames (nothing goes to public/art).
Runs production/scripts/shade_b.py (the installed shades' own B code) on each picked cutout and writes a sidecar."""
import json, subprocess, os
from PIL import Image
C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj5'
ART = 'D:/Tools/pyrefly-scratch/nooj5/art/characters'
SHADE = 'D:/Final Fantasy/docs/concepts/chapters/gippal/production/scripts/shade_b.py'
PICK = {  # option -> (idle cutout, cast cutout)
    'nooj5-lean': ('idle-lean/C-opt/cand-975102', 'cast/C-lean-f/cand-975201'),
    'nooj5-upright': ('idle-upright/C-opt/cand-975101', 'cast/C-upright-f/cand-975201'),
    'nooj5-glasses': ('idle-glasses/C-opt/cand-975101', 'cast/C-glasses-f/cand-975201'),
}
for subj, (idle, cast) in PICK.items():
    os.makedirs(f'{ART}/{subj}', exist_ok=True)
    for pose, src in (('idle', idle), ('cast', cast)):
        meta = json.load(open(f'{C}/{src}.json'))['cutout']
        pre = f'{ART}/{subj}/{pose}'
        subprocess.run(['python', SHADE, f'{C}/{src}.png', pre], check=True)
        os.replace(pre + '-b.png', pre + '.png')
        im = Image.open(pre + '.png')
        bl = meta['baselineY'] + 70
        side = {'width': im.width, 'height': im.height, 'baselineY': bl, 'facing': 'left', 'status': 'CANDIDATE (look only)'}
        if pose == 'idle':
            side['scale'] = round(bl / meta['baselineY'], 4)
        json.dump(side, open(pre + '.json', 'w'), indent=1)
        print(subj, pose, side)
