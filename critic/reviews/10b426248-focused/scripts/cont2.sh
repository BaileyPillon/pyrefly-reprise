#!/bin/bash
until grep -q "CONT-ALL-DONE" /d/Tools/pyrefly-scratch/2026-11-01/r71-focused/cont.log; do sleep 5; done
cd /d/pyrefly-release55
for c in yunalesca seymour-anima-macalania isaaru-via-purifico ffx2-trema braskas-final-aeon; do
  echo "=== START $c $(date -u +%T)"
  PYREFLY_BROWSER=gpu node /d/Tools/pyrefly-scratch/2026-10-30/r69-focused/scripts/withlock.mjs 40 /d/pyrefly-release55 -- node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --evidence="D:/pyrefly-release55/critic/reviews/e3f51bf18-focused/continuity-live" --chapters=$c --summary=continuity-summary-$c.json --tag=live69 2>&1 | tail -6
  echo "=== END $c $(date -u +%T)"
done
echo CONT2-ALL-DONE
