#!/bin/bash
# Film set: far-wrist repairs (canon: the white SOLDIER band is on his RIGHT wrist only; these pilots drew one on the far LEFT wrist too).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
T="In the middle of this picture, the white cloth band on the wrist just above the gloved hand becomes the plain dark brown leather cuff of his fingerless glove, snug on the wrist, with bare skin of the forearm above it. No white band, no metal."
FEATHER=12 $PY -s patch.py $C/fistpump/p2.full.png $C/fistpump/p2w.full.png 975 1080 1100 1210 150 755001 "$T" | tail -c 200
FEATHER=12 $PY -s patch.py $C/back/p2.full.png $C/back/p2w.full.png 1005 1065 1105 1200 150 755002 "$T" | tail -c 200
echo DONE
