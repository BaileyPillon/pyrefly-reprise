#!/bin/bash
# runs each hidden-chapter door job under the RIG-RECORD lock, one at a time
cd /d/pyrefly-release55
L=<scratch>/RIG-RECORD
for job in "$@"; do
  word=${job%%:*}; rest=${job#*:}; id=${rest%%:*}; turns=${rest#*:}
  until ( set -o noclobber; echo "{\"who\":\"r62 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":10}" > $L ) 2>/dev/null; do sleep 20; done
  echo "=== $word start $(date +%T)"
  PYREFLY_BROWSER=gpu timeout 600 node critic/reviews/cc0fea14a-focused/job-door.mjs $word $id 1600 900 $turns 2>&1 | cut -c1-420
  mv $L <scratch>/RIG-RECORD.r62-focused-last-release 2>/dev/null
  echo "=== $word done $(date +%T)"
done
echo ALLDONE
