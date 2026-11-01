#!/bin/bash
cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
E="D:/pyrefly-release55/critic/reviews/0804dc482-focused"
run() { # name base evidence-subdir chapter tag
  echo "=== START $1 $(date -u +%T)"
  node /d/Tools/pyrefly-scratch/2026-10-30/r69-focused/scripts/withlock.mjs 20 /d/pyrefly-release55 -- node critic/runner/lib/continuity.mjs --base="$2" --evidence="$E/$3" --chapters=$4 --summary=continuity-summary-$4.json --tag=$5 2>&1 | tail -3
  echo "=== END $1 $(date -u +%T)"; sleep 95
}
run cand-XVIII http://127.0.0.1:5877/ continuity sin-face 0804dc482
run live-XVIII "https://echoesofspira.com/" continuity-live sin-face live70
run pack-XVIII "http://127.0.0.1:5877/?treated=pack&x=/" continuity-control sin-face ctrl
run cand-VIII http://127.0.0.1:5877/ continuity evrae-airship 0804dc482
run cand-mirror http://127.0.0.1:5877/ continuity mirror-aeons 0804dc482
echo CONT-ALL-DONE
