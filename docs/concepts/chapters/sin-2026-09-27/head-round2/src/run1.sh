#!/bin/bash
# Round 2, pass 1: stage 0 (SHUT) from our sketch, z-image img2img + detail pass; four seeds at two strengths.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g whole zimg $C/sketches/sketch-s0.png $C/s0/a1 927601 0.62 1.75 0.30 s0
g whole zimg $C/sketches/sketch-s0.png $C/s0/a2 927611 0.62 1.75 0.30 s0
g whole zimg $C/sketches/sketch-s0.png $C/s0/b1 927621 0.70 1.75 0.30 s0
g whole zimg $C/sketches/sketch-s0.png $C/s0/b2 927631 0.70 1.75 0.30 s0
echo DONE
