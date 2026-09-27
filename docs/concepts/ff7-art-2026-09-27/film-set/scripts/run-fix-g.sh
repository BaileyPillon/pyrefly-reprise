#!/bin/bash
# Film set: Cloud strike, a LOOK at full size after the sheets: the strike pick p2 has THREE hands on the grip (a gloved
# hand at the pommel and two bare hands), so the pick moves to p1 (two gloved hands, canon), whose one fault is a
# white band on the far (LEFT) wrist too: that band becomes the brown glove cuff, as on the other poses.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
T="In the middle of this picture, the white cloth band on the wrist just above the gloved hand becomes the plain dark brown leather cuff of his fingerless glove, snug on the wrist, with bare skin of the forearm above it. No white band, no metal."
for s in 756001 756002; do FEATHER=12 $PY -s patch.py $C/strike/p1.full.png $C/strike/p1w$s.full.png 650 605 785 755 150 $s "$T" | tail -c 120; done
echo DONE
