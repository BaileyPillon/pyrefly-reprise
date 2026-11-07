#!/bin/bash
# continuity harness: <evidence subdir> <base url> <tag> then chapters; one at a time under the RIG-RECORD lock
cd /d/pyrefly-release55
L=D:/Tools/pyrefly-scratch/RIG-RECORD
SUB=$1; BASEURL=$2; TAG=$3; shift 3
EV="D:/pyrefly-release55/critic/reviews/36b6e851d-focused/$SUB"
for ch in "$@"; do
  until ( set -o noclobber; echo "{\"who\":\"r76 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":20}" > $L ) 2>/dev/null; do sleep 20; done
  echo "=== $ch start $(date +%T)"
  PYREFLY_BROWSER=gpu timeout 1500 node critic/runner/lib/continuity.mjs --base=$BASEURL --evidence="$EV" --chapters=$ch --tag=$TAG --summary=continuity-summary-$ch.json 2>&1 | grep -E "CAUGHT|REPORT LINE" | cut -c1-500
  mv $L D:/Tools/pyrefly-scratch/RIG-RECORD.r76-focused-last-release 2>/dev/null
  echo "=== $ch done $(date +%T)"
done
echo ALLDONE
