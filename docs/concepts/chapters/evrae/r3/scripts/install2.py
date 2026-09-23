"""r3 repair cycle (FFX only): install the in-place breath-charge into public/art (CANDIDATE) and write the
lunge cast candidate into docs (NOT installed; Bailey's Decision 1). The replaced cycle-1 files are backed up
first in D:/Tools/pyrefly-art-backup/candidates/2026-09-23-evrae-r3/cycle1/characters/evrae/."""
import json, shutil, hashlib, datetime, os
import numpy as np, cv2
F = 'D:/Final Fantasy/'; E = F + 'public/art/characters/evrae/'; R = F + 'docs/concepts/chapters/evrae/r3/'
W = 'D:/Tools/pyrefly-lora/evrae/r3/cycle2/'
BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-evrae-r3/cycle1/characters/evrae/'
assert os.path.exists(BK + 'breath-charge.png') and os.path.exists(BK + 'cast-candidate.png'), 'back up first'
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
def box(p):
    a = cv2.imread(p, -1)[..., 3]; ys, xs = np.where(a > 0); return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
idle = json.load(open(E + 'idle-near.json')); old = json.load(open(BK + 'breath-charge.json'))
dst = E + 'breath-charge.png'; shutil.copyfile(W + 'breath-charge.png', dst)
a = cv2.imread(dst, -1); h, w = a.shape[:2]
side = {'width': w, 'height': h, 'baselineY': idle['baselineY'], 'pose': 'breath-charge', 'composition': 'boss', 'facing': 'left',
  'status': 'CANDIDATE (not approved; no entry in docs/target/approved-hashes.json)', 'method': 'r3-derive (repair cycle)',
  'methodNote': "idle-near's own pixels. The throat swells in place: only the neck's belly plates and the lowest 12 px of teal stretch down (up to 66 px, one smooth convex underside that merges into the arch's belly line); every dorsal scale above that is idle's pixels exactly. The sac outline is the belly edge plus the swell, drawn as binary alpha like the rest of the sprite; the rim's last 6 px take the colour 7 px further in (no pale fringe). The glow lights the belly plates themselves, so its top edge is their own painted seam, and it falls off along the neck (Gaussian, not a column). A small warm spill follows the seam's curve. The mouth glow is unchanged from cycle 1. No generated pixels. Glow colour orange is unsourced (research 12.2 names none).",
  'derivedFrom': 'public/art/characters/evrae/idle-near.png (sha256 ' + sha(E + 'idle-near.png') + ', judged 8)',
  'identityAnchor': idle.get('redo', {}).get('identityAnchor'),
  'derive': json.load(open(W + 'breath-charge.json')), 'script': 'docs/concepts/chapters/evrae/r3/scripts/breath_inplace.py (A=66 CX=440)',
  'contentBox': box(dst), 'sha256': sha(dst),
  'replaced': {'file': BK + 'breath-charge.png', 'sha256': old.get('sha256'), 'judged': 'docs/concepts/chapters/evrae/r3/JUDGE.md', 'score': 5},
  'candidateOf': 'public/art/characters/evrae/breath-charge.png', 'notes': 'docs/concepts/chapters/evrae/r3/r3.md', 'installedAt': now}
json.dump(side, open(E + 'breath-charge.json', 'w'), indent=2); print('breath-charge', w, h, side['sha256'][:12])
cd = R + 'cast-candidate.png'; shutil.copyfile(W + 'cast.png', cd)
oc = json.load(open(BK + 'cast-candidate.json')); m = json.load(open(W + 'cast.json'))
m['headPx'] = 69.5; m['headPxNote'] = "the head is a rigid layer (neck weight 1 over the whole head), so its length is idle's 69.5 px by construction; the script's nearest-point probe misreads it once the jaw map is composed"
c = cv2.imread(cd, -1); ch, cw = c.shape[:2]
cast = {'status': "CANDIDATE for Bailey's Decision 1 (METHOD-CHECK section 4); NOT installed, no characters/evrae/cast.png exists",
  'game': 'FFX only (Evrae, Chapter 8)', 'width': cw, 'height': ch, 'baselineY': idle['baselineY'], 'facing': 'left', 'pose': 'cast',
  'method': 'r3-derive (repair cycle)',
  'methodNote': "idle-near's own pixels: the head and neck as one layer driven DOWN and FORWARD at the party (shift -55, +28 px, pitched 11 deg snout-down), the lower jaw opened 20 deg about the mouth corner (the gullet's own dark pixels stretch; the teeth are not folded). The body never moves. Hurt throws the head UP and BACK, so the two read as opposites. No generated pixels.",
  'why': "every Evrae action is kind 'ability', poseForCommand maps ability to the cast pose, and with no cast.png the idle stands in for every action",
  'derive': m, 'script': 'docs/concepts/chapters/evrae/r3/scripts/pose_derive2.py (SHIFTX=-55 SHIFTY=28, -11 520 230 350 600 -20)',
  'replaces': {'file': BK + 'cast-candidate.png', 'sha256': oc.get('sha256'), 'judged': 'docs/concepts/chapters/evrae/r3/JUDGE.md', 'score': 6},
  'sha256': sha(cd)}
json.dump(cast, open(R + 'cast-candidate.json', 'w'), indent=2); print('cast', cw, ch, cast['sha256'][:12])
