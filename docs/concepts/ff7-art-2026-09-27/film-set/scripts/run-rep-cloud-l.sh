#!/bin/bash
# Film set, repair round, Cloud wind-up: LOOK at p6o1/p6o2: the wrist repair left a white-blue glow on the forearm
# just below the new glove cuff. One more local repaint of that wrist, on p6o2 (the cleaner shoulder).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
WR="In the middle of image 1: the gloved hand's plain dark brown leather cuff, snug on the wrist, and below it the bare skin of the forearm with normal warm skin shading. No white cloth, no white or blue glow, no light spot."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="wrist: the glow the first repair left taken off" $PY -s patch2.py $C/windup/p6o2.full.png $C/windup/p6w$k.full.png 450 590 640 740 140 79382$k "$WR" | tail -c 40; echo
done
echo DONE
