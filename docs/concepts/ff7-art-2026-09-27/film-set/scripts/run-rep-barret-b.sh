#!/bin/bash
# Film set, repair round, Barret gatling, second try (LOOK at run-rep-barret-a.sh: four barrels right, but the repaint
# grew a bright red bare forearm between the elbow and the gun, and shifted the trouser green): the box now starts
# BELOW the elbow rings, so the elbow junction stays the render's own; the prompt says there is no forearm skin; the
# repaint's colours are matched to the source (MATCH=1). Two seeds each; LOOKED at before a pick.
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7-film/barret
GUNREF="$C/idle/cut-p1.png@230,600,1155,1040"
GUN="In image 1, the gun-arm (the grafted gatling that replaces his right forearm) becomes exactly the gatling of image 2: the same stepped steel cylinder with ring bands and exactly FOUR barrels in one 2 by 2 cluster, the same dark steel colour, highlights and detail, pointing the SAME direction as the gun-arm points now. The steel of the gun continues straight on from the steel rings that are already there at the elbow: there is no bare forearm and no skin anywhere on this arm below the elbow. Only this one gun, with no hand and nothing else beside it. Keep his body, left arm and hand, vest and trousers unchanged, with their own colours."
UPPER="In the middle of image 1, the steel band around the upper arm is removed: that part of the upper arm is bare muscular skin with the same skin tone and shading as the rest of the arm."
run() { REFS="$1" FEATHER=16 MATCH=1 WHAT="$2" $PY -s patch2.py "${@:3}" | tail -c 120; echo; }
for k in 3 4; do
  run "$GUNREF" "gatling: the idle's four-barrel gun-arm, pointing down (below the elbow rings)" $C/punch/p6.full.png $C/punch/p6x$k.full.png 170 1060 560 1885 120 79210$k "$GUN The gun-arm hangs straight down at his side, the barrels pointing at the floor."
  run "$GUNREF" "gatling: the idle's four-barrel gun-arm, one gun (below the elbow rings)" $C/hurt/p3.full.png $C/hurt/p3x$k.full.png 140 1000 660 1745 120 79220$k "$GUN The gun-arm is dropped low and hangs down in front of his thigh, the barrels pointing down."
  run "$GUNREF" "gatling: the idle's four-barrel gun-arm, no box magazine (past the elbow rings)" $C/squat/p4.full.png $C/squat/p4a$k.full.png 450 700 1490 1455 120 79230$k "$GUN The gun-arm rests across his knee pointing down and forward to the right. No box magazine under it."
  run "" "near upper arm: the extra steel band became bare skin" $C/squat/p4a$k.full.png $C/squat/p4x$k.full.png 220 850 440 965 140 79231$k "$UPPER"
done
echo DONE
