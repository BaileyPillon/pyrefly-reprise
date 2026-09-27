"""Install the Film set into public/art under NEW keys (FF7 only). Adds files only; never replaces an existing file.

Bailey, 2026-09-27 ~13:00 EDT, "I'll go with all of your recommendations" (D-259 Film art, D-262 sides switched).
The picks are the film-set README's "Recommended file per pose" (the repair round, every pick LOOKed at and passing
both cut-out checks). Each installed PNG is the pick, then only:
  1. back-edge de-mint (Cloud only, where any mint remains): a mint pixel within 4 px of the transparent edge on the
     BACK (screen-left) side becomes the ink colour; the one fault Bailey named, finished off (front rims kept);
  2. a premultiplied Lanczos resize (party x0.5, Guard Scorpion x0.75, the backdrop unchanged): the figures are drawn
     300 to 490 px tall at 1600x900, so the source's 2200 px is far more than a DPR-2 screen shows;
  3. transparent columns added so the registration point sits on the image's centre column (the stage centres every
     plane on its figure's spot): the party on the feet (the sidecar's anchorX), Guard Scorpion on its rear foot (the
     recoil's pivot), so the idle, the raised tail and both recoils keep the machine planted with no shift.
Nothing is mirrored. Usage: python install.py <art root> <backup dir> [--dry]"""
import hashlib, json, os, shutil, sys
import numpy as np
from PIL import Image
from scipy import ndimage

CAND = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film'
ROOT, BACKUP = sys.argv[1], sys.argv[2]
DRY = '--dry' in sys.argv
WORDS = "I'll go with all of your recommendations"
STATUS = ('APPROVED: Bailey 2026-09-27 ~13:00 EDT, "' + WORDS + '" (D-259 art direction 3 Film with the back-edge rim '
          'fixed first; D-262 sides switched, never mirrored). The pick is the film-set repair round\'s recommended file '
          '(docs/concepts/ff7-art-2026-09-27/film-set/README.md). A pick approves only the art as shown. Game: FF7 only.')
INK = np.array([22, 24, 30], float)

# key -> (state -> (pick, registration x in pick px or None for anchorX, anchorY in pick px or None))
GS_IDLE_PIVOT = (908, 1060)      # recoil.py's rear-foot pivot on gs/idle/cut-tj
GS_RAISED_PIVOT = (910, 1442)    # on gs/raised/cut-p1s
PLAN = {
    'ff7-film-cloud': (0.5, 'right', {
        'idle': ('cloud/idle/cut-p4x', None, None), 'windup': ('cloud/windup/cut-g', None, None),
        'attack': ('cloud/strike/cut-r', None, None), 'follow': ('cloud/follow/cut-y2', None, None),
        'victory': ('cloud/fistpump/cut-b2', None, None), 'spin': ('cloud/spin/cut-k', None, None),
        'back': ('cloud/back/cut-y2', None, None), 'hurt': ('cloud/hurt/cut-z2', None, None)}),
    'ff7-film-barret': (0.5, 'right', {
        'idle': ('barret/idle/cut-p1', None, None), 'aim': ('barret/aim/cut-k', None, None),
        'attack': ('barret/fire/cut-k', None, None), 'victory': ('barret/squat/cut-t2', None, None),
        'punch': ('barret/punch/cut-y2', None, None), 'hurt': ('barret/hurt/cut-y1', None, None)}),
    'ff7-film-guard-scorpion': (0.75, 'left', {
        'idle': ('gs/idle/cut-tj', GS_IDLE_PIVOT[0], None), 'hurt': ('gs/recoil/cut-l12', 814, 1023)}),
    'ff7-film-guard-scorpion-tail-up': (0.75, 'left', {
        'idle': ('gs/raised/cut-p1s', GS_RAISED_PIVOT[0], None), 'hurt': ('gs/recoil/cut-r12', 816, 1284)}),
}
# The tail-up subject's idle is taller than the tail-down idle (the raised tail) at the SAME pixel scale; the
# stage gives the combatant one world height, so its reference scale keeps its pixels the tail-down idle's.
SUBJECT_SCALE = {'ff7-film-guard-scorpion-tail-up': 1442 / 1060}

STATE_NOTE = {
    'attack': 'the attack key the house beats name: Cloud strike (B1 key 2) / Barret fire (B1 key 2)',
    'victory': 'the first victory key: Cloud fist pump / Barret squat (D1)',
    'hurt': 'the hit flinch; for Guard Scorpion the recoil (a 12-degree tilt of its own pick, anchorY on the rear foot)',
}


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def demint_back(a):
    op = a[..., 3] >= 128
    band = op & ~ndimage.binary_erosion(op, iterations=4)
    left = np.zeros_like(op)
    left[:, 5:] = ~op[:, :-5]
    right = np.zeros_like(op)
    right[:, :-5] = ~op[:, 5:]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mint = (g > r + 25) & (g >= b - 15) & (g > 90) & band & left & ~right
    a[..., :3][mint] = INK
    return int(mint.sum())


def resize(im, k):
    if k == 1:
        return im
    w, h = round(im.width * k), round(im.height * k)
    return im.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')


def centre_on(im, x):
    """Pad with transparent columns so column x is the centre."""
    left, right = x, im.width - x
    half = int(np.ceil(max(left, right)))
    pad_l, w = int(round(half - left)), 2 * half
    out = Image.new('RGBA', (w, im.height), (0, 0, 0, 0))
    out.paste(im, (pad_l, 0))
    return out, pad_l


def install():
    report = []
    for key, (k, facing, states) in PLAN.items():
        for state, (pick, regx, anchor_y) in states.items():
            src = f'{CAND}/{pick}.png'
            side = json.load(open(f'{CAND}/{pick}.json'))
            assert side.get('mirrored') is False and side.get('facing') == facing, (pick, side.get('facing'))
            a = np.asarray(Image.open(src).convert('RGBA')).astype(float)
            steps = []
            if key == 'ff7-film-cloud':
                n = demint_back(a)
                if n:
                    steps.append({'step': 'demint-back', 'pixels': n, 'what': 'mint pixels on the back (screen-left) 4 px edge band -> ink'})
            im = Image.fromarray(a.clip(0, 255).astype(np.uint8))
            im = resize(im, k)
            if k != 1:
                steps.append({'step': 'resize', 'factor': k, 'filter': 'lanczos, premultiplied'})
            rx = (regx if regx is not None else side['anchorX']) * k
            im, pad_l = centre_on(im, rx)
            steps.append({'step': 'register', 'padLeft': pad_l, 'on': 'rear foot pivot' if regx is not None else 'feet (anchorX)', 'centreColumn': im.width // 2})
            base = round(side['baselineY'] * k)
            meta = {
                'width': im.width, 'height': im.height, 'baselineY': base, 'facing': facing, 'mirrored': False,
                'status': STATUS, 'decision': 'D-259', 'installedFrom': src, 'sourceSha256': sha(src),
                'installSteps': steps, 'installer': 'docs/concepts/ff7-art-2026-09-27/film-set/scripts/install.py',
                'subject': key, 'state': state, 'scaleToIdle': side.get('scaleToIdle', 1),
            }
            s = side.get('scaleToIdle', 1)
            if state == 'idle' and key in SUBJECT_SCALE:
                meta['scale'] = round(SUBJECT_SCALE[key], 6)
                meta['scaleNote'] = 'same machine and pixel scale as ff7-film-guard-scorpion/idle: the raised tail makes this idle 1442/1060 taller, so the subject scale keeps the body the tail-down size'
            elif state != 'idle' and s != 1:
                meta['scale'] = s
            if anchor_y is not None:
                meta['anchorY'] = round(anchor_y * k)
                meta['anchorNote'] = 'the rear foot (recoil.py pivotInOutput): the ground line, so the tilted machine keeps that foot planted'
            if state in STATE_NOTE:
                meta['note'] = STATE_NOTE[state]
            for f in ('seed', 'engine', 'retailInput', 'promptKey'):
                if f in side:
                    meta[f] = side[f]
            out_dir = os.path.join(ROOT, 'characters', key)
            png, js = os.path.join(out_dir, state + '.png'), os.path.join(out_dir, state + '.json')
            if os.path.exists(png) or os.path.exists(js):
                raise SystemExit(f'refusing to replace {png}')
            report.append((key, state, im.size, meta.get('scale'), meta.get('anchorY')))
            if DRY:
                continue
            os.makedirs(out_dir, exist_ok=True)
            im.save(png, optimize=True)
            meta['sha256'] = sha(png)
            json.dump(meta, open(js, 'w'), indent=1)
            bdir = os.path.join(BACKUP, 'characters', key)
            os.makedirs(bdir, exist_ok=True)
            shutil.copy2(png, bdir)
            shutil.copy2(js, bdir)
    # the backdrop
    src = f'{CAND}/core/p1b.full.png'
    png = os.path.join(ROOT, 'backdrops', 'ff7-film-reactor.png')
    js = png[:-4] + '.json'
    if os.path.exists(png) or os.path.exists(js):
        raise SystemExit(f'refusing to replace {png}')
    im = Image.open(src).convert('RGB')
    report.append(('backdrop', 'ff7-film-reactor', im.size, None, None))
    if not DRY:
        im.save(png, optimize=True)
        meta = {'width': im.width, 'height': im.height, 'status': STATUS, 'decision': 'D-259', 'installedFrom': src,
                'sourceSha256': sha(src), 'installSteps': [{'step': 'rgb', 'what': 'alpha dropped (fully opaque)'}],
                'note': 'the Film reactor core (hifi seed 733002, two glyph-like marks painted out); the backdrop of the FF7 Guard Scorpion scene', 'sha256': sha(png)}
        json.dump(meta, open(js, 'w'), indent=1)
        os.makedirs(os.path.join(BACKUP, 'backdrops'), exist_ok=True)
        shutil.copy2(png, os.path.join(BACKUP, 'backdrops'))
        shutil.copy2(js, os.path.join(BACKUP, 'backdrops'))
    for r in report:
        print(r)


install()
