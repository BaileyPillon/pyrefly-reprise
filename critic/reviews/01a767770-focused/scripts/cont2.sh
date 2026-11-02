#!/bin/bash
cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
E="D:/pyrefly-release55/critic/reviews/01a767770-focused"
while ! grep -q CONT-ALL-DONE $E/continuity/cont.log; do sleep 20; done
sleep 95
run() {
  echo "=== START $1 $(date -u +%T)"
  node /d/Tools/pyrefly-scratch/2026-10-30/r69-focused/scripts/withlock.mjs 20 /d/pyrefly-release55 -- node critic/runner/lib/continuity.mjs --base="$2" --evidence="$E/$3" --chapters=$4 --summary=continuity-summary-$4.json --tag=$5 2>&1 | tail -4
  echo "=== END $1 $(date -u +%T)"; sleep 95
}
run live-VII "https://echoesofspira.com/" continuity-live seymour-anima-macalania live71
run pack-VII "http://127.0.0.1:5731/?treated=pack&x=/" continuity-control seymour-anima-macalania ctrl
echo CONT2-DONE
