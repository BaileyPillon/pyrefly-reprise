"""Logos round 2: the OpenPose (COCO-18) skeletons, drawn with round 1's own drawer
(../poses/draw-poses.py: controlnet_aux colours and limb order, facing LEFT like the idle,
bone lengths from the idle's skeleton).

    D:/Tools/ComfyUI/python_embeded/python.exe -s draw-poses-r2.py

What the judges faulted, and the fix:
  attack2 : judge (attack 96101) "the stance is a stride rather than a deep lunge". Both
            arms still lead with the revolvers at shoulder height (Double Shot, research
            10.1 two aimed shots); the hips drop about 40 px, the near knee is thrown
            forward and bent, the far leg reaches straight back.
  cast    : unchanged (the round-1 cast skeleton read as Russian Roulette, pose 8).
  hurt3   : judge (hurt 96303.r2) "an even walking stride with both feet flat ... a
            stagger more than a hard hit", and round 1's hurt2 lifted the front foot, so
            renders lost a leg. A recoil that KEEPS BOTH LEGS: hips pushed back and down,
            torso about 25 degrees back, head thrown back, the back knee bent under the
            weight, the front leg thrust out with the heel planted, both ankles on the floor
            line; the far arm flung back and up, the near arm trailing forward-low.
  ko      : unchanged (lying on his back, head toward the party; judge pose 9).

Writes <name>-pose.png here and poses-r2-preview.jpg.
"""
from __future__ import annotations

import importlib.util
import pathlib

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location('dp', HERE.parent / 'poses' / 'draw-poses.py')
dp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(dp)

POSES = {
    'attack2': ((832, 1216), {
        0: (318, 272), 15: (338, 254), 17: (376, 262), 1: (398, 328),
        2: (380, 348), 3: (262, 332), 4: (148, 320),          # far arm, out and a little high
        5: (420, 366), 6: (302, 372), 7: (186, 376),          # near arm, out at shoulder height
        8: (470, 662), 9: (612, 860), 10: (734, 1086),        # far leg straight back
        11: (452, 674), 12: (300, 824), 13: (284, 1100),      # near knee thrown forward, bent
    }),
    'cast': dp.POSES['cast'],
    'hurt3': ((832, 1216), {
        0: (622, 218), 15: (649, 215), 17: (675, 243), 1: (642, 293),
        2: (622, 315), 3: (720, 250), 4: (790, 200),          # far arm flung back and up
        5: (652, 333), 6: (590, 480), 7: (500, 560),          # near arm trailing forward-low
        8: (500, 560), 9: (610, 800), 10: (650, 1090),        # back leg bent under the weight
        11: (530, 570), 12: (430, 820), 13: (360, 1095),      # front leg thrust out, heel planted
    }),
    'ko': dp.POSES['ko'],
}


def main():
    tiles = [Image.open(HERE.parent / 'idle-pose-overlay.jpg').convert('RGB')]
    for name, (size, pts) in POSES.items():
        sk = dp.draw(size, pts)
        sk.save(HERE / f'{name}-pose.png')
        tiles.append(sk)
    th = 600
    scaled = [t.resize((round(t.width * th / t.height), th)) for t in tiles]
    sheet = Image.new('RGB', (sum(t.width for t in scaled) + 10 * len(scaled), th), (40, 40, 40))
    x = 0
    for t in scaled:
        sheet.paste(t, (x, 0))
        x += t.width + 10
    sheet.save(HERE / 'poses-r2-preview.jpg', quality=85)
    print('poses written:', ', '.join(POSES))


if __name__ == '__main__':
    main()
