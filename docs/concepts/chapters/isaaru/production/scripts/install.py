# Install the Chapter XIV (Isaaru, FFX only) production candidates under NEW subject ids. Never replaces a file
# (asserts first), never touches an approved file; writes sidecars, backs every installed file up.
import json, shutil, os, hashlib, datetime
import numpy as np
from PIL import Image

ART = 'D:/Final Fantasy/public/art'
OPT = 'D:/Tools/pyrefly-scratch/isaaru-options/renders'
# Inputs: isaaru_idle.py -> isaaru-idle-r4.png, isaaru_portrait.py -> portrait-r2.png, isaaru_aeons.py -> aeons/.
# That scratch folder was later emptied by another agent; the installed files and their backups are the record.
WK = 'D:/Tools/pyrefly-scratch/ch1215/isaaru/work'
BK = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-isaaru'
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
PICK = "Bailey 2026-09-25 ~01:40 EDT, verbatim: \"I'll go with all your recommendations\""
GAME = 'FFX only'
CH = 'Chapter XIV (provisional) Isaaru, Via Purifico beneath Bevelle'
README = 'docs/concepts/chapters/isaaru/INSTALLED.md'
JUDGE = 'self-judged at 1:1 and in a real 1600x900 engine frame; not independently judged; not approved'
S = 'docs/concepts/chapters/isaaru/production/scripts/'


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def feet(p):
    a = np.asarray(Image.open(p).convert('RGBA').getchannel('A')) >= int(0.35 * 255)
    return int(np.nonzero(a.sum(1) >= 3)[0].max())


def rec(name):
    r = json.load(open(f'{OPT}/{name}.json'))
    keys = ('seed', 'prompt', 'negative', 'model', 'steps', 'cfg', 'sampler', 'scheduler', 'canvas', 'upscaler')
    return {k: r.get(k) for k in keys if r.get(k) is not None}


def put(dst, src, side):
    assert not os.path.exists(dst), f'refusing to replace {dst}'
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copyfile(src, dst)
    side = dict(side)
    side['sha256'] = sha(dst)
    side['installedAt'] = now
    side['readme'] = README
    j = dst[:-4] + '.json'
    assert not os.path.exists(j), j
    json.dump(side, open(j, 'w'), indent=2)
    rel = os.path.relpath(dst, ART).replace('\\', '/')
    os.makedirs(os.path.dirname(f'{BK}/{rel}'), exist_ok=True)
    shutil.copyfile(dst, f'{BK}/{rel}')
    shutil.copyfile(j, f'{BK}/{rel[:-4]}.json')
    print(rel, side.get('width'), side.get('height'), side.get('baselineY'), side['sha256'][:12])


# ---- Isaaru, billboard idle (O-1 A)
src = f'{WK}/isaaru-idle-r4.png'
im = Image.open(src)
put(f'{ART}/characters/isaaru/idle.png', src, {
    'width': im.width, 'height': im.height, 'baselineY': feet(src), 'pose': 'idle', 'composition': 'full', 'nonBiped': False,
    'facing': 'left', 'facingObserved': True, 'status': 'CANDIDATE', 'game': GAME, 'chapter': CH,
    'concept': 'O-1 A (calm, arms open), render isaaru-a3; docs/concepts/chapters/isaaru/isaaru/a-card.jpg; picked by ' + PICK,
    'method': ("r3 derive-from-concept (docs/plans/art-method-r3/METHOD-CHECK.md): the picked render's own pixels; "
               'pixel repairs only, 0 GPU (' + S + 'isaaru_idle.py)'),
    'repairs': [
        ('coat to the knee (wiki Isaaru "Appearance", revid 4026440: a black knee-length jacket edged in sea green): '
         'the sea-green front panels erased below a hem line at y 846 (+/-10 px slope); the robe in front keeps every pixel; '
         'a 2 px ink hem on the cut; on the right the robe edge is a fitted straight line with its own ink'),
        ('the wide white sash recoloured sea green and the navy cord knot with its hanging cords a deeper sea green '
         "(wiki: a wide sea-green belt tied in a bow); a*/b* taken from the painting's own sea-green lapel at each pixel's "
         'lightness; the knot keeps its drawn shape (an ornamental knot, not a bow)'),
        'the dark navy coat pulled toward black (Lab chroma x0.5, L x0.9)',
        ("the white robe's highlights compressed (L > 75 -> 75 + (L - 75) x 0.6) so the chapter's bloom does not blow "
         'it out (the options README asked for this)')],
    'knownDefects': [
        "the knot is the render's ornamental knot with tassels, recoloured, not a bow",
        "the white robe still reaches the ankles (a white robe under the jacket is sourced; its length is the render's)",
        'the topknot and side locks are our reading of the images; the wiki does not say his hair is tied up'],
    'acts': 'no (plan B8 = a: on the field, no turn, never targetable), so idle is his only painting; hurt/ko fall back to idle',
    'suggestedWorldHeight': "0.85 x Mortibody's stage height (the options frames; about a man beside Yuna) [estimate]",
    **rec('isaaru-a3'), 'cropBox': [15, 21, 759, 1209], 'source': {'width': 832, 'height': 1216},
    'judgeNotes': JUDGE})

# ---- Isaaru, speaker portrait (O-2 B)
src = f'{WK}/portrait-r2.png'
im = Image.open(src)
put(f'{ART}/portraits/isaaru.png', src, {
    'width': im.width, 'height': im.height, 'baselineY': im.height, 'pose': 'portrait', 'composition': 'portrait',
    'facing': 'none', 'status': 'CANDIDATE', 'game': GAME, 'chapter': CH,
    'concept': 'O-2 B (steady and sorrowful), render isaaru-pb2; docs/concepts/chapters/isaaru/portrait/b-dialogue.jpg; picked by ' + PICK,
    'method': "r3: the picked render's own pixels; recolours only, brought to the O-1 A pick, 0 GPU (" + S + 'isaaru_portrait.py)',
    'repairs': [
        "the yellow-green upper lapels and inner V recoloured sea green, a*/b* from the portrait's own sea-green lower lapels",
        "the green-tinted hair strands at both shoulders returned to his brown, from the portrait's own hair ramp",
        "the blue hair tie made gold like O-1 A's, from the portrait's own bronze medallion ramp",
        'the royal-navy coat pulled toward black as on the billboard (chroma x0.5, L x0.9)'],
    'knownDefects': [
        "painted from O-1 C's look (IP-Adapter ref isaaru-c2 at 0.4): the bronze lapel medallions and blue collar gem are not on the O-1 A billboard",
        "the matte is the options run's cut-out, kept with --keepBad (a bust fills the canvas, as every portrait does)"],
    **rec('isaaru-pb2'), 'cropBox': [0, 0, 832, 1216], 'source': {'width': 832, 'height': 1216},
    'ref': 'D:/Tools/pyrefly-scratch/isaaru-options/renders/isaaru-c2.png', 'refWeight': 0.4,
    'judgeNotes': JUDGE})

# ---- the chamber (O-3 A)
src = f'{OPT}/via-a.png'
im = Image.open(src)
put(f'{ART}/backdrops/via-purifico.png', src, {
    'width': im.width, 'height': im.height, 'status': 'CANDIDATE', 'game': GAME, 'chapter': CH,
    'concept': 'O-3 A red-lit stone, the hallway behind (render via-a); docs/concepts/chapters/isaaru/chamber/a-plate.jpg; picked by ' + PICK,
    'method': 'r3: the picked plate exactly as rendered (2688x1536, RealESRGAN x4 of the 1344x768 render); 0 pixels changed, 0 GPU',
    'sources': "research/ffx-isaaru-bevelle.md section 7: the maze's last chamber at the end of a red-lit hallway [verified: 4]",
    'knownDefects': [
        'no low parapet with small square red lamps (the real room has one; none of the three option plates drew it)',
        'a colonnade more than a square room (options README)'],
    **rec('via-a'), 'judgeNotes': JUDGE})

# ---- Grothia / Pterya / Spathi (O-4 C), idle + attack + overdrive each
PAD = 60
for aeon, name in (('ifrit', 'grothia'), ('valefor', 'pterya'), ('bahamut', 'spathi')):
    ob = json.load(open(f'{ART}/characters/{aeon}/idle.json'))['baselineY']
    for pose in ('idle', 'attack', 'overdrive'):
        o = json.load(open(f'{ART}/characters/{aeon}/{pose}.json'))
        src = f'{WK}/aeons/{name}-{pose}.png'
        im = Image.open(src)
        side = {
            'width': im.width, 'height': im.height, 'baselineY': o['baselineY'] + PAD, 'pose': pose,
            'facing': o.get('facing', 'left'), 'facingObserved': True, 'status': 'CANDIDATE', 'game': GAME, 'chapter': CH,
            'concept': ("O-4 C \"his side\": a sea-green edge and a darker grade in his coat's colour; "
                        'docs/concepts/chapters/isaaru/aeons/c-frame.jpg; picked by ' + PICK),
            'method': ('r3 derive: the ' + aeon + " painting's own pixels; grade (saturation x0.8, multiply (200,212,232), "
                       'contrast x1.08), inner sea-green rim, sea-green glow behind (alpha capped at 0.33, under the '
                       "engine's 0.35 alpha measure, so it never moves the feet or the content box), "
                       f'{PAD} px transparent pad; line work and shapes identical; 0 GPU (' + S + 'isaaru_aeons.py)'),
            'derivedFrom': f'public/art/characters/{aeon}/{pose}.png (D-089, read only; sha256 {sha(f"{ART}/characters/{aeon}/{pose}.png")})',
            'sourceSeed': o.get('seed'), 'sourcePrompt': o.get('prompt'),
            'canon': ("not canon: the sources give no visual difference between Isaaru's aeons and Yuna's "
                      '(research/ffx-isaaru-bevelle.md section 10.2); the mark is ours (plan B18 = c)'),
            'ko': "no painting: the engine's pyrefly dissolve (plan B19, O-4 follow-up 1)",
            'judgeNotes': JUDGE}
        if pose == 'idle':
            side['scale'] = round((ob + PAD) / ob, 4)
            side['scaleNote'] = f"the {PAD} px top pad raises baselineY; this factor restores the {aeon} painting's pixels per world unit"
        put(f'{ART}/characters/{name}/{pose}.png', src, side)
