# Install the Nooj shade attempt 3 (METHOD-nooj.md) over the two nooj-shade CANDIDATE files (never an approved file).
# The replaced files are kept in D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu2/nooj-shade/replaced/.
import json, shutil, datetime, hashlib
from PIL import Image
ART = 'D:/Final Fantasy/public/art/characters/nooj-shade'
S = 'D:/Tools/pyrefly-scratch/gpu2/den'
approved = json.load(open('D:/Final Fantasy/docs/target/approved-hashes.json'))
blob = json.dumps(approved)
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
meta = json.load(open(f'{S}/work/fin-meta.json'))
r = json.load(open(f'{S}/renders/n9.4.json'))
old = {p: json.load(open(f'{ART}/{p}.json')) for p in ('idle', 'cast')}
for p in ('idle', 'cast'):
    h = hashlib.sha256(open(f'{ART}/{p}.png', 'rb').read()).hexdigest()
    assert h not in blob, f'{p} is approved: refusing'
    assert old[p]['status'] == 'CANDIDATE'
PICK = old['idle']['concept']; TREAT = old['idle']['method'].split('; ', 1)[1]
common = {'facing': 'left', 'status': 'CANDIDATE', 'game': 'FFX-2 only', 'chapter': old['idle']['chapter'], 'concept': PICK,
          'canon': old['idle']['canon'],
          'base': ("attempt 3 (docs/concepts/chapters/gippal/production/METHOD-nooj.md): a fresh render, three-quarter left, with "
                   "IP-Adapter on the picked portrait portraits/nooj.png (D-043) FORCED past the monochrome guard (--forceRef; "
                   "the first render's record said refSkippedMonochrome), weight 0.55 ease in 0.2-0.7; 46 seeds in 9 pilots "
                   "(970101-970908, 4 quarantined by the cut-out guard); 970704 kept: blue glasses, a loop with a red tie, a fur "
                   "shoulder, the machina left arm and leg toward camera, the cane in the gloved right hand"),
          'conceptSeed': r['seed'], 'prompt': r['prompt'], 'negative': r['negative'], 'model': r['model'], 'steps': r['steps'],
          'cfg': r['cfg'], 'sampler': r['sampler'], 'facingPhrase': r['facingPhrase'], 'emphasis': r['emphasis'],
          'ref': 'portraits/nooj.png', 'refWeight': r['refWeight'], 'refWeightType': r['refWeightType'], 'refStart': r['refStart'],
          'refEnd': r['refEnd'], 'refForced': True}
IDLE_REP = ["three background holes the cut-out left white (inside the near loop, beside the neck, beside the far cheek) keyed to "
            "alpha 0; a pink fleck by the near foot removed",
            "the FAR hair loop (his right side) blocked in behind the head in the render's own hair colours with a red tie, then ONE "
            "masked repaint with IP-Adapter on the portrait (ip-adapter-plus SDXL 0.55; seed 971102, denoise 0.6; 3 seeds tried); "
            "its outer alpha edge anti-aliased inside the mask only (scripts/nooj3/)"]
KNOWN = ["the fur is on the LEFT (machina) shoulder; the bible puts the purple fur-trimmed sleeve on the right shoulder, and the right "
         "arm here is a long dark glove, not a purple sleeve",
         "the far loop's outer edge is a little blocky at 2x (its alpha is the block-in's ellipse, softened)",
         "the gloved right hand on the cane is a dark mass with few finger reads",
         "the near (machina) foot tapers like a hoof",
         "one belt pair and a cross strap, not five belts",
         "the red suit and the purple boots are muted by the B treatment, as the pick accepts"]
for p in ('idle', 'cast'):
    shutil.copyfile(f'{S}/work/fin-nooj3-{p}.png', f'{ART}/{p}.png')
    im = Image.open(f'{ART}/{p}.png'); m = meta[p]
    side = {'width': im.width, 'height': im.height, 'baselineY': m['baselineY'], **common}
    if p == 'idle':
        side['method'] = 'r3 derive-from-concept (docs/plans/art-method-r3/METHOD-CHECK.md); ' + TREAT
        side['repairs'] = IDLE_REP
        side['knownDefects'] = KNOWN
        side['scale'] = round(m['baselineY'] / 1143, 4)
        side['scaleNote'] = ("the B pad and halo margin move baselineY; this factor keeps the pixels-per-world-unit of the "
                             "unpadded painting (baselineY 1143)")
    else:
        side['method'] = 'r3 hero cast (one per acting enemy, as Chapters VI-XI chose): rig derive of the opaque idle, then ' + TREAT
        side['derivedFrom'] = 'characters/nooj-shade/idle.png (same pixel scale; sized against idle, no own scale)'
        side['repairs'] = IDLE_REP + [
            "the gloved right forearm, hand and cane turned 40 degrees clockwise about the elbow as one rigid layer of the opaque "
            "idle's own pixels (the cane swings out and up toward the party); the elbow gap closed and pre-filled inside a 30 px "
            "joint circle, then ONE masked repaint there (seed 971204, denoise 0.45; 4 seeds tried); a 22 px notch on the sleeve "
            "edge above the joint filled"]
        side['knownDefects'] = KNOWN[:1] + ["the elbow shows a band of skin between the upper sleeve and the glove (ours)",
                                            "the gloved hand on the cane is a dark mass with few finger reads"]
    side['installedAt'] = now
    side['replacedSha256'] = hashlib.sha256(open(f'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu2/nooj-shade/replaced/{p}.png', 'rb').read()).hexdigest()
    side['replacedKeptAt'] = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu2/nooj-shade/replaced/'
    json.dump(side, open(f'{ART}/{p}.json', 'w'), indent=2)
    print(p, im.size, m['baselineY'], hashlib.sha256(open(f'{ART}/{p}.png', 'rb').read()).hexdigest()[:12])
