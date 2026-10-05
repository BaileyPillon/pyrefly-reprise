"""style_gpu.py: the GPU stages of the style pilot (concept art for an options round; candidates only, nothing installed, no approved painting touched).

Directions, each from the approved painting (its ESRGAN 2x flattened on white, made by pilot_gpu.py d2), two seeds each, all keeping the design, the pose, the costume parts and colours:
  S1 "Premium cel"       Animagine XL 4.0 Opt img2img on 1024 px tiles at 2x, denoise 0.45, finish prompts (two to three shading tones, crisp variable-weight linework,
                         specular highlights on hair and metal, cloth texture and seams, a rim light), the diffusion's output kept whole (no high-pass mixing)
  S2 "Painterly"         FLUX.2 Klein 9B reference edit: visible brushwork, soft painted gradients, richer colour, lighter outlines
  S3 "Semi-real painted" Z-Image Turbo img2img (denoise 0.62) from the same painting, or Klein with a semi-real prompt (`s3k`)
  python style_gpu.py s1|s2|s3z|s3k <subject/state> ...
Outputs per subject in F:/pyrefly-parked/2026-10-04/r39-art/style-work/<subject>-<state>/: <dir>-s<seed>-2x.png (the model's output), <dir>-s<seed>-4x.png (ESRGAN to 4x), gpu.json.
"""
import json
import shutil
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from r39lib import *
import hires_lib as H
from cc import g_upscale_to, DETAIL_NEG, STYLE_TAGS, load_rgba
from klein import g_klein_edit

ART39 = 'D:/pyrefly-r39-art/public/art'
PWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/pilot-work'
SWORK = 'F:/pyrefly-parked/2026-10-04/r39-art/style-work'
H.ART = ART39
H.WORK = SWORK + '/_h'   # the library's work dirs on F: too (a hard link does not cross drives)
cc.ART = ART39
_orig_run = cc.run_graph


def _gated(graph, out_nodes, tag='job', timeout=900):
    gpu_gate()
    return _orig_run(graph, out_nodes, tag=tag, timeout=timeout)


H.run_graph = _gated
S1_SEEDS = (424242, 20261004)
K_SEEDS = (9101, 9102)
Z_SEEDS = (9201, 9202)

HINT = {
    'tidus': 'Keep the hair golden blond with a black underside and the eyes blue. Keep the skin the same light peach-orange as in the reference, not darker. Keep the yellow and black hooded top, the blue shoulder armour, the black shorts and the blue and white broadsword.',
    'yuna-gunner': 'Keep the skin light and the hair dark chocolate brown. The eyes are two different colours: the eye on the left of the picture is a vivid emerald green and the eye on the right of the picture is a vivid sapphire blue. Keep the white halter top, the pink scarf, the orange sash with a red flower, the yellow bow armbands, the short blue pleated skirt with long pink and white panels, the navy gloves and the navy lace-up knee boots, and a pistol in each hand.',
    'seymour-flux-body': 'Keep the skin pale pink, the hair pale blue-lavender with red tips, the eye glowing violet, the face markings red, the long blue robe with red trim and the green sash. Same crouching pose with one hand on the knee.',
}
SUBJECT_WORDS = {   # for the text-to-image-style prompt of Z-Image
    'tidus': 'a young man with spiky golden blond hair and blue eyes, a yellow and black sleeveless hooded top with a white hood, blue shoulder armour, black shorts with a brown belt, holding a huge ornate blue and white broadsword, standing three-quarter view facing right',
    'yuna-gunner': 'a young woman with short brown hair, one green eye and one blue eye, a white halter top, a pink scarf, an orange obi sash with a red flower, yellow bow armbands, a short blue pleated skirt with long pink and white side panels, navy fingerless gloves, navy lace-up knee boots, holding an ornate pistol in each hand, standing',
    'seymour-flux-body': 'a tall pale man with long pale lavender-blue hair with red tips, glowing violet eyes, red face markings, a long dark blue robe with red trim and a green sash, crouching with one hand on his knee, looking at the viewer with a faint smile',
}
S1_TAGS = ('(masterpiece, best quality:1.2), official art, splash art, key visual, cel shading, (three tone cel shading:1.2), (crisp variable weight lineart:1.25), (sharp specular highlights on hair and metal:1.3), '
           'detailed cloth texture, visible seams and stitching, (rim light:1.3), vibrant colors, high contrast, clean render, intricate details')
PROMPT_S2 = ('Repaint the reference illustration as a rich digital painting: visible brushwork, soft painted gradients, richer saturated colour, thin light outlines instead of heavy ink lines, painterly rendering '
             'like a painted fantasy game backdrop. Keep exactly the same character, face, expression, pose, camera angle, costume pieces and colours. Plain white background. {hint}')
PROMPT_S3K = ('Repaint the reference illustration as high-end semi-realistic painted key art in the style of a 3D-era game render: realistic proportions, believable skin, hair, cloth, leather and metal materials, '
              'soft cinematic lighting with a rim light; still a painting, not a photograph. Keep exactly the same character, face, expression, pose, camera angle, costume pieces and colours. Plain white background. {hint}')
PROMPT_S3Z = ('{words}, semi-realistic digital painting, high-end 3D-era game key art, realistic proportions, realistic skin, hair, cloth, leather and metal materials, soft cinematic lighting, '
              'painterly rendering, not a photograph, plain white background')


def wdir(item):
    d = f'{SWORK}/{item.replace("/", "-")}'
    os.makedirs(d, exist_ok=True)
    return d


def logj(item, key, val):
    p = f'{wdir(item)}/gpu.json'
    d = json.load(open(p)) if os.path.exists(p) else {}
    d[key] = val
    json.dump(d, open(p, 'w'), indent=1)


def sid_of(item):
    return item.split('/')[0]


def up4(item, src_png, dst, rgba_size):
    """ESRGAN on the 2x output, Lanczos to exactly 4x the painting."""
    w, h = rgba_size
    im = Image.open(src_png).convert('RGB')
    nm = upload(png_bytes(im), f'r39-up4-{os.getpid()}.png')
    ims, g = gpu_run(g_upscale_to(nm, w * 4, h * 4), ['9'], tag=f'{item}/up4')
    ims[0].save(dst, compress_level=1)
    return g


def fit16(im, max_mp=1.6):
    w, h = im.size
    k = min(1.0, (max_mp * 1e6 / (w * h)) ** 0.5)
    W, Hh = max(16, int(w * k) // 16 * 16), max(16, int(h * k) // 16 * 16)
    return im.resize((W, Hh), Image.LANCZOS)


def g_zimage(init, pos, seed, denoise, steps=8):
    return {'1': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'z_image_turbo_bf16_v2.safetensors', 'weight_dtype': 'default'}},
            '2': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen_3_4b.safetensors', 'type': 'lumina2', 'device': 'default'}},
            '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
            '4': {'class_type': 'ModelSamplingAuraFlow', 'inputs': {'model': ['1', 0], 'shift': 3.0}},
            '6': {'class_type': 'CLIPTextEncode', 'inputs': {'text': pos, 'clip': ['2', 0]}},
            '8': {'class_type': 'ConditioningZeroOut', 'inputs': {'conditioning': ['6', 0]}},
            '40': {'class_type': 'LoadImage', 'inputs': {'image': init, 'upload': 'image'}},
            '41': {'class_type': 'VAEEncode', 'inputs': {'pixels': ['40', 0], 'vae': ['3', 0]}},
            '9': {'class_type': 'KSampler', 'inputs': {'seed': seed, 'steps': steps, 'cfg': 1.0, 'sampler_name': 'res_multistep', 'scheduler': 'simple', 'denoise': denoise,
                                                       'model': ['4', 0], 'positive': ['6', 0], 'negative': ['8', 0], 'latent_image': ['41', 0]}},
            '10': {'class_type': 'VAEDecode', 'inputs': {'samples': ['9', 0], 'vae': ['3', 0]}},
            '99': {'class_type': 'PreviewImage', 'inputs': {'images': ['10', 0]}}}


def s1(item):
    sid, state = item.split('/')
    d = wdir(item)
    rgba = load_rgba(f'{ART39}/characters/{sid}/{state}.png')
    w, h = rgba.size
    plain2 = f'{PWORK}/{item.replace("/", "-")}/plain2.png'
    for seed in S1_SEEDS:
        out = f'{d}/s1-s{seed}-2x.png'
        if not os.path.exists(out):
            t0 = time.time()
            job = {'id': f'style/{item.replace("/", "-")}/s1s{seed}', 'src': f'characters/{sid}/{state}.png', 'kind': 'figure', 'scale': 2, 'subject': sid, 'cls': 'boss', 'prio': 'P1', 'state': state,
                   'size': [w, h]}
            wd = H.wdir(job, 'refined')
            os.makedirs(wd, exist_ok=True)
            if not os.path.exists(f'{wd}/plain.png'):
                shutil.copy(plain2, f'{wd}/plain.png')
            R = dict(H.RECIPE)
            R.update({'denoise': 0.45, 'seed': seed, 'steps': 14, 'cfg': 6.0})
            o_r, o_t, o_s = H.RECIPE, H.DETAIL_TAGS, H.STYLE_TAGS
            H.RECIPE, H.DETAIL_TAGS, H.STYLE_TAGS = R, S1_TAGS, 'official art'
            try:
                g = H.gpu_refine(job)
            finally:
                H.RECIPE, H.DETAIL_TAGS, H.STYLE_TAGS = o_r, o_t, o_s
            plain_full = np.asarray(Image.open(f'{wd}/plain.png').convert('RGB'))
            ref = H.assemble_refined(plain_full, wd, 0, 1.0)[:h * 2, :w * 2]   # hf_sigma 0: the diffusion's tiles whole
            Image.fromarray(ref, 'RGB').save(out, compress_level=1)
            logj(item, f's1-{seed}', {'gpu_s': g, 'wall_s': round(time.time() - t0, 1)})
            say(f'{item} S1 seed {seed}: {g:.0f} s GPU')
            try:
                dst = f'{SWORK}/_tiles/{item.replace("/", "-")}-s1s{seed}'
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.move(wd, dst)
            except Exception as e:
                say(f'tiles not moved: {e}')
        if not os.path.exists(f'{d}/s1-s{seed}-4x.png'):
            g2 = up4(item, out, f'{d}/s1-s{seed}-4x.png', (w, h))
            logj(item, f's1-{seed}-up4', {'gpu_s': g2})


def klein_dir(item, tag, prompt_t, seeds):
    sid, state = item.split('/')
    d = wdir(item)
    rgba = load_rgba(f'{ART39}/characters/{sid}/{state}.png')
    w, h = rgba.size
    refp = f'{PWORK}/{item.replace("/", "-")}/klein-ref.png'
    ref = Image.open(refp).convert('RGB')
    cw, ch = w * 2, h * 2
    prompt = prompt_t.format(hint=HINT[sid])
    for seed in seeds:
        out = f'{d}/{tag}-s{seed}-2x.png'
        if not os.path.exists(out):
            t0 = time.time()
            nm = upload(png_bytes(ref), f'r39-sk-{os.getpid()}.png')
            ims, g = gpu_run(g_klein_edit(nm, prompt, ref.width, ref.height, seed=seed), ['99'], tag=f'{item}/{tag}{seed}', timeout=3000)
            ims[0].crop((0, 0, cw, ch)).save(out)
            logj(item, f'{tag}-{seed}', {'gpu_s': g, 'wall_s': round(time.time() - t0, 1), 'prompt': prompt})
            say(f'{item} {tag} seed {seed}: Klein {g:.0f} s GPU, {time.time() - t0:.0f} s wall')
        if not os.path.exists(f'{d}/{tag}-s{seed}-4x.png'):
            g2 = up4(item, out, f'{d}/{tag}-s{seed}-4x.png', (w, h))
            logj(item, f'{tag}-{seed}-up4', {'gpu_s': g2})


def s3z(item):
    sid, state = item.split('/')
    d = wdir(item)
    rgba = load_rgba(f'{ART39}/characters/{sid}/{state}.png')
    w, h = rgba.size
    ref = Image.open(f'{PWORK}/{item.replace("/", "-")}/klein-ref.png').convert('RGB').crop((0, 0, w * 2, h * 2))
    small = fit16(ref)
    pos = PROMPT_S3Z.format(words=SUBJECT_WORDS[sid])
    for seed in Z_SEEDS:
        out = f'{d}/s3z-s{seed}-2x.png'
        if not os.path.exists(out):
            t0 = time.time()
            nm = upload(png_bytes(small), f'r39-sz-{os.getpid()}.png')
            ims, g = gpu_run(g_zimage(nm, pos, seed, 0.62), ['99'], tag=f'{item}/z{seed}', timeout=3000)
            ims[0].resize((w * 2, h * 2), Image.LANCZOS).save(out)
            logj(item, f's3z-{seed}', {'gpu_s': g, 'wall_s': round(time.time() - t0, 1), 'prompt': pos, 'init': list(small.size)})
            say(f'{item} S3 z-image seed {seed}: {g:.0f} s GPU, {time.time() - t0:.0f} s wall')
        if not os.path.exists(f'{d}/s3z-s{seed}-4x.png'):
            g2 = up4(item, out, f'{d}/s3z-s{seed}-4x.png', (w, h))
            logj(item, f's3z-{seed}-up4', {'gpu_s': g2})


if __name__ == '__main__':
    mode = sys.argv[1]
    for it in sys.argv[2:]:
        if mode == 's1':
            s1(it)
        elif mode == 's2':
            klein_dir(it, 's2', PROMPT_S2, K_SEEDS)
        elif mode == 's3k':
            klein_dir(it, 's3k', PROMPT_S3K, K_SEEDS)
        elif mode == 's3z':
            s3z(it)
