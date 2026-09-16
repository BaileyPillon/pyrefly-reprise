#!/usr/bin/env bash
# promote <subject-dir> <variant-stem> <final-state>
# Copies <variant>.png/.json to <state>.png/.json, then removes every numbered
# variant and every *.raw.png for that subject.
set -e
D="$1"; V="$2"; S="$3"
cp "$D/$V.png" "$D/$S.png"
cp "$D/$V.json" "$D/$S.json"
echo "promoted $D/$V -> $S"
