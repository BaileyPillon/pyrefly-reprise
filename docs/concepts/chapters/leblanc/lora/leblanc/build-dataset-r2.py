"""Chapter 6 (FFX-2 only): the round-2 training set for the Leblanc identity LoRA (leblanc-x2-r2).

Round 1 (build-dataset.py, dataset.md) was 10 views of the idle plus one portrait face,
so the LoRA memorised the idle's props (the closed fan at the mouth came back in a lunge).
Round 2 keeps every round-1 image (idle views at repeats 2, the portrait at 1) and adds the
round-1 pose outputs that the independent judge or the painter scored 6 or above, at
repeats 1, captioned by view and pose only. Regions carrying a defect a judge or the
painter named are cropped out or erased in the dataset copy (never in the source):
see dataset-r2.md for every source, its score, what was kept and why.

    D:/Tools/ComfyUI/python_embeded/python.exe -s build-dataset-r2.py build [--out D:/Tools/pyrefly-lora/leblanc/dataset-r2]
    ... preview --out <dir>
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import pathlib
import shutil

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('r1', HERE / 'build-dataset.py')
r1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r1)

R1_OUT = pathlib.Path('D:/Tools/pyrefly-lora/leblanc/dataset')
POSES = 'D:/Tools/pyrefly-lora/leblanc/poses'
P = r1.P
BG = r1.BG
REPEATS = {'idle': 2, 'portrait': 1, 'poses': 1}

ATTACK = f'{POSES}/attack.v7.2.noshadow.png'   # installed attack (redo pick), painter 7
CAST = f'{POSES}/cast.r2red.png'               # installed cast (redo pick), painter 7
HURT = f'{POSES}/hurt.v4.5.png'                # installed hurt (redo pick), painter 7
KO = f'{POSES}/ko.r2.noshadow.png'             # installed ko (redo pick), painter 7
HURT31 = f'{POSES}/hurt.v3.1.png'              # round-1 v3 pick, painter 6 (independent judge 5)

# Erase boxes (x0, y0, x1, y1) in source pixels, set transparent before flattening on white.
# hurt.v4.5: the purple tassel hanging off the fan's end (idle's fan has none; painter named it).
HURT_TASSEL = [(22, 283, 64, 382)]

CLOSED_FAN = 'holding folding fan, closed fan'
ATTACK_POSE = 'from side, lunging, leaning forward, one leg forward, wide stance, outstretched arm, ' + CLOSED_FAN
CAST_POSE = 'from side, standing, arm up, raised hand, holding folding fan, open fan, fan above head, looking up'
HURT_POSE = ('from side, leaning back, off balance, head back, wince, one eye closed, clenched teeth, '
             'hand on own stomach, ' + CLOSED_FAN)
HURT31_POSE = 'leaning back, head back, wince, one eye closed, clenched teeth, hand on own stomach, ' + CLOSED_FAN
KO_POSE = 'lying, on side, on ground, closed eyes, ' + CLOSED_FAN

# (id, subset, source, box, canvas, erase, caption tail); canvas (w, h, scale, x, y) as in round 1
POSE_ITEMS = [
    # the lunge from below the chin: the face has the dark hair patch the painter named, so it stays out
    ('pose-attack-body', 'poses', ATTACK, (0, 240, 1020, 1190), None, [],
     f'head out of frame, {ATTACK_POSE}, feet, {BG}'),
    ('pose-cast-full', 'poses', CAST, None, (832, 1216, 1.0, 126, 15), [],
     f'full body, {CAST_POSE}, feet, {BG}'),
    ('pose-cast-upper', 'poses', CAST, (0, 0, 579, 640), None, [],
     f'upper body, {CAST_POSE}, {BG}'),
    ('pose-hurt-full', 'poses', HURT, None, (832, 1216, 1.0, 49, 200), HURT_TASSEL,
     f'full body, {HURT_POSE}, feet, {BG}'),
    ('pose-hurt-upper', 'poses', HURT, (0, 0, 734, 520), None, HURT_TASSEL,
     f'upper body, {HURT_POSE}, {BG}'),
    ('pose-ko-full', 'poses', KO, None, (1216, 832, 1.0, 0, 200), [],
     f'full body, {KO_POSE}, feet, {BG}'),
    ('pose-ko-upper', 'poses', KO, (0, 0, 720, 437), None, [],
     f'upper body, {KO_POSE}, {BG}'),
    # hurt v3.1 above the robe hem only: its far leg is missing below the hem (judge: anatomy 5)
    ('pose-hurt31-upper', 'poses', HURT31, (0, 0, 715, 560), None, [],
     f'upper body, {HURT31_POSE}, {BG}'),
]


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def src_path(src: str) -> pathlib.Path:
    p = pathlib.Path(src)
    return p if p.is_absolute() else r1.REPO / src


def make(src, box, canvas, erase, allow_esrgan=True):
    im = Image.open(src_path(src)).convert('RGBA')
    if erase:
        a = im.getchannel('A')
        d = ImageDraw.Draw(a)
        for e in erase:
            d.rectangle(e, fill=0)
        im.putalpha(a)
    im = r1.flatten(im)
    if box:
        im = im.crop(box)
    if canvas:
        w, h, s, x, y = canvas
        fig = im if s == 1.0 else im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        c = Image.new('RGB', (w, h), (255, 255, 255))
        c.paste(fig, (x, y))
        return c, 'canvas'
    return r1.to_area(im, allow_esrgan)


def build(out: pathlib.Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    m1 = json.loads((R1_OUT / 'manifest.json').read_text(encoding='utf-8'))
    manifest = {'trigger': 'leblancX2', 'repeats': REPEATS, 'items': []}
    # round 1's images, copied byte for byte (and checked against round 1's manifest)
    for it in m1['items']:
        d = out / it['subset']
        d.mkdir(exist_ok=True)
        for ext in ('png', 'txt'):
            shutil.copyfile(R1_OUT / it['subset'] / f"{it['id']}.{ext}", d / f"{it['id']}.{ext}")
        assert sha256(d / f"{it['id']}.png") == it['outSha256'], it['id']
        manifest['items'].append({**it, 'round': 1})
        print(it['id'], it['subset'], 'copied from round 1')
    for ident, subset, src, box, canvas, erase, tail in POSE_ITEMS:
        sp = src_path(src)
        before = sha256(sp)
        im, how = make(src, box, canvas, erase)
        d = out / subset
        d.mkdir(exist_ok=True)
        im.save(d / f'{ident}.png')
        caption = f'{P}, {tail}'
        (d / f'{ident}.txt').write_text(caption + '\n', encoding='utf-8')
        assert sha256(sp) == before, f'source changed: {src}'
        manifest['items'].append({
            'id': ident, 'subset': subset, 'source': src, 'sha256': before,
            'box': list(box) if box else None, 'canvas': list(canvas) if canvas else None,
            'erase': [list(e) for e in erase], 'size': [im.width, im.height], 'resize': how,
            'caption': caption, 'outSha256': sha256(d / f'{ident}.png'), 'round': 2,
        })
        print(ident, subset, im.size, how)
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=1), encoding='utf-8')


def preview(out: pathlib.Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    tiles = []
    for ident, subset, src, box, canvas, erase, tail in POSE_ITEMS:
        im, _ = make(src, box, canvas, erase, allow_esrgan=False)
        im.thumbnail((420, 420))
        tiles.append(im)
    W = sum(t.width for t in tiles) + 6 * len(tiles)
    s = Image.new('RGB', (W, 420), (160, 160, 160))
    x = 0
    for t in tiles:
        s.paste(t, (x, 0))
        x += t.width + 6
    s.save(out / 'preview-r2.jpg', quality=88)
    print(out / 'preview-r2.jpg', s.size)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['build', 'preview'])
    ap.add_argument('--out', default='D:/Tools/pyrefly-lora/leblanc/dataset-r2')
    a = ap.parse_args()
    (build if a.cmd == 'build' else preview)(pathlib.Path(a.out))


if __name__ == '__main__':
    main()
