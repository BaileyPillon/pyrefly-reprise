#!/bin/bash
# Film set: finish a pick again from its existing checked raw cut-out (steps 2-4 of finish.sh), after derim.py gained
# the teal pass (all party picks) and the pale pass (PALE=1, Barret), and with the scale read off the lineups
# (headfit.py, stature, and a same-scale lineup by eye):
#   defloor.py (the soft floor shadow round the boots; BAND env, default 0.10 of the height)
#   -> derim.py (rim off the edges facing left) -> scale.py (resample to the idle's scale, sidecar) -> recheck.mjs (both checks)
# Usage: refinish.sh <subject> <dir> <name> <scale> <facing> [pale=0]
set -e
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
SUB=$1; DIR=$2; NAME=$3; SCALE=$4; FACING=$5; PALE=${6:-0}
RC=../../hifi/scripts/recheck.mjs
$PY -s defloor.py "$DIR/cut-$NAME.raw.png" "$DIR/cut-$NAME.floor.png" "${BAND:-0.10}" > "$DIR/cut-$NAME.defloor.json"
PALE=$PALE $PY -s derim.py "$DIR/cut-$NAME.floor.png" "$DIR/cut-$NAME.png" > "$DIR/cut-$NAME.derim.json"
$PY -s scale.py "$DIR/cut-$NAME.png" "$DIR/cut-$NAME.raw.json" "$SCALE" "$FACING" "$SUB" > "$DIR/cut-$NAME.scale.json"
node $RC "$DIR/cut-$NAME.png" "$DIR/cut-$NAME.scaled.json" "$(cat "$DIR/cut-$NAME.defloor.json")"
node $RC "$DIR/cut-$NAME.png" "$DIR/cut-$NAME.json" "$(cat "$DIR/cut-$NAME.derim.json")"
