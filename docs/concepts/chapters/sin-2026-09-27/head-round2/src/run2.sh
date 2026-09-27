#!/bin/bash
# Round 2, pass 2 (after LOOKING at pass 1: a1 holds the tower, claw, wings and dial, but the hide is a smooth humpback):
# stage 0 with the v2 words (rock-like armour plates, spikes on the snout); four seeds.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round2
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g whole zimg $C/sketches/sketch-s0.png $C/s0/c1 927701 0.62 1.75 0.30 s0v2
g whole zimg $C/sketches/sketch-s0.png $C/s0/c2 927711 0.62 1.75 0.30 s0v2
g whole zimg $C/sketches/sketch-s0.png $C/s0/c3 927721 0.66 1.75 0.30 s0v2
g whole zimg $C/sketches/sketch-s0.png $C/s0/c4 927601 0.62 1.75 0.30 s0v2
echo DONE
