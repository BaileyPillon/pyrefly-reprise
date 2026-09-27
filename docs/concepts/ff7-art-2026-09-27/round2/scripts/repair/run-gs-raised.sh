#!/bin/bash
# Repair round: Guard Scorpion tail raised, inpainted onto idle-a.2's own render (only the tail is
# masked; see gs-raised-paintover.py). Then cut out and checked by cutout-check.mjs.
cd "D:/Final Fantasy"
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7
S=$C/round2-repair-scratch
OUT=$C/guard-scorpion/round2-repair
mkdir -p "$OUT"
waitq() { while [ "$(curl -s http://127.0.0.1:8188/queue | python -c 'import json,sys;d=json.load(sys.stdin);print(len(d["queue_pending"]))')" -ge 2 ]; do sleep 15; done; }
ID="no humans, robot, mecha, (mechanical scorpion:1.2), giant red security robot, final fantasy vii, (segmented scorpion tail raised high over its back:1.3), (red armor blocks joined by black steel joints:1.2), (laser cannon at the tail tip:1.3), red cylindrical emitter housing with cooling fins, (gun barrel muzzle with a cyan lens:1.2), aimed forward and down, simple background, white background"
NEG="glowing rings, cyan rings on the tail, teal joints, stinger, blade, spike, claw, hook, sickle, human, 1boy, 1girl, lamp, spotlight, flashlight, camera, floor, ground, shadow"
gsr() { waitq; node tools/gen/inpaint.mjs --image "$S/gs2r-paint.png" --mask "$S/gs2r-mask.png" --box 0,0,1216,832 --pad 0 --latent \
  --identity "$ID" --tags "tail raised, detailed mechanical parts" --negAdd "$NEG" --denoise $1 --count $2 --seed $3 --out "$OUT/$4" 2>&1 | grep -E "\->|BLACK|rror|failed"; }
gsr ${1:-0.62} ${2:-1} ${3:-7001} ${4:-pilot-062}
