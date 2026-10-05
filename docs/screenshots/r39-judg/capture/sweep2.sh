#!/bin/bash
# usage: sweep2.sh TAG SIZE STEPS CHAPTERS TSLIST [extra flags]   (second harness)
TAG=$1; SIZE=$2; STEPS=$3; CHAPTERS=$4; TSLIST=$5; shift 5
cd "D:/Tools/pyrefly-scratch/2026-10-04/r39-judg"
for ch in $CHAPTERS; do
  for ts in $TSLIST; do
    PYREFLY_BROWSER=gpu timeout 900 node textsize2.mjs --chapter=$ch --size=$SIZE --ts=$ts --tag=$TAG --steps=$STEPS "$@" 2>&1 | tail -2
  done
done
