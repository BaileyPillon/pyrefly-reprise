#!/bin/bash
# Film set: Guard Scorpion recoil, two more seeds (recoil/p1 barely moves; recoil/p2 throws debris), stronger tilt wording.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/gs
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g gs recoil $C/recoil/p3 762003
g gs recoil $C/recoil/p4 762004
echo DONE
