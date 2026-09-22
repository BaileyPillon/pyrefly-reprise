#!/usr/bin/env bash
# Rebuild the living-portrait v3 frontal layer set end to end from the
# committed specs and the picked inpaint results (no ComfyUI needed).
# Run from the repo root. Picks: job:variant, as recorded in art/v3/fills/provenance.json.
set -euo pipefail
P="${PY:-D:/Tools/ComfyUI/python_embeded/python.exe}"
J=docs/concepts/pause-until-dawn/prototype-v2/art/v3/jobs/out
PICKS="${PICKS:-neck:2 earCollar:src earHair:2 behind:1 face:2}"
"$P" -s tools/gen/rig-masks.py classes
"$P" -s tools/gen/rig-masks.py owners
"$P" -s tools/gen/rig-fill.py plan
rm -f docs/concepts/pause-until-dawn/prototype-v2/art/v3/fills/*.png docs/concepts/pause-until-dawn/prototype-v2/art/v3/fills/provenance.json
JOBS=docs/concepts/pause-until-dawn/prototype-v2/art/v3/jobs
for jp in $PICKS; do
  j="${jp%%:*}"; v="${jp##*:}"
  if [ "$v" = src ]; then pick="$JOBS/$j.src.png"; else pick="$J/$j.$v.full.png"; fi
  "$P" -s tools/gen/rig-fill.py merge --job "$j" --pick "$pick"
done
"$P" -s tools/gen/rig-assemble.py
"$P" -s tools/gen/rig-face.py brows
"$P" -s tools/gen/rig-assemble.py
"$P" -s tools/gen/rig-face.py eyes
"$P" -s tools/gen/rig-face.py browpatches
"$P" -s tools/gen/rig-face.py mouth
# yaw keys: re-place q34-right, merge the picked outpaints, mirror profile-right, cut
OUT=docs/concepts/pause-until-dawn/prototype-v2/art/v3/jobs/out
"$P" -s tools/gen/rig-keys.py replace
"$P" -s tools/gen/rig-keys.py outmerge --key q34-left --pick "$OUT/out-q34-left.2.full.png"
"$P" -s tools/gen/rig-keys.py outmerge --key q34-right --pick "$OUT/out-q34-right.2.full.png"
"$P" -s tools/gen/rig-keys.py mirror
"$P" -s tools/gen/rig-keys.py outmerge --key profile-right --pick "$OUT/out-profile-right.1.full.png"
"$P" -s tools/gen/rig-keys.py cut
"$P" -s tools/gen/rig-json.py
# v3.1 (runtime pass): re-slot the yaw keys so a turn never reverses (q34-right's painting faces LEFT),
# fix the profile eye colours, clean the keys' own collar, then the warp landmarks (art/v3/warp/landmarks.json)
"$P" -s tools/gen/rig-turns.py mirror
"$P" -s tools/gen/rig-turns.py wire
# the turned body: the frontal tassel's footprint inpainted (pick recorded in art/v3/jobs/tassel.merge.json)
"$P" -s tools/gen/rig-collar.py job
"$P" -s tools/gen/rig-collar.py merge --pick "$OUT/tassel2.1.full.png"
