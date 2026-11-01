#!/bin/bash
cd /d/Tools/pyrefly-scratch/2026-11-01/r71-focused/scripts
while ! grep -q SEQ-DONE seq.log; do sleep 10; done
export PYREFLY_BROWSER=gpu
cd /d/pyrefly-release55
B='http://127.0.0.1:5871/?treated=pack&x=/'
for c in sin-face evrae-airship mirror-aeons; do
  echo "=== START $c $(date -u +%T)"
  node /d/Tools/pyrefly-scratch/2026-10-30/r69-focused/scripts/withlock.mjs 45 /d/pyrefly-release55 -- node critic/runner/lib/continuity.mjs --base="$B" --evidence="D:/pyrefly-release55/critic/reviews/10b426248-focused/continuity-control" --chapters=$c --summary=continuity-summary-$c.json --tag=ctrl 2>&1 | tail -6
  echo "=== END $c $(date -u +%T)"
done
echo SEQ2-DONE
