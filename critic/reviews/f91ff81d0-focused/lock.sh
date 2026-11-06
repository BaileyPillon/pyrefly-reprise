#!/bin/bash
# usage: lock.sh take <minutes> | drop   (RIG-RECORD, exclusive create; waits while another holder exists)
L=/d/Tools/pyrefly-scratch/RIG-RECORD
if [ "$1" = take ]; then
  for i in $(seq 1 360); do
    if ( set -C; echo "{\"who\":\"r62 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":${2:-10}}" > $L ) 2>/dev/null; then echo taken; exit 0; fi
    sleep 10
  done
  echo timeout; exit 1
else
  rm -f $L; echo dropped; date +%s > /d/Tools/pyrefly-scratch/.r62-focused-released
fi
