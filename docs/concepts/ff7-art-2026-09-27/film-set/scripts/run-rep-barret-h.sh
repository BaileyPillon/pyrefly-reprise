#!/bin/bash
# Film set, repair round, Barret squat (p4z2): LOOK at 1:1: the gun patch's left box edge (x 450) left a soft vertical
# seam and a lighter block across the upper arm. One blend patch across the seam.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
ARM="In the middle of image 1, his bare muscular upper arm is one continuous surface: the same red-brown skin tone and cel shading everywhere, crisp dark ink lines, no vertical seam, no lighter block, no blur. Keep the gun-arm's steel rings and the vest unchanged."
for k in 1 2; do
  REFS="" FEATHER=14 MATCH=1 WHAT="upper arm: the gun patch's box seam blended" $PY -s patch2.py $C/squat/p4z2.full.png $C/squat/p4s$k.full.png 360 640 560 1010 130 79233$k "$ARM" | tail -c 40; echo
done
echo DONE
