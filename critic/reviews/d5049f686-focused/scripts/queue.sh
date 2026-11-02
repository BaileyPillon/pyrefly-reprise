#!/bin/bash
cd /d/pyrefly-release55/critic/reviews/d5049f686-focused/scripts
export PYREFLY_BROWSER=gpu
run() { # id chapter query mode
  echo "=== START $1 $(date -u +%T)"
  node runcont.mjs --id=$1 --chapter=$2 --query="$3" --mode=$4 --minutes=20 2>&1 | tail -3
  echo "=== END $1 $(date -u +%T)"; sleep 95
}
run sin-F-cand sin-face '?coach=off' force
run sin-F-pack sin-face '?coach=off&treated=pack' force
run sin-N-cand sin-face '?coach=off' observe
run sin-N-pack sin-face '?coach=off&treated=pack' observe
run evrae-F-cand evrae-airship '?coach=off' force
run evrae-F-pack evrae-airship '?coach=off&treated=pack' force
run evrae-N-cand evrae-airship '?coach=off' observe
run evrae-N-pack evrae-airship '?coach=off&treated=pack' observe
run mirror-F-cand mirror-aeons '?coach=off' force
run mirror-F-pack mirror-aeons '?coach=off&treated=pack' force
run mirror-N-cand mirror-aeons '?coach=off' observe
run mirror-N-pack mirror-aeons '?coach=off&treated=pack' observe
run ch1-F-cand seymour-flux '?coach=off' force
run ch1-F-today seymour-flux '?coach=off&fastfloor=today' force
run ch1-N-cand seymour-flux '?coach=off' observe
run ch4-F-cand ffx2-bahamut '?coach=off' force
run ch4-F-today ffx2-bahamut '?coach=off&fastfloor=today' force
run ch4-N-cand ffx2-bahamut '?coach=off' observe
echo QUEUE-ALL-DONE
