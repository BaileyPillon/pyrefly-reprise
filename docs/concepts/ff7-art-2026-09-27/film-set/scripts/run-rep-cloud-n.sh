#!/bin/bash
# Film set, repair round, Cloud fist pump (on p2x2, the upper-arm band already off): the far wrist, second try (the
# first box missed the top of the pale band; LOOK showed a red-pink smear above the glove cuff), then the scribble on
# the near boot's folded cuff.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
FAR="In the middle of image 1: the forearm is bare skin with normal warm skin shading right down to the plain dark brown leather cuff of his fingerless glove at the wrist. No pink or red band, no white band, no smear, no metal."
BOOT="In the middle of image 1, the folded-over top cuff of the brown leather boot is plain leather with a clean stitched edge: remove the scribbled marks. No lettering, no symbols."
for k in 1 2; do
  REFS="" FEATHER=12 MATCH=1 WHAT="far (LEFT) wrist: the pink-red smear above the glove cuff became skin" $PY -s patch2.py $C/fistpump/p2x2.full.png $C/fistpump/p2f$k.full.png 955 995 1115 1145 140 79132$k "$FAR" | tail -c 40; echo
  REFS="" FEATHER=10 MATCH=1 WHAT="near boot cuff: the scribble painted out" $PY -s patch2.py $C/fistpump/p2f$k.full.png $C/fistpump/p2b$k.full.png 375 1875 485 1995 130 79133$k "$BOOT" | tail -c 40; echo
done
echo DONE
