"""Look-only B-treated copies of the repaired pair for the engine frames (nothing goes to public/art).
Same as attempt 5's nooj5_frames_prep.py: the installed shades' own shade_b.py, baseline + its 70 px pad."""
import json, subprocess, os
from PIL import Image
C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6'
ART = 'D:/Tools/pyrefly-scratch/nooj6/art/characters'
SHADE = 'D:/Final Fantasy/docs/concepts/chapters/gippal/production/scripts/shade_b.py'
PICK = {'nooj6-repair': (('idle-repair/idle-repaired', 'idle-repair/idle-repaired.cutout.json'), ('cast/C-r1/cand-976202', 'cast/C-r1/cand-976202.json'))}
for subj, pair in PICK.items():
    os.makedirs(f'{ART}/{subj}', exist_ok=True)
    for pose, (src, meta_path) in zip(('idle', 'cast'), pair):
        meta = json.load(open(f'{C}/{meta_path}'))['cutout']
        pre = f'{ART}/{subj}/{pose}'
        subprocess.run(['python', SHADE, f'{C}/{src}.png', pre], check=True)
        os.replace(pre + '-b.png', pre + '.png')
        for extra in ('-c.png',):
            if os.path.exists(pre + extra): os.remove(pre + extra)
        im = Image.open(pre + '.png')
        bl = meta['baselineY'] + 70
        side = {'width': im.width, 'height': im.height, 'baselineY': bl, 'facing': 'left', 'status': 'CANDIDATE (look only)'}
        if pose == 'idle':
            side['scale'] = round(bl / meta['baselineY'], 4)
        json.dump(side, open(pre + '.json', 'w'), indent=1)
        print(subj, pose, side)
