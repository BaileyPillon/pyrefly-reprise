#!/bin/bash
# Pass 9 (2026-09-29, FFX only): the backdrops' city, third try after the written method check in bk_city.py (v3:
# the whole old footprint masked minus the hull, filled with sky, a tiny city drawn low). Two denoise strengths each,
# because a large empty mask invites a large city: 0.50 holds the init's scale, 0.62 paints more cloud.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin
S=$C/sketches/bk
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g mouth $S/bk-city-a3-comp.png $S/bk-city-a3-mask.png $C/backdrop/bk-a-3.full.png $S/bk-city-a3-mask-full.png $C/backdrop/bk-a-6 290351 0.50 0.26 bk-city-a2
g mouth $S/bk-city-b3-comp.png $S/bk-city-b3-mask.png $C/backdrop/bk-b-3.full.png $S/bk-city-b3-mask-full.png $C/backdrop/bk-b-6 290451 0.50 0.26 bk-city-b2
g mouth $S/bk-city-a3-comp.png $S/bk-city-a3-mask.png $C/backdrop/bk-a-3.full.png $S/bk-city-a3-mask-full.png $C/backdrop/bk-a-7 290352 0.62 0.26 bk-city-a2
g mouth $S/bk-city-b3-comp.png $S/bk-city-b3-mask.png $C/backdrop/bk-b-3.full.png $S/bk-city-b3-mask-full.png $C/backdrop/bk-b-7 290452 0.62 0.26 bk-city-b2
echo DONE
