#!/bin/bash
# Sin head pilot, pass 2: the pass 2 prompts, two strengths per option (0.70 holds the deck and the mouth band
# of our sketch harder; 0.74 in between pass 1's 0.78 and that). Same GPU rules as run1.sh.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
declare -A SEED=([A]=927111 [B]=927121 [C]=927131 [D]=927141)
for o in A B C D; do
  g sdxl $C/sketches/sketch-$o-m2.png $C/$o/p2 ${SEED[$o]} 0.70 1.75 0.35 sin-$o
  g sdxl $C/sketches/sketch-$o-m2.png $C/$o/p3 $((SEED[$o]+5)) 0.74 1.75 0.35 sin-$o
done
echo DONE
