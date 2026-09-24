"""Write the candidate PNGs and their sidecars into the candidates folder (never public/art).
Each sidecar is the idle's own (same canvas, same feet, so the engine's idle-derived pixel scale holds
with no override) plus the pose, the method, the repaint provenance and the file's sha256."""
import json, hashlib, shutil, os
from ylib import *

J = lambda p: json.load(open(p))
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
ycs, dgs = f'{SCR}/yoj', f'{SCR}/dg'
os.makedirs(f'{OUT}/yojimbo-cavern', exist_ok=True); os.makedirs(f'{OUT}/daigoro', exist_ok=True)

def write(key, pose, src, extra, name=None):
    idle = J(f'{REPO}/public/art/characters/{key}/idle.json')
    keep = {k: idle[k] for k in ('width', 'height', 'baselineY', 'composition', 'nonBiped', 'facing', 'facingObserved', 'cutout', 'suggestedWorldHeight') if k in idle}
    dst = f'{OUT}/{key}/{name or pose}.png'
    shutil.copyfile(src, dst)
    side = dict(keep, pose=pose, status='CANDIDATE (never installed; not approved)', game='FFX only',
                anchor=f'public/art/characters/{key}/idle.png sha256 {idle["sha256"]}', **extra, sha256=sha(dst),
                scripts='docs/concepts/chapters/yojimbo/casts/scripts/')
    json.dump(side, open(dst.replace('.png', '.json'), 'w'), indent=1)
    print(dst, side['sha256'][:12])

rep = lambda p: {k: v for k, v in J(p).items() if k in ('seed', 'denoise', 'words', 'model', 'ipadapter', 'steps', 'cfg', 'sampler')}
write('yojimbo-cavern', 'cast', f'{ycs}/cast-v1.png', dict(
    method='r3 idle-pixel transplant + masked seam repaint (METHOD-CHECK step 2): the idle katana (hilt, tsuba) moved from the hip into the far hand; the far forearm is the idle gauntlet forearm moved under the body; the blade drawn in steel colours the idle already has; repaint only inside masks, then the hilt interior re-pasted',
    reads='Zanmato and every enemy action: the drawn blade (poseForCommand maps every Yojimbo row, kind ability, to cast)',
    repaints=[dict(rep(f'{ycs}/pA.a1.json'), mask='fist, wrist, forearm seam'), dict(rep(f'{ycs}/pB.b2.json'), mask='blade and hilt edges')],
    pixelOnly=['hip: the tsuba sliver and its shadow erased back to the sash edge (nothing painted)', 'white-ground fringe peeled on the new silhouette']))
write('yojimbo-cavern', 'hurt', f'{ycs}/hurt-v1.png', dict(
    method='r3 derived hurt (METHOD-CHECK step 3): a bake of the idle pixels, no GPU; torso 6 degrees back about the waist, ramped through the sash, head and hat 4 degrees more about the neck; hip swords rigid; 2x Lanczos warp; binary matte',
    versus="'none' = no hurt file: the engine flinches the idle (tie goes to none)"))
write('daigoro', 'cast', f'{dgs}/cast-v2.png', dict(
    method='r3 idle-pixel transplant + masked repaint: the idle lower jaw turned 30 degrees down about the hinge, the gap as mouth, then one repaint inside the muzzle mask',
    reads='Daigoro (row 4:177, his bite): the only action he takes',
    repaints=[dict(rep(f'{dgs}/pN.n4.json'), mask='muzzle and jaw')]))
write('daigoro', 'cast', f'{dgs}/cast-v1.png', dict(
    method='as cast.png, jaw 20 degrees (the milder alternative)', repaints=[dict(rep(f'{dgs}/pM.m2.json'), mask='muzzle and jaw')]), name='cast-alt-narrow')
