#!/bin/bash
# Pass 6 (2026-09-29, FFX only): (1) the backdrops' step 2: Bevelle painted into the lower-left cloud of the relit
# plates bk-a-3 and bk-b-3 (bk_city.py; the hull, the rail and the sky outside the region keep their pixels);
# (2) Fin option B at NEAR again with the limb words (fin-b-*-near2), after pass 3's right fin read as a second head.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g mouth $C/sketches/bk/bk-city-a-comp.png $C/sketches/bk/bk-city-a-mask.png $C/backdrop/bk-a-3.full.png $C/sketches/bk/bk-city-a-mask-full.png $C/backdrop/bk-a-4 290331 0.62 0.26 bk-city-a
g mouth $C/sketches/bk/bk-city-b-comp.png $C/sketches/bk/bk-city-b-mask.png $C/backdrop/bk-b-3.full.png $C/sketches/bk/bk-city-b-mask-full.png $C/backdrop/bk-b-4 290431 0.62 0.26 bk-city-b
S=$C/sketches/fins
g mouth $S/fin-b-r-near-comp.png $S/fin-b-r-near-mask.png $C/plates/flight-1.full.png $S/fin-b-r-near-mask-full.png $C/fins/fin-b-r-near-2 290801 0.64 0.28 fin-b-r-near2
g mouth $S/fin-b-l-near-comp.png $S/fin-b-l-near-mask.png $C/plates/flight-1.full.png $S/fin-b-l-near-mask-full.png $C/fins/fin-b-l-near-2 290811 0.64 0.28 fin-b-l-near2
S2=$C/sketches/shell
# (3) the shelled state on the picked v2 paintings genais-a-4 and genais-b-4 (shell.py: only the body region repaints)
g mouth $S2/genais-a-shell-comp.png $S2/genais-a-shell-mask.png $C/link3/genais-a-4.full.png $S2/genais-a-shell-mask-full.png $C/link3/genais-a-4-shell-1 290581 0.72 0.26 genais-a2-shelled
g mouth $S2/genais-b-shell-comp.png $S2/genais-b-shell-mask.png $C/link3/genais-b-4.full.png $S2/genais-b-shell-mask-full.png $C/link3/genais-b-4-shell-1 290591 0.72 0.26 genais-b2-shelled
echo DONE
