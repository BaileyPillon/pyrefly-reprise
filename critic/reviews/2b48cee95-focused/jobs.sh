cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
B=http://127.0.0.1:5511/
O=critic/reviews/2b48cee95-focused
P=$O/opening-probe.mjs
node $O/run-with-lock.mjs 10 "r62 focused review" -- "node $P $B $O/opening ch1 seymour-flux 1600 900 && node $P $B $O/opening ch4 ffx2-bahamut 1600 900 && node $P $B $O/opening ch1-2k seymour-flux 2000 1012 && node $P $B $O/opening ch4-2k ffx2-bahamut 2000 1012 && node $P $B $O/opening demo1 demo1 1600 900 && node $P $B $O/opening demo4 demo4 1600 900 && node $O/phone-menu.mjs $B $O/phone"
node $O/run-with-lock.mjs 20 "r62 focused review" -- "node critic/runner/lib/continuity.mjs --base=$B --evidence=\"D:/pyrefly-release55/critic/reviews/2b48cee95-focused/continuity\" --chapters=ffx2-bahamut --tag=2b48cee95"
node $O/run-with-lock.mjs 20 "r62 focused review" -- "node critic/runner/lib/continuity.mjs --base=$B --evidence=\"D:/pyrefly-release55/critic/reviews/2b48cee95-focused/continuity\" --chapters=seymour-flux --tag=2b48cee95"
echo ALLJOBS_DONE
