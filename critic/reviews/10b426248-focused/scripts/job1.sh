#!/bin/bash
cd /d/Tools/pyrefly-scratch/2026-11-01/r71-focused/scripts
B=http://127.0.0.1:5871/
export PYREFLY_BROWSER=gpu
for c in evrae-airship sin-face mirror-aeons ffx2-vegnagun-shuyin ffx2-fallen-aeons ffx2-ixion-djose braskas-final-aeon; do
  echo "=== $c 1600 $(date -u +%T)"; node play.mjs --chapter=$c --base=$B --w=1600 --h=900 --tag=p-$c-1600 2>&1 | tail -3
done
for c in sin-face ffx2-ixion-djose mirror-aeons; do
  echo "=== $c 2000 $(date -u +%T)"; node play.mjs --chapter=$c --base=$B --w=2000 --h=1012 --tag=p-$c-2000 2>&1 | tail -3
done
echo "=== sin-face phone"; node play.mjs --chapter=sin-face --base=$B --w=390 --h=844 --phone --tag=p-sin-face-390 2>&1 | tail -3
for c in seymour-flux ffx2-bahamut yojimbo-cavern seymour-omnis; do
  echo "=== $c ctrl 1600 $(date -u +%T)"; node play.mjs --chapter=$c --base=$B --w=1600 --h=900 --tag=p-$c-1600 2>&1 | tail -3
done
echo JOB1-DONE
