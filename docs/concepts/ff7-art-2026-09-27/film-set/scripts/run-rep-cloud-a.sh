#!/bin/bash
# Film set, repair round, Cloud local repairs (patch2.py; images 2.. are crops of our own fixed idle, cut-p4x):
#   strike: the pauldron becomes the idle's plate          follow: far-wrist band -> glove cuff, then the pauldron
#   fistpump: the extra band on the near upper arm -> skin, the pale far-wrist band -> glove cuff
#   back: the white SOLDIER band added on the raised near (RIGHT) wrist, then the pauldron      hurt: the pauldron
# Pilot 2 (two seeds per chain); every result is LOOKED at before a pick.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/cloud
IDLE=$C/idle/cut-p4x.png
PAUL="In the middle of image 1, the metal pauldron on his shoulder becomes exactly the pauldron shown in image 2: the same steel shoulder plate with the same shape, layered rim, rivets and spike, turned to fit this shoulder at this angle and about the same size as now. Exactly one pauldron. Keep his hair, face, arms, straps, sword and knit shirt unchanged."
FAR="In the middle of image 1, the white or pale band on the wrist just above the gloved hand becomes the plain dark brown leather cuff of his fingerless glove, snug on the wrist, with bare skin of the forearm above it. No white band, no metal."
UPPER="In the middle of image 1, the white band wrapped around the upper arm near the elbow is removed: that part of the arm is bare skin with the same skin tone and shading as the rest of the arm. Nothing is worn on the upper arm."
NEAR="In the middle of image 1, the raised hand grips the sword hilt. Add a plain white cloth wristband, exactly like the one in image 2, on that wrist just above the brown glove, snug around the wrist. Keep the glove, the hand and the hilt unchanged."
run() { REFS="$1" FEATHER=${FEATHER:-12} MATCH=${MATCH:-0} WHAT="$2" $PY -s patch2.py "${@:3}" | tail -c 160; echo; }
for k in 1 2; do
  # strike: pauldron
  run "$IDLE@440,500,700,800" "pauldron: the idle's plate" $C/strike/p1w756001.full.png $C/strike/p1x$k.full.png 730 420 960 640 160 79110$k "$PAUL"
  # follow: far wrist, then pauldron
  run "" "far (LEFT) wrist: the second white band became the brown glove cuff" $C/follow/p2.full.png $C/follow/p2a$k.full.png 1030 810 1120 910 150 79120$k "$FAR"
  run "$IDLE@440,500,700,800" "pauldron: the idle's plate" $C/follow/p2a$k.full.png $C/follow/p2x$k.full.png 950 470 1100 690 160 79121$k "$PAUL"
  # fistpump: upper-arm band, then far wrist
  run "" "near upper arm: the extra white band became bare skin" $C/fistpump/p2w.full.png $C/fistpump/p2a$k.full.png 395 580 525 730 150 79130$k "$UPPER"
  run "" "far (LEFT) wrist: the pale band became the brown glove cuff" $C/fistpump/p2a$k.full.png $C/fistpump/p2x$k.full.png 965 1060 1095 1155 150 79131$k "$FAR"
  # back: near wrist band, then pauldron
  run "$IDLE@250,920,500,1150" "near (RIGHT) wrist: the white SOLDIER band added" $C/back/p2w.full.png $C/back/p2a$k.full.png 405 630 515 730 150 79140$k "$NEAR"
  run "$IDLE@440,500,700,800" "pauldron: the idle's plate" $C/back/p2a$k.full.png $C/back/p2x$k.full.png 880 540 1080 800 160 79141$k "$PAUL"
  # hurt: pauldron
  run "$IDLE@440,500,700,800" "pauldron: the idle's plate" $C/hurt/p3w.full.png $C/hurt/p3x$k.full.png 870 500 1075 800 160 79150$k "$PAUL"
done
echo DONE
