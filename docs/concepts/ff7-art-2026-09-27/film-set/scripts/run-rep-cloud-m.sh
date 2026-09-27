#!/bin/bash
# Film set, repair round, Cloud spin after the graft (f2g): the removal box left a soft seam on the upper arm under the plate.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
ARM="In the middle of image 1, just below the metal shoulder plate, his bare upper arm continues smoothly: clean continuous skin with the same tone and cel shading as the rest of the arm and a crisp dark ink outline on its edge, no blur, no seam. Keep the shoulder plate exactly as it is."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="upper arm below the grafted plate made continuous" $PY -s patch2.py $C/spin/f2g.full.png $C/spin/f2y$k.full.png 885 795 1075 905 130 79391$k "$ARM" | tail -c 40; echo
done
echo DONE
