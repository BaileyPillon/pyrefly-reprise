"""Ormi round-2 pose skeletons (FFX-2 only, Chapter 6): OpenPose COCO-18 control images
for the LoRA r2 renders (render-r2.mjs). Same drawing code and facing as round 1
(../poses/skeletons.py: screen-RIGHT like the idle, near side = his RIGHT, keypoints
2-4, 8-10), with the three faults the round-1 judges named fixed:

  attack : the strike leads with the weapon. Round 1's hands sat at the chest (the
           shield hugged, seen edge-on); here both arms are driven out at shoulder
           height, the far (shield) wrist about 260 px ahead of the neck, torso
           leaning into it, back leg straight, front knee bent.
  hurt   : a recoil that keeps both legs. Round 1's recoil kicked the front foot
           off the ground and the renders lost a leg or read it as a dance; here
           both feet are planted in a staggered stance while the torso and head go
           back, the near hand clutches the belly and the far arm is thrown
           forward-low (an arm up read as reaching, ../judge.md).
  idle   : round 1's idle read (step pick only, not a state to install).
  cast   : round 1's cast was the one pose at the bar (judge 7): unchanged.
  ko     : lying flat on his back, head right (toward the party once mirrored),
           arms at his sides, legs together and straight, body on one horizontal line.

    python skeletons-r2.py    # writes skel-<state>.png, skel-<state>-s85.png and skel-overlay.jpg here
"""
from __future__ import annotations

import importlib.util
import pathlib

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('skel1', HERE.parent / 'poses' / 'skeletons.py')
S1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(S1)

POSES = {
    # the idle read by eye over the installed idle (round 1's scale check), used here only
    # for the step pick: the idle pose through the production recipe
    'idle': S1.POSES['idle'],
    'attack': ((832, 1216), {
        0: (590, 300), 1: (500, 362), 14: (577, 272), 15: (612, 279), 16: (518, 280),
        2: (445, 392), 3: (560, 425), 4: (688, 405), 5: (556, 378), 6: (662, 382), 7: (762, 372),
        8: (390, 680), 9: (270, 892), 10: (150, 1132), 11: (460, 670), 12: (600, 862), 13: (640, 1132),
    }),
    'cast': S1.POSES['cast'],
    'hurt': ((832, 1216), {
        0: (388, 246), 1: (362, 332), 14: (367, 222), 15: (403, 228), 16: (326, 252),
        2: (308, 362), 3: (326, 492), 4: (440, 540), 5: (412, 348), 6: (505, 398), 7: (592, 452),
        8: (430, 662), 9: (362, 892), 10: (292, 1132), 11: (500, 662), 12: (560, 892), 13: (612, 1132),
    }),
    'ko': ((1216, 832), {
        0: (1075, 520), 1: (968, 560), 14: (1064, 496), 15: (1096, 506), 16: (1016, 500),
        2: (962, 515), 3: (840, 520), 4: (720, 530), 5: (962, 610), 6: (840, 620), 7: (720, 628),
        8: (640, 540), 9: (420, 545), 10: (190, 552), 11: (640, 600), 12: (420, 608), 13: (190, 616),
    }),
}
PIVOT = {'ko': (608, 600)}


def scaled(name, pts, s=0.85):
    px, py = PIVOT.get(name, (416, 1135))
    return {k: (round(px + (x - px) * s), round(py + (y - py) * s)) for k, (x, y) in pts.items()}


def fit(pts, size, height_frac=0.75, feet_y_frac=0.93):
    """Refit a standing pose into another canvas: the skeleton's box scaled to
    `height_frac` of the canvas height, centred horizontally, feet at `feet_y_frac`."""
    w, h = size
    xs = [p[0] for p in pts.values()]
    ys = [p[1] for p in pts.values()]
    s = height_frac * h / (max(ys) - min(ys))
    cx = (min(xs) + max(xs)) / 2
    return {k: (round(w / 2 + (x - cx) * s), round(feet_y_frac * h - (max(ys) - y) * s)) for k, (x, y) in pts.items()}


def main() -> None:
    tiles = []
    for name, (size, pts) in POSES.items():
        sk = S1.draw(size, pts)
        sk.save(HERE / f'skel-{name}.png')
        S1.draw(size, scaled(name, pts)).save(HERE / f'skel-{name}-s85.png')
        # s70: the r2 renders filled the frame at 85 percent (the stout body is wider than
        # a stick figure; batch a, round2.md) and the cut-out guard rejected them
        S1.draw(size, scaled(name, pts, 0.7)).save(HERE / f'skel-{name}-s70.png')
        tiles.append(sk)
    # sq: the lunge is wider than tall, so a portrait canvas left an empty top half that
    # the renders filled with extra shields and cloth (batches a and b); 1024x1024 instead
    S1.draw((1024, 1024), fit(POSES['attack'][1], (1024, 1024))).save(HERE / 'skel-attack-sq.png')
    # wide: the prone body in 1216x832 left the upper half empty and the renders filled it
    # with shields, mats and a second body (ko batches a and b); 1536x640 instead, the
    # skeleton scaled to 80 percent of the width, centred a little below the middle
    kx = [p[0] for p in POSES['ko'][1].values()]
    ky = [p[1] for p in POSES['ko'][1].values()]
    s = 0.8 * 1536 / (max(kx) - min(kx))
    cx, cy = (min(kx) + max(kx)) / 2, (min(ky) + max(ky)) / 2
    wide = {k: (round(768 + (x - cx) * s), round(0.56 * 640 + (y - cy) * s)) for k, (x, y) in POSES['ko'][1].items()}
    S1.draw((1536, 640), wide).save(HERE / 'skel-ko-wide.png')
    hh = 400
    row = [t.resize((round(t.width * hh / t.height), hh)) for t in tiles]
    sheet = Image.new('RGB', (sum(t.width for t in row) + 10 * len(row), hh), (255, 255, 255))
    x = 0
    for t in row:
        sheet.paste(t, (x, 0))
        x += t.width + 10
    sheet.save(HERE / 'skel-overlay.jpg', quality=85)


if __name__ == '__main__':
    main()
