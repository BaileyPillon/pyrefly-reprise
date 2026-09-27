#!/bin/bash
# Sin head pilot, pass 5: option C's shut stage again (pass 4 left a sliver of the old jaw's edge under the
# chin); stages.py now grows the old jaw area before filling it. Same heal settings as run4.sh.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin
python stages.py edit $C/C/p2.full.png $C/C/stages C 0
$PY -s gen.py sdxl $C/C/stages/C-m0.edit.png $C/C/stages/C-m0 927131 0.42 1.75 0.30 sin-C-shut 2>&1 | tail -c 300
python stages.py blend $C/C/p2.full.png $C/C/stages C
echo DONE
