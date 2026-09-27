#!/bin/bash
# Film set: Guard Scorpion, 2 pilots per pose (FLUX.2 Klein edit mode on the Film pick, which already has the tail
# raised): the idle with the tail LOWERED, the tail raised (same machine), the hit recoil. Painted facing left, never flipped.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/gs
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g gs idle   $C/idle/p1   760001
g gs idle   $C/idle/p2   760002
g gs raised $C/raised/p1 761001
g gs raised $C/raised/p2 761002
g gs recoil $C/recoil/p1 762001
g gs recoil $C/recoil/p2 762002
echo DONE
