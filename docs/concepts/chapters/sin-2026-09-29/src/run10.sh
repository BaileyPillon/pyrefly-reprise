#!/bin/bash
# Pass 10 (2026-09-29, FFX only): the backdrops' city, v4 (bk_city.py's method check): the tiny city drawn in FRAME
# coordinates (compose_bk's roll and crop) so it shows just above the rail; the old footprint and the band masked.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin
S=$C/sketches/bk
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g mouth $S/bk-city-a4-comp.png $S/bk-city-a4-mask.png $C/backdrop/bk-a-3.full.png $S/bk-city-a4-mask-full.png $C/backdrop/bk-a-8 290361 0.50 0.26 bk-city-a2
g mouth $S/bk-city-b4-comp.png $S/bk-city-b4-mask.png $C/backdrop/bk-b-3.full.png $S/bk-city-b4-mask-full.png $C/backdrop/bk-b-8 290461 0.50 0.26 bk-city-b2
echo DONE
