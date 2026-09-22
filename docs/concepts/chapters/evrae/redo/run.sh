#!/usr/bin/env bash
# usage: run.sh <pose> <seed> "<poseTags>" [extra comfy.mjs args...]
# Evrae redo (FFX only): teal identity from the picked concept B, forced reference at 0.45.
set -e
cd "/d/Final Fantasy"
R=docs/concepts/chapters/evrae/redo
pose=$1; seed=$2; poseTags=$3; shift 3
node tools/gen/comfy.mjs boss --name evrae --pose "$pose" --size 1216x832 \
  --composition boss --nonBiped --facing left \
  --tags "$(cat $R/identity.txt)" --negAdd "$(cat $R/negadd.txt)" \
  --emphasis "(dark teal scales:1.3), (pale tan underbelly:1.15), (crimson red dorsal spines:1.15)" \
  --poseTags "$poseTags" \
  --ref $R/refs/evrae-b-square.png --forceRef --refWeight 0.45 --refStart 0.2 --refEnd 0.6 --refWeightType "ease in" \
  --seed "$seed" --batch 4 \
  --out public/art/characters/evrae/$pose.png --candidateDir $R/cand/$pose/r${ROUND:-1} "$@"
