#!/usr/bin/env bash
# Valefor options 2026-09-27/28. Gentle GPU: one prompt at a time, only while ComfyUI's queue is empty.
# usage: run.sh <option A|B|C> <seed> [<seed> ...]
set -u
cd "D:/Final Fantasy"
OUT="D:/Tools/pyrefly-art-backup/candidates/2026-09-27-valefor"
FP='(from side:1.15), three-quarter view, (looking at viewer:1.2)'
ANTIBG='cropped, cropped wings, out of frame, close-up, pedestal, rock, floor, ground, glowing background, light burst, backlight, white glow, glowing aura, magic circle'
WHITE='white smoke, smoke, mist, cloud, white cloud, white flames, white energy, glowing white, white aura, spotlight, glowing orb, white circle, backlit'
COMMON_NEG="fire, flames, burning, phoenix, embers, extra heads, two heads, extra wings, four wings, three wings, extra limbs, two tails, extra tail, second tail, feathered tail, fan tail, plume, humanoid, 1girl, 1boy, $WHITE, $ANTIBG"
POSE='standing on the ground, wings half spread, long neck raised, head turned toward the viewer, talons planted, exactly two wings, one head, one single long scaly tail, zoomed out, the whole creature inside the frame, wingtips inside the frame, clear empty margin around every wingtip, nothing cropped, plain empty white background'

opt="$1"; shift
case "$opt" in
  A)
    TAGS='no humans, monster, solo, single creature, avian creature, large bird, two large feathered dragon wings, dragon-like wings, crimson red feathers, red plumage, deep red body, cream white underbelly, golden tan underwing membrane, long neck, short hooked ivory beak, strong sharp ivory talons, long scaly lizard tail, yellow eyes, aeon, final fantasy x'
    EMPH='(crimson red plumage:1.3), (cream white underbelly:1.15), (one head:1.25)'
    NEG="orange feathers, yellow feathers, teal, green feathers, blue feathers, $COMMON_NEG"
    ;;
  B)
    TAGS='no humans, monster, solo, single creature, avian creature, part bird part dragon, two large dragon-like wings, bat-like wing membranes, golden tan wing membrane, red feathers on the neck and chest, red feather crest, red feathered wing arms, dark slate blue scaly skin, scaly legs, long dark scaly lizard tail, long neck, short hooked ivory beak, strong sharp ivory talons, yellow eyes, aeon, final fantasy x'
    EMPH='(red feathers on neck and wings:1.25), (dark slate scaly skin:1.2), (one head:1.25)'
    NEG="orange feathers, teal, green feathers, turquoise, white feathers, $COMMON_NEG"
    ;;
  C)
    TAGS='no humans, monster, solo, single creature, avian creature, bird, two large feathered dragon-like wings, red feathers on the head neck and wing edges, red feather crest, teal blue green body plumage, turquoise body, cream white underbelly, golden tan underwing membrane, banded striped scaly tail, long neck, short hooked dark beak, sharp talons, long lizard tail, yellow eyes, aeon, final fantasy x'
    EMPH='(red feathers:1.2), (teal blue green body:1.2), (long scaly lizard tail:1.2)'
    NEG="rainbow, multicolored, iridescent, yellow feathers, gold feathers, purple feathers, pink, orange feathers, pale cyan, white feathers, $COMMON_NEG"
    ;;
  *) echo "bad option"; exit 2;;
esac
mkdir -p "$OUT/$opt"
for seed in "$@"; do
  # wait until nothing is running or pending on the shared ComfyUI
  while :; do
    q=$(curl -s -m 5 http://127.0.0.1:8188/queue)
    if echo "$q" | grep -q '"queue_running": \[\], "queue_pending": \[\]'; then break; fi
    echo "[wait] ComfyUI busy; retry in 20 s"; sleep 20
  done
  echo "=== option $opt seed $seed ==="
  node tools/gen/comfy.mjs boss --name valefor --pose "opt$opt" \
    --size ${SIZE:-1216x832} --composition boss --nonBiped --facing left --facingPhrase "$FP" \
    --tags "$TAGS" --poseTags "$POSE" --emphasis "$EMPH" --negAdd "$NEG" \
    --out "$OUT/$opt/idle-$seed.png" --batch 1 --seed "$seed" --keepBad 2>&1 | tail -8
done
