#!/bin/bash
cd /d/pyrefly-release55/critic/reviews/d5049f686-focused/scripts
export PYREFLY_BROWSER=gpu
C=http://127.0.0.1:5733/; L=https://echoesofspira.com/
r() { echo "=== $1 $(date -u +%T)"; node play.mjs --chapter=$2 --base=$3 --w=$4 --h=$5 --tag=$1 $6 2>&1 | tail -4; sleep 95; }
r p-ch1-cand seymour-flux $C 390 844 --phone
r p-ch1-live seymour-flux $L 390 844 --phone
r p-ch4-cand ffx2-bahamut $C 390 844 --phone
r p-ch4-live ffx2-bahamut $L 390 844 --phone
r d-ch1-1600 seymour-flux $C 1600 900
r d-ch4-2000 ffx2-bahamut $C 2000 1012
r d-ch1-live-1600 seymour-flux $L 1600 900
echo Q4-DONE
