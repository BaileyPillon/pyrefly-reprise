#!/bin/bash
# Film set, repair round, Cloud back and hurt, after the pauldron graft (graft.py on p2o1 / p3o1): the removal box left a
# soft seam on the upper arm just below the plate; a small patch below the plate (the plate itself outside the box)
# makes the arm continuous. Two seeds each.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
ARM="In the middle of image 1, just below the metal shoulder plate, his bare upper arm continues smoothly: clean continuous skin with the same tone and cel shading as the rest of the arm and a crisp dark ink outline on its edge, no blur, no seam. Keep the shoulder plate exactly as it is."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="upper arm below the grafted plate made continuous" $PY -s patch2.py $C/back/p2g1.full.png $C/back/p2y$k.full.png 930 785 1115 880 130 79440$k "$ARM" | tail -c 60; echo
  REFS="" FEATHER=12 MATCH=1 WHAT="upper arm below the grafted plate made continuous" $PY -s patch2.py $C/hurt/p3g1.full.png $C/hurt/p3y$k.full.png 975 750 1135 850 130 79450$k "$ARM" | tail -c 60; echo
done
echo DONE
