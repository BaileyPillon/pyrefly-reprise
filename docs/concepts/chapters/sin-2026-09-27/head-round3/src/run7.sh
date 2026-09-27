#!/bin/bash
# Round 3, pass 7: one-time repairs on the pick b1 (after LOOKING at passes 5 and 6: b1 has the best head; b4 grew ribs in
# the mouth, b5 has fine wings but gold cracks over the head). The near wing loses its pipe-like rod and the cheek its
# hose-like loop and cog. Each is a masked repaint of that region only, then set back with repair.py blend.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
$PY -s gen.py mouth $C/sin/b1.base.png $C/fix/fix-wing.png $C/sin/b1.full.png $C/fix/fix-wing-full.png $C/fix/wing-a 930701 0.58 0.30 wingfix 2>&1 | tail -c 300
python repair.py blend $C/sin/b1.full.png $C/fix/wing-a wing $C/fix/b1-w.png
$PY -s gen.py mouth $C/sin/b1.base.png $C/fix/fix-cheek.png $C/fix/b1-w.png $C/fix/fix-cheek-full.png $C/fix/cheek-a 930711 0.55 0.30 cheekfix 2>&1 | tail -c 300
python repair.py blend $C/fix/b1-w.png $C/fix/cheek-a cheek $C/fix/b1-wc.png
echo DONE
