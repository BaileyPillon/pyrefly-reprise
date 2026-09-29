#!/bin/bash
# Pass 7 (2026-09-29, FFX only): Fin option A, left, at NEAR again: a spread hand of four talons in the sketch
# (sketches/fins2) and the v2 words (FIN_A2 + LIMB), after pass 3's arm read as a neck with a beak. Two seeds.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin
S=$C/sketches/fins2
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g mouth $S/fin-a-l-near-comp.png $S/fin-a-l-near-mask.png $C/plates/flight-1.full.png $S/fin-a-l-near-mask-full.png $C/fins/fin-a-l-near-2 290821 0.66 0.28 fin-a-l-near2
g mouth $S/fin-a-l-near-comp.png $S/fin-a-l-near-mask.png $C/plates/flight-1.full.png $S/fin-a-l-near-mask-full.png $C/fins/fin-a-l-near-3 290831 0.72 0.28 fin-a-l-near2
echo DONE
