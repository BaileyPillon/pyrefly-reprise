#!/bin/bash
# run_holds_v1.sh [first hold] : the real-game recordings of the pilot rigs RE-CUT on the approved v1 colour-lock paintings (art/APPROVED.json), in three holds of the shared RIG-RECORD slot.
# The tree's public/art must point at the merged art folder (mkmerged.py: r61 with the approved Tidus and Rikku paintings) and D:/pyrefly-art-rigs-pilots must hold tidus-x-t1 and rikku-dark-knight-x-v1.
# H1 Tidus motion rig on and off (the turns; a scripted blow KOs him after the cast, so no victory here); H2 Rikku motion rig on and off (no victory pose in Chapter IV) + the Tidus cast alone (its victory works); H3 the Rikku hit and KO; H4 the Tidus hit and KO.
cd /d/pyrefly-rig-rikkudk || exit 1
R=D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/rec-v1
export PYREFLY_BROWSER=gpu PILOTS_MAX_MINUTES=10
C="--repo D:/pyrefly-rig-rikkudk --rigs-dir D:/pyrefly-art-rigs-pilots"
T="--subject tidus-x --alias tidus=tidus-x-t1 $C"
K="--subject rikku-dark-knight-x --alias rikku-dark-knight=rikku-dark-knight-x-v1 $C"
mkdir -p $R/_holds
FIRST=${1:-H1}
hold() {
  local name=$1; shift
  [[ "$FIRST" > "$name" ]] && return
  node tools/rig/lane/party/waitslot.mjs $R/_holds/$name-rec-$RANDOM.log -- "$@" > $R/_holds/$name-waiter-$RANDOM.log 2>&1
}
hold H1 $T --out $R/tidus --modes motion --off
hold H2 PYREFLY_LANE_QUERY=wait=hold $K --out $R/rikku --modes motion --off ++ MOTION_TURNS=cast $T --out $R/tidus-c --modes motion --off
hold H3 PYREFLY_LANE_QUERY=wait=hold $K --out $R/rikku --modes hurtko --off
hold H4 $T --out $R/tidus --modes hurtko --off
