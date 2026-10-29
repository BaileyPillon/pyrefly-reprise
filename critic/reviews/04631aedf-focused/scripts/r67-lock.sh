#!/bin/bash
# usage: lock.sh take|drop
L=/d/Tools/pyrefly-scratch/RIG-RECORD
if [ "$1" = take ]; then
 set -C
 echo "{\"who\":\"r67 focused review\",\"pid\":$$,\"at\":\"$(date -u +%FT%TZ)\",\"maxMinutes\":10}" > $L && echo taken || echo busy
else rm -f $L; echo dropped; fi
