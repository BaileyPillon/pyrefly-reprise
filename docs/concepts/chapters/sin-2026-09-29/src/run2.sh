#!/bin/bash
# Pass 2 (2026-09-29, FFX only): link 3 on Sin's back (plate back-1). Genais out of its shell with the Core behind it,
# options A and B, each painted INTO the plate (masked repaint inside our sketch's silhouette), two seeds each.
# The shelled state is pass 3: a repaint of only the body region ON the picked painting, so the shell and the Core stay.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin
S=$C/sketches/link3
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g mouth $S/genais-a-comp.png $S/genais-a-mask.png $C/plates/back-1.full.png $S/genais-a-mask-full.png $C/link3/genais-a-1 290501 0.66 0.28 genais-a
g mouth $S/genais-b-comp.png $S/genais-b-mask.png $C/plates/back-1.full.png $S/genais-b-mask-full.png $C/link3/genais-b-1 290511 0.66 0.28 genais-b
g mouth $S/genais-a-comp.png $S/genais-a-mask.png $C/plates/back-1.full.png $S/genais-a-mask-full.png $C/link3/genais-a-2 290521 0.72 0.28 genais-a
g mouth $S/genais-b-comp.png $S/genais-b-mask.png $C/plates/back-1.full.png $S/genais-b-mask-full.png $C/link3/genais-b-2 290531 0.72 0.28 genais-b
echo DONE
