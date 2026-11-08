#!/bin/bash
cd /d/pyrefly-release55
L=D:/Tools/pyrefly-scratch/RIG-RECORD
R=critic/reviews/6429ff15e-focused
while [ $# -ge 3 ]; do
  ch=$1; W=$2; H=$3; shift 3
  until ( set -o noclobber; echo "{\"who\":\"r62 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":10}" > $L ) 2>/dev/null; do sleep 20; done
  echo "=== layout $ch $W start $(date +%T)"
  PYREFLY_BROWSER=gpu timeout 400 node $R/job-core.mjs $ch layout "" $W $H 2>&1 | cut -c1-400
  mv $L D:/Tools/pyrefly-scratch/RIG-RECORD.r62-focused-last-release 2>/dev/null
  echo "=== layout $ch $W done $(date +%T)"
done
echo ALLDONE
