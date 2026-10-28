cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
R=critic/reviews/2b48cee95-focused
for pair in "seymour-flux lose" "ffx2-bahamut lose" "ffx2-vegnagun-shuyin win" "seymour-anima-macalania win"; do
  set -- $pair
  node $R/run-with-lock.mjs 20 "r62 focused review" -- node critic/runner/lib/route.mjs $1 $2 --base=http://127.0.0.1:5901/ --evidence="D:/pyrefly-release55/critic/reviews/2b48cee95-focused/routes/$1-$2" --tag=2b48cee95 --budget=900000
  sleep 100
done
echo ALLDONE
