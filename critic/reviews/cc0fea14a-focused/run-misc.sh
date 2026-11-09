#!/bin/bash
cd /d/pyrefly-release55
L=<scratch>/RIG-RECORD
R=critic/reviews/cc0fea14a-focused
lock() { until ( set -o noclobber; echo "{\"who\":\"r62 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":10}" > $L ) 2>/dev/null; do sleep 20; done; }
unlock() { mv $L <scratch>/RIG-RECORD.r62-focused-last-release 2>/dev/null; }
for w in bluelight ifrit wendigo; do
  lock; echo "=== save $w $(date +%T)"
  PYREFLY_BROWSER=gpu timeout 400 node $R/job-save.mjs $w 2>&1 | cut -c1-1000
  unlock; sleep 95
done
lock; echo "=== art-browser-load $(date +%T)"
PYREFLY_BROWSER=gpu timeout 400 node tools/art-browser-load.mjs --dir dist-gate 2>&1 | tail -6 | cut -c1-300
unlock
echo ALLDONE
