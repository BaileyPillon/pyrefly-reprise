"""Ormi identity LoRA (FFX-2 only, Chapter 6 art): build the kohya dataset.

  python dataset.py crops    # native crops, flattened on white -> D:/Tools/pyrefly-lora/ormi/stage/crops
  (node tools/gen/lora-ormi.mjs upscale)   # RealESRGAN x4 through ComfyUI -> stage/up
  python dataset.py finish   # resize to ~1 MP, mirror, captions, manifest -> D:/Tools/pyrefly-lora/ormi/dataset

Sources are read only. The only on-model painting of Ormi is the installed idle
(see dataset.md for why the portrait, the pause plate, the concepts and every
round-3 frame are excluded), so the set is crops of the idle at several
framings, each also mirrored (the round-3 judge: Ormi has no one-sided feature
that mirroring would break). Captions carry view and pose only; the trigger
`ormiX2` carries the identity.
"""
import hashlib, json, os, sys
from PIL import Image, ImageOps

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..', '..'))
ROOT = 'D:/Tools/pyrefly-lora/ormi'
STAGE = f'{ROOT}/stage'
DATA = f'{ROOT}/dataset'
IDLE = 'public/art/characters/ormi/idle.png'

TAIL = 'white background, simple background'
# (id, box on the 489x1189 idle cutout or None = whole, target long side / canvas, caption body)
CROPS = [
    ('full', None, 'canvas832x1216', 'full body, from side, three-quarter view, standing, arms crossed, looking to the side'),
    ('full-small', None, 'canvas1024x1024', 'full body, from side, three-quarter view, standing, arms crossed, looking to the side, wide shot'),
    ('cowboy', (0, 0, 489, 800), 'mp', 'cowboy shot, from side, three-quarter view, standing, arms crossed, looking to the side'),
    ('upper', (0, 0, 489, 540), 'mp', 'upper body, from side, three-quarter view, arms crossed, looking to the side'),
    ('bust', (120, 0, 480, 360), 'mp', 'portrait, head and shoulders, from side, three-quarter view, arms crossed, looking to the side'),
    ('face', (170, 0, 430, 260), 'mp', 'close-up, face, from side, three-quarter view, looking to the side'),
    ('lower', (0, 480, 489, 1189), 'mp', 'lower body, from side, standing'),
]


def flat(path):
    im = Image.open(path).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    return bg.convert('RGB')


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def crops():
    os.makedirs(f'{STAGE}/crops', exist_ok=True)
    idle = flat(os.path.join(REPO, IDLE))
    for cid, box, _, _ in CROPS:
        (idle.crop(box) if box else idle).save(f'{STAGE}/crops/{cid}.png')
    print('crops ->', f'{STAGE}/crops', len(CROPS))


def to_mp(im, target=1024 * 1024):
    s = (target / (im.width * im.height)) ** 0.5
    w, h = round(im.width * s / 8) * 8, round(im.height * s / 8) * 8
    return im.resize((w, h), Image.LANCZOS)


def finish():
    os.makedirs(DATA, exist_ok=True)
    src = os.path.join(REPO, IDLE)
    items = []
    idle = flat(src)
    for cid, box, mode, cap in CROPS:
        if mode.startswith('canvas'):
            cw, ch = map(int, mode[6:].split('x'))
            fig = idle
            s = min((cw - 48) / fig.width, (ch - 24) / fig.height, 1.0)
            if mode == 'canvas1024x1024':
                s = min(s, 0.72)
            fig = fig.resize((round(fig.width * s), round(fig.height * s)), Image.LANCZOS)
            im = Image.new('RGB', (cw, ch), (255, 255, 255))
            im.paste(fig, ((cw - fig.width) // 2, ch - fig.height - 12))
            resize = f'lanczos x{s:.3f} on a white {cw}x{ch} canvas'
        else:
            up = Image.open(f'{STAGE}/up/{cid}.png').convert('RGB')
            im = to_mp(up)
            resize = f'RealESRGAN_x4plus (ComfyUI) then lanczos to {im.width}x{im.height}'
        for mirror in (False, True):
            face = 'left' if mirror else 'right'
            out = ImageOps.mirror(im) if mirror else im
            name = f'{cid}-{face}'
            out.save(f'{DATA}/{name}.png')
            caption = f'ormiX2, 1boy, solo, {cap}, body facing {face}, {TAIL}'
            open(f'{DATA}/{name}.txt', 'w', encoding='utf-8').write(caption)
            items.append({'id': name, 'source': IDLE, 'sha256': sha(src), 'box': list(box) if box else None,
                          'mirrored': mirror, 'size': list(out.size), 'resize': resize, 'caption': caption,
                          'file_sha256': sha(f'{DATA}/{name}.png')})
    json.dump({'trigger': 'ormiX2', 'repeats': {'.': 1}, 'items': items}, open(f'{DATA}/manifest.json', 'w'), indent=1)
    print('dataset ->', DATA, len(items))


if __name__ == '__main__':
    {'crops': crops, 'finish': finish}[sys.argv[1]]()
