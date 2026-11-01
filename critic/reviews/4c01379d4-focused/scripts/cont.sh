#!/bin/bash
cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
for c in evrae-airship sin-face mirror-aeons; do
  echo "=== START $c $(date -u +%T)"
  node /d/Tools/pyrefly-scratch/2026-10-30/r69-focused/scripts/withlock.mjs 20 /d/pyrefly-release55 -- node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5877/ --evidence="D:/pyrefly-release55/critic/reviews/4c01379d4-focused/continuity" --chapters=$c --summary=continuity-summary-$c.json --tag=4c01379d4 2>&1 | tail -4
  echo "=== END $c $(date -u +%T)"
  sleep 95
done
echo CONT-ALL-DONE
