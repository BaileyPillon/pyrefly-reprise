#!/bin/bash
# Pass 1 (2026-09-29, FFX only): the plates. The flight plate for links 1-2 (a masked repaint of round 3's plate p6
# above its deck, so the deck is kept), the link-3 plate on Sin's back (whole img2img from our sketch), and the two
# link-4 backdrop options (SDXL img2img from our own approved Evrae plate, graded to dusk, with our Bevelle sketch).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin
R3=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3
g() { $PY -s gen.py "$@" 2>&1 | tail -c 300; }
g mouth $C/sketches/flight-comp.png $C/sketches/flight-mask.png $R3/plate/p6.full.png $C/sketches/flight-mask-full.png $C/plates/flight-1 290101 0.74 0.28 flight
g whole zimg $C/sketches/back-sketch.png $C/plates/back-1 290201 0.72 1.75 0.28 back
g whole sdxl $C/sketches/bk-a-init.png $C/backdrop/bk-a-1 290301 0.55 1.75 0.30 bk-a
g whole sdxl $C/sketches/bk-b-init.png $C/backdrop/bk-b-1 290401 0.55 1.75 0.30 bk-b
g mouth $C/sketches/flight-comp.png $C/sketches/flight-mask.png $R3/plate/p6.full.png $C/sketches/flight-mask-full.png $C/plates/flight-2 290111 0.82 0.28 flight
g whole zimg $C/sketches/back-sketch.png $C/plates/back-2 290211 0.80 1.75 0.28 back
g whole sdxl $C/sketches/bk-a-init.png $C/backdrop/bk-a-2 290311 0.62 1.75 0.30 bk-a
g whole sdxl $C/sketches/bk-b-init.png $C/backdrop/bk-b-2 290411 0.62 1.75 0.30 bk-b
echo DONE
