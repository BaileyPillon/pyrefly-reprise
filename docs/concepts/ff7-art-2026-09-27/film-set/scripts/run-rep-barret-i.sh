#!/bin/bash
# Film set, repair round, Barret squat (p4s1): LOOK at the sheet: a dark grey band lies across the trousers just under
# the gun (the gun patch's bottom box edge, where the old box magazine was). One patch below the gun.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
TR="In the middle of image 1, below the gun: his olive green trousers over the knees are plain olive fabric with their normal folds and shading. Remove the dark grey band across them. Keep the gun-arm and his fist exactly as they are."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="trousers: the dark band under the gun (the old magazine's box edge) taken off" $PY -s patch2.py $C/squat/p4s1.full.png $C/squat/p4t$k.full.png 420 1345 1030 1445 130 79234$k "$TR" | tail -c 40; echo
done
echo DONE
