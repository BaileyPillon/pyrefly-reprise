#!/bin/bash
# Repair round: Barret from the shaded v3 sketch (barret-r2b-sketch.py). Every canon detail the judge
# found missing is in the prompt AND the sketch; the emphasis channel (not escaped) carries the weights,
# because comfy.mjs escapes parentheses in --tags (round 2's "(gun arm:1.3)" carried no weight).
# Usage: bash run-barret.sh <denoise | t2i> <pose> <batch> [seed] [init png in the scratch dir]   (t2i = text-to-image, no sketch)
cd "D:/Final Fantasy"
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7
S=$C/round2-repair-scratch
waitq() { while [ "$(curl -s http://127.0.0.1:8188/queue | python -c 'import json,sys;d=json.load(sys.stdin);print(len(d["queue_pending"]))')" -ge 2 ]; do sleep 15; done; }
BT="1boy, barret wallace, final fantasy vii, safe, solo, male focus, dark-skinned male, very muscular, large heavy-set build, hi-top fade, thick black beard, gun arm, right forearm replaced by a mechanical gatling gun, no right hand, open dirty brown vest, bare chest, bare muscular arms, metal bands on the left forearm, metal bands around the waist, two dog tags on a chain, skull tattoo on left shoulder, silver hoop earring, green pants, large brown boots"
EM="(tall hi-top fade:1.25), (flat top hair:1.1), (skull tattoo on left shoulder:1.2), (six-barrel gatling gun arm:1.25), (metal bands around the waist:1.1), (two dog tags:1.2), (bare fist:1.1), (soft shading:1.15)"
PT="fighting stance, gun arm held forward and aimed ahead, left fist clenched, determined, looking ahead, soft gradient shading, thin lineart"
FP="(from side:1.3), (three-quarter view:1.2), body facing left, looking to the side"
BN="sunglasses, holding gun, holding weapon, two guns, hand on gun, gun in hand, weapon on back, gun on back, backpack, gun over shoulder, mohawk, spiked hair, undercut, shaved head, shirt, collared shirt, white shirt, undershirt, collar, gloves, fingerless gloves, leather belt, belt buckle, strap, sash, holster, cannon, single barrel, thick outlines, bold outlines, heavy lineart, flat color, posterized, western comics, cartoon, looking at viewer, fur collar, fur trim, white collar, tied cloth around the waist, chain belt, chibi, big head"
if [ "$1" = t2i ]; then INIT=(); else INIT=(--img2img "$S/${5:-barret3.png}" --denoise $1); fi
SEED=(); [ -n "$4" ] && SEED=(--seed $4)
waitq
node tools/gen/comfy.mjs character --name ff7-barret --facing left --facingPhrase "$FP" --tags "$BT" --emphasis "$EM" --negAdd "$BN" \
  "${INIT[@]}" "${SEED[@]}" --pose $2 --poseTags "$PT" --out $C/barret/round2-repair/$2.png --batch $3 2>&1 | grep -E "\->|FAIL|black|rror|reject"
