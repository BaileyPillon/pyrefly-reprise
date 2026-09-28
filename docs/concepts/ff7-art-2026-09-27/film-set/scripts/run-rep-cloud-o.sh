#!/bin/bash
# Film set, repair round, Cloud wind-up after the graft (p6g): blend the upper arm under the plate (the removal box's seam).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
ARM="In the middle of image 1, just below the metal shoulder plate, his bare upper arm continues smoothly across his chest: clean continuous skin with natural warm skin tone and cel shading, crisp dark ink outlines, no blur, no seam, no red patch. Keep the shoulder plate exactly as it is."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="upper arm below the grafted plate made continuous" $PY -s patch2.py $C/windup/p6g.full.png $C/windup/p6y$k.full.png 890 790 1110 900 130 79383$k "$ARM" | tail -c 40; echo
done
echo DONE
