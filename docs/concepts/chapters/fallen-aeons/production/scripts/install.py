# Install the Fallen Aeons production candidates under NEW subject ids (never touching approved files) with sidecars.
import json, shutil, os, datetime, numpy as np
from PIL import Image
ART = 'D:/Final Fantasy/public/art'
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
OPT = 'D:/Tools/pyrefly-scratch/fallen-aeons-options/renders'
W = 'D:/Tools/pyrefly-scratch/fa-prod/work'


def feet(p):
    a = np.asarray(Image.open(p).convert('RGBA').getchannel('A')) >= int(0.35 * 255)
    rows = np.nonzero(a.sum(1) >= 3)[0]
    return int(rows.max())


def put(subject, pose, src, meta):
    d = f'{ART}/characters/{subject}'
    os.makedirs(d, exist_ok=True)
    dst = f'{d}/{pose}.png'
    assert not os.path.exists(dst), dst
    shutil.copyfile(src, dst)
    im = Image.open(dst)
    side = {'width': im.width, 'height': im.height, 'baselineY': feet(dst), 'facing': 'left', 'status': 'CANDIDATE',
            'game': 'FFX-2 only', 'chapter': 'Chapter XI Fallen Aeons (ffx2-fallen-aeons)'}
    side.update(meta)
    side['installedAt'] = now
    json.dump(side, open(f'{d}/{pose}.json', 'w'), indent=2)
    print(dst, side['width'], side['height'], side['baselineY'])


def rec(name):
    r = json.load(open(f'{OPT}/{name}.json'))
    return {'conceptSeed': r['seed'], 'prompt': r['prompt'], 'negative': r['negative'], 'model': r.get('model'),
            'steps': r.get('steps'), 'cfg': r.get('cfg'), 'sampler': r.get('sampler')}


PICK = ("O-1 A armoured sisters, picked by Bailey 2026-09-24 (\"I'll go with your recommendations for all\"); "
        "docs/concepts/chapters/fallen-aeons/o1-sisters/a-armoured-trio.jpg")
M = "r3 derive-from-concept (docs/plans/art-method-r3/METHOD-CHECK.md): the picked O-1 A render's own pixels; repair only what must change"
MC = M + '; cast = rig derive of the clean idle (FA13: one idle and one hero cast)'

put('sandy', 'idle', f'{W}/sandy-idle-clean.png', {'concept': PICK, 'method': M, **rec('sandy-a3'), 'repairs': [
    "clean pass (inferred, visual-bible 1.22.6 shape [estimate]): the floating scythe (the render's own second component) "
    "scaled 0.70, rotated 14 deg and moved so its mount sits on her right forearm gauntlet, drawn in front of the arm; "
    "pixel transplant only, no repaint, no GPU"]})
put('sandy', 'cast', f'{W}/sandy-cast-clean.png', {'concept': PICK, 'method': MC,
    'derivedFrom': 'sandy/idle.png (same pixel scale, scale 1.0 by construction)', **rec('sandy-a3'), 'repairs': [
    'forearm, hand and attached scythe rotated 100 deg about the elbow (blade raised high behind her), idle pixels',
    'elbow seam repainted only inside a 96x88 px disc (crop-upscale masked repaint, Animagine XL 4.0 Opt, denoise 0.45, seed 931201); detached specks and a stray strand removed']})
put('cindy', 'idle', f'{W}/cindy-idle-clean.png', {'concept': PICK, 'method': M, **rec('cindy-a2'), 'repairs': [
    "clean pass: seven pale dots on the red shell spots filled by diffusion from the spots' own red pixels, so the shell "
    "reads red spots on BLUE (visual-bible 1.22.6; the review corrected the README's 'black spots on red'); 3,556 px changed, no GPU"]})
put('cindy', 'cast', f'{W}/cindy-cast-clean.png', {'concept': PICK, 'method': MC,
    'derivedFrom': 'cindy/idle.png (same pixel scale)', **rec('cindy-a2'), 'repairs': [
    'near forearm (gauntlet and hand) rotated -95 deg about the elbow: arm raised forward',
    'vacated belly, sash and joint repainted inside their mask only (denoise 0.55, seed 932201); alpha re-derived there by rembg isnet-anime (local weights)'],
    'knownDefects': ['the far hand left at the belly reads as a blue block at 1:1']})
put('mindy', 'idle', f'{W}/mindy-idle-clean.png', {'concept': PICK, 'method': M, **rec('mindy-a2'), 'repairs': [
    "clean pass (inferred, bible shape [estimate]): the render's own striped abdomen taken off her hips, scaled 0.62, "
    "tilted -22 deg and set BEHIND her, a black stinger point added at its tip",
    'hips blocked in as black leggings and repainted inside the hip mask only (denoise 0.62, seed 925101); the notch the '
    'glove left in the abdomen closed (denoise 0.42, seed 925201); alpha re-derived in the edit region by rembg isnet-anime (local weights)'],
    'hover': 'she hovers (bible 1.22.6): the hover height is engine data, not art'})
put('mindy', 'cast', f'{W}/mindy-cast-clean.png', {'concept': PICK, 'method': MC,
    'derivedFrom': 'mindy/idle.png (same pixel scale)', **rec('mindy-a2'), 'repairs': [
    'near forearm (orange cuff and glove) rotated -130 deg about the elbow: arm thrust forward',
    'vacated bodice repainted inside its mask only (denoise 0.55, seed 933201); alpha re-derived there'],
    'hover': 'she hovers (bible 1.22.6): the hover height is engine data, not art'})

P = 'D:/Tools/pyrefly-scratch/fa-prod/poss'
POSS = ("r3 derive: the APPROVED painting's own pixels, colour grade only (shadows toward violet, highlights kept), inner "
        "violet rim, violet eye glow, dark violet aura behind the figure (alpha capped at 0.33, under the engine's 0.35 "
        "alpha-measure threshold, so the aura never moves the feet or the content box); line work and shapes identical; "
        "70 px transparent pad on every side; no GPU (docs/concepts/chapters/fallen-aeons/production/scripts/possess_b.py)")
for subj, orig in [('x2-shiva', 'shiva'), ('x2-anima', 'anima')]:
    ob = json.load(open(f'{ART}/characters/{orig}/idle.json'))['baselineY']
    for pose in ['idle', 'attack', 'overdrive']:
        o = json.load(open(f'{ART}/characters/{orig}/{pose}.json'))
        appr = 'approved, cast:shiva hashed' if orig == 'shiva' else "FA11: Anima counts as approved on Bailey's word, 2026-09-24"
        meta = {'concept': 'O-2 B Chapter IV violet (FA12), picked by Bailey 2026-09-24; docs/concepts/chapters/fallen-aeons/o2-possessed/',
                'method': POSS, 'derivedFrom': f'public/art/characters/{orig}/{pose}.png ({appr})',
                'sourceSeed': o.get('seed'), 'sourcePrompt': o.get('prompt'),
                'canon': 'not canon: no source confirms a recolour (research F-12); house precedent ffx2-bahamut idle'}
        if pose == 'idle':
            meta['scale'] = round((ob + 70) / ob, 4)
            meta['scaleNote'] = "the 70 px top pad raises baselineY; this factor restores the approved painting's pixels-per-world-unit"
        put(subj, pose, f'{P}/{orig}-{pose}-b-violet.png', meta)

O3 = 'D:/Tools/pyrefly-scratch/fallen-aeons-options/o3'
r = json.load(open(f'{O3}/raw-a3.json'))
for bid, src, note in [
        ('road-to-the-farplane', f'{O3}/road-a3.png', 'O-3 A, one platform over a bright void: the battle arena for all three links (FA14 b)'),
        ('road-to-the-farplane-links', f'{O3}/road-b3.png', "O-3 B, the establishing shot between links: plate A plus two smaller copies of A's own island toward the spire")]:
    dst = f'{ART}/backdrops/{bid}.png'
    assert not os.path.exists(dst), dst
    shutil.copyfile(src, dst)
    side = {'status': 'CANDIDATE', 'game': 'FFX-2 only', 'concept': note + '; picked by Bailey 2026-09-24',
            'derivedFrom': 'public/art/backdrops/farplane.png (approved scene:farplane)',
            'method': ("r3: only the flower field was masked and repainted (SetLatentNoiseMask, denoise 0.75) over a rough guide and "
                       "pasted back inside the feathered mask; 65 % of the pixels (every row above 827 of 1536) are the approved plate's exactly"
                       + ("; B adds two scaled copies of A's island, no render" if 'links' in bid else '')),
            'seed': r['seed'], 'denoise': r['denoise'], 'prompt': r['prompt'], 'negative': r['negative'], 'model': r['model'],
            'steps': r['steps'], 'cfg': r['cfg'], 'sampler': r['sampler'], 'installedAt': now}
    json.dump(side, open(f'{ART}/backdrops/{bid}.json', 'w'), indent=2)
    print(dst)
