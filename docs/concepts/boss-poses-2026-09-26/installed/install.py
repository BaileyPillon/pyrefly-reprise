"""Install the seven D-229/D-230 boss pose picks (Bailey 2026-09-26). Run once."""
import hashlib, json, os, shutil
from datetime import datetime, timezone
from PIL import Image, ImageOps

REPO = 'D:/Final Fantasy'
C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses-v2/'
ART = REPO + '/public/art/characters/'
BK = 'D:/Tools/pyrefly-art-backup/approved/2026-09-26-boss-poses/'
WORDS = "i'll go with all your recommendations, i love it."
NOW = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')

# subject, slot, candidate path (no ext), decision, scale, scaleNote tail, flip, judge score
PICKS = [
    ('yojimbo-cavern', 'attack', 'yojimbo/attack-h/cand-45', 'D-229', 1.053,
     "Hat head-match: the idle's own jingasa is composited at 0.95 (cand-45.json composite.pieces hat.scale), so pose pixels x 1/0.95 = idle pixels; stature at that scale 0.78 of the idle (a lunge, gate at least 0.60).", False, '7.69'),
    ('yojimbo-cavern', 'hurt', 'yojimbo/hurt/cand-35', 'D-229', 1.25,
     "Hat head-match: the idle's own jingasa is composited at 0.80 (cand-35.json composite.pieces hat.scale), so pose pixels x 1/0.80 = idle pixels; stature at that scale 0.97 of the idle (upright gate 0.75 to 1.30).", False, '7.44'),
    ('trema', 'hurt', 'trema/hurt/cand-7', 'D-230', 0.93,
     'Head match read on 3x gridded crops against the installed idle: ear height 33 vs 38 px (0.87), eye to ear 51 vs 52 px (0.98); the 3/4 turn is the same in both, so the mean, 0.93; stature at that scale 0.94 (upright gate 0.75 to 1.30).', False, '7.38'),
    ('logos', 'hurt', 'logos/hurt/cand-2', 'D-230', 1.0,
     'Head match read on 3x gridded crops against the installed idle: the helmet dome is 143 px across in the idle and about 142 to 144 px in the pose (the face is tipped back, so the helmet decides); 1.00; stature at that scale 0.78 (the lean-back and stride lower him; upright gate 0.75 to 1.30).', False, '7.56'),
    ('leblanc', 'hurt', 'leblanc/hurt/cand-10', 'D-230', 1.0,
     'Head match read on 3x gridded crops against the installed idle: iris spacing 48 vs 44.7 px (1.07); eye line to mouth 30 vs 46 px (0.65, her face is seen from below with an open grin, so the tilt rules this reading out); the visual check beside the idle head at 1.00 matches; stature at that scale 0.73 (a bent lean-back, gate at least 0.60).', False, '7.38'),
    ('ormi', 'hurt', 'ormi/hurt/cand-7', 'D-230', 1.0,
     'Flipped horizontally at install (the render faces screen-left, the idle faces right; no repaint). Head match on the gridded sheet: the bald head is about 140 px top to chin and 125 to 130 px across in both; 1.00; stature at that scale 1.00.', True, '7.25'),
    ('ffx2-dr-goon', 'hurt', 'ffx2-dr-goon/hurt/cand-4', 'D-230', 1.5,
     'Head match read on 3x gridded crops against the installed idle: hair top to chin 150 vs 100 px (1.50), hair width 178 vs 112 px (1.59; the idle hair flares); 1.50; stature at that scale 1.02, which agrees (upright gate 0.75 to 1.30). The render drew him small on the canvas, so the pick shown at 1.00 on the sheet stood 0.68 of the idle.', False, '7.19'),
]

GEN_KEYS = ['seed', 'positive', 'negative', 'model', 'steps', 'cfg', 'sampler', 'scheduler', 'controlnet', 'ipadapter', 'composite', 'identitySource', 'generatedAt']

os.makedirs(BK + 'installed', exist_ok=True)
os.makedirs(BK + 'replaced', exist_ok=True)
record = []
for subj, slot, cand, dec, scale, note, flip, score in PICKS:
    src_png = C + cand + '.png'
    cj = json.load(open(C + cand + '.json', encoding='utf-8'))
    idle = json.load(open(ART + subj + '/idle.json', encoding='utf-8'))
    dst = ART + subj + '/' + slot + '.png'
    assert not os.path.exists(dst), dst + ' exists: stop, nothing is replaced by this install'
    if flip:
        im = ImageOps.mirror(Image.open(src_png))
        im.save(dst, optimize=False)
    else:
        shutil.copyfile(src_png, dst)
    data = open(dst, 'rb').read()
    sha = hashlib.sha256(data).hexdigest()
    im = Image.open(dst)
    cut = cj['cutout']
    assert (im.width, im.height) == (cut['width'], cut['height'])
    side = {
        'width': im.width,
        'height': im.height,
        'baselineY': cut['baselineY'],
        'scale': scale,
        'scaleNote': 'Head match 2026-09-26 (D-229/D-230 install; the 2026-09-26 pose-install method, docs/concepts/art5/installed-0926/README.md; scale = idle pixels / pose pixels at the head; evidence docs/concepts/boss-poses-2026-09-26/installed/). ' + note,
        'cropBox': cut.get('cropBox'),
        'source': {'width': cut.get('sourceWidth'), 'height': cut.get('sourceHeight')},
        'pose': slot,
        'composition': 'boss',
        'facing': idle.get('facing', cj.get('facing')),
        'canvas': {'width': cj.get('width'), 'height': cj.get('height')},
    }
    for k in GEN_KEYS:
        if k in cj:
            side['prompt' if k == 'positive' else k] = cj[k]
    side['game'] = cj.get('game')
    if flip:
        side['flippedAtInstall'] = 'horizontal mirror of the candidate at install (Bailey\'s pick, D-230: "Ormi hurt c7 flipped"); no repaint'
    side['status'] = ('APPROVED: Bailey 2026-09-26, "' + WORDS + '", answering the boss pose sheets '
                      'docs/concepts/boss-poses-2026-09-26/ (' + dec + '; a pick approves only the pose as shown); '
                      'installed 2026-09-26, locked in docs/target/approved-hashes.json set bailey:2026-09-26-boss-poses')
    side['judge'] = 'docs/concepts/boss-poses-2026-09-26/looks.json (maker look plus a second look by the same agent, art5 rubric; ' + score + ')'
    side['candidateOf'] = src_png
    side['sha256'] = sha
    side['installedAt'] = NOW
    side['installedFrom'] = src_png
    side['decision'] = dec
    json.dump(side, open(ART + subj + '/' + slot + '.json', 'w', encoding='utf-8', newline='\n'), indent=2, ensure_ascii=False)
    os.makedirs(BK + 'installed/' + subj, exist_ok=True)
    shutil.copyfile(dst, BK + 'installed/' + subj + '/' + slot + '.png')
    shutil.copyfile(ART + subj + '/' + slot + '.json', BK + 'installed/' + subj + '/' + slot + '.json')
    record.append({'file': 'public/art/characters/' + subj + '/' + slot + '.png', 'sha256': sha, 'mtime': datetime.fromtimestamp(os.path.getmtime(dst), timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z', 'scale': scale, 'decision': dec, 'from': src_png, 'flip': flip})
open(BK + 'replaced/NOTHING-REPLACED.txt', 'w').write('D-229/D-230 install 2026-09-26: yojimbo-cavern attack and hurt, trema, logos, leblanc, ormi and ffx2-dr-goon hurt were empty before the install; no file was replaced.\n')
json.dump(record, open('D:/Tools/pyrefly-scratch/boss-pose-install-0926/record.json', 'w'), indent=2)
print(json.dumps(record, indent=1))
