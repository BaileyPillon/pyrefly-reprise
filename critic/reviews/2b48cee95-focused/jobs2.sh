cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
B=http://127.0.0.1:5511/
O=critic/reviews/2b48cee95-focused
until grep -q ALLJOBS_DONE $O/jobs.log; do sleep 10; done
P=$O/opening-probe.mjs
node $O/run-with-lock.mjs 10 "r62 focused review" -- "node $P $B $O/opening demo1d demo1 1600 900 \"?demo=1&pack=demo\" && node $P $B $O/opening demo4d demo4 1600 900 \"?demo=1&pack=demo\" && node $O/phone-menu.mjs $B $O/phone2"
echo JOBS2_DONE
