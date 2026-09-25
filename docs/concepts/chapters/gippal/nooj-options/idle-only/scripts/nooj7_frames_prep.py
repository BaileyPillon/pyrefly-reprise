"""Look-only B-treated copies for the engine frames (nothing goes to public/art), as attempt 6's nooj6_frames_prep.py:
the installed shades' own shade_b.py, baseline + its 70 px pad. The previous idle (attempt 6) is re-made beside it."""
import json, subprocess, os, sys
from PIL import Image
ART = 'D:/Tools/pyrefly-scratch/nooj7/art/characters'
SHADE = 'D:/Final Fantasy/docs/concepts/chapters/gippal/production/scripts/shade_b.py'
C6 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj6/idle-repair/idle-repaired'
C7 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj7/merge/' + (sys.argv[1] if len(sys.argv) > 1 else 'idle-m2')
for subj, src in (('nooj6-idle', C6), ('nooj7-idle', C7)):
    os.makedirs(f'{ART}/{subj}', exist_ok=True)
    meta = json.load(open(src + '.cutout.json'))['cutout']
    pre = f'{ART}/{subj}/idle'
    subprocess.run(['python', SHADE, src + '.png', pre], check=True)
    os.replace(pre + '-b.png', pre + '.png')
    if os.path.exists(pre + '-c.png'): os.remove(pre + '-c.png')
    im = Image.open(pre + '.png'); bl = meta['baselineY'] + 70
    side = {'width': im.width, 'height': im.height, 'baselineY': bl, 'facing': 'left', 'status': 'CANDIDATE (look only)',
            'scale': round(bl / meta['baselineY'], 4)}
    json.dump(side, open(pre + '.json', 'w'), indent=1); print(subj, side)
