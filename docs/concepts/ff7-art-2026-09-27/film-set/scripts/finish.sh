#!/bin/bash
# Film set: one pick from a full render to a checked cut-out at its subject's idle scale.
#   1. final-cut.mjs (round 2: rembg, defringe, then BOTH checks)          -> <dir>/cut-<name>.raw.png + .json
#   2. derim.py (party only: no rim on the edges facing left)             -> <dir>/cut-<name>.png
#   3. scale.py (resample to the idle's scale; facing, baseline, sidecar)
#   4. recheck.mjs (hi-fi: both checks again on the FINAL file)
# Usage: finish.sh <subject> <full.png> <out-dir> <name> <scale> <facing> [derim=1]
set -e
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
SUB=$1; FULL=$2; DIR=$3; NAME=$4; SCALE=$5; FACING=$6; DERIM=${7:-1}
FC=./cut2.mjs
RC=../../hifi/scripts/recheck.mjs
PROV=${FULL%.full.png}.prov.json
mkdir -p "$DIR"
node $FC "$FULL" "$DIR/cut-$NAME.raw.png" "$PROV" | tail -c 300 || true
if [ "$DERIM" = "1" ]; then
  $PY -s derim.py "$DIR/cut-$NAME.raw.png" "$DIR/cut-$NAME.png" > "$DIR/cut-$NAME.derim.json"
else
  cp "$DIR/cut-$NAME.raw.png" "$DIR/cut-$NAME.png"; echo '{"step":"derim","skipped":true}' > "$DIR/cut-$NAME.derim.json"
fi
$PY -s scale.py "$DIR/cut-$NAME.png" "$DIR/cut-$NAME.raw.json" "$SCALE" "$FACING" "$SUB" > "$DIR/cut-$NAME.scale.json"
node $RC "$DIR/cut-$NAME.png" "$DIR/cut-$NAME.scaled.json" "$(cat "$DIR/cut-$NAME.derim.json")"
