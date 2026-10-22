#!/bin/bash
# run_holds.sh : the real-game recordings of both party rigs still owed, in FEW holds of the shared RIG-RECORD slot (waitslot.mjs runs the `++`-separated recordings one after the other under one hold;
# a hold is at most 10 minutes, so each hold carries about 6 to 8 minutes of recording). Order: A the Tidus victory (rig off) + the Tidus hit and KO (rig on and off), B Rikku motion rig on (done once; its cast stalled), C Rikku motion rig on AND off (the cast fixed: the others take their turns while it plays; no victory in Chapter IV),
# D the Rikku hit and KO (rig on and off). FFX-2 runs hold the ATB while a menu is up (wait=hold). Only the two pilot rigs are served (D:/pyrefly-art-rigs-pilots).
# Output: rec/<fig>/{motion,motion-off,hurtko,hurtko-off}, rec/tidus-v/motion[-off] (the victory alone); logs rec/_holds/*.log. Then `clips.py` cuts the mp4s.
cd /d/pyrefly-rig-rikkudk || exit 1
R=D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/rec
export PYREFLY_BROWSER=gpu PILOTS_MAX_MINUTES=10
C="--repo D:/pyrefly-rig-rikkudk --rigs-dir D:/pyrefly-art-rigs-pilots"
T="--subject tidus-x --alias tidus=tidus-x $C"
K="--subject rikku-dark-knight-x --alias rikku-dark-knight=rikku-dark-knight-x $C"
mkdir -p $R/_holds
FIRST=${1:-A}
hold() { # name, then the run segments (waitslot syntax)
  local name=$1; shift
  [[ "$FIRST" > "$name" ]] && return
  node tools/rig/lane/party/waitslot.mjs $R/_holds/$name-rec-$RANDOM.log -- "$@" > $R/_holds/$name-waiter-$RANDOM.log 2>&1
}
hold A MOTION_TURNS=none $T --out $R/tidus-v --modes motion --only-off ++ $T --out $R/tidus --modes hurtko --off
hold B PYREFLY_LANE_QUERY=wait=hold $K --out $R/rikku --modes motion
hold C PYREFLY_LANE_QUERY=wait=hold $K --out $R/rikku --modes motion --off
hold D PYREFLY_LANE_QUERY=wait=hold $K --out $R/rikku --modes hurtko --off
# E (after A to D): Rikku motion rig on AND off again (the cast fixed) and the Tidus cast alone, rig on and off (the fx part: the ring and the swirl no longer ride the legs). Run with `run_holds.sh E`.
hold E PYREFLY_LANE_QUERY=wait=hold $K --out $R/rikku --modes motion --off ++ MOTION_TURNS=cast $T --out $R/tidus-c --modes motion --off
