"""Ormi identity LoRA round 2 (`ormiX2`, FFX-2 only, Chapter 6 art): grow the dataset.

  python dataset-r2.py crops     # pose crops flattened on white -> D:/Tools/pyrefly-lora/ormi/r2/stage/crops
  node tools/gen/lora-ormi.mjs upscale --src D:/Tools/pyrefly-lora/ormi/r2/stage/crops --dst D:/Tools/pyrefly-lora/ormi/r2/stage/up
  python dataset-r2.py finish    # idle subset (round 1's 14 files, repeats 2) + pose subset (repeats 1),
                                 # captions, manifest.json and dataset.toml under D:/Tools/pyrefly-lora/ormi/r2/

Round 1's dataset (../dataset.md) was one painting, the idle, at seven framings each
mirrored. Round 2 adds every round-1 output a judge or the painter scored 6 or above,
minus anything with a wrong costume detail a judge named (dataset-r2.md):
  attack  installed redo (painter 6)            full body + upper body, each mirrored
  cast    cast.960106 (judge 7) with the collar heart clasp painted out (clasp975003)
                                                 full body + upper body, each mirrored
  hurt    installed redo (painter 6): its repainted shield face is pink-violet with no
          red band (redo.md), so only a cowboy crop right of the shield rim (x 292 on) is used, mirrored
Captions carry view and pose only; the trigger carries the costume.
"""
import hashlib, json, os, shutil, sys
from PIL import Image, ImageOps

R1 = 'D:/Tools/pyrefly-lora/ormi/dataset'
ROOT = 'D:/Tools/pyrefly-lora/ormi/r2'
STAGE = f'{ROOT}/stage'
DATA = f'{ROOT}/dataset'
POSES = 'D:/Tools/pyrefly-lora/ormi/poses'
TAIL = 'white background, simple background'

SOURCES = {
    'attack': (f'{POSES}/attack/attack.p3.960022.erase.back970023.hemfix.blend972035.brooch972045.eye.raw.png',
               'public/art/characters/ormi/attack.png (installed redo, painter 6)'),
    'cast': (f'{POSES}/cast/cast.960106.clasp975003.raw.png',
             'cast.960106 (judge 7) + collar clasp painted out (repaint.mjs clasp975003)'),
    'hurt': (f'{POSES}/hurt/hurt.p5.960242.heart971005.raw.png',
             'public/art/characters/ormi/hurt.png (installed redo, painter 6)'),
}
# (id, source, box on the 832x1216 raw frame (None = the cut-out whole), mode, caption body)
CROPS = [
    ('attack-full', 'attack', None, 'canvas',
     'full body, from side, three-quarter view, shield bash, lunging, leaning forward, one leg forward, holding shield, shield in front, clenched teeth, angry'),
    ('attack-upper', 'attack', (300, 190, 780, 650), 'up',
     'upper body, from side, three-quarter view, shield bash, leaning forward, holding shield, shield in front, clenched teeth, angry'),
    ('cast-full', 'cast', None, 'canvas',
     'full body, from side, three-quarter view, standing, legs apart, arm up, raised fist, shield at side, clenched teeth, angry'),
    ('cast-upper', 'cast', (250, 0, 710, 560), 'up',
     'upper body, from side, three-quarter view, arm up, raised fist, shield at side, clenched teeth, angry'),
    ('hurt-cowboy', 'hurt', (292, 250, 640, 1000), 'up',
     'cowboy shot, from side, three-quarter view, leaning back, arm up, hand on own stomach, closed eyes, wince, pained expression'),
]


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def flat_cut(raw):
    """The pipeline cut-out of a raw frame (same name without .raw), flattened on white."""
    cut = raw.replace('.raw.png', '.png')
    im = Image.open(cut).convert('RGBA')
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    meta = json.load(open(raw.replace('.raw.png', '.json')))['cutout']
    return bg.convert('RGB'), meta['cropBox'], cut


def crop_raw(src, box):
    img, cb, _ = flat_cut(src)
    canvas = Image.new('RGB', (832, 1216), (255, 255, 255))
    canvas.paste(img, (cb[0], cb[1]))
    return canvas.crop(box)


def crops():
    os.makedirs(f'{STAGE}/crops', exist_ok=True)
    for cid, s, box, mode, _ in CROPS:
        if mode == 'up':
            crop_raw(SOURCES[s][0], box).save(f'{STAGE}/crops/{cid}.png')
    print('crops ->', f'{STAGE}/crops')


def to_mp(im, target=1024 * 1024):
    s = (target / (im.width * im.height)) ** 0.5
    w, h = round(im.width * s / 8) * 8, round(im.height * s / 8) * 8
    return im.resize((w, h), Image.LANCZOS)


def finish():
    for sub in ('idle', 'poses'):
        d = f'{DATA}/{sub}'
        os.makedirs(d, exist_ok=True)
        for f in os.listdir(d):
            os.remove(os.path.join(d, f))
    items = []
    r1 = json.load(open(f'{R1}/manifest.json'))
    for it in r1['items']:
        for ext in ('png', 'txt'):
            shutil.copyfile(f"{R1}/{it['id']}.{ext}", f"{DATA}/idle/{it['id']}.{ext}")
        items.append({**it, 'subset': 'idle', 'repeats': 2, 'file_sha256': sha(f"{DATA}/idle/{it['id']}.png")})
    for cid, s, box, mode, cap in CROPS:
        src, label = SOURCES[s]
        if mode == 'canvas':
            img, cb, cut = flat_cut(src)
            cw, ch = (832, 1216) if img.height >= img.width * 1.25 else (1024, 1024)
            sc = min((cw - 48) / img.width, (ch - 24) / img.height, 1.0)
            fig = img.resize((round(img.width * sc), round(img.height * sc)), Image.LANCZOS)
            im = Image.new('RGB', (cw, ch), (255, 255, 255))
            im.paste(fig, ((cw - fig.width) // 2, ch - fig.height - 12))
            resize = f'cut-out {os.path.basename(cut)} lanczos x{sc:.3f} on a white {cw}x{ch} canvas'
        else:
            im = to_mp(Image.open(f'{STAGE}/up/{cid}.png').convert('RGB'))
            resize = f'raw box {list(box)} of the flattened cut-out, RealESRGAN_x4plus (ComfyUI) then lanczos to {im.width}x{im.height}'
        for mirror in (False, True):
            face = 'left' if mirror else 'right'
            out = ImageOps.mirror(im) if mirror else im
            name = f'{cid}-{face}'
            out.save(f'{DATA}/poses/{name}.png')
            caption = f'ormiX2, 1boy, solo, {cap}, body facing {face}, {TAIL}'
            open(f'{DATA}/poses/{name}.txt', 'w', encoding='utf-8').write(caption)
            items.append({'id': name, 'subset': 'poses', 'repeats': 1, 'source': src, 'sourceLabel': label,
                          'sha256': sha(src), 'cutoutSha256': sha(src.replace('.raw.png', '.png')),
                          'box': list(box) if box else None, 'mirrored': mirror, 'size': list(out.size),
                          'resize': resize, 'caption': caption, 'file_sha256': sha(f'{DATA}/poses/{name}.png')})
    json.dump({'trigger': 'ormiX2', 'repeats': {'idle': 2, 'poses': 1}, 'items': items}, open(f'{DATA}/manifest.json', 'w'), indent=1)
    toml = (f"[general]\nenable_bucket = true\ncaption_extension = '.txt'\nshuffle_caption = false\n\n"
            f"[[datasets]]\nresolution = 1024\nbatch_size = 1\nmin_bucket_reso = 512\nmax_bucket_reso = 2048\nbucket_reso_steps = 64\n\n"
            f"[[datasets.subsets]]\nimage_dir = '{DATA}/idle'\nnum_repeats = 2\n\n"
            f"[[datasets.subsets]]\nimage_dir = '{DATA}/poses'\nnum_repeats = 1\n")
    open(f'{ROOT}/dataset.toml', 'w').write(toml)
    print('dataset ->', DATA, len(items), 'items')


if __name__ == '__main__':
    {'crops': crops, 'finish': finish}[sys.argv[1]]()
