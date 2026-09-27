#!/bin/bash
# Round 3, pass 1: the PLATE (sky, Bevelle, the tall white tower, the Fahrenheit's deck; no creature) from our sketch,
# z-image img2img + detail pass. One job at a time, only while ComfyUI is idle (gen.py waits).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g whole zimg $C/sketches/sketch-plate.png $C/plate/p1 930101 0.62 1.75 0.30 plate
g whole zimg $C/sketches/sketch-plate.png $C/plate/p2 930111 0.66 1.75 0.30 plate
echo DONE
