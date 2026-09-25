# Install the Chapter XV (Den of Woe) production CANDIDATES under NEW subject ids; never touches an approved file.
import json, shutil, os, datetime, hashlib
from PIL import Image
ART = 'D:/Final Fantasy/public/art'
S = 'D:/Tools/pyrefly-scratch/ch1215/gippal'
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
meta = json.load(open(f'{S}/work/fin-meta.json'))


def rec(path):
    r = json.load(open(path))
    d = {'conceptSeed': r['seed'], 'prompt': r['prompt'], 'negative': r['negative'], 'model': r.get('model'),
         'steps': r.get('steps'), 'cfg': r.get('cfg'), 'sampler': r.get('sampler')}
    if r.get('ref'):
        d['ref'] = r['ref']
    return d


PICK = ("O-1 B translucent and lit from within, the same treatment for all three shades; picked by Bailey 2026-09-25 "
        "(\"I'll go with all your recommendations\"); docs/concepts/chapters/gippal/o1-shade/b-translucent-frame.jpg")
TREAT = ("O-1 B treatment (docs/concepts/chapters/gippal/production/scripts/shade_b.py): the options round's own B code and "
         "parameters, applied to the opaque painting; only change: outer halo alpha capped at 0.33 (was 0.45) so the engine's "
         "0.35 alpha measure never moves the feet or the content box (Chapter XI precedent). No GPU in the treatment")
SRC = {'gippal-shade': ('D:/Tools/pyrefly-scratch/gippal-options/renders/gippal-a2.json', 'gip'),
       'baralai-shade': (f'{S}/renders/baralai.3.json', 'bar'),
       'nooj-shade': (f'{S}/renders/nooj2.3.json', 'nooj')}
ORIG_BASE = {'gip': 1113, 'bar': 1192, 'nooj': 1141}
BASE = {
    'gip': 'r3 derive from the O-1 pilot render gippal-a2 (seed 951102), the pixels B was shown on',
    'bar': ("fresh render (no Baralai painting exists on disk: no speaker portrait, no body): character preset, facing left, "
            "seeds 961101-961104, two quarantined by the cut-out guard, 961103 kept (the other survivor, 961102, had a "
            "wheel-headed staff); identity words from research/visual-bible.md 1.23.6 [single source]; the staff from "
            "research/ffx2-gippal-den-of-woe.md (strategy notes: Baralai's staff)"),
    'nooj': ("fresh render with IP-Adapter on the picked speaker portrait portraits/nooj.png (D-043) as identity reference: "
             "8 seeds in two batches (962101-962104, 962201-962204); 962203 kept (brown hair, blue glasses, ponytail with red "
             "tie, machina left arm and left leg toward camera as bible 1.23.4 stages him)"),
}
IDLE_REPAIRS = {
    'gip': ["mortar: the ring clamp repainted as the sourced rounded saw blade (visual bible 1.23.5): a grey toothed disc "
            "blocked in behind the barrel and the fist, masked crop-upscale repaint inside the disc only (Animagine XL 4.0 Opt, "
            "denoise 0.55, seed 963102); alpha = the block-in disc shape; 25,919 px changed, everything else the render's own "
            "pixels (MAD 0)"],
    'bar': [], 'nooj': [],
}
CAST = {
    'gip': ("forearm, fist, mortar and saw rotated 18 deg about the elbow as one rigid layer of the idle's own pixels (the "
            "mortar swings up and out toward the party); elbow seam repainted in a joint mask only (denoise 0.45, seed 964101); "
            "edge specks removed"),
    'bar': ("forearm, hand and staff rotated 22 deg about the elbow as one rigid layer (the staff head tips toward the party); "
            "the pole hidden behind the coat rebuilt by repeating the idle's own visible pole profile; the uncovered chest "
            "pre-filled by diffusion and repainted in its mask only (denoise 0.55, seed 965102)"),
    'nooj': ("machina forearm, hand and cane rotated 32 deg about the elbow as one rigid layer (the cane levelled at the "
             "party); the uncovered torso pre-filled and repainted in its mask only (denoise 0.5, seed 966102)"),
}
CAST_KNOWN = {
    'gip': ['the saw disc now touches the hair tips at 1:1'],
    'bar': ['the far hand stays at his side, empty, after the staff moved',
            'the rebuilt pole is a uniform cylinder below the grip'],
    'nooj': ['a small red spur of the torso edge shows under the forearm'],
}
KNOWN = {
    'gip': ['the overalls read as a purple sash and apron (options review), not repaired: B desaturates them',
            'the patch sits a little low on the cheek at 1:1 (options review), not repaired'],
    'bar': ['no black-and-white glyph panels on the lower coat (bible 1.23.6): the render shows black trousers under the coat',
            'the staff head design is ours (the sources name a staff, not its look)'],
    'nooj': ['the purple fur-trimmed sleeve (right shoulder) is on the far side and not visible in this near-profile pose',
             'the cane is held in the machina LEFT hand; the bible says the right hand',
             'the cane reads copper-banded, not silver, before B'],
}
for subj, (rj, k) in SRC.items():
    d = f'{ART}/characters/{subj}'
    os.makedirs(d, exist_ok=True)
    for pose in ['idle', 'cast']:
        dst = f'{d}/{pose}.png'
        assert not os.path.exists(dst), dst
        shutil.copyfile(f'{S}/work/fin-{k}-{pose}.png', dst)
        m = meta[f'{k}-{pose}']
        im = Image.open(dst)
        side = {'width': im.width, 'height': im.height, 'baselineY': m['baselineY'], 'facing': 'left',
                'status': 'CANDIDATE', 'game': 'FFX-2 only',
                'chapter': 'Chapter XV Den of Woe (provisional ffx2-den-of-woe)', 'concept': PICK,
                'canon': ('the shade look is ours (research G-13); the sources say only that each is an illusion made of '
                          'pyreflies'),
                'base': BASE[k], **rec(rj)}
        if pose == 'idle':
            side['method'] = 'r3 derive-from-concept (docs/plans/art-method-r3/METHOD-CHECK.md); ' + TREAT
            side['repairs'] = IDLE_REPAIRS[k]
            side['knownDefects'] = KNOWN[k]
            side['scale'] = round(m['baselineY'] / ORIG_BASE[k], 4)
            side['scaleNote'] = ("the B pad and halo margin move baselineY; this factor keeps the pixels-per-world-unit of "
                                 "the unpadded painting (baselineY %d)" % ORIG_BASE[k])
        else:
            side['method'] = ('r3 hero cast (one per acting enemy, as Chapters VI-XI chose): rig derive of the opaque idle, '
                              'then ' + TREAT)
            side['derivedFrom'] = f'characters/{subj}/idle.png (same pixel scale; sized against idle, no own scale)'
            side['repairs'] = [CAST[k]]
            side['knownDefects'] = CAST_KNOWN[k]
        side['installedAt'] = now
        json.dump(side, open(f'{d}/{pose}.json', 'w'), indent=2)
        h = hashlib.sha256(open(dst, 'rb').read()).hexdigest()
        print(dst, im.size, m['baselineY'], h[:12])

bdst = f'{ART}/backdrops/den-of-woe.png'
assert not os.path.exists(bdst)
shutil.copyfile('D:/Tools/pyrefly-scratch/gippal-options/renders/plate-a.png', bdst)
r = json.load(open('D:/Tools/pyrefly-scratch/gippal-options/renders/den-a3.json'))
json.dump({'status': 'CANDIDATE', 'game': 'FFX-2 only', 'chapter': 'Chapter XV Den of Woe (provisional ffx2-den-of-woe)',
           'concept': 'O-3 A cold blue pyreflies, picked by Bailey 2026-09-25; docs/concepts/chapters/gippal/o3-den/a-frame.jpg',
           'method': ('the picked plate installed unchanged (MAD 0 against the O-3 plate-a): den-a3 (img2img over the layout '
                      'guide, denoise 0.8) lifted x1.12, a blue floor glow and drawn pyrefly motes '
                      '(docs/concepts/chapters/gippal/scripts/denplates.py)'),
           'canon': 'a pyrefly-filled cave with a rectangular clearing [single source: GamerGuides]; rock, floor and light are ours',
           'knownDefects': ['no clear tunnel mouth: two masked repaint tries (6 seeds) read as a door or a cut-out hole and '
                            'were withdrawn (rule 15)',
                            'the motes are painted in; if the scene adds live pyrefly particles they may double up',
                            'the painted pyreflies on the floor read as glowing domes'],
           'seed': r['seed'], 'denoise': r.get('denoise'), 'prompt': r['prompt'], 'negative': r['negative'],
           'model': r['model'], 'steps': r['steps'], 'cfg': r['cfg'], 'sampler': r['sampler'], 'installedAt': now},
          open(bdst[:-4] + '.json', 'w'), indent=2)
print(bdst, hashlib.sha256(open(bdst, 'rb').read()).hexdigest()[:12])
