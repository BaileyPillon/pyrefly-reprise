"""pilot_gpu.py: the GPU stages of the figure-detail pilot (candidates only; nothing is installed, no approved painting is touched).

  python pilot_gpu.py d1 <subject/state> [<subject/state> ...]     ESRGAN plain, then the four D1 variants (denoise 0.45 and 0.55, two seeds each):
                                                                   SDXL (Animagine XL 4.0 Opt) img2img on 1024 px tiles of the ESRGAN image (the library recipe at a higher
                                                                   denoise: no tile ControlNet is installed), then a face / hands detail pass at native 4x scale
  python pilot_gpu.py d2 <subject/state> [<subject/state> ...]     D2 repaint: FLUX.2 Klein 9B reference edit at 2x (two seeds), brought to 4x by ESRGAN
Outputs (work dir F:/pyrefly-parked/2026-10-04/r39-art/pilot-work/<subject>-<state>/): plain.png, d1-<tag>-ref.png (tiles assembled), d1-<tag>-fh.png (plus face/hands),
d2-<seed>-rgb.png (4x RGB), gpu.json (GPU seconds per stage). The CPU half (alpha, rim, QC, edge treatment, sheets) is pilot_cpu.py.
"""
import json
import shutil
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from r39lib import *
import hires_lib as H
from cc import plan_tiles, clean_source, alpha_up, load_rgba, g_img2img, g_upscale_to, DETAIL_NEG
from scipy.ndimage import gaussian_filter

ART39 = 'D:/pyrefly-r39-art/public/art'
PWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/pilot-work'
H.ART = ART39
H.WORK = PWORK
cc.ART = ART39
_orig_run = cc.run_graph


def _gated(graph, out_nodes, tag='job', timeout=900):
    gpu_gate()
    return _orig_run(graph, out_nodes, tag=tag, timeout=timeout)


H.run_graph = _gated   # hires_lib imported the name: every graph it runs honours PAUSE-GPU
S = 4
VARIANTS = [(0.45, 424242), (0.45, 20261004), (0.55, 424242), (0.55, 20261004)]
KLEIN_SEEDS = (8101, 8102)
D1_TAGS = 'detailed hair strands, cloth folds and seams, stitching, engraved metal edges, buckles, detailed eyes with highlights'
FH_TAGS = '(detailed face:1.15), detailed eyes with highlights, eyelashes, (detailed hands:1.15), detailed fingers'
FH_NEG = ', extra fingers, bad hands, deformed hands, extra eyes, bad eyes'

# 1x centres of the face and hands windows (the window is 256 x 256 px at 1x = 1024 at 4x), read off the approved paintings
FH = {
    'tidus/idle': {'face': [(405, 150)], 'hands': [(565, 150), (540, 300)]},
    'tidus/attack': {'face': [(340, 150)], 'hands': [(95, 105), (165, 170)]},
    'yuna-gunner/idle': {'face': [(235, 130)], 'hands': [(65, 545), (360, 560)]},
    'seymour-flux-body/idle': {'face': [(365, 235)], 'hands': [(130, 520)]},
}
KLEIN_HINTS = {
    'tidus': 'Keep the hair golden blond with a black underside and the eyes blue. Keep the skin the same light peach-orange as in the reference, not darker.',
    'yuna-gunner': 'Keep the skin light and the hair dark chocolate brown with near-black shadows. The eyes are two different colours: the eye on the left of the picture is a vivid sapphire blue and the eye on the right of the picture is a vivid emerald green.',
    'seymour-flux-body': 'Keep the skin pale pink, the hair pale blue-lavender with red tips, the eye glowing violet, the face markings red.',
}
PROMPT_CEL = ('Redraw the reference illustration at much higher resolution and fidelity. Keep exactly the same character, face, expression, pose, camera angle, costume, colours '
              'and the plain white background. Do not add or remove anything. {hint} Same cel-shaded anime style with clean ink outlines, but finer and crisper detail: '
              'individual hair strands, sharp eyes with highlights, stitched seams, leather, metal and cloth texture.')
PROMPT_PAINT = ('Redraw the reference illustration at much higher resolution and fidelity. Keep exactly the same character, shape, pose, camera angle, colours and the plain white background. '
                'Do not add or remove anything. {hint} Keep the exact same rendering style, painterly texture, lighting direction, colour palette, darkness, contrast and glow; do not brighten '
                'the picture, do not add ink outlines, do not turn it into a cartoon. Only add finer, crisper detail: skin, hair, cloth weave, armour plates, fine surface texture.')
PAINT = {'seymour-flux-body'}


def wdir(item):
    d = f'{PWORK}/{item.replace("/", "-")}'
    os.makedirs(d, exist_ok=True)
    return d


def jobfor(item, tag):
    sid, state = item.split('/')
    return {'id': f'pilot/{item.replace("/", "-")}/{tag}', 'src': f'characters/{sid}/{state}.png', 'kind': 'figure', 'scale': S, 'subject': sid, 'cls': 'boss', 'prio': 'P1',
            'state': state, 'size': list(Image.open(f'{ART39}/characters/{sid}/{state}.png').size)}


def logjson(item, key, val):
    p = f'{wdir(item)}/gpu.json'
    d = json.load(open(p)) if os.path.exists(p) else {}
    d[key] = val
    json.dump(d, open(p, 'w'), indent=1)


def plain_for(item):
    """The ESRGAN image of the cleaned source at 4x (the library's plain tier), once per painting."""
    d = wdir(item)
    if os.path.exists(f'{d}/plain.png'):
        return
    job = jobfor(item, 'plain')
    H.WORK = PWORK
    g = H.gpu_plain(job, 'base')   # writes <WORK>/<id>.E/plain.png
    src = f'{H.wdir(job, "base")}/plain.png'
    shutil.copy(src, f'{d}/plain.png')
    logjson(item, 'plain_gpu_s', g)


def run_tiles(item, denoise, seed, tag):
    """The library's gpu_refine on a pseudo job: tiles under <work>/<tag>.D/refined/, plain.png linked in."""
    job = jobfor(item, tag)
    wd = H.wdir(job, 'refined')
    os.makedirs(wd, exist_ok=True)
    if not os.path.exists(f'{wd}/plain.png'):
        os.link(f'{wdir(item)}/plain.png', f'{wd}/plain.png')
    R = dict(H.RECIPE)
    R['denoise'] = denoise
    R['seed'] = seed
    old_r, old_t = H.RECIPE, H.DETAIL_TAGS
    H.RECIPE = R
    H.DETAIL_TAGS = old_t + ', ' + D1_TAGS
    try:
        g = H.gpu_refine(job)
    finally:
        H.RECIPE, H.DETAIL_TAGS = old_r, old_t
    return job, wd, g


def assemble(item, job, wd, mix=0.8):
    rgba = load_rgba(f'{ART39}/{job["src"]}')
    w, h = rgba.size
    plain_full = np.asarray(Image.open(f'{wd}/plain.png').convert('RGB'))
    ref = H.assemble_refined(plain_full, wd, 1.5 * S, mix)[:h * S, :w * S]
    return ref


def smooth(n, r):
    t = np.linspace(0.02, 1, r, dtype=np.float32)
    return t * t * (3 - 2 * t)


def fh_pass(item, ref, seed, tag, denoise=0.38):
    """Face and hands at native 4x scale: 1024 px windows of the assembled image through img2img, the new detail laid on the window's own tones, feathered back."""
    sid = item.split('/')[0]
    words = H.subject_words(sid, 'figure')
    pos = f'{words}, {FH_TAGS}, {H.DETAIL_TAGS}, {D1_TAGS}, {H.STYLE_TAGS}, {H.QUALITY_TAGS}'
    neg = DETAIL_NEG + FH_NEG
    centres = FH[item]['face'] + FH[item]['hands']
    out = ref.astype(np.float32).copy()
    H_, W_ = ref.shape[:2]
    gsum = 0.0
    nm = f'r39-fh-{os.getpid()}.png'
    for (cx, cy) in centres:
        x0 = int(min(max(0, cx * S - 512), W_ - 1024))
        y0 = int(min(max(0, cy * S - 512), H_ - 1024))
        crop = ref[y0:y0 + 1024, x0:x0 + 1024]
        name = upload(png_bytes(Image.fromarray(crop, 'RGB')), nm)
        g = g_img2img(name, pos, neg, seed, denoise, steps=12, cfg=5.0, sampler='dpmpp_2m', scheduler='karras')
        ims, gpu = gpu_run(g, ['9'], tag=f'{item}/{tag}/fh{cx}-{cy}')
        gsum += gpu or 0
        r = np.asarray(ims[0].convert('RGB')).astype(np.float32)
        c = crop.astype(np.float32)
        sg = (6.0, 6.0, 0)
        lp = gaussian_filter(c, sg)
        new = lp + 0.85 * (r - gaussian_filter(r, sg)) + 0.15 * (c - lp)
        ramp = smooth(0, 160)
        wy = np.ones(1024, np.float32); wx = np.ones(1024, np.float32)
        wy[:160] = ramp; wy[-160:] = np.minimum(wy[-160:], ramp[::-1]); wx[:160] = ramp; wx[-160:] = np.minimum(wx[-160:], ramp[::-1])
        m = (wy[:, None] * wx[None, :])[..., None]
        out[y0:y0 + 1024, x0:x0 + 1024] = out[y0:y0 + 1024, x0:x0 + 1024] * (1 - m) + new * m
    return np.clip(out + 0.5, 0, 255).astype(np.uint8), gsum


def d1(item):
    plain_for(item)
    d = wdir(item)
    for denoise, seed in VARIANTS:
        tag = f'd{int(denoise * 100)}s{seed}'
        if os.path.exists(f'{d}/d1-{tag}-fh.png'):
            continue
        t0 = time.time()
        if os.path.exists(f'{d}/d1-{tag}-ref.png'):   # the tile pass is done (a restart redoes only the face / hands pass)
            ref = np.asarray(Image.open(f'{d}/d1-{tag}-ref.png').convert('RGB'))
            g, wd = 0.0, None
        else:
            job, wd, g = run_tiles(item, denoise, seed, tag)
            ref = assemble(item, job, wd)
            Image.fromarray(ref, 'RGB').save(f'{d}/d1-{tag}-ref.png', compress_level=1)
        ref2, gfh = fh_pass(item, ref, seed, tag)
        Image.fromarray(ref2, 'RGB').save(f'{d}/d1-{tag}-fh.png', compress_level=1)
        logjson(item, f'd1-{tag}', {'tiles_gpu_s': g, 'fh_gpu_s': gfh, 'wall_s': round(time.time() - t0, 1)})
        say(f'{item} D1 {tag}: tiles {g:.0f} s + face/hands {gfh:.0f} s GPU, {time.time() - t0:.0f} s wall')
        # park the tile folder (nothing is deleted)
        if wd is None:
            continue
        try:
            dst = f'{PWORK}/_tiles/{item.replace("/", "-")}-{tag}'
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.move(os.path.dirname(f'{wd}/refined'), dst)
        except Exception as e:
            say(f'could not move tiles: {e}')


def pad16(img):
    w, h = img.size
    W, Hh = (w + 15) // 16 * 16, (h + 15) // 16 * 16
    if (W, Hh) == (w, h):
        return img, (w, h)
    out = Image.new('RGB', (W, Hh), (255, 255, 255))
    out.paste(img, (0, 0))
    return out, (w, h)


def d2(item):
    from klein import g_klein_edit
    sid, state = item.split('/')
    d = wdir(item)
    rgba = load_rgba(f'{ART39}/characters/{sid}/{state}.png')
    w, h = rgba.size
    # the 2x reference: ESRGAN of the cleaned source, flattened on white with the approved alpha (as klein_fig.py)
    if not os.path.exists(f'{d}/plain2.png'):
        src = H.padded(clean_source(rgba), 2)
        nm = upload(png_bytes(src), f'r39-k2-{os.getpid()}.png')
        ims, g0 = gpu_run(g_upscale_to(nm, src.width * 2, src.height * 2), ['9'], tag=f'{item}/esrgan2')
        ims[0].crop((0, 0, w * 2, h * 2)).save(f'{d}/plain2.png')
        logjson(item, 'plain2_gpu_s', g0)
    plain2 = Image.open(f'{d}/plain2.png').convert('RGB')
    a2 = np.asarray(alpha_up(rgba.getchannel('A'), 2)).astype(np.float32)[..., None] / 255.0
    flat = Image.fromarray((np.asarray(plain2).astype(np.float32) * a2 + 255.0 * (1 - a2)).clip(0, 255).astype(np.uint8), 'RGB')
    ref, (cw, ch) = pad16(flat)
    ref.save(f'{d}/klein-ref.png')
    hint = KLEIN_HINTS.get(sid, '')
    prompt = (PROMPT_PAINT if sid in PAINT else PROMPT_CEL).format(hint=hint)
    for seed in KLEIN_SEEDS:
        out = f'{d}/d2-{seed}-rgb.png'
        if os.path.exists(out):
            continue
        t0 = time.time()
        nm = upload(png_bytes(ref), f'r39-kref-{os.getpid()}.png')
        ims, g1 = gpu_run(g_klein_edit(nm, prompt, ref.width, ref.height, seed=seed), ['99'], tag=f'{item}/klein{seed}', timeout=3000)
        k2 = ims[0].crop((0, 0, cw, ch))
        k2.save(f'{d}/d2-{seed}-klein2x.png')
        # bring it to 4x: ESRGAN on the Klein 2x image, Lanczos to exactly 4x the painting
        nm2 = upload(png_bytes(k2), f'r39-k4-{os.getpid()}.png')
        ims2, g2 = gpu_run(g_upscale_to(nm2, w * S, h * S), ['9'], tag=f'{item}/klein{seed}/up4')
        ims2[0].save(out, compress_level=1)
        logjson(item, f'd2-{seed}', {'klein_gpu_s': g1, 'up_gpu_s': g2, 'wall_s': round(time.time() - t0, 1), 'prompt': prompt})
        say(f'{item} D2 seed {seed}: Klein {g1:.0f} s + ESRGAN {g2:.0f} s GPU, {time.time() - t0:.0f} s wall')


if __name__ == '__main__':
    mode = sys.argv[1]
    for it in sys.argv[2:]:
        (d1 if mode == 'd1' else d2)(it)
