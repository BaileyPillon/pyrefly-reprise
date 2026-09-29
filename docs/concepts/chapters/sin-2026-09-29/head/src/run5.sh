#!/bin/bash
# Head A, pass 1 (FFX only): option A's head-on face and spread wings, painted INTO round 3's plate p6 (dusk over
# Bevelle, the white tower, the Fahrenheit's prow) by a masked repaint inside our sketch's silhouette only, mouth fully
# open so the lower jaw, both rows of teeth and the throat are painted once (the rig then moves only the jaw).
# Round 3's creature pick was b1 at 0.62: two strengths around it, two seeds.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin/head-a
P6=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3/plate/p6.full.png
m() { $PY -s gen.py mouth $C/comp-a.png $C/mask-a.png $P6 $C/mask-a-full.png "$@" 2>&1 | tail -c 300; }
m $C/a1 292301 0.60 0.30 head-a
m $C/a2 292311 0.66 0.30 head-a
m $C/a3 292321 0.62 0.30 head-a
echo DONE
