#!/bin/bash
# Film set, repair round, Cloud pauldron (back, hurt): the local repaint kept the pose's own disc, so step 1 takes the
# disc OFF (a bare left shoulder with its strap), and step 2 (graft.py, no GPU) puts the idle's own pauldron on it.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
OFF="In the middle of image 1, remove the round metal shoulder plate and its spikes completely: his shoulder there is bare skin, the rounded top of a muscular shoulder and upper arm, with the brown leather strap passing over it exactly as before. Nothing else on the shoulder, no armour, no spikes."
for k in 1 2; do
  REFS="" FEATHER=14 MATCH=0 WHAT="step 1: the redrawn round pauldron taken off" $PY -s patch2.py $C/back/p2x2.full.png $C/back/p2o$k.full.png 870 520 1085 815 150 79410$k "$OFF" | tail -c 80; echo
  REFS="" FEATHER=14 MATCH=0 WHAT="step 1: the redrawn round pauldron taken off" $PY -s patch2.py $C/hurt/p3w.full.png $C/hurt/p3o$k.full.png 860 490 1085 810 150 79420$k "$OFF" | tail -c 80; echo
done
echo DONE
