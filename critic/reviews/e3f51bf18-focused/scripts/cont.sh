#!/bin/bash
cd /d/pyrefly-release55
for c in yunalesca braskas-final-aeon seymour-anima-macalania seymour-natus isaaru-via-purifico ffx2-trema ffx2-den-of-woe; do
  echo "=== START $c $(date -u +%T)"
  PYREFLY_BROWSER=gpu node /d/Tools/pyrefly-scratch/2026-10-30/r69-focused/scripts/withlock.mjs 20 /d/pyrefly-release55 -- node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5871/ --evidence="D:/pyrefly-release55/critic/reviews/e3f51bf18-focused/continuity" --chapters=$c --summary=continuity-summary-$c.json --tag=e3f51bf18 2>&1 | tail -6
  echo "=== END $c $(date -u +%T)"
done
echo CONT-ALL-DONE
