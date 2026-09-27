#!/bin/bash
# Film set, repair round, Barret:
#   squat/punch/hurt: the gatling becomes the idle's (four barrels in a 2x2 cluster, the stepped steel cylinder), from a
#   crop of our own idle cut-out as image 2 (patch2.py); squat also loses the extra steel band on the near upper arm.
#   aim: a new render on our fixed idle (poses2.py: taller canvas, the idle's face, no back rim). Fire follows as an edit.
# Pilot 2 (two seeds each); every result is LOOKED at before a pick.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
GUNREF="$C/idle/cut-p1.png@230,600,1155,1040"
GUN="In image 1, the gun-arm (the grafted gatling that replaces his right forearm below the elbow) becomes exactly the gatling of image 2: the same stepped steel cylinder with the same ring bands at the elbow, and exactly FOUR barrels in one 2 by 2 cluster, the same dark steel colour, highlights and detail, pointing the SAME direction as the gun-arm points now. There is only this one gun, attached at his elbow, with no hand and nothing else beside it. Keep his upper arm, body, left arm and hand, vest and trousers unchanged."
UPPER="In the middle of image 1, the steel band around the upper arm is removed: that part of the upper arm is bare muscular skin with the same skin tone and shading as the rest of the arm."
run() { REFS="$1" FEATHER=${FEATHER:-16} WHAT="$2" $PY -s patch2.py "${@:3}" | tail -c 120; echo; }
for k in 1 2; do
  run "$GUNREF" "gatling: the idle's four-barrel gun-arm, pointing down" $C/punch/p6.full.png $C/punch/p6x$k.full.png 175 975 565 1885 120 79210$k "$GUN The gun-arm hangs straight down at his side, the barrels pointing at the floor."
  run "$GUNREF" "gatling: the idle's four-barrel gun-arm (one gun, not two)" $C/hurt/p3.full.png $C/hurt/p3x$k.full.png 145 900 655 1745 120 79220$k "$GUN The gun-arm is dropped low and hangs down in front of his thigh, the barrels pointing down."
  run "$GUNREF" "gatling: the idle's four-barrel gun-arm, no box magazine" $C/squat/p4.full.png $C/squat/p4a$k.full.png 355 700 1485 1455 120 79230$k "$GUN The gun-arm rests across his knee pointing down and forward to the right. No box magazine under it."
  run "" "near upper arm: the extra steel band became bare skin" $C/squat/p4a$k.full.png $C/squat/p4x$k.full.png 220 850 440 965 140 79231$k "$UPPER"
  $PY -s poses2.py barret aim $C/aim/r$k 79240$k 2>&1 | tail -c 120
done
echo DONE
