#!/bin/bash
# Film set, repair round, Barret aim (p8) and fire (p2): fresh renders and edits of the idle both broke identity (a
# hand-held gun, a buckle, new hair), so the old picks are repaired in place: (1) extend.py adds 192 rows of studio grey
# under the clipped canvas and patch2.py completes the near boot's sole and heel; (2) patch2.py takes the scars off the
# face, keeping the expression. The skin tone (skinmatch.py) and the back rim (derim wide + pale, inkback) are code steps
# in the finish. Two seeds each; LOOKED at before a pick.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
BOOT="At the bottom of image 1 the near brown boot is cut off. Complete the whole boot: the rest of the heavy brown leather boot, its thick dark rubber sole and heel, resting flat, in the same style, with the plain flat dark grey background below and around it. No floor, no shadow."
FACE="On his face in image 1, remove every scar and scratch mark on the cheek, nose and forehead: clean smooth skin. Keep exactly the same expression, eyes, eyebrows, mouth, beard, hair and skin colour."
for pose in fire:p2 aim:p8; do
  P=${pose%%:*}; N=${pose##*:}
  $PY -s extend.py $C/$P/$N.full.png $C/$P/${N}e.full.png 192 | tail -c 80; echo
  for k in 1 2; do
    REFS="" FEATHER=14 MATCH=1 WHAT="the clipped near boot completed (sole and heel)" $PY -s patch2.py $C/$P/${N}e.full.png $C/$P/${N}b$k.full.png 120 1930 640 2290 140 7945$k$([ $P = aim ] && echo 1 || echo 0) "$BOOT" | tail -c 80; echo
    REFS="" FEATHER=12 MATCH=1 WHAT="face: the scars taken off, the expression kept" $PY -s patch2.py $C/$P/${N}b$k.full.png $C/$P/${N}x$k.full.png 290 180 480 480 150 7946$k$([ $P = aim ] && echo 1 || echo 0) "$FACE" | tail -c 80; echo
  done
done
echo DONE
