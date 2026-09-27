#!/bin/bash
# Film set, repair round: one pick from a full render to a checked cut-out at its subject's idle scale.
#   cut2.mjs (rembg max of two models, defringe, both checks) -> defloor.py (floor shadow round the feet)
#   -> trim.py (studio-grey shell round the figure) -> derim.py (rim off the back edges; PALE, FACE env)
#   -> inkback.py (party only, when INKBOX is set: a band outside the ink line on the back edges becomes ink)
#   -> scale.py (the idle's scale; facing, baseline, sidecar) -> merge-steps.py -> recheck.mjs (both checks, final file)
#   -> degreen.py (DGBOX: green tint off named parts) -> skinmatch.py (SKINREF: the idle's skin tone)
# Usage: finish2.sh <subject> <full.png> <out-dir> <name> <scale> <facing>
#   env KEYBOX=x0,y0,x1,y1 (keycut.py) DFVLO=.. (defloor's lowest value) SKIPCUT=1
#   env PALE=1 FACE=.. (derim) INKBOX=.. INKBAND=.. INKFACE=.. (inkback) DGBOX=.. DGMIN=.. DGMODE=.. SKINREF=.. BAND=.. (defloor) DERIM=0
set -e
cd "$(dirname "$0")"
PY=D:/Tools/ComfyUI/python_embeded/python.exe
SUB=$1; FULL=$2; DIR=$3; NAME=$4; SCALE=$5; FACING=$6
P=$DIR/cut-$NAME
PROV=${FULL%.full.png}.prov.json
if [ -z "$SKIPCUT" ]; then node ./cut2.mjs "$FULL" "$P.raw.png" "$PROV" | tail -c 400 || true; fi
if [ -n "$KEYBOX" ]; then   # a region both rembg models failed: re-cut by colour key (after flatbg.py on the full render)
  $PY -s keycut.py "$FULL" "$P.raw.png" "$P.raw.json" "$KEYBOX" "$P.raw.png" > "$P.keycut.json"
fi
$PY -s defloor.py "$P.raw.png" "$P.floor.png" "${BAND:-0.10}" "${DFVLO:-22}" > "$P.defloor.json"
BOX="$TRIMBOX" $PY -s trim.py "$P.floor.png" "$P.trim.png" > "$P.trim.json"   # TRIMBOX: limit the trim (a grey blade on the grey studio)
if [ "${DERIM:-1}" = "1" ]; then
  PALE=${PALE:-0} $PY -s derim.py "$P.trim.png" "$P.png" > "$P.derim.json"
else
  cp "$P.trim.png" "$P.png"; echo '{"step":"derim","skipped":true}' > "$P.derim.json"
fi
STEPS="$P.defloor.json $P.trim.json $P.derim.json"
if [ -n "$INKBOX" ]; then
  BOX="$INKBOX" $PY -s inkback.py "$P.png" "$P.png" > "$P.inkback.json"; STEPS="$STEPS $P.inkback.json"
fi
if [ -n "$DGBOX" ]; then
  BOX="$DGBOX" MIN=${DGMIN:-18} MODE=${DGMODE:-grey} $PY -s degreen.py "$P.png" "$P.png" > "$P.degreen.json"; STEPS="$STEPS $P.degreen.json"
fi
if [ -n "$RMA" ]; then   # regionmatch.py: the repainted part (RMA) takes the colours of the same material (RMB)
  $PY -s regionmatch.py "$P.png" "$P.png" "$RMA" "$RMB" "${RMWHAT:-repainted part matched to the same material}" > "$P.rmatch.json"; STEPS="$STEPS $P.rmatch.json"
fi
if [ -n "$SKINREF" ]; then
  $PY -s skinmatch.py "$P.png" "$SKINREF" "$P.png" > "$P.skin.json"; STEPS="$STEPS $P.skin.json"
fi
$PY -s scale.py "$P.png" "$P.raw.json" "$SCALE" "$FACING" "$SUB" > "$P.scale.json"
$PY -s merge-steps.py "$P.png" "$P.scaled.json" $STEPS
node ../../hifi/scripts/recheck.mjs "$P.png" "$P.base.json"
