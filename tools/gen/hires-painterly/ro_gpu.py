"""ro_gpu.py: the GPU stage of the painterly roll-out for one figure and one seed (the main process; one prompt in flight, PAUSE-GPU honoured, retried on a failed execution).

  klein-s<seed>.png  Klein 9B at the working size: the painting (2x on white) as the reference and as the init (noised only to sigma 0.99), plus the head and two costume close-ups, NO KV cache
  rgb-s<seed>.png    ESRGAN of it to exactly the master's size (4x, or 2x for a wide-only figure)
  face-s<seed>.png   the face pass: the approved head close-up repainted from its own latent at sigma 0.97 (only where the figure has a head box)
All under RW/<id>/ . Nothing here touches the art tree or the libraries.
"""
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from ro_common import *
from lock_lib import gpu_run, upload, png_bytes, say, g_klein_lock, os, Image, np, time, json
from cc import g_upscale_to

Image.MAX_IMAGE_PIXELS = None
PROMPT = ('Image 1 is the full figure to repaint. {refdesc} Repaint image 1 as a rich digital painting: visible brushwork, soft painted gradients, richer saturated colour, thin light outlines '
          'instead of heavy ink lines, painterly rendering like a painted fantasy game backdrop. Keep exactly the same character{face}, the same pose, silhouette, camera angle, parts, props, weapons, '
          'belts, straps, markings and colours as in the references; add nothing that is not in the references: no chain, no extra pocket, no new accessory. Plain white background.')
PROMPT_FACE = ('Repaint this close-up of a face and hair as a rich digital painting: visible brushwork, soft painted gradients, richer saturated colour, thin light outlines instead of heavy ink lines. '
               'Keep exactly the same face, the same eyes, brows, nose, mouth and expression, the same hair shape, the same angle, and the colours of the hair, eyes, skin and clothing exactly as in the close-up. '
               'Plain white background.')


def flat_white(im):
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def crop_ref(T, box1x, S, long_side=1024):
    """A close-up of today's master (flattened on white), the long side at long_side (a multiple of 16 each way)."""
    x0, y0, x1, y1 = [int(round(v * S)) for v in box1x]
    c = flat_white(T).crop((x0, y0, x1, y1))
    k = long_side / max(c.size)
    return c.resize((r16(c.width * k), r16(c.height * k)), Image.LANCZOS)


def alpha_bbox(P):
    a = np.asarray(P.getchannel('A'))
    ys, xs = np.nonzero(a > 128)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def up_to(src, dst, W, H, tag):
    """ESRGAN x4 then Lanczos to exactly W x H; a plain Lanczos where the gain is under 1.5x (a small figure that Klein already drew at the master's size)."""
    im = Image.open(src).convert('RGB')
    if W / im.width < 1.5:
        im.resize((W, H), Image.LANCZOS).save(dst, compress_level=1)
        return 0.0
    nm = upload(png_bytes(im), f'ro-up-{os.getpid()}.png')
    ims, g = gpu_run(g_upscale_to(nm, W, H), ['9'], tag=tag, timeout=3000)
    ims[0].save(dst, compress_level=1)
    return g


def gpu_stage(a, seed, head):
    from ro_cpu import today, approved1x
    wd = f'{RW}/{a["id"]}'
    os.makedirs(wd, exist_ok=True)
    gpath = f'{wd}/gpu.json'
    gj = load_json(gpath, {})
    S, w, h = a['S'], a['w'], a['h']
    tag = f'{a["id"]}#{seed}'
    f_klein, f_rgb, f_face = f'{wd}/klein-s{seed}.png', f'{wd}/rgb-s{seed}.png', f'{wd}/face-s{seed}.png'
    T = None
    if not os.path.exists(f_klein):
        T = today(a)
        ws = work_scale(w, h)
        cw, ch = int(round(w * ws)), int(round(h * ws))
        W, H = r16(cw), r16(ch)
        ref = Image.new('RGB', (W, H), (255, 255, 255))
        ref.paste(flat_white(T.resize((cw, ch), Image.LANCZOS)), (0, 0))
        pid = os.getpid()
        n0 = upload(png_bytes(ref), f'ro-ref-{pid}.png')
        extra, desc = [], []
        if head:
            extra.append(upload(png_bytes(crop_ref(T, head, S)), f'ro-head-{pid}.png'))
            desc.append(f'Image {len(extra) + 1} is a close-up of the face and hair: keep exactly this face.')
        P = approved1x(a)
        for k, b in enumerate(crop_boxes(a, alpha_bbox(P))):
            extra.append(upload(png_bytes(crop_ref(T, b, S)), f'ro-cos{k}-{pid}.png'))
            desc.append(f'Image {len(extra) + 1} is a close-up of details of the figure: keep exactly these parts, add no chain, pocket or accessory.')
        prompt = PROMPT.format(refdesc=' '.join(desc), face=', the same face, eyes, brows, nose and mouth, the same expression' if head else '')
        sig = sig_str(lock_sigmas(W, H, 0.99 if seed == SEEDS[0] else 0.975))     # the second seed holds the painting harder (0.975): for a figure whose first try drifted
        t0 = time.time()
        ims, gs = gpu_run(g_klein_lock(n0, extra, prompt, W, H, seed, sig), ['99'], tag=f'{tag}/klein', timeout=3000)
        out = ims[0].crop((0, 0, cw, ch))
        nonwhite = float((np.asarray(out).min(-1) < 235).mean())
        if nonwhite < 0.004:
            raise RuntimeError(f'{tag}: Klein returned an empty picture ({nonwhite:.4f})')
        out.save(f_klein, compress_level=1)
        gj[f'klein-{seed}'] = {'gpu_s': gs, 'wall_s': round(time.time() - t0, 1), 'size': [W, H], 'work_scale': round(ws, 3), 'refs': len(extra), 'sigmas': sig}
        save_json(gpath, gj)
        say(f'{a["id"]} seed {seed}: Klein {W}x{H} {gs:.0f} s GPU')
    if not os.path.exists(f_rgb):
        g2 = up_to(f_klein, f_rgb, w * S, h * S, f'{tag}/up')
        gj[f'up-{seed}'] = {'gpu_s': g2}
        save_json(gpath, gj)
    if head and not os.path.exists(f_face):
        T = T or today(a)
        c = crop_ref(T, head, S)
        n0 = upload(png_bytes(c), f'ro-fc-{os.getpid()}.png')
        sig = sig_str(lock_sigmas(c.width, c.height, 0.97))
        t0 = time.time()
        ims, gs = gpu_run(g_klein_lock(n0, [], PROMPT_FACE, c.width, c.height, seed, sig), ['99'], tag=f'{tag}/face', timeout=3000)
        ims[0].crop((0, 0, c.width, c.height)).save(f_face)
        gj[f'face-{seed}'] = {'gpu_s': gs, 'wall_s': round(time.time() - t0, 1), 'size': list(c.size), 'sigmas': sig}
        save_json(gpath, gj)
    return gj
