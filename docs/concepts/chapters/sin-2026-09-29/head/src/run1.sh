#!/bin/bash
# Head C, pass 1 (FFX only): the stage-4 tusk. A masked repaint of a 272x155 crop of round 3's master at the chin,
# upscaled to 1344x768 so the model paints it at full detail (repair.py tusk-prep / tusk-paste). Two strengths.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin/head-c
$PY -s gen.py patch $C/tusk-crop.png $C/tusk-mask.png $C/tusk-1 292101 0.62 tusk 2>&1 | tail -c 300
$PY -s gen.py patch $C/tusk-crop.png $C/tusk-mask.png $C/tusk-2 292111 0.74 tusk 2>&1 | tail -c 300
echo DONE
