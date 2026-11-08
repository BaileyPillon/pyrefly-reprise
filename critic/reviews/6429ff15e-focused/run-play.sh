#!/bin/bash
cd /d/pyrefly-release55
L=D:/Tools/pyrefly-scratch/RIG-RECORD
R=critic/reviews/6429ff15e-focused
for i in "$@"; do
  until ( set -o noclobber; echo "{\"who\":\"r62 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":10}" > $L ) 2>/dev/null; do sleep 20; done
  echo "=== play $i start $(date +%T)"
  PYREFLY_BROWSER=gpu timeout 900 node critic/runner/lib/play.mjs $i --base=http://127.0.0.1:5471/ --evidence="D:/pyrefly-release55/$R/play$i" 2>&1 | tail -15 | cut -c1-400
  mv $L D:/Tools/pyrefly-scratch/RIG-RECORD.r62-focused-last-release 2>/dev/null
  echo "=== play $i done $(date +%T)"
done
echo ALLDONE
