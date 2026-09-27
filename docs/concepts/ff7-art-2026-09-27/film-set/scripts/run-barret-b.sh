#!/bin/bash
# Film set: Barret retries on OUR repaired idle (steel waist bands, no back rim) as the reference:
# aim (both pilots put a hand on a hand-held gun), squat, punch (both pilots put the gun on the far arm), hurt (belt buckles).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
R=$C/idle/p1.full.png
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g barret aim   $C/aim/p3   745003 1.0 $R
g barret aim   $C/aim/p4   745004 1.0 $R
g barret punch $C/punch/p3 748003 1.0 $R
g barret punch $C/punch/p4 748004 1.0 $R
g barret squat $C/squat/p3 747003 1.0 $R
g barret squat $C/squat/p4 747004 1.0 $R
g barret hurt  $C/hurt/p3  749003 1.0 $R
g barret hurt  $C/hurt/p4  749004 1.0 $R
g barret fire  $C/fire/p3  746003 1.0 $R
echo DONE
