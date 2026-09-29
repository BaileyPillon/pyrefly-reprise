#!/bin/bash
# Pass 8 (2026-09-29, FFX only): the backdrops' city again, lower and smaller (bk_city.py v2 region, the v2 words),
# after pass 6 painted Bevelle level with the ship; and Fin B left at NEAR with the paddle-tipped sketch (fins2).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g mouth $C/sketches/bk/bk-city-a2-comp.png $C/sketches/bk/bk-city-a2-mask.png $C/backdrop/bk-a-3.full.png $C/sketches/bk/bk-city-a2-mask-full.png $C/backdrop/bk-a-5 290341 0.60 0.26 bk-city-a2
g mouth $C/sketches/bk/bk-city-b2-comp.png $C/sketches/bk/bk-city-b2-mask.png $C/backdrop/bk-b-3.full.png $C/sketches/bk/bk-city-b2-mask-full.png $C/backdrop/bk-b-5 290441 0.60 0.26 bk-city-b2
S=$C/sketches/fins2
g mouth $S/fin-b-l-near-comp.png $S/fin-b-l-near-mask.png $C/plates/flight-1.full.png $S/fin-b-l-near-mask-full.png $C/fins/fin-b-l-near-3 290841 0.64 0.28 fin-b-l-near2
echo DONE
