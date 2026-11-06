#!/bin/bash
cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
D=critic/reviews/f91ff81d0-focused
for ch in spectral-keeper ffx2-fallen-maesters; do
  bash $D/lock.sh take 10 || exit 1
  echo "== $ch 1600"; node $D/job-hidden.mjs $ch 1600 900 8 2>&1 | tail -40
  bash $D/lock.sh drop
  sleep 100
done
echo ALLDONE
