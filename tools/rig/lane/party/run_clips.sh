#!/bin/bash
# run_clips.sh [first job index] : the real-game recordings of both party rigs, one polite hold of the shared RIG-RECORD slot at a time (waitslot.mjs: waits while the slot is held or reserved, takes a reservation written after
# we began waiting, 90 s between our holds, 10 minutes a hold). Only the two pilot rigs are served (D:/pyrefly-art-rigs-pilots: copies of tidus-x and rikku-dark-knight-x), so no other rig is in the picture.
# Output: D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/rec/<fig>/{motion,motion-off,hurtko,hurtko-off}; logs rec/<fig>/job-*.log. Then `clips.py` cuts the mp4s.
cd /d/pyrefly-rig-rikkudk || exit 1
R=D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/rec
export PYREFLY_BROWSER=gpu PILOTS_MAX_MINUTES=10
FIRST=${1:-1}
N=0
job() { # name subject alias modes extra...
  N=$((N+1)); [ $N -lt $FIRST ] && return
  local name=$1 subj=$2 alias=$3 modes=$4; shift 4
  mkdir -p $R/$name
  node tools/rig/lane/party/waitslot.mjs $R/$name/job-$modes-$RANDOM.log -- --subject $subj --out $R/$name --modes $modes --alias $alias --rigs-dir D:/pyrefly-art-rigs-pilots --repo D:/pyrefly-rig-rikkudk "$@" > $R/$name/waiter-$modes-$RANDOM.log 2>&1
}
job tidus tidus-x tidus=tidus-x motion
job tidus tidus-x tidus=tidus-x motion --only-off
export PYREFLY_LANE_QUERY=wait=hold
job rikku rikku-dark-knight-x rikku-dark-knight=rikku-dark-knight-x motion
job rikku rikku-dark-knight-x rikku-dark-knight=rikku-dark-knight-x motion --only-off
unset PYREFLY_LANE_QUERY
job tidus tidus-x tidus=tidus-x hurtko
job tidus tidus-x tidus=tidus-x hurtko --only-off
export PYREFLY_LANE_QUERY=wait=hold
job rikku rikku-dark-knight-x rikku-dark-knight=rikku-dark-knight-x hurtko
job rikku rikku-dark-knight-x rikku-dark-knight=rikku-dark-knight-x hurtko --only-off
