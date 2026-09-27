#!/bin/bash
# Film set, repair round, Cloud follow-through after the graft (p2g2): the removal box left a soft seam where the shirt
# meets the upper arm under the plate, and the earlier wrist repair a smear on the forearm; one patch below the plate.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
ARM="In the middle of image 1, below the metal shoulder plate: the dark knit shirt's armhole edge and his bare upper arm and forearm are clean and continuous, with the same skin tone and cel shading as the rest of the arm and crisp dark ink outlines, no blur, no smear. Keep the shoulder plate and the glove exactly as they are."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="shirt edge and arm below the grafted plate made continuous" $PY -s patch2.py $C/follow/p2g2.full.png $C/follow/p2y$k.full.png 955 700 1150 845 130 79460$k "$ARM" | tail -c 60; echo
done
echo DONE
