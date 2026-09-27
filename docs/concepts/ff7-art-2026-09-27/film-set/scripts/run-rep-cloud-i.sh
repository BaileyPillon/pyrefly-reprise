#!/bin/bash
# Film set, repair round, Cloud wind-up and spin, after LOOKING at every re-render and edit (r1-r2, e1-e2, f1-f2):
#  - wind-up: none of the new ones is canon (a second blade, the band on the far arm, a smaller head), so the old pick
#    p6 is repaired: its only visible arm comes from under the pauldron, so its white band becomes the brown glove cuff
#    (the near right wrist is hidden behind it, which is canon); its dome pauldron comes OFF (the idle's goes on by graft.py);
#    its red forearm and green front are code steps (skinmatch.py, degreen.py) in the finish.
#  - spin: f2 (the fist pump's own body, the near fist with the band holds the sword up, the far wrist only the glove);
#    its plain square pauldron comes OFF for the idle's.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
FAR="In the middle of image 1, the white band on the wrist just below the gloved hand becomes the plain dark brown leather cuff of his fingerless glove, snug on the wrist, with bare skin of the forearm below it. No white band, no metal."
OFF="In the middle of image 1, remove the metal shoulder plate completely: his shoulder there is bare skin, the rounded top of a muscular shoulder and upper arm, with the dark knit shirt's armhole and the brown leather strap exactly as before. Nothing else on the shoulder, no armour, no spikes."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="the visible (far, LEFT) wrist: the white band became the brown glove cuff" $PY -s patch2.py $C/windup/p6.full.png $C/windup/p6a$k.full.png 460 580 595 695 140 79380$k "$FAR" | tail -c 60; echo
  REFS="" FEATHER=14 MATCH=0 WHAT="step 1: the dome pauldron taken off" $PY -s patch2.py $C/windup/p6a$k.full.png $C/windup/p6o$k.full.png 895 595 1105 830 150 79381$k "$OFF" | tail -c 60; echo
  REFS="" FEATHER=14 MATCH=0 WHAT="step 1: the square pauldron taken off" $PY -s patch2.py $C/spin/f2.full.png $C/spin/f2o$k.full.png 835 555 1045 855 150 79390$k "$OFF" | tail -c 60; echo
done
echo DONE
