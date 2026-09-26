"""Rikku Thief try c skeletons (FFX-2 only; 2026-09-26). Bailey picked the body-height gate for the
Thief (JUDGE.md Question 1, answered), so the big-head forcing is dropped: round 2 drew the Thief
skeletons with the face keypoints scaled by the clamped head factor 1.45 (her idle's R 10.4); try c
draws them with Rikku's own head, the median R of her other five idles (18.5 -> r = 17.5 / 18.5).
Everything else is skeletons2.py unchanged (scale 0.8, ground 1135, the recoil hurt).

    python skeletons-thief-c.py     # writes skeletons/rikku-thief-c/<pose>.png
"""
from __future__ import annotations

import json
import pathlib
import statistics
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import skeletons2 as s2  # noqa: E402

POSES = ('attack', 'cast', 'hurt')


def main():
    girls = json.loads((HERE / 'girls2.json').read_text(encoding='utf8'))['girls']
    others = [g['R'] for k, g in girls.items() if k.startswith('rikku-') and k != 'rikku-thief']
    r = s2.NATURAL / statistics.median(others)
    out = HERE / 'skeletons' / 'rikku-thief-c'
    out.mkdir(parents=True, exist_ok=True)
    for pose in POSES:
        size, pts = s2.build(girls['rikku-thief']['skel'], pose, r)
        s2.base.draw(size, pts).save(out / f'{pose}.png')
        print(f'rikku-thief-c/{pose} r={r:.3f} (median R of {sorted(others)})')


if __name__ == '__main__':
    main()
