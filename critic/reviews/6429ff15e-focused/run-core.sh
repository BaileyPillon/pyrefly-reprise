#!/bin/bash
# args: chapterId tag query  (repeated triples)
cd /d/pyrefly-release55
L=D:/Tools/pyrefly-scratch/RIG-RECORD
R=critic/reviews/6429ff15e-focused
while [ $# -ge 3 ]; do
  ch=$1; tag=$2; q=$3; shift 3
  until ( set -o noclobber; echo "{\"who\":\"r62 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":10}" > $L ) 2>/dev/null; do sleep 20; done
  echo "=== core $ch $tag start $(date +%T)"
  PYREFLY_BROWSER=gpu timeout 400 node $R/job-core.mjs $ch $tag "$q" 1600 900 2>&1 | cut -c1-500
  mv $L D:/Tools/pyrefly-scratch/RIG-RECORD.r62-focused-last-release 2>/dev/null
  echo "=== core $ch $tag done $(date +%T)"
done
echo ALLDONE
