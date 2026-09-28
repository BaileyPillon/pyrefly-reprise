#!/bin/bash
# Film set, repair round, Barret aim/fire face, second try: LOOK showed the first face box was misplaced (it painted a
# faint face into the empty background); the face is at x 700-960. On the boot-completed renders (fire p2b1, aim p8b2).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
FACE="On his face in the middle of image 1, remove every scar and scratch mark on the cheek, nose and forehead: clean smooth skin. Keep exactly the same expression, eyes, eyebrows, open or closed mouth, teeth, beard, hair and skin colour."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="face: the scars taken off, the expression kept" $PY -s patch2.py $C/fire/p2b1.full.png $C/fire/p2f$k.full.png 700 250 965 585 140 79470$k "$FACE" | tail -c 40; echo
  REFS="" FEATHER=12 MATCH=1 WHAT="face: the scars taken off, the expression kept" $PY -s patch2.py $C/aim/p8b2.full.png $C/aim/p8f$k.full.png 700 250 965 585 140 79471$k "$FACE" | tail -c 40; echo
done
echo DONE
