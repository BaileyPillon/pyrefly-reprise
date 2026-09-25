# Install the Chapter XIII (Trema, FFX-2 only) production candidates under NEW subject ids, with sidecars, and back
# them up. Never overwrites an existing file. Run with D:/Tools/ComfyUI/python_embeded/python.exe -s install.py
import json, hashlib, shutil, os, datetime, numpy as np
from PIL import Image
ROOT = 'D:/Final Fantasy/public/art'
S = 'D:/Tools/pyrefly-scratch/ch1215/trema/tmp'
R = 'D:/Tools/pyrefly-scratch/trema-options/renders'
BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-trema'
REC = json.load(open('D:/Final Fantasy/docs/concepts/chapters/trema/recipes.json'))
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat()
PICK = ("Bailey 2026-09-25 ~01:40 EDT, verbatim: \"I'll go with all your recommendations\" "
        "(docs/concepts/chapters/trema/README.md; plan docs/plans/chapter-trema-review.md with its Review)")


def feet(p):
    a = np.asarray(Image.open(p).convert('RGBA'))[..., 3] >= int(0.35 * 255)
    rows = np.nonzero(a.sum(1) >= 3)[0]
    return int(rows.max())


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def put(src, dst, meta):
    assert not os.path.exists(dst), f'refusing to overwrite {dst}'
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(src, dst)
    im = Image.open(dst)
    meta = {'width': im.width, 'height': im.height, **meta, 'sha256': sha(dst), 'installedAt': NOW}
    json.dump(meta, open(dst[:-4] + '.json', 'w'), indent=2)
    rel = os.path.relpath(dst, ROOT).replace('\\', '/')
    b = os.path.join(BK, rel)
    os.makedirs(os.path.dirname(b), exist_ok=True)
    shutil.copyfile(dst, b)
    shutil.copyfile(dst[:-4] + '.json', b[:-4] + '.json')
    print(rel, im.size, meta['sha256'][:12])


tr = REC['trema-a6.3']; pa = REC['paragon-a.2']; cl = REC['cloister-b2']
common_t = {
    'facing': 'left', 'facingObserved': True,
    'facingNote': 'Judged on the pixels: face in three-quarter profile and the raised hand toward screen-left, the party side.',
    'status': 'CANDIDATE', 'game': 'FFX-2 only', 'chapter': 'Chapter XIII Trema (Via Infinito, Cloister 100), link 2',
    'pickedFrom': 'O-1 A priest, ' + PICK, 'concept': 'docs/concepts/chapters/trema/trema/a-priest-frame.jpg',
    'conceptSeed': tr['seed'], 'prompt': tr['prompt'], 'negative': tr['negative'], 'model': tr['model'],
    'steps': 28, 'cfg': 6, 'sampler': 'euler_ancestral',
    'sourced': ("research/ffx2-trema.md 6.2: \"an old man in a torn Yevon priest's robe\" [single source: wiki]; the rest "
                "of the look is ours, after look-only reference viewing (README 'What is sourced and what is ours')"),
}
ti = f'{S}/idle2.png'
put(ti, f'{ROOT}/characters/trema/idle.png', {
    'baselineY': feet(ti), 'pose': 'idle', **common_t,
    'method': ("r3 derive-from-concept (docs/plans/art-method-r3/METHOD-CHECK.md): the options round's dehaloed cut-out "
               "of render trema-a6.3 (seed 924113), same crop; the repairs erase or re-grade existing pixels, no GPU"),
    'repairs': [
        ("torn robe (the sourced detail the review found missing): ragged strips and slits cut into the silhouette of the "
         "black under-robe hem, the white coat train and its red lining, the coat's lower outer edge and the hanging left "
         "sleeve (alpha only; a 2 px rim darkened x0.72 on light cloth); one lens-shaped rip in the coat panel shows the "
         "black under-robe (flat under-robe black) - production/scripts/tear.py"),
        "face skin moved to the hands' grey-green (Lab a*/b* of the hands' median, lightness x0.94), the options README to-fix - idlefix.py",
        "stole crest: the round core inside the gold ring turned into a red disc (the README to-fix 'round red crest'); the gold ring and flourishes kept - idlefix.py",
        'detached specks under 40 px removed',
    ]})
tc = f'{S}/cast1.png'
put(tc, f'{ROOT}/characters/trema/cast.png', {
    'baselineY': feet(tc), 'pose': 'cast', **common_t,
    'derivedFrom': 'trema/idle.png (same pixel scale, scale 1.0 by construction)',
    'method': ("r3 rig derive (one hero cast per enemy that acts): the raised hand and cuff lifted 95 px to his beard line "
               "and the wide sleeve hanging from that wrist stretched to follow, hem fixed (castwarp.py); only the wrist "
               "joint, the sleeve top where it now crosses the chest and the vacated slivers were repainted (crop-upscale "
               "masked repaint, Animagine XL 4.0 Opt, denoise 0.45, seed 951102; seed 951101 withdrawn: a dark square at "
               "the sleeve edge). Outside that mask the pixels are the idle's exactly"),
    'repaintSeed': 951102, 'repaintDenoise': 0.45})
common_p = {
    'facing': 'left', 'facingObserved': True,
    'facingNote': 'Judged on the pixels: the horned head is at screen-left, toward the party.', 'nonBiped': True,
    'status': 'CANDIDATE', 'game': 'FFX-2 only', 'chapter': 'Chapter XIII Trema (Via Infinito, Cloister 100), link 1',
    'pickedFrom': 'O-2 A gold armoured beast, with the link staged (O-2b yes), ' + PICK,
    'concept': 'docs/concepts/chapters/trema/paragon/a-gold-frame.jpg',
    'conceptSeed': pa['seed'], 'prompt': pa['prompt'], 'negative': pa['negative'], 'model': pa['model'],
    'steps': 28, 'cfg': 6, 'sampler': 'euler_ancestral',
    'sourced': "research/ffx2-trema.md 6.2: Lord Zaon's fiend form, uses FFX's Nemesis model [single source]; the look is ours",
    'link': ("No KO painting: the link (Trema destroys Paragon) is staged with the engine's pyrefly dissolve plus Trema's "
             "entrance, as the O-2b strip showed; see docs/concepts/chapters/trema/production/link-*.jpg"),
}
pi = f'{S}/p6.png'
put(pi, f'{ROOT}/characters/paragon/idle.png', {
    'baselineY': feet(pi), 'pose': 'idle', **common_p,
    'method': ("r3 derive-from-concept: the options round's cut-out of render paragon-a.2 (seed 924402), same crop; the "
               "repairs erase alpha only, no GPU - production/scripts/paraclean.py"),
    'repairs': [
        "the loose curved blade in front of it (the README flaw: attached to nothing) erased inside a polygon; near the mane only its blue-grey metal and ink edge, never the fur",
        'white background pockets rembg left between the claws and legs opened (3,012 px) and a 2-pass white matte halo peeled (372 px)',
        'a detached baked floor-shadow sliver under the hind foot removed (about 420 px)',
    ]})
pc = f'{S}/pcast.png'
geom = json.load(open(f'{S}/pcast-geom.json'))
hc = Image.open(pc).height
put(pc, f'{ROOT}/characters/paragon/cast.png', {
    'baselineY': geom['pivot_out'][1], 'anchorY': round(geom['pivot_out'][1] / hc, 4), 'pose': 'cast', **common_p,
    'derivedFrom': 'paragon/idle.png (same pixel scale, scale 1.0 by construction)',
    'method': (f"r3 rig derive: the whole idle pitched back {geom['ang']} deg about its hind-foot contact (idle px "
               f"{geom['pivot_idle']}), so the forelegs leave the floor and the head rises (rearing to cast); premultiplied "
               "2x bicubic rotation, no pixel repainted - production/scripts/pararear.py"),
    'anchorNote': (f"anchorY is the hind-foot contact (row {geom['pivot_out'][1]}); the tail tip dips "
                   f"{geom['lowestRow'] - geom['pivot_out'][1]} px lower, so the measured baseline alone would float him")})
pl = f'{R}/plate-b-repaint.png'
put(pl, f'{ROOT}/backdrops/via-infinito.png', {
    'status': 'CANDIDATE', 'game': 'FFX-2 only',
    'scene': 'Via Infinito, Cloister 100 (Chapter XIII Trema; the planned src/scenes/via-infinito.ts)',
    'pickedFrom': 'O-3 B repaint, ' + PICK, 'concept': 'docs/concepts/chapters/trema/cloister/b-repaint-frame.jpg',
    'derivedFrom': 'public/art/backdrops/bevelle-underground.png (approved scene:bevelle-underground), img2img at denoise 0.7',
    'method': 'r3: the picked plate installed unchanged (MAD 0 to the options render cloister-b2), as the Natus and Evrae plates were',
    'seed': cl['seed'], 'denoise': cl['denoise'], 'prompt': cl['prompt'], 'negative': cl['negative'], 'model': cl['model'],
    'steps': cl['steps'], 'cfg': cl['cfg'], 'sampler': cl['sampler'],
    'notes': [
        'The sourced upside-down banners hang in the top third, which the Chapter IV staging crops; a Cloister scene gets its own staging (T5).',
        "No Yu Yevon likeness on the banners: the review says that is Bailey's call, still open; the emblem at the back is our own shape.",
    ]})
