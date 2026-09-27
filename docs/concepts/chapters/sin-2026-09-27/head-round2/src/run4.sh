#!/bin/bash
# Round 2, pass 4 (after LOOKING at pass 3: the five stages read apart, but stage 4's mouth has curtain-like bars and
# stage 2 a pink swirl): a second seed for stages 1-4, to pick per stage.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2
for k in 1 2 3 4; do
  $PY -s gen.py mouth $C/stages/comp-s$k.png $C/stages/mask-s$k.png $C/s0/c3.full.png $C/stages/mask-s$k-full.png $C/stages/m$k-b 927901 0.62 0.30 s${k}v2 2>&1 | tail -c 200
  python stages.py blend $C/s0/c3 $C/stages/m$k-b $k $C/stages/m$k-b.blend.png
done
echo DONE
