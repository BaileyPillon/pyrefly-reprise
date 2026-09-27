# Install Ixion's FFX-2 look B (D-268; Bailey 2026-09-27 ~15:20 EDT, "all your recommendations") under the NEW
# subject x2-ixion. FFX-2 only. Adds files only: asserts every destination is absent, never replaces or removes.
# Poses: idle = the option-B picture Bailey saw (opt-b.png, byte for byte); attack, overdrive = possess_b.py on the
# shipped FFX attack and overdrive paintings (same method, same parameters); cast = the overdrive derive plus
# recharge_glow.py (the Recharge glow). Backups to D:/Tools/pyrefly-art-backup/approved/2026-09-27-ixion/, and the
# set bailey:2026-09-27-ixion appended to docs/target/approved-hashes.json of the repo passed as argv[1].
# Usage: python install.py <repo root holding docs/target/approved-hashes.json>
import hashlib, json, os, shutil, sys
from datetime import datetime, timezone
import numpy as np
from PIL import Image

REPO = sys.argv[1]
ART = 'D:/Final Fantasy/public/art/characters'
SUBJ = 'x2-ixion'
CAND = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ixion'
WORK = 'D:/Tools/pyrefly-scratch/ixion-b-0927'
BK = 'D:/Tools/pyrefly-art-backup/approved/2026-09-27-ixion'
SET = 'bailey:2026-09-27-ixion'
WORDS = 'all your recommendations'
NOW = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
LOOK = 'docs/concepts/chapters/ixion-djose-2026-09-27/look/'
POSS = ("possess_b.py (docs/concepts/chapters/fallen-aeons/production/scripts/): the shipped FFX painting's own pixels, "
        "colour grade only (shadows toward violet, highlights kept), inner violet rim, violet eye glow, dark violet aura "
        "behind the figure (alpha capped at 0.33, under the engine's 0.35 alpha-measure threshold, so the aura never moves "
        "the feet or the content box); line work and shapes identical; 70 px transparent pad on every side; no GPU")
CONCEPT = ("look B, possessed violet (D-268), picked by Bailey 2026-09-27 ~15:20 EDT, \"all your recommendations\"; "
           + LOOK + "README.md (the house treatment of FFX-2's possessed aeons: ffx2-bahamut, x2-shiva, x2-anima)")
CANON = 'not canon: no source confirms a recolour (research F-12; ffx2-ixion-djose.md Q6); house precedent x2-shiva, x2-anima'


def feet(p):
    a = np.asarray(Image.open(p).convert('RGBA').getchannel('A')) >= int(0.35 * 255)
    return int(np.nonzero(a.sum(1) >= 3)[0].max())


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


orig_idle_feet = feet('D:/Final Fantasy/public/art/characters/ixion/idle.png')
POSES = [
    ('idle', f'{CAND}/opt-b.png', 'ixion/idle', "possess_b.py ... idle.png <prefix> \"262,292\" 5",
     'APPROVED: the exact picture Bailey picked (option B, opt-b.png, byte for byte)'),
    ('attack', f'{WORK}/attack-b-violet.png', 'ixion/attack', "possess_b.py ... attack.png <prefix> \"170,456\" 3.5",
     'DERIVED from the approved look B by the same method (the brief of 2026-09-27); not yet seen by Bailey as a pose'),
    ('cast', f'{WORK}/cast-recharge.png', 'ixion/overdrive',
     "possess_b.py ... overdrive.png <prefix> \"269,159\" 5, then recharge_glow.py <b-violet> <out> "
     "\"6,60;130,92;228,122;228,168;118,112;6,82\" \"16,72\"",
     'DERIVED from the approved look B by the same method plus the Recharge glow; not yet seen by Bailey as a pose'),
    ('overdrive', f'{WORK}/overdrive-b-violet.png', 'ixion/overdrive', "possess_b.py ... overdrive.png <prefix> \"269,159\" 5",
     'DERIVED from the approved look B by the same method (Thor\'s Hammer); not yet seen by Bailey as a pose'),
]
USE = {
    'idle': 'standing',
    'attack': 'his Attack (the only physical row; EnemyActionPose reads damageType)',
    'cast': 'Recharge, Thundara, Aerospark and Thor\'s Hammer (every non-physical row wears `cast`): the Recharge glow, lit horn and paler rim',
    'overdrive': 'Thor\'s Hammer as a painting of its own; the enemy presenter reads only idle, attack, cast, hurt and ko today, so it is kept for a per-move pose (the x2-shiva / x2-anima key set)',
}

os.makedirs(f'{ART}/{SUBJ}', exist_ok=True)
os.makedirs(f'{BK}/installed/{SUBJ}', exist_ok=True)
record = {}
for pose, src, orig, cmd, status in POSES:
    dst = f'{ART}/{SUBJ}/{pose}.png'
    assert not os.path.exists(dst), dst + ' exists: stop, nothing is replaced'
    assert not os.path.exists(f'{ART}/{SUBJ}/{pose}.json'), pose + '.json exists'
    shutil.copyfile(src, dst)
    o = json.load(open(f'D:/Final Fantasy/public/art/characters/{orig}.json', encoding='utf-8'))
    im = Image.open(dst)
    side = {
        'width': im.width, 'height': im.height, 'baselineY': feet(dst), 'facing': 'left',
        'status': status + '. Installed 2026-09-27, locked in docs/target/approved-hashes.json set ' + SET,
        'game': 'FFX-2 only', 'chapter': 'Chapter XVII Ixion at Djose (ffx2-ixion-djose)',
        'concept': CONCEPT, 'decision': 'D-268', 'pose': pose, 'use': USE[pose],
        'method': POSS + ('; plus recharge_glow.py (' + LOOK + 'scripts/): the horn lit pale violet-white inside the figure, '
                          'a paler inner rim, a violet halo round the horn and a gathering glow at its tip outside the figure '
                          '(alpha capped with the aura at 0.33; 0 opaque-mask pixels changed)' if pose == 'cast' else ''),
        'command': cmd,
        'derivedFrom': f'public/art/characters/{orig}.png (FFX, shipped by D-089; sha256 {sha("D:/Final Fantasy/public/art/characters/" + orig + ".png")})',
        'sourceSeed': o.get('seed'), 'sourcePrompt': o.get('prompt'),
        'canon': CANON,
    }
    if pose == 'idle':
        side['scale'] = round(feet(dst) / orig_idle_feet, 4)
        side['scaleNote'] = ("the 70 px top pad raises baselineY; this factor restores the FFX painting's pixels-per-world-unit "
                             f"(measured feet {feet(dst)} / {orig_idle_feet}; the x2-shiva precedent)")
    h = sha(dst)
    side['sha256'] = h
    side['installedFrom'] = src
    side['installedAt'] = NOW
    json.dump(side, open(f'{ART}/{SUBJ}/{pose}.json', 'w', encoding='utf-8', newline='\n'), indent=2, ensure_ascii=False)
    shutil.copyfile(dst, f'{BK}/installed/{SUBJ}/{pose}.png')
    shutil.copyfile(f'{ART}/{SUBJ}/{pose}.json', f'{BK}/installed/{SUBJ}/{pose}.json')
    mt = datetime.fromtimestamp(os.path.getmtime(dst), timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    record[f'public/art/characters/{SUBJ}/{pose}.png'] = {'sha256': h, 'mtime': mt, 'approved': '2026-09-27'}
    print(dst, im.width, im.height, side['baselineY'], h[:12])

open(f'{BK}/NOTHING-REPLACED.txt', 'w').write(
    'D-268 install 2026-09-27: public/art/characters/x2-ixion/ did not exist; four poses added (idle, attack, cast, '
    'overdrive); no file was replaced or removed. The FFX ixion/ paintings are untouched.\n')

p = f'{REPO}/docs/target/approved-hashes.json'
d = json.loads(open(p, 'rb').read().decode('utf-8'))
assert SET not in d['sets'], SET + ' already recorded'
entry = {
    'words': WORDS,
    'note': ('Bailey, 2026-09-27 ~15:20 EDT, verbatim "all your recommendations" (D-268 in docs/target/decisions.json), '
             'answering the driver on ' + LOOK + 'README.md (Q6, four painted options; B recommended): Ixion\'s FFX-2 look is '
             'option B, possessed violet. Installed under the new subject x2-ixion (FFX-2 only; the FFX ixion/ paintings are '
             'untouched). idle = opt-b.png byte for byte, the picture Bailey saw. attack, cast and overdrive are DERIVED by the '
             'same no-GPU method from the shipped FFX attack and overdrive paintings (possess_b.py; cast adds recharge_glow.py, '
             'the Recharge glow), as the driver\'s brief of the same message asked; Bailey has not seen those three as poses, '
             'and a pick approves only what Bailey named (rule 15). Backup: D:/Tools/pyrefly-art-backup/approved/2026-09-27-ixion/ '
             '(installed/, NOTHING-REPLACED.txt). Game: FFX-2 only.'),
    **record,
}
d['sets'][SET] = entry
s = json.dumps(d, indent=1, ensure_ascii=False).replace('\n', '\r\n') + '\r\n'
open(p, 'wb').write(s.encode('utf-8'))
json.dump(record, open(f'{BK}/record.json', 'w'), indent=2)
print('locked', len(record), 'in', SET)
