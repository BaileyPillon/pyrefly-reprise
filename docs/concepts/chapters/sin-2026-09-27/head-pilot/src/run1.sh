#!/bin/bash
# Sin head pilot, pass 1: one render per option from our own sketch (mouth stage 2), to LOOK before any more.
# ComfyUI is shared: gen.py submits only while fewer than 3 prompts are pending, never restarts it,
# and stops on an all-black frame.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin
mkdir -p $C/sketches
python sketch.py $C/sketches all 2
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
declare -A SEED=([A]=927011 [B]=927021 [C]=927031 [D]=927041)
for o in A B C D; do
  g sdxl $C/sketches/sketch-$o-m2.png $C/$o/p1 ${SEED[$o]} 0.78 1.75 0.35 sin-$o
done
echo DONE
