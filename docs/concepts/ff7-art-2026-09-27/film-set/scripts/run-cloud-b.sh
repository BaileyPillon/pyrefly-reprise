#!/bin/bash
# Film set: Cloud wind-up retry (both first pilots put armour on the raised near arm), then the victory keys and hurt.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g cloud windup   $C/windup/p3   742003
g cloud windup   $C/windup/p4   742004
g cloud fistpump $C/fistpump/p1 750001
g cloud fistpump $C/fistpump/p2 750002
g cloud spin     $C/spin/p1     751001
g cloud spin     $C/spin/p2     751002
g cloud back     $C/back/p1     752001
g cloud back     $C/back/p2     752002
g cloud hurt     $C/hurt/p1     753001
g cloud hurt     $C/hurt/p2     753002
echo DONE
