#!/bin/bash
cd /d/Tools/pyrefly-scratch/2026-11-01/r71-focused/scripts
B=http://127.0.0.1:5871/
export PYREFLY_BROWSER=gpu
while ! grep -q JOB1-DONE job1.log; do sleep 10; done
for s in 1.15 1.3; do
 for c in sin-face yojimbo-cavern seymour-omnis; do
  echo "=== ts $c $s"; node textsize.mjs --chapter=$c --size=$s --base=$B --tag=ts-$c-$s 2>&1 | tail -3
 done
done
echo JOB2-DONE
