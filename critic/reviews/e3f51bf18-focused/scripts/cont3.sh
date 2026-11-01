#!/bin/bash
until grep -q "CONT2-ALL-DONE" /d/Tools/pyrefly-scratch/2026-10-31/r70-focused/cont2.log; do sleep 5; done
cd /d/pyrefly-release55
for c in isaaru-via-purifico seymour-anima-macalania; do
  echo "=== START $c $(date -u +%T)"
  PYREFLY_BROWSER=gpu node /d/Tools/pyrefly-scratch/2026-10-30/r69-focused/scripts/withlock.mjs 20 /d/pyrefly-release55 -- node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5871/ --evidence="D:/pyrefly-release55/critic/reviews/e3f51bf18-focused/continuity-rerun" --chapters=$c --summary=continuity-summary-$c.json --tag=e3f51bf18r --seed=2 2>&1 | tail -3
  echo "=== END $c $(date -u +%T)"
done
echo CONT3-ALL-DONE
