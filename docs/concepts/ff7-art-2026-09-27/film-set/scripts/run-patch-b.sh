#!/bin/bash
# Film set: far-wrist repairs on spin/p3 (a white wrap with a ribbon) and hurt/p3 (a white riveted cuff).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
T="In the middle of this picture, the white band or cuff on the wrist just above the gloved hand becomes the plain dark brown leather cuff of his fingerless glove, snug on the wrist, with bare skin of the forearm above it. No white cloth, no ribbon, no metal, no rivets."
FEATHER=12 $PY -s patch.py $C/spin/p3.full.png $C/spin/p3w.full.png 1130 510 1360 650 150 755003 "$T" | tail -c 200
FEATHER=12 $PY -s patch.py $C/hurt/p3.full.png $C/hurt/p3w.full.png 945 965 1075 1115 150 755004 "$T" | tail -c 200
echo DONE
