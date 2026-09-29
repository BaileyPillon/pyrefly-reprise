#!/bin/bash
# Pass 5 (2026-09-29, FFX only): FAR v2 after LOOKING at pass 3: the same far sketches, with round 3's head in words
# (prompts.fin_far2), so the far body's face is the head option C's creature and not a gentle humpback.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin
S=$C/sketches/fins
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
seed=290700
for k in fin-a-l-far fin-b-l-far fin-a-r-far fin-b-r-far; do
  seed=$((seed + 11))
  g mouth $S/$k-comp.png $S/$k-mask.png $C/plates/flight-1.full.png $S/$k-mask-full.png $C/fins/$k-2 $seed 0.70 0.28 ${k}2
done
echo DONE
