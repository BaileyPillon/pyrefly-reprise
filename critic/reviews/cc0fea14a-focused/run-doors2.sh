#!/bin/bash
cd /d/pyrefly-release55
L=<scratch>/RIG-RECORD
for job in "$@"; do
  IFS=: read word id W H turns <<< "$job"
  until ( set -o noclobber; echo "{\"who\":\"r62 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":10}" > $L ) 2>/dev/null; do sleep 20; done
  echo "=== $word $W start $(date +%T)"
  PYREFLY_BROWSER=gpu timeout 600 node critic/reviews/cc0fea14a-focused/job-door.mjs $word $id $W $H $turns 2>&1 | cut -c1-420
  mv $L <scratch>/RIG-RECORD.r62-focused-last-release 2>/dev/null
  echo "=== $word $W done $(date +%T)"
  sleep 95
done
echo ALLDONE
