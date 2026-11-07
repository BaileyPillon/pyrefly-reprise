#!/bin/bash
# continuity harness one chapter at a time under the RIG-RECORD lock (maxMinutes 20 each)
cd /d/pyrefly-release55
L=D:/Tools/pyrefly-scratch/RIG-RECORD
EV="D:/pyrefly-release55/critic/reviews/36b6e851d-focused/continuity"
for ch in "$@"; do
  until ( set -o noclobber; echo "{\"who\":\"r76 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":20}" > $L ) 2>/dev/null; do sleep 20; done
  echo "=== $ch start $(date +%T)"
  PYREFLY_BROWSER=gpu timeout 1500 node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5471/ --evidence="$EV" --chapters=$ch --tag=36b6e851d --summary=continuity-summary-$ch.json 2>&1 | tail -4 | cut -c1-600
  mv $L D:/Tools/pyrefly-scratch/RIG-RECORD.r76-focused-last-release 2>/dev/null
  echo "=== $ch done $(date +%T)"
done
echo ALLDONE
