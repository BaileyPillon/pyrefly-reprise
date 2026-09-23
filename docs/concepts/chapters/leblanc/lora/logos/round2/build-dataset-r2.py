"""Chapter 6 (FFX-2 only): the ROUND-2 training set for the logos-x2 identity LoRA.

Round 1 (../build-dataset.py) was 16 crops and mirrors of ONE painting, the idle, and the
LoRA learned that idle's own defect (the near revolver hanging from a finger while the fist
closes on a grey stub). Round 2:

  * the idle is the REPAIRED idle (round2/fix2.mjs idle.r2 98014: the near hand grips the
    revolver; every other pixel byte-identical, round2/idle-hand-diff.png), with round 1's
    same 16 crops and mirrors, in subset img-idle at repeats 2;
  * plus every round-1 output the independent judge or the painter scored 6 or above,
    cut so that no costume or weapon detail a judge named as wrong is in the frame
    (dataset-r2.md argues each one), in subset img-poses at repeats 1, not mirrored (the
    battle always faces left).

Captions: trigger, 1boy, view / framing and pose only (no costume words), as round 1.
Sources are read, never written; their sha256 is checked before and after.

    D:/Tools/ComfyUI/python_embeded/python.exe -s build-dataset-r2.py build [--out D:/Tools/pyrefly-lora/logos/dataset-r2]
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import pathlib

from PIL import ImageOps

HERE = pathlib.Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location('r1', HERE.parent / 'build-dataset.py')
r1 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(r1)

REPO = r1.REPO
P, BG = r1.P, r1.BG
CH = 'public/art/characters/logos'

# (id, source, box on that cutout (x0,y0,x1,y1), caption tail). Boxes keep out every
# detail a judge named as wrong (see dataset-r2.md).
POSES = [
    ('attack-upper', f'{CH}/attack.png', (0, 0, 545, 392),
     'upper body, from side, profile, leaning forward, aiming, arms forward, outstretched arm, holding gun, serious, closed mouth'),
    ('attack-legs', f'{CH}/attack.png', (236, 604, 817, 1013),
     'lower body, legs, feet, sandals, head out of frame, from side, lunging, legs apart, one leg forward'),
    ('cast-upper', f'{CH}/cast.png', (84, 0, 420, 428),
     'upper body, from side, profile, arm up, holding gun, gun pointed up, smirk, closed mouth'),
    ('cast-hand', f'{CH}/cast.png', (180, 500, 372, 800),
     'close-up, hand, holding gun, gun pointed down, arm at side, from side'),
    ('ko-upper', f'{CH}/ko.png', (0, 0, 720, 222),
     'upper body, from side, lying, on back, on ground, unconscious, closed eyes, arm at side'),
]
REPEATS = {'img-idle': 2, 'img-poses': 1}


def build(out: pathlib.Path) -> None:
    manifest = {'trigger': 'logosX2', 'round': 2, 'repeats': REPEATS, 'items': []}
    # idle: round 1's crops of the repaired idle
    d = out / 'img-idle'
    d.mkdir(parents=True, exist_ok=True)
    src = REPO / r1.IDLE
    before = r1.sha256(src)
    base = r1.flatten(r1.Image.open(src))
    for ident, box, tail in r1.CROPS:
        im0, how = r1.to_area(r1.crop_pad(base, box))
        for mirror in (False, True):
            im = ImageOps.mirror(im0) if mirror else im0
            name = f'{ident}{"-m" if mirror else ""}'
            caption = f'{P}, {tail}, {"facing right" if mirror else "facing left"}, {BG}'
            im.save(d / f'{name}.png')
            (d / f'{name}.txt').write_text(caption + '\n', encoding='utf-8')
            manifest['items'].append({'id': name, 'subset': 'img-idle', 'source': r1.IDLE, 'sha256': before, 'box': list(box),
                                      'mirror': mirror, 'size': [im.width, im.height], 'resize': how,
                                      'outSha256': r1.sha256(d / f'{name}.png'), 'caption': caption})
            print(name, im.size, how)
    assert r1.sha256(src) == before, 'idle changed'
    # the round-1 poses that qualify
    d = out / 'img-poses'
    d.mkdir(parents=True, exist_ok=True)
    for ident, rel, box, tail in POSES:
        s = REPO / rel
        h = r1.sha256(s)
        im, how = r1.to_area(r1.crop_pad(r1.flatten(r1.Image.open(s)), box))
        caption = f'{P}, {tail}, facing left, {BG}'
        im.save(d / f'{ident}.png')
        (d / f'{ident}.txt').write_text(caption + '\n', encoding='utf-8')
        assert r1.sha256(s) == h, f'{rel} changed'
        manifest['items'].append({'id': ident, 'subset': 'img-poses', 'source': rel, 'sha256': h, 'box': list(box), 'mirror': False,
                                  'size': [im.width, im.height], 'resize': how, 'outSha256': r1.sha256(d / f'{ident}.png'), 'caption': caption})
        print(ident, im.size, how)
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=1), encoding='utf-8')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['build'])
    ap.add_argument('--out', default='D:/Tools/pyrefly-lora/logos/dataset-r2')
    a = ap.parse_args()
    build(pathlib.Path(a.out))


if __name__ == '__main__':
    main()
