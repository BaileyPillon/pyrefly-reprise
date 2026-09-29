#!/usr/bin/env bash
# Valefor repair round (2026-09-28): B2 (pale ash body) and B3 (muted teal-green body), both from
# option B's design, PAINTED facing RIGHT (toward Yojimbo when she stands left of the party in
# Chapter IX). Gentle GPU: one prompt at a time, only while ComfyUI's queue is empty, batch 1.
# COMFY_LOG_DIR points at a folder whose restart sentinel is in the future, so comfy.mjs's
# black-frame guard can never restart the shared ComfyUI from this run (it stops instead).
# usage: run-repair.sh <B2|B3> <mode: i2i|txt> <denoise> <seed> [<seed> ...]
set -u
cd "D:/Final Fantasy"
BASE="D:/Tools/pyrefly-art-backup/candidates/2026-09-27-valefor"
OUT="$BASE/repair"
export COMFY_LOG_DIR="$OUT/comfy-logs-norestart"
FP='(from side:1.15), three-quarter view, body facing right, (looking at viewer:1.1)'
ANTIBG='cropped, cropped wings, out of frame, close-up, pedestal, rock, floor, ground, floor shadow, cast shadow, glowing background, light burst, backlight, white glow, glowing aura, magic circle'
WHITE='white smoke, smoke, mist, cloud, white cloud, white flames, white energy, glowing white, white aura, spotlight, glowing orb, white circle, backlit'
COMMON_NEG="fire, flames, burning, phoenix, embers, extra heads, two heads, second head, extra wings, four wings, three wings, extra limbs, six limbs, four legs, extra legs, two tails, extra tail, second tail, forked tail, looped tail, feathered tail, fan tail, plume, humanoid, 1girl, 1boy, facing left, $WHITE, $ANTIBG"
POSE="${POSE:-standing on the ground, wings half spread, long neck raised, head facing right, talons planted, exactly two wings, one head, two legs, one single long scaly tail ending in one pointed tip, zoomed out, the whole creature inside the frame, wingtips inside the frame, clear empty margin around every wingtip, nothing cropped, plain empty white background}"

opt="$1"; mode="$2"; den="$3"; shift 3
case "$opt" in
  B2)
    TAGS='no humans, monster, solo, single creature, avian creature, part bird part dragon, two large dragon-like wings, bat-like wing membranes, crimson red wing membrane, red feathers on the neck and chest, red feather crest, red feathered ruff, pale ash grey scaly skin, light warm grey scales, pale grey wing bones, scaly legs, long pale grey scaly lizard tail, red feather ridge along the tail, cream throat and belly, long neck, short hooked ivory beak, strong sharp dark talons, yellow eyes, aeon, final fantasy x'
    EMPH='(pale ash grey scales:1.25), (red feathers on neck and chest:1.2), (one head:1.25)'
    NEG="black scales, dark scales, slate, navy, blue scales, purple, teal, green, turquoise, orange, gold, white feathers, $COMMON_NEG"
    INIT="$OUT/init/B-init-ash.png"
    ;;
  B3)
    TAGS='no humans, monster, solo, single creature, avian creature, part bird part dragon, two large dragon-like wings, bat-like wing membranes, crimson red wing membrane, red feathers on the neck and chest, red feather crest, red feathered ruff, muted teal green scaly skin, dark teal green scales, scaly legs, long teal green scaly lizard tail, red feather ridge along the tail, cream throat and belly, long neck, short hooked ivory beak, strong sharp dark talons, yellow eyes, aeon, final fantasy x'
    EMPH='(muted teal green scales:1.25), (red feathers on neck and chest:1.2), (one head:1.25)'
    NEG="black scales, slate, navy, purple, bright cyan, neon, turquoise feathers, blue feathers, orange, gold, white feathers, $COMMON_NEG"
    INIT="$OUT/init/B-init-teal.png"
    ;;
  *) echo "bad option"; exit 2;;
esac
mkdir -p "$OUT/$opt"
for seed in "$@"; do
  while :; do
    q=$(curl -s -m 5 http://127.0.0.1:8188/queue)
    if echo "$q" | grep -q '"queue_running": \[\], "queue_pending": \[\]'; then break; fi
    echo "[wait] ComfyUI busy; retry in 20 s"; sleep 20
  done
  tag="$mode"; [ "$mode" = i2i ] && tag="i2i${den/./}"
  echo "=== $opt $tag seed $seed ==="
  EXTRA=()
  [ "$mode" = i2i ] && EXTRA=(--img2img "$INIT" --denoise "$den")
  node tools/gen/comfy.mjs boss --name valefor --pose "rep$opt" \
    --size 1344x768 --composition boss --nonBiped --facing right --facingPhrase "$FP" \
    --tags "$TAGS" --poseTags "$POSE" --emphasis "$EMPH" --negAdd "$NEG" \
    "${EXTRA[@]}" --out "$OUT/$opt/idle-$tag-$seed.png" --batch 1 --seed "$seed" --keepBad 2>&1 | tail -6
done
