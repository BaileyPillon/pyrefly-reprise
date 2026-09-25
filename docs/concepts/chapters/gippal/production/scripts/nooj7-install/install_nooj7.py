"""Install attempt 7's judged idle (a87ff561ef41, 7.0 PASS) as the Den of Woe's Nooj shade (FFX-2 only).
Bailey picked option A (2026-09-25 ~14:25 EDT). Refuses any approved or judge-locked hash; backs up the replaced
idle and the candidate cast; removes the cast from the served slot so every action pose falls back to the idle."""
import hashlib, json, os, shutil, subprocess, sys, datetime
from PIL import Image

REPO = 'D:/Final Fantasy'
SLOT = REPO + '/public/art/characters/nooj-shade'
SRC = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj7/merge/idle-m2'
SHADE = REPO + '/docs/concepts/chapters/gippal/production/scripts/shade_b.py'
BACKUP = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-nooj7/replaced'
WORK = 'D:/Tools/pyrefly-scratch/nooj7-install/work'
SRC_SHA = 'a87ff561ef41b4a56b139185d6dc9885a569b79cb74a50642dd10fa70f60a040'


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def locked():
    out = set()
    for f in ('approved-hashes.json', 'judge-locked-hashes.json'):
        p = f'{REPO}/docs/target/{f}'
        if os.path.exists(p):
            for s in json.load(open(p, encoding='utf8'))['sets'].values():
                for v in s.values():
                    if isinstance(v, dict) and v.get('sha256'):
                        out.add(v['sha256'])
    return out


L = locked()
assert sha(SRC + '.png') == SRC_SHA, 'candidate hash changed'
for pose in ('idle', 'cast'):
    p = f'{SLOT}/{pose}.png'
    if os.path.exists(p) and sha(p) in L:
        sys.exit(f'REFUSE: {p} is approved or judge-locked')

os.makedirs(WORK, exist_ok=True)
pre = WORK + '/idle'
subprocess.run(['python', SHADE, SRC + '.png', pre], check=True)
out_png = pre + '-b.png'
new_sha = sha(out_png)
if new_sha in L:
    sys.exit('REFUSE: the new file hash is already locked')

cut = json.load(open(SRC + '.cutout.json'))['cutout']
im = Image.open(out_png)
bl = cut['baselineY'] + 70  # shade_b.py pads 70 px on every side
old_side = json.load(open(SLOT + '/idle.json', encoding='utf8'))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

# backups
os.makedirs(BACKUP, exist_ok=True)
moved = {}
for f in ('idle.png', 'idle.json', 'cast.png', 'cast.json'):
    p = f'{SLOT}/{f}'
    if os.path.exists(p):
        dst = f'{BACKUP}/{f}'
        shutil.copy2(p, dst)
        assert sha(dst) == sha(p)
        moved[f] = sha(p)

side = {
    'width': im.width, 'height': im.height, 'baselineY': bl, 'facing': 'left',
    'status': 'APPROVED (Bailey 2026-09-25, option A; independent judge 7.0 PASS)',
    'game': 'FFX-2 only',
    'chapter': old_side.get('chapter'),
    'concept': old_side.get('concept'),
    'canon': old_side.get('canon'),
    'bailey': "2026-09-25 ~14:25 EDT, verbatim \"I'll go with all your recommendations however\"; the driver's Nooj "
              "recommendation A: fix only the idle (the loops, the sleeve, the neck fringe), then judge it; if it passes, "
              "install it and let Nooj use the idle for his action moments too, with the usual motion",
    'base': 'attempt 7 idle (docs/concepts/chapters/gippal/nooj-options/idle-only/README.md): masked repaints of attempt 6\'s '
            'repaired idle (8e1d77e9991c) with IP-Adapter forced on portraits/nooj.png; loops seed 977102, sleeve 977101 then '
            '977202, near side (neck fringe + machina forearm) 977102; alpha-only ground-shadow touch-up',
    'sourceSha256': SRC_SHA,
    'sourceFile': SRC + '.png',
    'judge': 'docs/concepts/chapters/gippal/nooj-options/README.md, "Independent judge (idle only)": 7.0 PASS narrowly; '
             'identity 7, anatomy 6.5, hands 7, costume 7, seams 7, edges 7, finish 7, game read 7.5',
    'method': 'O-1 B treatment (docs/concepts/chapters/gippal/production/scripts/shade_b.py), unchanged; no GPU in the install',
    'poses': 'idle only: no cast, attack or hurt painting is served, so every action moment falls back to this idle '
             '(POSE_FALLBACKS in src/engine/BattlePresenterArt.ts) with the engine\'s usual motion; KO is the pyrefly dissolve',
    'knownDefects': [
        'the face is young, soft and frontal (the portrait is mature and angular); the lean does not show (the cane stands '
        'vertically); the legs are about 60 percent of his height (anatomy at the 6.5 floor)',
        'the sleeve is a straight purple tube with a flat cuff; the fur tips over its top form a regular pale and pink fringe at 2x',
        'the loops are rounder than the portrait\'s; the red ties are a few pixels each and the B treatment washes them out at game size',
        'a faint pale halo on the loops\' outer edge and the near shoulder at 2x; a tiny orange sliver left of the metal toe',
        'a small amber plate on the machina upper arm; a red and black fold in the armpit; the boot is boxy',
        'the red suit and the purple boot are muted by the B treatment, as the pick accepts',
    ],
    'scale': round(bl / cut['baselineY'], 4),
    'scaleNote': f'the B pad moves baselineY; this factor keeps the pixels-per-world-unit of the unpadded painting (baselineY {cut["baselineY"]})',
    'installedAt': now,
    'replacedSha256': moved.get('idle.png'),
    'removedCastSha256': moved.get('cast.png'),
    'replacedKeptAt': BACKUP + '/',
}

shutil.copyfile(out_png, SLOT + '/idle.png')
json.dump(side, open(SLOT + '/idle.json', 'w', encoding='utf8'), indent=2, ensure_ascii=False)
for f in ('cast.png', 'cast.json'):
    if os.path.exists(f'{SLOT}/{f}'):
        os.remove(f'{SLOT}/{f}')  # a verified copy is in BACKUP
print(json.dumps({'installed': sha(SLOT + '/idle.png'), 'size': [im.width, im.height], 'baselineY': bl,
                  'scale': side['scale'], 'backedUp': moved, 'slot': sorted(os.listdir(SLOT))}, indent=1))
