#!/bin/bash
cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
E="D:/pyrefly-release55/critic/reviews/04631aedf-focused"
sleep 95
for c in seymour-flux ffx2-bahamut; do
  while ! bash .r67-lock.sh take | grep -q taken; do sleep 20; done
  node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5871/ --evidence="$E/continuity" --chapters=$c --tag=04631aedf
  echo "DONE $c rc=$?"
  bash .r67-lock.sh drop
  sleep 95
done
echo ALLDONE
