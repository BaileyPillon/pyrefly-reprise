#!/bin/bash
# Film set: Barret air punch, two more seeds (punch/p3 and p4 drew a hand beside the gun-arm and a belt).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g barret punch $C/punch/p5 748005 1.0 $C/idle/p1.full.png
g barret punch $C/punch/p6 748006 1.0 $C/idle/p1.full.png
echo DONE
