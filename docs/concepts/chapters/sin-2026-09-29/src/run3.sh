#!/bin/bash
# Pass 3 (2026-09-29, FFX only): the Fins at NEAR and FAR, options A (clawed arm + ribbed fin) and B (pectoral fin),
# each painted INTO the flight plate flight-1 (masked repaint inside our sketch's silhouette; the deck is never in the
# mask). Then the two backdrop relights at a low denoise so the Evrae hull keeps its shape (pass 1 at 0.55 and 0.62
# turned it into another ship and dropped the city).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin
S=$C/sketches/fins
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
seed=290600
for k in fin-a-l-near fin-b-l-near fin-a-l-far fin-b-l-far fin-a-r-near fin-b-r-near fin-a-r-far fin-b-r-far; do
  seed=$((seed + 11))
  g mouth $S/$k-comp.png $S/$k-mask.png $C/plates/flight-1.full.png $S/$k-mask-full.png $C/fins/$k-1 $seed 0.68 0.28 $k
done
g whole sdxl $C/sketches/bk-a-init.png $C/backdrop/bk-a-3 290321 0.40 1.75 0.28 bk-a
g whole sdxl $C/sketches/bk-b-init.png $C/backdrop/bk-b-3 290421 0.40 1.75 0.28 bk-b
echo DONE
