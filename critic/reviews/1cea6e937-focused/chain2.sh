#!/bin/bash
cd "D:/pyrefly-release55/critic/reviews/1cea6e937-focused"
export PYREFLY_BROWSER=gpu
E="D:/pyrefly-release55/critic/reviews/1cea6e937-focused"
run() { local n=$1 c=$2 b=$3 s=$4; shift 4
  FPSLOG=fps-$n.log node route-fps.mjs $c win --base=$b --evidence="$E/$n" --size=$s "$@" > $n.log 2>&1
  echo "$n done $(tail -1 $n.log)" >> chain2.status; }
run live-ch1-390 seymour-flux https://echoesofspira.com/ 390x844 --seed=1 --touch
run cand-ch1-390 seymour-flux http://127.0.0.1:5420/pyrefly-reprise/ 390x844 --seed=1 --touch
echo ALLDONE >> chain2.status
