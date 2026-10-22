#!/bin/bash
cd "D:/pyrefly-release55/critic/reviews/1cea6e937-focused"
export PYREFLY_BROWSER=gpu
B=http://127.0.0.1:5420/pyrefly-reprise/
E="D:/pyrefly-release55/critic/reviews/1cea6e937-focused"
run() { # name chapter query size extra
  local n=$1 c=$2 q=$3 s=$4; shift 4
  FPSLOG=fps-$n.log PYREFLY_QUERY="$q" node route-fps.mjs $c win --base=$B --evidence="$E/$n" --size=$s "$@" > $n.log 2>&1
  echo "$n done $(tail -1 $n.log)" >> chain1.status
}
run ch1-nodemo-1600 seymour-flux "" 1600x900 --seed=1
run ch4-nodemo-1600 ffx2-bahamut "" 1600x900 --seed=1
run yuna-1600 yunalesca "" 1600x900 --seed=1
run vegnagun-1600 ffx2-vegnagun-shuyin "" 1600x900 --seed=1
run leblanc-1600 ffx2-leblanc "" 1600x900 --seed=1
run ch1-demo-2560 seymour-flux "?demo=1" 2560x1440 --seed=drawn
run ch4-demo-2560 ffx2-bahamut "?demo=1" 2560x1440 --seed=drawn
run ch1-demo-390 seymour-flux "?demo=1" 390x844 --seed=drawn --touch
run ch4-demo-390 ffx2-bahamut "?demo=1" 390x844 --seed=drawn --touch
echo ALLDONE >> chain1.status
