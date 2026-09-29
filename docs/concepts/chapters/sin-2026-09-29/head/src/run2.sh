#!/bin/bash
# Head C, pass 2 (FFX only): after LOOKING at pass 1 (0.62 and 0.74 kept a big central fang and painted the chin as
# pebbles with sparkles), our own paint-over of the crop (repair.py tusk-sketch: the interior's and the jaw's own
# colours, a row of short even teeth), blended by a low-strength masked pass. Two strengths.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin/head-c
$PY -s gen.py patch $C/tusk-sketched.png $C/tusk-mask.png $C/tusk-3 292121 0.42 tusk 2>&1 | tail -c 300
$PY -s gen.py patch $C/tusk-sketched.png $C/tusk-mask.png $C/tusk-4 292131 0.52 tusk 2>&1 | tail -c 300
echo DONE
