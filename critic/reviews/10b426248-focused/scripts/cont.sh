#!/bin/bash
cd /d/pyrefly-release55
while ! grep -q JOB1-DONE /d/Tools/pyrefly-scratch/2026-11-01/r71-focused/scripts/job1.log; do sleep 10; done
export PYREFLY_BROWSER=gpu
B=${CONT_BASE:-http://127.0.0.1:5871/}
EV=${CONT_EV:-D:/pyrefly-release55/critic/reviews/10b426248-focused/continuity}
TG=${CONT_TAG:-10b426248}
for c in braskas-final-aeon evrae-airship sin-face mirror-aeons ffx2-vegnagun-shuyin ffx2-fallen-aeons ffx2-ixion-djose; do
  echo "=== START $c $(date -u +%T)"
  node /d/Tools/pyrefly-scratch/2026-10-30/r69-focused/scripts/withlock.mjs 20 /d/pyrefly-release55 -- node critic/runner/lib/continuity.mjs --base=$B --evidence="$EV" --chapters=$c --summary=continuity-summary-$c.json --tag=$TG 2>&1 | tail -6
  echo "=== END $c $(date -u +%T)"
done
echo CONT-ALL-DONE
