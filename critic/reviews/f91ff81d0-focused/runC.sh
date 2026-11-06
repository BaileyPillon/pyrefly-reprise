#!/bin/bash
cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
export PYREFLY_QUERY='?coach=off'
D=critic/reviews/f91ff81d0-focused
for c in seymour-flux ffx2-bahamut evrae-airship seymour-omnis sin-fins-core; do
  mins=12; [ $c = sin-fins-core ] && mins=20
  bash $D/lock.sh take $mins || exit 1
  node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5871/ --evidence="D:/pyrefly-release55/critic/reviews/f91ff81d0-focused/continuity/$c" --chapters=$c --tag=f91ff81d0
  echo "DONE $c rc=$?"
  bash $D/lock.sh drop
  sleep 100
done
echo ALLDONE
