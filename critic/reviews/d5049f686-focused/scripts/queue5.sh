#!/bin/bash
cd /d/pyrefly-release55/critic/reviews/d5049f686-focused/scripts
export PYREFLY_BROWSER=gpu
until grep -q Q4-DONE queue4.log; do sleep 10; done; sleep 95
node phone4.mjs --base=http://127.0.0.1:5733/ --tag=p-ch4-cand 2>&1 | tail -3; sleep 95
node phone4.mjs --base=https://echoesofspira.com/ --tag=p-ch4-live 2>&1 | tail -3
echo Q5-DONE
