#!/bin/bash
# Film set, repair round, Cloud follow-through: the pauldron repaint (p2x1/p2x2) left a soft, frayed right edge that the
# cut turns ragged, so the follow takes the same route as back and hurt: the pauldron OFF (patch2), then the idle's on (graft.py).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
OFF="In the middle of image 1, remove the metal shoulder plate completely: his shoulder there is bare skin, the rounded top of a muscular shoulder and upper arm, with the dark knit shirt's armhole and the brown leather strap exactly as before. Nothing else on the shoulder, no armour, no spikes."
for k in 1 2; do
  REFS="" FEATHER=14 MATCH=0 WHAT="step 1: the redrawn pauldron taken off" $PY -s patch2.py $C/follow/p2a2.full.png $C/follow/p2o$k.full.png 945 460 1110 710 150 79430$k "$OFF" | tail -c 80; echo
done
echo DONE
