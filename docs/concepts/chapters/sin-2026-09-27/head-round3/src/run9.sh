#!/bin/bash
# Round 3, pass 9 (after LOOKING at pass 8: naming "no ropes, no wires" grew gold wires on the cheek; that repair is
# dropped): back to b1-w (the wing repair only), and one masked repaint of the cheek and shoulder together with
# positive words only, at a lower strength.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
$PY -s gen.py mouth $C/fix/b1-w.base.png $C/fix/fix-patch2.png $C/fix/b1-w.png $C/fix/fix-patch2-full.png $C/fix/patch3-a 930901 0.45 0.25 cheekpos 2>&1 | tail -c 300
python repair.py blend $C/fix/b1-w.png $C/fix/patch3-a patch2 $C/fix/b1-wp.png
echo DONE
