# Install the repaired Sister casts (FFX-2 only) as CANDIDATES over the failed ones; the failed ones are backed up first.
import json, os, shutil, datetime, hashlib, numpy as np
from PIL import Image
ART = 'D:/Final Fantasy/public/art/characters'
BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-24-chapters'
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
def feet(p):
    a = np.asarray(Image.open(p).convert('RGBA').getchannel('A')) >= int(0.35 * 255)
    return int(np.nonzero(a.sum(1) >= 3)[0].max())
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
M = ("r3 idle-pixel repair (docs/plans/art-method-r3/METHOD-CHECK.md): every pixel is the idle's own (unchanged, or the "
     "forearm moved as a rigid layer of idle pixels), except inside one repaint mask whose guide is built from idle pixels; "
     "MAD 0 against the idle outside the mask and the moved arm (FA13: one idle and one hero cast)")
SPEC = {
 'cindy': dict(src='work/cindy-cast-new.png', pad=24, gates='work/cindy-gates.json', repairs=[
   "cast r1 (2026-09-24), repairing the judge's FAIL (blue block at the belly, a floating red sash slab, the bust cut off): re-derived from cindy/idle.png",
   "near forearm, elbow cap and glove (SAM 2.1 small mask of the idle) rotated -75 deg about the elbow (150,345 on the old cast canvas; +24 px canvas pad on the left so the hand is not clipped): the hand reaches forward at chest height, the bust stays whole behind it",
   "vacated belly, belt front and sash tails pre-filled from idle pixels (belt = the idle's own belt column sheared along its slope, belly = harmonic fill of the idle's skin, tails = the idle's own tail columns), then repainted inside that mask only (crop-upscale masked repaint, Animagine XL 4.0 Opt, denoise 0.5, seed 941101, 1 of 8 seeds looked at)",
   "the moved arm laid back on top as exact idle pixels; the new silhouette edge de-fringed and antialiased inside the mask only"]),
 'mindy': dict(src='work/mindy-cast-new.png', pad=0, gates='work/mindy-gates.json', repairs=[
   "cast r1 (2026-09-24), repairing the judge's FAIL (a black glove pressed on a jagged black slab, a shapeless ballooned sleeve, a grey scratch at the elbow): re-derived from mindy/idle.png",
   "puffed sleeve and glove (SAM 2.1 small mask of the idle, no background pixels, so no slab) rotated -110 deg about the elbow (195,445): an open-hand thrust forward at chest height",
   "vacated waist, hip and the remnant of the white wrist band pre-filled from idle pixels (the idle's own dark bodice pixels diffused, its orange hem column carried round the hip), then repainted inside that mask only (denoise 0.45, seed 943101, 1 of 8 seeds looked at)",
   "the moved sleeve and glove laid back on top as exact idle pixels; the new waist silhouette de-fringed and antialiased inside the mask only"]),
}
for name, s in SPEC.items():
    d = f'{ART}/{name}'; bk = f'{BK}/{name}'; os.makedirs(bk, exist_ok=True)
    for f in ['cast.png', 'cast.json']:
        dst = f'{bk}/{f}'; assert not os.path.exists(dst), dst
        shutil.copyfile(f'{d}/{f}', dst)
    old = json.load(open(f'{d}/cast.json'))
    shutil.copyfile(s['src'], f'{d}/cast.png')
    im = Image.open(f'{d}/cast.png'); g = json.load(open(s['gates']))
    side = dict(old)
    side.update({'width': im.width, 'height': im.height, 'baselineY': feet(f'{d}/cast.png'), 'status': 'CANDIDATE',
                 'method': M, 'derivedFrom': f'{name}/idle.png (same pixel scale; canvas' + (f' padded {s["pad"]} px on the left)' if s['pad'] else ' unchanged)'),
                 'repairs': s['repairs'], 'repaintSeed': int(s['repairs'][2].split('seed ')[1].split(',')[0]),
                 'gates': {'changedOutsideMaskAndMovedArm': g['changedOutsideMasks'], 'generatedPx': g['generatedPx'],
                           'inventedColourSharePct': g['inventedSharePct'], 'cutoutMarginPx': 16},
                 'provenance': f'docs/concepts/chapters/fallen-aeons/production/provenance/{name}-cast-r1-provenance.png',
                 'replaced': f'{BK}/{name}/cast.png (sha256 {sha(bk + "/cast.png")[:16]}, judged 5.4/5.6 FAIL in production/JUDGE.md)',
                 'installedAt': now})
    side.pop('knownDefects', None)
    json.dump(side, open(f'{d}/cast.json', 'w'), indent=2)
    print(name, im.size, side['baselineY'], sha(f'{d}/cast.png')[:16])
