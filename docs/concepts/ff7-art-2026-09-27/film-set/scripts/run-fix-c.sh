#!/bin/bash
# Film set: Guard Scorpion idle retry as an edit of the raised pick (idle/p1 put a turret on its back, idle/p2 kept the
# tail high); Cloud wind-up, two more seeds (windup/p3 carries a guard on the raised arm).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g gs lower     $C/gs/idle/p3      760003 1.0 $C/gs/raised/p1.full.png
g gs lower     $C/gs/idle/p4      760004 1.0 $C/gs/raised/p1.full.png
g cloud windup $C/cloud/windup/p5 742005
g cloud windup $C/cloud/windup/p6 742006
echo DONE
