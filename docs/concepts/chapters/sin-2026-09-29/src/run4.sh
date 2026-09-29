#!/bin/bash
# Pass 4 (2026-09-29, FFX only): Genais v2 after LOOKING at pass 2 (both options read as small cute animals): the
# sketch drawn 1.35x larger with a dark fanged maw and red eyes, a dark stone shell, and the v2 words (FIEND).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin
S=$C/sketches/link3v2
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g mouth $S/genais-a-comp.png $S/genais-a-mask.png $C/plates/back-1.full.png $S/genais-a-mask-full.png $C/link3/genais-a-3 290541 0.68 0.28 genais-a2
g mouth $S/genais-b-comp.png $S/genais-b-mask.png $C/plates/back-1.full.png $S/genais-b-mask-full.png $C/link3/genais-b-3 290551 0.68 0.28 genais-b2
g mouth $S/genais-a-comp.png $S/genais-a-mask.png $C/plates/back-1.full.png $S/genais-a-mask-full.png $C/link3/genais-a-4 290561 0.74 0.28 genais-a2
g mouth $S/genais-b-comp.png $S/genais-b-mask.png $C/plates/back-1.full.png $S/genais-b-mask-full.png $C/link3/genais-b-4 290571 0.74 0.28 genais-b2
echo DONE
