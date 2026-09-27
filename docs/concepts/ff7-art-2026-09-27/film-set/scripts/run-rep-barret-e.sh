#!/bin/bash
# Film set, repair round, Barret squat: LOOK at p4x3 (the gun is right) shows the extra steel band on the near upper arm
# still there: the first box missed it (it sits further right, near the elbow). Two seeds.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
UPPER="In the middle of image 1, the thin steel band around the upper arm is removed: that part of the upper arm is bare muscular skin with the same skin tone and shading as the rest of the arm. Keep the gun-arm below the elbow exactly as it is."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="near upper arm: the extra steel band became bare skin" $PY -s patch2.py $C/squat/p4x3.full.png $C/squat/p4z$k.full.png 425 835 610 975 130 79232$k "$UPPER" | tail -c 60; echo
done
echo DONE
