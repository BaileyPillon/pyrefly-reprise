"""Install the Chapter XII (Seymour Omnis, FFX only) production candidates under NEW ids. Never overwrites: refuses if a
target exists. Every file is a CANDIDATE: self-judged at 1:1 and in a real 1600x900 frame, not independently judged, not
approved (never in approved-hashes.json)."""
import json, hashlib, os, sys, datetime
import numpy as np
from PIL import Image
REPO = 'D:/Final Fantasy/public/art/'
OPT = 'D:/Tools/pyrefly-scratch/omnis-options/renders/'
W = 'D:/Tools/pyrefly-scratch/ch1215/omnis/work/'
SCR = 'D:/Tools/pyrefly-scratch/ch1215/omnis/'
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
PICK = "Bailey 2026-09-25 ~01:40 EDT, verbatim: \"I'll go with all your recommendations\" (docs/concepts/chapters/omnis/README.md, docs/plans/chapter-omnis-review.md)"
REF = ('look-only reference pass 2026-09-25 (Bailey\'s yes to question 5): the wiki\'s Omnis concept art, the reels concept art and one HD '
       'battle screenshot were viewed in the built-in browser and not saved; see docs/concepts/chapters/omnis/INSTALLED.md')
JUDGE = 'self-judged at 1:1 and in a 1600x900 engine frame; not independently judged; not approved (never in approved-hashes.json)'
DO = '--dry' not in sys.argv


def rec(k):
    return json.load(open(OPT + k + '.json')) if os.path.exists(OPT + k + '.json') else {}


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def place(img, rel, side):
    p = REPO + rel
    if os.path.exists(p):
        sys.exit('refusing to overwrite ' + p)
    side['status'] = 'CANDIDATE'; side['game'] = 'ffx'; side['judgeNotes'] = JUDGE
    if not DO:
        print('dry', rel, img.size); return
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p, optimize=True)
    side['sha256'] = sha(p); side['installedAt'] = NOW
    json.dump(side, open(p[:-4] + '.json', 'w'), indent=2)
    print('installed', rel, img.size, side['sha256'][:12])


def alpha_box(im):
    a = np.array(im)[..., 3] > 0
    ys = np.nonzero(a.any(1))[0]; xs = np.nonzero(a.any(0))[0]
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


A_TAGS = ('1boy, seymour guado, final fantasy x, solo, male focus, final mutated form, towering demonic sorcerer, pale grey blue skin, '
          'long straight light blue hair falling past his shoulders, purple eyes, dark veins on his face, bare chest with ridged ribs, '
          'dark indigo armored shoulders with curved horn spikes, clawed hands, (lower body is a long heavy dark indigo skirt of hanging '
          'tattered cloth strips, no legs visible:1.2), (1boy:1.3); poseTags: floating upright in midair, both arms spread wide at shoulder '
          'height, hem hanging straight down, looking at viewer, cold smile')
A_BASE = {'seed': 912102, 'model': 'animagine-xl-4.0-opt.safetensors', 'steps': 28, 'cfg': 6, 'sampler': 'euler_ancestral', 'scheduler': 'normal',
          'prompt': 'character preset --pose idle --facing left --composition full; tags: ' + A_TAGS,
          'recipe': 'docs/concepts/chapters/omnis/recipes.json "O-1 A omnis-a"', 'source': {'width': 832, 'height': 1216}, 'canvas': {'width': 832, 'height': 1216}}
FACING = ('Judged on the pixels: torso three-quarter with the chest turned to screen-left and the face toward screen-left and the viewer; '
          'he faces the party when he stands on the right. Never mirror the discs with him (a mirror reverses the ring order).')
OFF_A = ('Our design, as picked (O-1 A). The look-only pass showed the game\'s Omnis as a lean blue-violet armoured figure with large crescent '
         'blade shapes above and below him and dangling legs under a long hanging robe; ours has spread clawed arms and no legs. Kept: Bailey '
         'picked A for its silhouette. Also ours: the red horn-claws on the shoulders and the red spiral on his shoulder (flagged at the options '
         'round). The outermost strips are cut by the render\'s own canvas at x 0 and x 831 (left 355 px, right 129 + 159 px of straight edge); '
         'the discs cover most of it at battle size; no outpaint was tried (Natus lesson: outpaints invent).')

# 1. Seymour Omnis idle
n = Image.open(W + 'omnis-idle.png')
l, t, r, b = alpha_box(n)
s = {'width': n.width, 'height': n.height, 'baselineY': b, **A_BASE, 'cropBox': [-16, -1, 848, 1228], 'pose': 'idle', 'composition': 'full',
     'nonBiped': True, 'facing': 'left', 'facingNote': FACING,
     'hover': 'Hovers (sourced: he hovers in front of four large discs); the lowest pixels are the hem tips, so baselineY is the hem; lift him in the scene (ours)',
     'pickedFrom': 'O-1 A, ' + PICK, 'concept': 'docs/concepts/chapters/omnis/o1-omnis/a-frame.jpg', 'reference': REF,
     'method': 'r3 derive-from-concept (docs/plans/art-method-r3/METHOD-CHECK.md): the picked render omnis-a (seed 912102) own pixels; only the alpha was rebuilt',
     'repairs': ['alpha rebuilt from the raw render against its flat white ground (white connected to the border, plus enclosed white pockets of 40 px or more); RGB = the raw render exactly',
                 'the white pocket enclosed between the raised left arm, the hair and the shoulder strip is opened (it bloomed in the options frame)',
                 'the pale light-blue strips the options matte broke are whole again (22,145 px regained, 18,180 px of white ground dropped vs the options cut-out)',
                 'near-white fringe peeled (47 px), specks under 30 px dropped (2 px); one connected component; binary alpha; 16 px margin'],
     'redGlow': 'not painted: the glow before Dispel and Ultima is a live effect (tint plus halo, pulse and particles), as the options follow-up said',
     'offCanon': OFF_A, 'candidateSource': OPT + 'omnis-a.raw.png', 'script': SCR + 'omnis_idle.py'}
place(n, 'characters/seymour-omnis/idle.png', s)

# 2. Seymour Omnis hero cast
c = Image.open(W + 'cast-warp.png')
g = json.load(open(W + 'cast-gates.json'))
l, t, r, b = alpha_box(c)
s = {'width': c.width, 'height': c.height, 'baselineY': b, 'pose': 'cast', 'composition': 'full', 'nonBiped': True, 'facing': 'left', 'facingNote': FACING,
     'reads': 'Every Omnis action plays the cast pose (his four spells a turn, Dispel, Ultima: research 4.1, 4.4): both clawed arms lift 20 degrees about the shoulders. The lift is our derived pose; the sources say what he casts, not how he moves.',
     'derivedFrom': 'characters/seymour-omnis/idle.png', 'method': 'r3 idle-pixel transplant as one smooth warp field (no cut lines, so no seam repaint): rotation full on the arms and hands, fading to zero down the hanging strips (idle y 225 to 480 left, 185 to 430 right) and before the hair, face and chest; bicubic at 2x, down once; where the field is zero the idle pixels are copied exactly',
     'framing': {'idleOffsetInCast': [50, 90], 'note': 'same pixel scale as the idle (sidecar scale 1.0); the canvas grows 50 px each side and 90 px on top for the raised claws; the hem baseline is the idle baseline + 90'},
     'gates': {**g, 'faceNote': 'face and chest (idle x 330-470) unchanged but for 0.2 % at the zero-field border; the hair edge at idle x 300-330 moves under 1 px', 'gpuSeconds': 0},
     'hurt': 'no file: the engine\'s hurt -> idle fallback with its flinch, flash and shake (METHOD-CHECK state map)', 'ko': 'no file: his end is the sending (story), not a painted fall',
     'pickedFrom': 'the paintings rule of Chapters VI to XI (idle plus one hero cast per enemy that acts), under ' + PICK,
     'offCanon': 'the arm lift is ours; see idle.json offCanon', 'script': SCR + 'cast_warp.py 20'}
place(c, 'characters/seymour-omnis/cast.png', s)

# 3. Mortiphasm disc
d = Image.open(W + 'mortiphasm.png')
rd = rec('disc-a')
s = {'width': d.width, 'height': d.height, 'baselineY': d.height - 1 - 16, 'seed': 912301, 'model': 'animagine-xl-4.0-opt.safetensors', 'steps': 28, 'cfg': 6,
     'sampler': 'euler_ancestral', 'scheduler': 'normal', 'prompt': rd.get('prompt', 'see recipes.json O-2 disc texture disc-a'),
     'source': {'width': 1024, 'height': 1024}, 'cropBox': [181, 181, 849, 849], 'cropNote': 'raw 1024x1024 render coords: the centre circle r318 about (515,515) plus a 16 px margin',
     'pose': 'idle', 'composition': 'boss', 'nonBiped': True, 'facing': 'front',
     'facingNote': 'NEVER MIRROR: a mirror reverses the ring order. The disc faces the camera; which element faces Omnis is a rotation about the disc centre, not a flip.',
     'disc': {'centre': [333.5, 333.5], 'radiusPx': 318, 'ringOrder': 'OUR ESTIMATE (plan B8): clockwise on screen from the quarter centred at 0 deg (screen right): fire, water, ice, thunder; quarter k is centred on k x 90 deg clockwise',
              'quarterColours': 'sourced (research 4.1): orange Fire (240,118,30), purple Ice (160,100,235), blue Water (40,120,235), yellow Thunder (245,212,50)',
              'turn': 'a spell turns a disc 90 deg right, a physical hit 90 deg left (research 4.3); which screen direction "right" is on a disc is presentation, ours',
              'retint': 'a different ring order is a re-run of disc_build.py with the order argument (no GPU); see INSTALLED.md for what the look-only pass showed'},
     'layers': {'facing': 'characters/mortiphasm-facing/idle.png', 'note': 'drawn on top, NOT turning with the disc: it marks the quarter that faces Omnis (lit, gold rim arc) and dims the other three. Painted facing screen right (0 deg); rotate the layer 180 deg for a disc on his right. O-2 B also puts a disc strip on the HUD (T8, not art)'},
     'staging': {'picked': 'two discs each side of him, facing him (ours; O-2 frames)', 'discDiameterVsOmnisHeight': 0.395,
                 'slotsOnOptionsCanvas': 'canvas 2050x1560 with Omnis 0.86 of its height: disc centres at (0.15,0.30) and (0.21,0.66) facing right, (0.85,0.30) and (0.79,0.66) facing left'},
     'states': 'idle only: the discs take no turns (B22 a, estimate) and never die (immune to all damage, research 2)',
     'pickedFrom': 'O-2 B (painted discs; the HUD strip is T8), ' + PICK, 'concept': 'docs/concepts/chapters/omnis/o2-discs/b-frame.jpg', 'reference': REF,
     'method': 'r3 derive-from-concept: the options painted_disc() recipe on the picked render (seed 912301) at its own pixel scale (636 px across); repairs of PIL artefacts only: rim diamonds keep their own paint, anti-aliased circle edge and dividers, un-lit (the lit quarter is its own layer)',
     'offCanon': 'The look-only pass showed the game\'s discs as purple mandala wheels with four round coloured jewels at the quarter points, placed above, below and to each side of him; ours are bronze wheels with tinted quarters, two each side, as picked (O-2 B).',
     'candidateSource': OPT + 'disc-a.png', 'script': SCR + 'disc_build.py'}
place(d, 'characters/mortiphasm/idle.png', s)

f = Image.open(W + 'mortiphasm-facing.png')
s = {'width': f.width, 'height': f.height, 'baselineY': f.height - 1 - 16, 'pose': 'idle', 'composition': 'boss', 'nonBiped': True, 'facing': 'front',
     'facingNote': 'painted facing screen right (0 deg); rotate, never mirror', 'layerOf': 'mortiphasm', 'pivot': [333.5, 333.5],
     'draws': 'the facing quarter (+-45 deg) under a 12 % white wash, the other three under a 40 % black dim (the options lit x1.35 / x0.6 as a normal-alpha layer), a gold rim arc (+-44 deg, r 0.90-0.99 of the disc) with a soft glow and a pale core',
     'pickedFrom': 'O-2 B (the quarter facing him lit with a gold rim, the others dimmed), ' + PICK,
     'method': 'drawn in numpy (no render), the options _facing_glow() look as its own layer so the disc can turn under it', 'script': SCR + 'disc_build.py'}
place(f, 'characters/mortiphasm-facing/idle.png', s)

# 4. The Garden of Pain backdrop (O-3 C violet), with the steps
bd = Image.open(W + 'garden-of-pain.png').convert('RGB')
rg = rec('garden-C')
st = json.load(open(W + 'steps.r1.json'))
s = {'seed': 912431, 'prompt': rg.get('prompt'), 'model': 'animagine-xl-4.0-opt.safetensors', 'steps': 30, 'cfg': 6, 'sampler': 'euler_ancestral', 'scheduler': 'normal',
     'canvas': {'width': 1344, 'height': 768}, 'upscaler': 'RealESRGAN_x4plus.pth', 'img2img': 'init-garden-c.png (sky and ledges from 912407, terrace floor from 912403)', 'denoise': 0.5,
     'width': bd.width, 'height': bd.height,
     'pickedFrom': 'O-3 C (deep violet), ' + PICK, 'concept': 'docs/concepts/chapters/omnis/o3-garden/c-plate.jpg',
     'method': 'r3-derive: the picked plate own pixels; one repair: the steps',
     'repairs': [{'what': 'a short broad flight of five stone steps rising from the terrace\'s far edge to a raised dais under Omnis: the one sourced Garden of Pain fact (research 7: steps up to a platform), which no options plate showed (README question 3 said a final would add them)',
                  'how': 'PIL blocks in the terrace\'s own sampled colours (steps_init.py), then a masked img2img inside a feathered box only (steps_merge.py): crop x1140-2164 y560-1136, Animagine XL 4.0 Opt, IP-Adapter plus on the plate crop at 0.3, denoise 0.5, seed 925301 (1 of 4)',
                  'changed': 'pixels x1341-1981 y774-998 only (3.2 % of the plate); MAD 0 elsewhere', 'gpuSeconds': round(st.get('execSeconds', 0), 1)}],
     'offCanon': 'Ours: the violet light, the floating ledges, the terrace paving, the dais. No staves in this plate (the look-only pass showed them as tall slender ornamented poles along the platform edges; the options drew none). The sea, walkways and waterfalls belong to the Sea of Sorrow, not the Garden, and are not claimed here.',
     'candidateSource': OPT + 'garden-C.png', 'script': SCR + 'steps_merge.py r1'}
place(bd, 'backdrops/garden-of-pain.png', s)

# 5. Speaker portrait (B17 = c, new; falls back to portraits/seymour-macalania)
p = Image.open(W + 'seymour-omnis-portrait.png')
pr = json.load(open(W + 'portrait.b3.json'))
s = {'width': 832, 'height': 1216, 'baselineY': 1216, 'seed': 925213, 'model': 'animagine-xl-4.0-opt.safetensors', 'steps': 30, 'cfg': 6, 'sampler': 'euler_ancestral', 'scheduler': 'normal',
     'pose': 'portrait', 'composition': 'portrait', 'facing': 'none', 'prompt': pr['words'], 'negative': pr['negative'],
     'ref': 'IP-Adapter plus (vit-h) 0.3, ease in 0-0.8, on the O-1 A idle head-and-shoulders crop (work/ref-head.png)',
     'cropBox': [0, 0, 832, 1216], 'source': {'width': 832, 'height': 1216},
     'pickedFrom': 'B17 = c (a new Omnis portrait drawn from the O-1 pick; fallback b, the approved Macalania portrait), ' + PICK,
     'rounds': 'round 1 (seeds 925201-925204, ref 0.4 on head crop + idle): neon, invented head horns and forehead marks; round 2 (925211-925214, ref 0.3 on the head crop): b3 picked (face, hair and cold smile read as O-1 A)',
     'cutout': {'matte': 'white ground: near-white connected to the border plus enclosed white pockets of 60 px or more above row 700 outside the face box; fringe peeled (383 px); rgb equals the raw render exactly inside the alpha; one component',
                'guard': 'hair and shoulders cut by the frame edge, as every approved portrait (coverage 100 % x 100 %)'},
     'faceCrop': {'pupils': [[270, 437], [439, 357]], 'fx': 0.4261, 'fy': 0.3265, 'ipd': 0.2247, 'note': 'read off a 2x gridded crop; for a src/ui/common/face-crops.json row when a speaker id uses it (not added: this track commits docs only)'},
     'offCanon': 'No options round was shown for the portrait itself (O-5 was to be drawn from the O-1 pick); the shoulders carry red and orange trim and cone spikes that the idle does not have, and there is no red eye on the shoulder; a white highlight on the forehead may bloom under the dialogue grade',
     'candidateSource': W + 'portrait.b3.png', 'script': SCR + 'portrait_matte.py'}
place(p, 'portraits/seymour-omnis.png', s)
