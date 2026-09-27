"""Film set: build the phone-readable sheets in film-set/ (sheet.py for the grids, plus the two composed frames as
JPEGs under 1 MB). Candidates stay in D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/.
Usage: python build-sheets.py"""
import glob, json, os, re, subprocess
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film'
PY = 'D:/Tools/ComfyUI/python_embeded/python.exe'
MAN = os.path.join(C, '_work', 'manifests')
os.makedirs(MAN, exist_ok=True)

# the repair round's picks (2026-09-27, after the judge's LOOK at the first set); OLD keeps the first set's picks
# for the before/after sheets
OLD = {'cloud': {'idle': 'cut-p4w', 'windup': 'cut-p6', 'strike': 'cut-p1w', 'follow': 'cut-p2', 'fistpump': 'cut-p2w',
                 'spin': 'cut-p3w', 'back': 'cut-p2w', 'hurt': 'cut-p3w'},
       'barret': {'aim': 'cut-p8', 'fire': 'cut-p2', 'squat': 'cut-p4', 'punch': 'cut-p6', 'hurt': 'cut-p3'},
       'gs': {'recoil': 'cut-p1s'}}
PICKS = {
    'cloud': [('idle', 'cut-p4x', 'Idle', 'legs inked, shell trimmed'),
              ('windup', 'cut-g', 'Attack 1: wind-up', 'far band off; idle pauldron'),
              ('strike', 'cut-r', 'Attack 2: strike', 'idle-style plate; rim inked'),
              ('follow', 'cut-y2', 'Attack 3: follow-through', 'one band; idle pauldron'),
              ('fistpump', 'cut-b2', 'Victory 1: fist pump', 'extra bands off'),
              ('spin', 'cut-k', 'Victory 2: sword spin', 'sword up in the near hand'),
              ('back', 'cut-y2', 'Victory 3: sword on back', 'near band; idle pauldron'),
              ('hurt', 'cut-z2', 'Hurt flinch', 'idle pauldron; blade clean')],
    'barret': [('idle', 'cut-p1', 'Idle', 'approved pick, fixed (unchanged)'),
               ('aim', 'cut-k', 'Attack 1: aim', 'boot whole, no scars, no rim'),
               ('fire', 'cut-k', 'Attack 2: fire', 'the same body; flash by code'),
               ('squat', 'cut-t2', 'Victory 1: squat', "the idle's four-barrel gun"),
               ('punch', 'cut-y2', 'Victory 2: air punch', "the idle's four-barrel gun"),
               ('hurt', 'cut-y1', 'Hurt flinch', 'one gun, four barrels')],
    'gs': [('idle', 'cut-tj', 'Idle: tail lowered', 'the raised pick, only the tail repainted'),
           ('raised', 'cut-p1s', 'Tail raised', 'laser lens up; same body as idle'),
           ('recoil', 'cut-r12', 'Hit recoil (tail raised)', 'raised pick tilted, eye flare'),
           ('recoil', 'cut-l12', 'Hit recoil (tail lowered)', 'idle pick tilted, eye flare')],
}
SUBTITLE = {'cloud': 'Cloud, facing screen-right. Pauldron on the far (left) shoulder, white band on the near (right) wrist.',
            'barret': 'Barret, facing screen-right. Gun-arm is the near (right) arm; the left hand is a hand.',
            'gs': 'Guard Scorpion, painted facing screen-left (never flipped). One scale for all three.'}


def sheet(man, name):
    p = os.path.join(MAN, name + '.json')
    json.dump(man, open(p, 'w', encoding='utf8'), indent=1)
    r = subprocess.run([PY, '-s', os.path.join(HERE, 'sheet.py'), p], capture_output=True, text=True)
    print(r.stdout.strip() or r.stderr[-400:])


def jpeg_under_1mb(src, dst, width=None):
    im = Image.open(src).convert('RGB')
    if width and im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    q = 90
    while True:
        im.save(dst, quality=q, optimize=True)
        if os.path.getsize(dst) < 1_000_000 or q <= 50:
            break
        q -= 5
    print(dst, im.size, os.path.getsize(dst), 'q', q)


# 01 / 02: the composed frames (scene only, no HUD), desk and phone
for fr, lab, name in (('frame-idle', 'idle', '01'), ('frame-action', 'action', '02'), ('frame-hit', 'hit', '11')):
    jpeg_under_1mb(f'{C}/_work2/{fr}/scene-1600.png', os.path.join(OUT, f'{name}-frame-{lab}-1600.jpg'))
    jpeg_under_1mb(f'{C}/_work2/{fr}/scene-390@2x.png', os.path.join(OUT, f'{name}-frame-{lab}-390.jpg'))

# 03-05: the picks, one sheet per subject, one scale per sheet (every pose is at its idle's scale)
for n, (sub, cols, th) in enumerate((('cloud', 4, 440), ('barret', 3, 560), ('gs', 2, 360)), 3):
    items = [{'path': f'{C}/{sub}/{pose}/{cut}.png', 'label': lab, 'sub': note, 'pick': True} for pose, cut, lab, note in PICKS[sub]]
    sheet({'out': os.path.join(OUT, f'0{n}-{ {"gs": "guard-scorpion"}.get(sub, sub)}.jpg'),
           'title': {'cloud': 'Cloud: the Film set (8 poses)', 'barret': 'Barret: the Film set (6 poses)', 'gs': 'Guard Scorpion: the Film set (3 poses, recoil in both tail forms)'}[sub],
           'note': SUBTITLE[sub], 'cols': cols, 'tileH': th, 'sameScale': True, 'items': items}, f'picks-{sub}')

# 06: the backdrop, the pick and the mark it replaced
bd = f'{C}/core/p1b.full.png'
b = Image.open(bd).convert('RGB')
b.crop((150, 550, 650, 900)).save(f'{C}/_work/core-after.png')
Image.open(f'{C}/core/p1.full.png').convert('RGB').crop((150, 550, 650, 900)).save(f'{C}/_work/core-before.png')
sheet({'out': os.path.join(OUT, '06-backdrop.jpg'), 'title': 'Backdrop: the Film reactor core',
       'note': 'Glyph-like marks painted out: a framed sign on the left wall, and the mark on a pipe clamp (below).',
       'cols': 2, 'tileH': 330, 'sameScale': False,
       'items': [{'path': bd, 'label': 'Pick: core/p1b.full.png', 'sub': 'hi-fi Film core, two marks removed', 'pick': True},
                 {'path': f'{C}/_work/core-before.png', 'label': 'Before: pipe clamp', 'sub': 'a glyph-like mark'},
                 {'path': f'{C}/_work/core-after.png', 'label': 'After', 'sub': 'a plain clamp', 'pick': True}]}, 'backdrop')

# 07: the judge's faults, before and after
H = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-hifi/film'
sheet({'out': os.path.join(OUT, '07-faults-fixed.jpg'), 'title': 'The Film faults, before and after',
       'note': 'Back-edge rim, far-wrist cuff, belt buckle, floor shadow. Left: the hi-fi pick. Right: this set.',
       'cols': 2, 'tileH': 470, 'sameScale': False,
       'items': [{'path': f'{H}/cloud/cut-p4.png', 'label': 'Cloud, hi-fi pick', 'sub': 'green rim on the back; metal cuff on far wrist'},
                 {'path': f'{C}/cloud/idle/cut-p4x.png', 'label': 'Cloud, fixed', 'sub': 'no back rim; far wrist is the glove', 'pick': True},
                 {'path': f'{H}/barret/cut-p1.png', 'label': 'Barret, hi-fi pick', 'sub': 'back rim; belt with a buckle'},
                 {'path': f'{C}/barret/idle/cut-p1.png', 'label': 'Barret, fixed', 'sub': 'no back rim; steel waist bands', 'pick': True},
                 {'path': f'{H}/gs/cut-p1.decast.png', 'label': 'Guard Scorpion, hi-fi pick', 'sub': 'dark floor patch under the body'},
                 {'path': f'{C}/gs/raised/cut-p1s.png', 'label': 'Guard Scorpion, fixed', 'sub': 'floor shadow cleared', 'pick': True}]}, 'faults')

# 08-10: every render of the round (LOOK record), the pick framed
CUTOFF = 1790540007   # commit 8140a461 (the first Film set); later files are the repair round's


def renders(sub):
    out = []
    seen = set()
    for pose, _, lab, _ in PICKS[sub]:
        if pose in seen:
            continue
        seen.add(pose)
        cut = OLD.get(sub, {}).get(pose) or dict((p, c) for p, c, _, _ in PICKS[sub])[pose]
        side = json.load(open(f'{C}/{sub}/{pose}/{cut}.json'))
        src = side.get('fullFrame', '').replace('\\', '/')
        for f in sorted(glob.glob(f'{C}/{sub}/{pose}/*.full.png'), key=lambda s: [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', s)]):
            f = f.replace('\\', '/')
            base = os.path.basename(f)[:-9]
            if '.patch' in base or base.endswith('.edit') or (os.path.getmtime(f) >= CUTOFF) != REPAIR:
                continue
            out.append({'path': f, 'label': f'{pose} {base}', 'sub': 'PICK' if f == src else '', 'pick': f == src})
    return out


REPAIR = False


for n, sub in ((8, 'cloud'), (9, 'barret'), (10, 'gs')):
    items = renders(sub)
    sheet({'out': os.path.join(OUT, f'{n:02d}-renders-{ {"gs": "guard-scorpion"}.get(sub, sub)}.jpg'),
           'title': f'Every {"Guard Scorpion" if sub == "gs" else sub.title()} render ({len(items)}), picks framed',
           'note': 'Full frames before the cut. w / -wrist / t = a local repair; lt / tg / j = the tail graft steps.',
           'cols': 4 if sub != 'gs' else 3, 'tileH': 300 if sub != 'gs' else 190, 'sameScale': False, 'items': items}, f'renders-{sub}')


# 12 / 13: the repair round, before (the first set's pick) and after (this round's pick), one scale per pair
def pairs(sub, poses):
    items = []
    for pose in poses:
        new = [c for p, c, _, _ in PICKS[sub] if p == pose]
        old = OLD[sub][pose]
        items.append({'path': f'{C}/{sub}/{pose}/{old}.png', 'label': f'{pose}: before', 'sub': old})
        for c in new:
            items.append({'path': f'{C}/{sub}/{pose}/{c}.png', 'label': f'{pose}: after', 'sub': c, 'pick': True})
    return items


sheet({'out': os.path.join(OUT, '12-repair-cloud.jpg'), 'title': 'Repair round: Cloud, before and after',
       'note': 'Left: the first set. Right (framed): this round. Same scale within each pair.',
       'cols': 4, 'tileH': 400, 'sameScale': True,
       'items': pairs('cloud', ['idle', 'windup', 'strike', 'follow', 'fistpump', 'spin', 'back', 'hurt'])}, 'repair-cloud')
sheet({'out': os.path.join(OUT, '13-repair-barret-gs.jpg'), 'title': 'Repair round: Barret and Guard Scorpion',
       'note': 'Left: the first set. Right (framed): this round. The recoil is an edit of our own picks.',
       'cols': 4, 'tileH': 400, 'sameScale': False,
       'items': pairs('barret', ['aim', 'fire', 'squat', 'punch', 'hurt']) + pairs('gs', ['recoil'])}, 'repair-barret-gs')

# 14 / 15: every render of the repair round (LOOK record), this round's picks framed
REPAIR = True


def renders2(sub):
    out, seen = [], set()
    for pose, cut, _, _ in PICKS[sub]:
        if pose in seen:
            continue
        seen.add(pose)
        srcs = {json.load(open(f'{C}/{sub}/{pose}/{c}.json')).get('fullFrame', '').replace(chr(92), '/')
                for p, c, _, _ in PICKS[sub] if p == pose}
        for f in sorted(glob.glob(f'{C}/{sub}/{pose}/*.full.png'), key=lambda s: [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', s)]):
            f = f.replace(chr(92), '/')
            base = os.path.basename(f)[:-9]
            if '.patch' in base or os.path.getmtime(f) < CUTOFF:
                continue
            out.append({'path': f, 'label': f'{pose} {base}', 'sub': 'PICK' if f in srcs else '', 'pick': f in srcs})
    return out


for n, sub in ((14, 'cloud'), (15, 'barret')):
    items = renders2(sub)
    sheet({'out': os.path.join(OUT, f'{n}-renders-repair-{sub}.jpg'),
           'title': f'Repair round: every {sub.title()} render ({len(items)}), picks framed',
           'note': 'Full frames before the cut: r/e/f = new renders and edits; a/b/f/o/w/x/y/z = local repairs; g = graft; k = flattened.',
           'cols': 6, 'tileH': 230, 'sameScale': False, 'items': items}, f'renders-repair-{sub}')
