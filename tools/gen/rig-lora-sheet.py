"""Living-portrait v4 (FFX-2 only): contact sheets for the LoRA step test and the yaw keys.

Every sheet puts the approved plate first, then each candidate WHOLE (half
size), then a row of 1:1 face crops (native pixels, never a thumbnail: the
judging rule of docs/ART-PIPELINE.md §6). A candidate whose largest RGB sample
is 0 is a black NaN frame and is labelled BLACK.

    python -s tools/gen/rig-lora-sheet.py steps --dir <cand/steptest> --out <sheet.png>
    python -s tools/gen/rig-lora-sheet.py picks --out <strip.png>   (reads art/v4/keys/picks.json)
    python -s tools/gen/rig-lora-sheet.py yaw   --dir <cand/r1/yaw-40> [--dir <cand/r2/yaw-40>] --yaw -40 --out <sheet.png>
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import pathlib

import numpy as np
from PIL import Image, ImageDraw

REPO = pathlib.Path(__file__).resolve().parents[2]
PLATE = REPO / 'public/art/portraits/yuna-x2.png'
BG = (46, 46, 52)
FG = (240, 240, 240)
FACE = 560                       # 1:1 face crop edge


def pose_mod():
    spec = importlib.util.spec_from_file_location('pose', REPO / 'tools/gen/rig-lora-pose.py')
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def load(p: pathlib.Path) -> Image.Image:
    im = Image.open(p)
    if im.mode == 'RGBA':
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        bg.alpha_composite(im)
        im = bg
    return im.convert('RGB')


def is_black(im: Image.Image) -> bool:
    return int(np.asarray(im).max()) == 0


def face_box(yaw: float) -> tuple[int, int, int, int]:
    pts = pose_mod().keypoints(yaw)
    xs = [pts[k][0] for k in (0, 14, 15) if k in pts]
    cx = int(sum(xs) / len(xs))
    cy = 530
    x0 = max(0, min(832 - FACE, cx - FACE // 2))
    return x0, cy - FACE // 2, x0 + FACE, cy + FACE // 2


def label(im: Image.Image, text: str) -> Image.Image:
    out = Image.new('RGB', (im.width, im.height + 26), BG)
    out.paste(im, (0, 26))
    ImageDraw.Draw(out).text((6, 6), text, fill=FG)
    return out


def row(tiles: list[Image.Image], gap: int = 8) -> Image.Image:
    w = sum(t.width for t in tiles) + gap * (len(tiles) - 1)
    h = max(t.height for t in tiles)
    out = Image.new('RGB', (w, h), BG)
    x = 0
    for t in tiles:
        out.paste(t, (x, 0))
        x += t.width + gap
    return out


def stack(rows: list[Image.Image], gap: int = 12) -> Image.Image:
    w = max(r.width for r in rows)
    out = Image.new('RGB', (w, sum(r.height for r in rows) + gap * (len(rows) - 1)), BG)
    y = 0
    for r in rows:
        out.paste(r, (0, y))
        y += r.height + gap
    return out


def sheet(entries: list[tuple[str, Image.Image]], box, box_plate, title: str) -> Image.Image:
    plate = load(PLATE)
    whole = [label(plate.resize((416, 608), Image.LANCZOS), 'PLATE (approved)')]
    faces = [label(plate.crop(box_plate), 'PLATE 1:1')]
    for name, im in entries:
        tag = name + ('  BLACK' if is_black(im) else '')
        whole.append(label(im.resize((416, 608), Image.LANCZOS), tag))
        faces.append(label(im.crop(box), f'{name} 1:1'))
    rows = []
    for i in range(0, len(whole), 7):
        rows.append(row(whole[i:i + 7]))
    for i in range(0, len(faces), 5):
        rows.append(row(faces[i:i + 5]))
    head = Image.new('RGB', (max(r.width for r in rows), 34), BG)
    ImageDraw.Draw(head).text((6, 10), title, fill=FG)
    return stack([head] + rows)


CAND = pathlib.Path('D:/Tools/pyrefly-lora/yuna-x2/cand')
V4 = REPO / 'docs/concepts/pause-until-dawn/prototype-v2/art/v4/keys'
TAG = 'round 2 (warp)'


def picks(out: pathlib.Path) -> None:
    """Copy the picks (picks.json) to picked/ as lossless webp + sidecar and draw
    the turn strip: pick 1 and pick 2 rows from -85 to +85 with the plate at 0,
    then the pick-1 faces at 1:1 in the same order."""

    spec = json.loads((V4 / 'picks.json').read_text(encoding='utf-8'))['picks']
    order = sorted(spec, key=float)
    (V4 / 'picked').mkdir(exist_ok=True)
    plate = load(PLATE)
    rows: list[list[Image.Image]] = [[], []]
    faces = []
    seq = [y for y in order if float(y) < 0] + ['0'] + [y for y in order if float(y) > 0]
    for y in seq:
        for k in range(2):
            if y == '0':
                im, name = plate, 'PLATE 0'
            else:
                rnd, c = spec[y][k]
                src = CAND / rnd / f'yaw{y}' / f'{c}.png'
                side = src.with_suffix('.json')
                if rnd.startswith('w'):          # second attempt: the finished key (rig-lora-fix.py)
                    src = CAND / rnd / f'yaw{y}' / 'fixed' / f'{c}.png'
                im = load(src)
                name = f'{y} pick{k + 1} {rnd}.{c}'
                dst = V4 / 'picked' / f'yaw{y}.pick{k + 1}'
                Image.open(src).save(f'{dst}.webp', lossless=True, method=6)
                meta = json.loads(side.read_text(encoding='utf-8'))
                mfile = src.parent / 'measure.json'
                if mfile.exists():
                    meta['measured'] = json.loads(mfile.read_text(encoding='utf-8'))['candidates'].get(c)
                    meta['finishedBy'] = 'tools/gen/rig-lora-fix.py fix (plate outside the head mask, iris colour by side)'
                pathlib.Path(f"{dst}.json").write_text(json.dumps(meta, indent=1), encoding='utf-8')
            rows[k].append(label(im.resize((312, 456), Image.LANCZOS), name))
            if k == 0:
                faces.append(label(im.crop(face_box(float(y))).resize((312, 312), Image.LANCZOS), f'{y} face'))
    head = Image.new('RGB', (row(rows[0]).width, 34), BG)
    ImageDraw.Draw(head).text((6, 10), f'v4 LoRA keys {TAG}, -85 .. plate .. +85: row 1 pick 1, row 2 pick 2, row 3 pick-1 faces (0.56x)', fill=FG)
    im = stack([head, row(rows[0]), row(rows[1]), row(faces)])
    im.save(out.with_suffix('.png'))
    im.save(V4 / 'sheets' / 'turn-strip.webp', quality=90, method=6)
    # the same pick-1 row as a flipbook, there and back (a head turning or not)
    frames = [f.crop((0, 26, f.width, f.height)) for f in rows[0]]
    loop = frames + frames[-2:0:-1]
    loop[0].save(V4 / 'sheets' / 'turn-flip.webp', save_all=True, append_images=loop[1:],
                 duration=220, loop=0, quality=85, method=6)
    print(out, im.size)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['steps', 'yaw', 'picks'])
    ap.add_argument('--dir', action='append', help='repeat to merge rounds')
    ap.add_argument('--yaw', type=float, default=0.0)
    ap.add_argument('--out', required=True)
    ap.add_argument('--webp', default=None, help='also write a q90 webp here (for committing)')
    ap.add_argument('--title', default='')
    a = ap.parse_args()
    if a.cmd == 'picks':
        picks(pathlib.Path(a.out))
        return
    dirs = [pathlib.Path(x) for x in a.dir]
    entries = []
    for d in dirs:
        pre = f'{d.parent.name}.' if len(dirs) > 1 else ''
        meas = {}
        if (d / 'measure.json').exists():
            meas = json.loads((d / 'measure.json').read_text(encoding='utf-8'))['candidates']
        for p in sorted(d.glob('*.png')):
            tag = pre + p.stem
            side = d.parent / f'{p.stem}.json' if d.name == 'fixed' else None
            if side and side.exists():
                    tag += f"  d{json.loads(side.read_text(encoding='utf-8')).get('denoise')}"
            if p.stem in meas:
                tag += f"  reads {meas[p.stem]['reads']:+d}"
            entries.append((tag, load(p)))
    box = face_box(a.yaw)
    im = sheet(entries, box, face_box(0.0), a.title or f'{dirs[0].name}  yaw {a.yaw:+.0f}  face box {box}')
    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out)
    if a.webp:
        pathlib.Path(a.webp).parent.mkdir(parents=True, exist_ok=True)
        im.save(a.webp, quality=90, method=6)
    print(out, im.size, 'black:', [n for n, e in entries if is_black(e)])


if __name__ == '__main__':
    main()
