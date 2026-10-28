cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
B=http://127.0.0.1:5511/
O=critic/reviews/2b48cee95-focused
until grep -q JOBS2_DONE $O/jobs2.log; do sleep 10; done
for c in ffx2-vegnagun-shuyin yunalesca; do node $O/run-with-lock.mjs 10 "r62 focused review" -- node $O/words-probe.mjs $B $O/words $c z; done
echo JOBS3_DONE
