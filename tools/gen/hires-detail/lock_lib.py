"""lock_lib.py: shared definitions of the painterly identity-lock round (r39-art lane, 2026-10-05; candidates only, nothing installed, no approved painting touched).

The round keeps the S2 finish (FLUX.2 Klein 9B repaint) and holds it to the approved painting. Methods:
  mr  multi-reference only (the painting plus close-ups of the face and the costume), a pure generation: shows what references alone do
  L1  (a) multi-reference + an init lock: the painting's own latent noised only to sigma s0 and denoised from there, so the silhouette, the pose and the costume parts are held
  L2  (a)+(b) L1 plus a face pass: the head repainted from the approved head close-up at a low sigma and blended back
  L3  (a)+(b)+(d) L2 plus a per-region palette lock to the approved painting's colours
(c) a lineart or canny ControlNet is NOT installed (models/controlnet holds only xinsir-controlnet-openpose-sdxl-1.0, an SDXL pose net), so it was not run; nothing was downloaded.
"""
import os
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from r39lib import *       # gpu_run, upload, png_bytes, say, Image, np, os, time, json, cc ...
from klein import g_klein_edit
from cc import load_rgba
import style_gpu as SG      # HINT, PROMPT_S2, up4
import r39lib as _r39


def gpu_run_retry(graph, out_nodes, tag='job', timeout=1800, tries=4, wait=60):
    """gpu_run with a retry: the card and the host RAM are shared with other lanes' jobs, and a sampler can die with a driver fault ("Fault failed: 2") when theirs and ours collide.
    Only a failed execution is retried (never a PAUSE-GPU wait, never another lane's job), after a pause."""
    for k in range(tries):
        try:
            return _r39.gpu_run(graph, out_nodes, tag=tag, timeout=timeout)
        except RuntimeError as e:
            if 'execution error' not in str(e) or k == tries - 1:
                raise
            say(f'{tag}: {str(e)[:160]} ... retry {k + 1} after {wait} s')
            time.sleep(wait)


gpu_run = gpu_run_retry
SG.gpu_run = gpu_run_retry      # style_gpu.up4 (the ESRGAN step) goes through the same retry

ART39 = 'D:/pyrefly-r39-art/public/art'
PWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/pilot-work'
LWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/lock-work'
DETAIL = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-detail'
STYLE = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04-style'
OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-05-painterly-lock'
ITEMS = ['tidus/idle', 'seymour-flux-body/idle', 'yuna-gunner/idle']
SEEDS = (9101, 9102)

# Boxes in the approved 1x painting's pixels (read off a 50 px grid laid over each painting): the head (the face repaint and the face-likeness window) and the costume close-ups used as references.
BOX = {
    'tidus/idle': {'head': (295, 30, 495, 235), 'costume': [(250, 100, 700, 450), (220, 440, 600, 800)]},
    'seymour-flux-body/idle': {'head': (270, 150, 470, 370), 'costume': [(20, 440, 560, 860)]},
    'yuna-gunner/idle': {'head': (145, 10, 350, 230), 'costume': [(40, 280, 420, 480), (10, 450, 450, 800)]},
}
EXTRA_HINT = {
    'tidus': ' The long straight blade points exactly where it points in image 1; its hilt is red and blue with one blue jewel; there is no chain anywhere on the belts.',
    'yuna-gunner': ' Both pistols hang pointing down exactly as in image 1; the skirt is a short blue pleated skirt.',
    'seymour-flux-body': ' The three-tailed hair, the red face markings and the red-trimmed sleeves are exactly as in image 1.',
}
PROMPT_LOCK = ('Image 1 is the full figure to repaint. {refdesc} Repaint image 1 as a rich digital painting: visible brushwork, soft painted gradients, richer saturated colour, thin light outlines '
               'instead of heavy ink lines, painterly rendering like a painted fantasy game backdrop. Keep exactly the same character, the same face, eyes, brows, nose and mouth, the same expression, '
               'the same pose, silhouette, camera angle, costume pieces, belts, straps and colours as in the references; add nothing that is not in the references. Plain white background. {hint}')
FACE_HINT = {   # face colours only: the whole-figure hints name costume parts and props, and a head close-up then grows them (a yellow hood, a hand, pistols)
    'tidus': 'The hair is golden blond with a black underside, the eyes are blue, the skin is light peach-orange and the hood at the neck is white.',
    'yuna-gunner': 'The skin is light, the hair is dark chocolate brown, the eye on the left of the picture is a vivid emerald green and the eye on the right of the picture is a vivid sapphire blue, and there is a pink scarf at the neck.',
    'seymour-flux-body': 'The skin is pale pink, the hair is pale blue-lavender, the eye glows violet, the face markings are red and the expression is the same faint smile.',
}
PROMPT_FACE = ('Repaint this close-up of a face and hair as a rich digital painting: visible brushwork, soft painted gradients, richer saturated colour, thin light outlines instead of heavy ink lines. '
               'Keep exactly the same face, the same eyes, brows, nose, mouth and expression, the same hair shape and colours, the same angle. Plain white background. {hint}')


def tag_dir(item):
    d = f'{LWORK}/{item.replace("/", "-")}'
    os.makedirs(d, exist_ok=True)
    return d


def logj(item, key, val):
    p = f'{tag_dir(item)}/gpu.json'
    d = json.load(open(p)) if os.path.exists(p) else {}
    d[key] = val
    json.dump(d, open(p, 'w'), indent=1)


def r16(n):
    return max(16, int(round(n / 16.0)) * 16)


def today4(item):
    """The approved painting's 4x library master with E (the 'Today' column), RGBA."""
    return Image.open(f'{DETAIL}/masters/{item.replace("/", "-")}/r39+E@4x.png').convert('RGBA')


def flat_white(im):
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def crop_ref(item, box1x, long_side=1024):
    """A close-up of the approved painting (from its 4x master, flattened on white), the long side at `long_side` (multiple of 16)."""
    im = flat_white(today4(item))
    x0, y0, x1, y1 = [int(v * 4) for v in box1x]
    c = im.crop((x0, y0, x1, y1))
    k = long_side / max(c.size)
    return c.resize((r16(c.width * k), r16(c.height * k)), Image.LANCZOS)


def g_klein_lock(ref_name, refs, prompt, W, H, seed, sigmas, kv=False):
    """g_klein_edit with the init lock: the sampler starts from the first reference's own latent noised to sigmas[0] (not from an empty latent) and follows `sigmas` (a comma string)."""
    g = g_klein_edit(ref_name, prompt, W, H, seed, refs=refs, kv=kv)
    g['12'] = {'class_type': 'ManualSigmas', 'inputs': {'sigmas': sigmas}}
    g['16']['inputs']['latent_image'] = ['50', 0]       # '50' = VAEEncode of the first reference (the painting)
    return g


def refdesc(item):
    n = 2 + len(BOX[item]['costume'])
    parts = ['Image 2 is a close-up of the face and hair: keep exactly this face.']
    for i in range(len(BOX[item]['costume'])):
        parts.append(f'Image {3 + i} is a close-up of costume details: keep exactly these parts, with no chain, pocket or accessory added.')
    return ' '.join(parts)


def run_whole(item, seed, tag, sigmas=None, refs=True, style_ref=None):
    """One whole-figure Klein pass at 2x. sigmas None = the pure generation (the S2 recipe) with the references; else the init-locked run."""
    sid, state = item.split('/')
    d = tag_dir(item)
    out = f'{d}/{tag}-s{seed}-2x.png'
    if os.path.exists(out):
        return out
    ref = Image.open(f'{PWORK}/{item.replace("/", "-")}/klein-ref.png').convert('RGB')
    rgba = load_rgba(f'{ART39}/characters/{sid}/{state}.png')
    w, h = rgba.size
    pid = os.getpid()
    n0 = upload(png_bytes(ref), f'lock-ref-{pid}.png')
    extra = []
    if refs:
        extra.append(upload(png_bytes(crop_ref(item, BOX[item]['head'])), f'lock-face-{pid}.png'))
        for k, b in enumerate(BOX[item]['costume']):
            extra.append(upload(png_bytes(crop_ref(item, b)), f'lock-cos{k}-{pid}.png'))
    rd = refdesc(item) if refs else ''
    if style_ref:       # the painterly finish of last round's S2 as one more reference: finish only, no content
        im = Image.open(style_ref).convert('RGB')
        k = 1024 / max(im.size)
        im = im.resize((r16(im.width * k), r16(im.height * k)), Image.LANCZOS)
        extra.append(upload(png_bytes(im), f'lock-style-{pid}.png'))
        rd += f' Image {len(extra) + 1} shows the painterly finish to reproduce (brush texture, soft gradients, richer colour, light outlines): take only the finish from it and none of its content, shapes, parts or colours.'
    prompt = PROMPT_LOCK.format(refdesc=rd, hint=SG.HINT[sid] + EXTRA_HINT[sid])
    if sigmas is None:
        g = g_klein_edit(n0, prompt, ref.width, ref.height, seed, refs=extra, kv=False)   # no KV cache: with four references it needs more VRAM than the card has (the first sweep job stalled for 30 minutes)
    else:
        g = g_klein_lock(n0, extra, prompt, ref.width, ref.height, seed, sigmas)
    t0 = time.time()
    ims, gs = gpu_run(g, ['99'], tag=f'{item}/{tag}{seed}', timeout=3000)
    ims[0].crop((0, 0, w * 2, h * 2)).save(out)
    logj(item, f'{tag}-{seed}', {'gpu_s': gs, 'wall_s': round(time.time() - t0, 1), 'sigmas': sigmas, 'refs': len(extra)})
    say(f'{item} {tag} seed {seed}: {gs:.0f} s GPU')
    return out


def run_face(item, seed, tag, sigmas):
    """The face pass: the approved head close-up repainted from its own latent at a low sigma (one reference: the close-up itself). Saved at the close-up's own size."""
    sid = item.split('/')[0]
    d = tag_dir(item)
    out = f'{d}/{tag}-s{seed}.png'
    if os.path.exists(out):
        return out
    c = crop_ref(item, BOX[item]['head'], 1024)
    n0 = upload(png_bytes(c), f'lock-fc-{os.getpid()}.png')
    if sigmas is None:      # the close-up alone as the reference, a pure generation (the S2 recipe at the face's own scale)
        g = g_klein_edit(n0, PROMPT_FACE.format(hint=FACE_HINT[sid]), c.width, c.height, seed, kv=False)
    else:
        g = g_klein_lock(n0, [], PROMPT_FACE.format(hint=FACE_HINT[sid]), c.width, c.height, seed, sigmas)
    t0 = time.time()
    ims, gs = gpu_run(g, ['99'], tag=f'{item}/{tag}{seed}', timeout=3000)
    ims[0].crop((0, 0, c.width, c.height)).save(out)
    logj(item, f'{tag}-{seed}', {'gpu_s': gs, 'wall_s': round(time.time() - t0, 1), 'sigmas': sigmas, 'size': list(c.size)})
    say(f'{item} {tag} seed {seed}: {gs:.0f} s GPU')
    return out
