#!/bin/bash
# Film set, repair round, Cloud small finishing repairs after LOOKING at the cut-outs at 1:1:
#  strike p1x2: the strap under the grafted-style pauldron came out bright red (it is brown leather everywhere else);
#  hurt p3y2: the glyph-like scratch marks on the blade (the judge's minor note).
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
STRAP="In the middle of image 1, the red strap under the shoulder plate is the same dark brown leather strap as his other straps, with its metal buckle. Keep the shoulder plate, the arm and the shirt exactly as they are."
BLADE="In the middle of image 1, the steel blade of the sword is clean brushed steel with smooth shading: remove the dark scratch marks and squiggles on it. Keep the blade's shape, edges and highlights."
for k in 1 2; do
  REFS="" FEATHER=10 MATCH=0 WHAT="strap under the pauldron: red became the brown leather of his other straps" $PY -s patch2.py $C/strike/p1x2.full.png $C/strike/p1y$k.full.png 700 460 800 640 130 79470$k "$STRAP" | tail -c 40; echo
  REFS="" FEATHER=10 MATCH=1 WHAT="blade: glyph-like scratch marks taken off" $PY -s patch2.py $C/hurt/p3y2.full.png $C/hurt/p3z$k.full.png 255 1530 410 1680 130 79480$k "$BLADE" | tail -c 40; echo
done
echo DONE
