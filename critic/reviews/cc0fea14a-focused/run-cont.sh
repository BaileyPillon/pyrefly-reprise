#!/bin/bash
# continuity harness one chapter at a time under the RIG-RECORD lock (maxMinutes 20 each)
cd /d/pyrefly-release55
L=<scratch>/RIG-RECORD
EV="critic/reviews/cc0fea14a-focused/continuity"
for ch in "$@"; do
  until ( set -o noclobber; echo "{\"who\":\"r62 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":20}" > $L ) 2>/dev/null; do sleep 20; done
  echo "=== $ch start $(date +%T)"
  PYREFLY_BROWSER=gpu timeout 1500 node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5471/ --evidence="$EV" --chapters=$ch --tag=cc0fea14a --summary=continuity-summary-$ch.json 2>&1 | tail -4 | cut -c1-600
  mv $L <scratch>/RIG-RECORD.r62-focused-last-release 2>/dev/null
  echo "=== $ch done $(date +%T)"
done
echo ALLDONE
