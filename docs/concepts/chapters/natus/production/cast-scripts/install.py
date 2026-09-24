"""Install the Natus hero cast as a CANDIDATE (FFX only): public/art/characters/seymour-natus/cast.png +
cast.json, a backup copy under D:/Tools/pyrefly-art-backup/candidates/2026-09-24-natus-cast/."""
import sys, os, json, hashlib, shutil, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nlib import *
g = json.load(open(f'{OUT}/cast.gates.json')); t = json.load(open(f'{OUT}/t1.json'))
dst = f'{REPO}/public/art/characters/seymour-natus'
bk = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-24-natus-cast'; os.makedirs(bk, exist_ok=True)
assert not os.path.exists(f'{dst}/cast.png') or '--force' in sys.argv, 'cast.png exists'
shutil.copyfile(f'{OUT}/cast.png', f'{dst}/cast.png'); shutil.copyfile(f'{OUT}/cast.png', f'{bk}/cast.png')
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
jl = json.load(open(f'{SCR}/jobs/L.r1.json')); jr = json.load(open(f'{SCR}/jobs/R2.r2.json'))
w, h = g['size']
side = {
  'width': w, 'height': h, 'baselineY': 1148, 'composition': 'full', 'nonBiped': False,
  'facing': 'front',
  'facingNote': "Judged on the pixels: the idle's near-frontal body and face, unchanged; 'front' is never mirrored (as idle.json).",
  'pose': 'cast', 'status': 'CANDIDATE', 'game': 'ffx',
  'reads': 'every Natus spell (Multi-ra, Flare, Break, Banish; research/ffx-seymour-natus-highbridge.md): both blade-wings flare open about the grip',
  'derivedFrom': 'public/art/characters/seymour-natus/idle.png', 'idleSha256': sha(IDLE),
  'method': ('r3 derive-from-idle (docs/plans/art-method-r3/METHOD-CHECK.md step 2): idle-pixel transplant, both blade-wings '
             f"(crescent, hilt, hand and tail) turned {t['deg']} deg outward about the grip, body, head, ring framing and both forearms "
             'the idle own pixels; then a masked seam repaint at each wrist only (Animagine XL 4.0 Opt img2img + IP-Adapter plus on the '
             'idle, denoise 0.4), the idle white matte pocket in the right hand Telea pre-filled and repainted, the white-ground fringe '
             "peeled on the new edges, painted pixels checked against the idle's palette"),
  'framing': f"same pixel scale and baseline as the idle; canvas widened sideways only (idle x0 sits at x {g['idleOffsetX']}); the ring layer is the idle's (idle.json layers)",
  'pieces': t['pieces'],
  'repaints': [dict(side='left wrist', seed=jl['seed'], denoise=jl['denoise'], words=jl['words'], model=jl['model']),
               dict(side='right wrist + pocket', seed=jr['seed'], denoise=jr['denoise'], words=jr['words'], model=jr['model'])],
  'gates': g['gates'],
  'scripts': 'docs/concepts/chapters/natus/production/cast-scripts/ (transplant.py, prep.py, repaint.mjs, merge.py, finish.py, install.py)',
  'sheet': 'docs/concepts/chapters/natus/production/cast.jpg',
  'decision': "Bailey 2026-09-24 ~19:20 EDT, 'I'll go with all your recommendations' (Natus gets one hero cast painting; precedent D-034/D-045)",
  'sha256': sha(f'{dst}/cast.png'), 'installedAt': datetime.datetime.utcnow().isoformat() + 'Z',
  'judgeNotes': 'self-judged at 1:1 and in a 1600x900 engine frame; not independently judged; not approved (never in approved-hashes.json)',
  'offCanon': 'the flare is our derived pose (the sources give what he casts, not how the model moves)',
}
json.dump(side, open(f'{dst}/cast.json', 'w'), indent=2); shutil.copyfile(f'{dst}/cast.json', f'{bk}/cast.json')
print('installed', side['sha256'], w, h)
