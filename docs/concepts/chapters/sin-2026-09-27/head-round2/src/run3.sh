#!/bin/bash
# Round 2, pass 3 (after LOOKING at the stage-4 test: 0.62 gives one continuous dropped jaw and a violet throat, 0.74 invents
# machinery; the mask now grows 20 px so the stage-0 jaw's underside is repainted too): stages 1-4 over the stage-0 pick c3,
# each from its own sketch, one seed for all stages.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2
for k in 1 2 3 4; do
  $PY -s gen.py mouth $C/stages/comp-s$k.png $C/stages/mask-s$k.png $C/s0/c3.full.png $C/stages/mask-s$k-full.png $C/stages/m$k-a 927801 0.62 0.30 s${k}v2 2>&1 | tail -c 200
  python stages.py blend $C/s0/c3 $C/stages/m$k-a $k $C/stages/m$k-a.blend.png
done
echo DONE
