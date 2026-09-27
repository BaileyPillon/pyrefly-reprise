#!/bin/bash
# Repair round: hi-top fade inpaint on barret/round2-repair/v4-d.1 (crown only; see barret-hair-paintover.py).
# Usage: bash run-barret-hair.sh <denoise> <count> <seed> <name>
cd "D:/Final Fantasy"
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7
S=$C/round2-repair-scratch
waitq() { while [ "$(curl -s http://127.0.0.1:8188/queue | python -c 'import json,sys;d=json.load(sys.stdin);print(len(d["queue_pending"]))')" -ge 2 ]; do sleep 15; done; }
ID="1boy, barret wallace, final fantasy vii, dark-skinned male, (hi-top fade:1.3), (tall flat-top black hair:1.2), short faded sides, thick black beard, simple background, white background"
waitq
node tools/gen/inpaint.mjs --image "$S/barret-hair-paint.png" --mask "$S/barret-hair-mask.png" --box 330,40,190,190 --pad 20 --latent \
  --identity "$ID" --tags "hair" --negAdd "mohawk, spiked hair, hat, cap, afro, dreadlocks" --denoise $1 --count $2 --seed $3 --out "$C/barret/round2-repair/$4" 2>&1 | grep -E "\->|BLACK|rror|failed"
