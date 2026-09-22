#!/usr/bin/env bash
# Leblanc identity-consistency pilot (2026-09-21). Run from the repo root.
#   bash docs/concepts/chapters/leblanc/pilot/run-pilot.sh A|B
# Method C is one-off and lives in pilot.md.
set -u
cd "$(dirname "$0")/../../../../.." || exit 1

P=docs/concepts/chapters/leblanc/pilot
R="$P/renders"
TAGS="$(cat "$P/identity.txt")"
EMPH='(short blonde bob:1.3), (blue and white triangle pattern robe:1.25), (heart mark on chest:1.2)'
IDLE=public/art/characters/leblanc/idle.png

pose_tags() {
  case "$1" in
    attack) echo "fighting stance, holding fan, outstretched arm, leaning forward, open mouth, looking at viewer" ;;
    cast)   echo "arm up, holding fan, raised hand, standing, looking up, open mouth" ;;
    hurt)   echo "wince, one eye closed, leaning back, arm across chest, holding fan, open mouth" ;;
  esac
}
seed_for() {
  case "$1" in attack) echo 7101 ;; cast) echo 7201 ;; hurt) echo 7301 ;; esac
}

common() {
  echo --name leblanc --facing left --composition full --size 832x1216 --batch 2
}

case "${1:-A}" in
A)
  for pose in attack cast hurt; do
    for w in 0.35 0.45; do
      tag="a$(echo "$w" | tr -d '.')"
      node tools/gen/comfy.mjs character $(common) \
        --pose "$pose" --tags "$TAGS" --emphasis "$EMPH" --poseTags "$(pose_tags "$pose")" \
        --ref "$IDLE" --forceRef --refWeight "$w" --refStart 0.2 --refEnd 0.6 --refWeightType "ease in" \
        --seed "$(seed_for "$pose")" --out "$R/$tag-$pose.png" || echo "FAILED $tag-$pose"
    done
  done
  ;;
B)
  for pose in attack cast hurt; do
    for d in 0.55 0.65; do
      tag="b$(echo "$d" | tr -d '.')"
      node tools/gen/comfy.mjs character $(common) \
        --pose "$pose" --tags "$TAGS" --emphasis "$EMPH" --poseTags "$(pose_tags "$pose")" \
        --img2img "$P/idle-init.png" --denoise "$d" \
        --seed "$(seed_for "$pose")" --out "$R/$tag-$pose.png" || echo "FAILED $tag-$pose"
    done
  done
  ;;
esac
