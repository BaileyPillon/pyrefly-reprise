#!/bin/bash
# Film set: Guard Scorpion lowered-tail idle, two more seeds (idle/p3 put the lens mid-tail and left a floating lens).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/gs
g() { $PY -s poses.py "$@" 2>&1 | tail -c 300; }
g gs lower $C/idle/p5 760005 1.0 $C/raised/p1.full.png
g gs lower $C/idle/p6 760006 1.0 $C/raised/p1.full.png
echo DONE
