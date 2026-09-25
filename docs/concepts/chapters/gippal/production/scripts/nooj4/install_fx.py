# Install the Nooj shade fur-shoulder fix over the two nooj-shade CANDIDATE files (never an approved file), or write the
# same files into a staging dir (argv[1] = target art root). The replaced files are kept under
# D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu3/nooj-shade/replaced/.
import sys, json, shutil, datetime, hashlib, os
from PIL import Image
LIVE = 'D:/Final Fantasy/public/art'
ROOT = sys.argv[1]; ART = f'{ROOT}/characters/nooj-shade'; os.makedirs(ART, exist_ok=True)
S = 'D:/Tools/pyrefly-scratch/gpu3/den-omnis'
KEEP = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu3/nooj-shade/replaced'
blob = open('D:/Final Fantasy/docs/target/approved-hashes.json').read()
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
FIX = ("fur-shoulder fix (docs/concepts/chapters/gippal/production/METHOD-nooj.md, last section; bible 1.23.4 'Over his right "
       "shoulder is a purple sleeve with fur at the top'): on the opaque idle the fur was cut off the LEFT (machina) shoulder and a "
       "metal shoulder cap blocked in; the RIGHT shoulder and upper arm (down to y 288) recoloured to the bible's purple ramp and a "
       "ragged grey fur crest blocked in along its top; then ONE masked repaint per shoulder with IP-Adapter FORCED on "
       "portraits/nooj.png (ip-adapter-plus SDXL 0.45, denoise 0.6; right seed 972101 of 972101-972103, left seed 972203 of "
       "972201-972203); the sleeve's lilac mapped back onto the purple ramp keeping the repaint's shading, the crest's alpha "
       "smoothed (blur 1.1 plus a soft ramp) and its edge colours pulled from its interior; then the same B treatment and crop")
for p in ('idle', 'cast'):
    live = f'{LIVE}/characters/nooj-shade/{p}.png'
    old = json.load(open(f'{LIVE}/characters/nooj-shade/{p}.json'))
    h = sha(live)
    assert h not in blob, f'{p} is approved: refusing'
    assert old['status'] == 'CANDIDATE'
    new = f'{S}/work/fin-fx-{p}.png'
    assert sha(new) not in blob
    if ROOT == LIVE:
        os.makedirs(KEEP, exist_ok=True)
        shutil.copyfile(live, f'{KEEP}/{p}.png'); shutil.copyfile(f'{LIVE}/characters/nooj-shade/{p}.json', f'{KEEP}/{p}.json')
    shutil.copyfile(new, f'{ART}/{p}.png')
    im = Image.open(f'{ART}/{p}.png')
    side = dict(old)
    assert (im.width, im.height) == (old['width'], old['height'])
    side['repairs'] = old['repairs'] + [FIX + (" (cast: the idle's changed pixels transplanted at the cast's paste offset 440,20 "
                                              "only where the cast still held the idle's unmoved pixels; 114 px at the rotated "
                                              "zone's edge left as they were)" if p == 'cast' else '')]
    kd = [k for k in old['knownDefects'] if not k.startswith('the fur is on the LEFT')]
    kd = ["the right sleeve stops above the elbow (the source says only 'over his right shoulder'; the length is ours) and "
          "its purple is a flat ramp with little fold detail",
          "the fur crest's edge is a little broken at 3x (grey flecks where the smoothed alpha meets the spikes)",
          "the machina arm and shoulder cap stay the render's blue metal; the bible's machina ramp is grey [estimate]"] + kd
    side['knownDefects'] = kd
    side['installedAt'] = now
    side['replacedSha256'] = h
    side['replacedKeptAt'] = KEEP + '/'
    json.dump(side, open(f'{ART}/{p}.json', 'w'), indent=2)
    print(p, im.size, sha(f'{ART}/{p}.png')[:12])
