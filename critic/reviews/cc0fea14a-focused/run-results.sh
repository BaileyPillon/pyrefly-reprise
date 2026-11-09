#!/bin/bash
# args repeated: tag how W H hp   (hp may be "-")
cd /d/pyrefly-release55
L=<scratch>/RIG-RECORD
R=critic/reviews/cc0fea14a-focused
while [ $# -ge 5 ]; do
  tag=$1; how=$2; W=$3; H=$4; hp=$5; shift 5; [ "$hp" = "-" ] && hp=""
  until ( set -o noclobber; echo "{\"who\":\"r62 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":10}" > $L ) 2>/dev/null; do sleep 20; done
  echo "=== results $tag start $(date +%T)"
  PYREFLY_BROWSER=gpu timeout 600 node $R/job-results.mjs $tag $how $W $H "$hp" 2>&1 | cut -c1-800
  mv $L <scratch>/RIG-RECORD.r62-focused-last-release 2>/dev/null
  echo "=== results $tag done $(date +%T)"
  sleep 95
done
echo ALLDONE
