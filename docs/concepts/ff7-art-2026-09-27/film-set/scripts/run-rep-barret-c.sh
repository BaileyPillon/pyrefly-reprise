#!/bin/bash
# Film set, repair round, Barret aim: the fresh render on the fixed idle (run-rep-barret-a.sh r1) held the gun in a hand and
# wore a belt with a buckle, so the aim is an EDIT of our fixed idle instead (poses2.py aimE). Pilot 2; LOOKED at before a pick.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
for k in 1 2; do $PY -s poses2.py barret aimE $C/aim/e$k 79250$k 2>&1 | tail -c 120; done
echo DONE
