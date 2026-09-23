"""Install the r3 Evrae candidates into public/art with CANDIDATE sidecars (FFX only).
The previous files are already backed up in D:/Tools/pyrefly-art-backup/candidates/2026-09-23-evrae-r3/.
usage: install.py <breath-charge.png> <breath.json(derive meta)> <hurt.png> <hurt.json(derive meta)>"""
import sys, json, shutil, hashlib, datetime, numpy as np, cv2
E = 'D:/Final Fantasy/public/art/characters/evrae/'
BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-evrae-r3/characters/evrae/'
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
idle = json.load(open(E + 'idle-near.json'))
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def box(p):
    a = cv2.imread(p, -1)[..., 3]; ys, xs = np.where(a > 0)
    return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
def write(state, src, meta, note, extra):
    dst = E + state + '.png'
    shutil.copyfile(src, dst)
    im = cv2.imread(dst, -1); h, w = im.shape[:2]
    old = json.load(open(BK + state + '.json'))
    side = {
        'width': w, 'height': h, 'baselineY': idle['baselineY'] + (h - idle['height']),
        'pose': state, 'composition': 'boss', 'facing': 'left',
        'status': 'CANDIDATE (not approved; no entry in docs/target/approved-hashes.json)',
        'method': 'r3-derive',
        'methodNote': note,
        'derivedFrom': 'public/art/characters/evrae/idle-near.png (sha256 ' + sha(E + 'idle-near.png') + ', judged 8)',
        'identityAnchor': idle.get('redo', {}).get('identityAnchor'),
        'derive': meta, **extra,
        'contentBox': box(dst), 'sha256': sha(dst),
        'replaced': {'file': BK + state + '.png', 'judged': old.get('redo', {}).get('candidate'), 'score': 6},
        'candidateOf': 'public/art/characters/evrae/' + state + '.png',
        'notes': 'docs/concepts/chapters/evrae/r3/r3.md', 'installedAt': now,
    }
    json.dump(side, open(E + state + '.json', 'w'), indent=2)
    print(state, w, h, side['baselineY'], side['sha256'][:12])
bsrc, bmeta, hsrc, hmeta = sys.argv[1:5]
write('breath-charge', bsrc, json.load(open(bmeta)),
      "idle-near's own pixels: the throat inflated by a vertical neck warp (dorsal line and head fixed, the belly edge pushed down along an ellipse arc, 2x Lanczos canvas, one resample); the charge glow is the only painted region (a Lab lift toward orange inside the swollen sac and the open mouth that keeps the plates' own detail). Idle's pixels exactly outside the warp + glow region. Same canvas and baseline as idle-near, so scale 1.0 by construction. Glow colour orange is unsourced (research 12.2 asks for a saturated throat accent, no colour) and follows the earlier candidate.",
      {})
write('hurt', hsrc, json.load(open(hmeta)),
      "idle-near's own pixels: the head and neck as one layer, thrown back (rotated 22 deg about the top of the neck arch and pulled 45 px back) and blended into the fixed body along the neck; the body layer never moves. No generated pixels. Canvas padded 90 px at the top for the raised head (baselineY moves with it); head length 69.7 px against idle's 69.5, so no pose scale.",
      {})
