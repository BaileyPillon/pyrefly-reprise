#!/bin/bash
# Film set: Barret poses, 2 pilots each (FLUX.2 Klein edit mode on the Film idle pick).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g barret aim   $C/aim/p1   745001
g barret aim   $C/aim/p2   745002
g barret fire  $C/fire/p1  746001
g barret fire  $C/fire/p2  746002
g barret squat $C/squat/p1 747001
g barret squat $C/squat/p2 747002
g barret punch $C/punch/p1 748001
g barret punch $C/punch/p2 748002
g barret hurt  $C/hurt/p1  749001
g barret hurt  $C/hurt/p2  749002
echo DONE
