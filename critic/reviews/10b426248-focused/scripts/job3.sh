#!/bin/bash
cd /d/Tools/pyrefly-scratch/2026-11-01/r71-focused/scripts
export PYREFLY_BROWSER=gpu
L=https://echoesofspira.com/
for c in sin-face seymour-flux ffx2-bahamut yojimbo-cavern seymour-omnis; do
  echo "=== live $c"; node play.mjs --chapter=$c --base=$L --w=1600 --h=900 --tag=L-$c-1600 2>&1 | tail -2
done
echo JOB3-DONE
