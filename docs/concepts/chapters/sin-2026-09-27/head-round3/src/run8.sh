#!/bin/bash
# Round 3, pass 8 (after LOOKING at pass 7: the near wing is feathered now and the cheek loop is gone, but the wing repair
# left an orange strap over the shoulder and the cheek repair wire-like loops by the hinge): one masked repaint of both.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
$PY -s gen.py mouth $C/fix/b1-wc.base.png $C/fix/fix-patch2.png $C/fix/b1-wc.png $C/fix/fix-patch2-full.png $C/fix/patch2-a 930801 0.52 0.28 patchfix 2>&1 | tail -c 300
python repair.py blend $C/fix/b1-wc.png $C/fix/patch2-a patch2 $C/fix/b1-wcp.png
echo DONE
