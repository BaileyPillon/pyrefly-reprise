#!/bin/bash
# Film set, repair round, Barret: LOOK at the gatling picks at 1:1: punch p6x4 has a soft seam where the gun meets the
# elbow rings (the box's top edge); hurt p3x3 has dark red stains on the vest beside the gun (the repaint's colour).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
SEAM="In the middle of image 1, where the steel rings of the gun-arm meet his upper arm at the elbow: make it one crisp clean join, the dark ink outline and the steel rings sharp, no blur and no smear. Keep the gun, the arm and the vest as they are."
VEST="In the middle of image 1, the brown leather vest beside the gun-arm is plain brown leather with its normal shading: remove the dark red stains and smudges. Keep the gun-arm, his belly and the steel waist band unchanged."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="elbow join made crisp (the gun patch's seam)" $PY -s patch2.py $C/punch/p6x4.full.png $C/punch/p6y$k.full.png 200 985 545 1080 130 79260$k "$SEAM" | tail -c 60; echo
  REFS="" FEATHER=12 MATCH=1 WHAT="vest: the red stains beside the gun taken off" $PY -s patch2.py $C/hurt/p3x3.full.png $C/hurt/p3y$k.full.png 440 900 665 1125 130 79270$k "$VEST" | tail -c 60; echo
done
echo DONE
