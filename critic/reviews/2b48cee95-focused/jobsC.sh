cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
R=critic/reviews/2b48cee95-focused
node $R/run-with-lock.mjs 20 "r62 focused review" -- node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5901/ --evidence="D:/pyrefly-release55/critic/reviews/2b48cee95-focused/continuity" --chapters=seymour-flux --summary=continuity-summary-ch1.json --tag=2b48cee95
sleep 100
node $R/run-with-lock.mjs 20 "r62 focused review" -- node critic/runner/lib/continuity.mjs --base=http://127.0.0.1:5901/ --evidence="D:/pyrefly-release55/critic/reviews/2b48cee95-focused/continuity" --chapters=ffx2-bahamut --summary=continuity-summary-ch4.json --tag=2b48cee95
echo ALLDONE
