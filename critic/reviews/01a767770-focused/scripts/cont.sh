#!/bin/bash
cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
E="D:/pyrefly-release55/critic/reviews/01a767770-focused"
run() { # name base evidence-subdir chapter tag maxmin
  echo "=== START $1 $(date -u +%T)"
  node /d/Tools/pyrefly-scratch/2026-10-30/r69-focused/scripts/withlock.mjs $6 /d/pyrefly-release55 -- node critic/runner/lib/continuity.mjs --base="$2" --evidence="$E/$3" --chapters=$4 --summary=continuity-summary-$4.json --tag=$5 2>&1 | tail -4
  echo "=== END $1 $(date -u +%T)"; sleep 95
}
B=http://127.0.0.1:5731/
run cand-IX $B continuity yojimbo-cavern 01a767770 20
run cand-XII $B continuity seymour-omnis 01a767770 20
run cand-VII $B continuity seymour-anima-macalania 01a767770 20
run cand-XIV $B continuity isaaru-via-purifico 01a767770 20
run pack-IX "http://127.0.0.1:5731/?treated=pack&x=/" continuity-control yojimbo-cavern ctrl 20
run pack-XII "http://127.0.0.1:5731/?treated=pack&x=/" continuity-control seymour-omnis ctrl 20
run cand-III $B continuity braskas-final-aeon 01a767770 35
echo CONT-ALL-DONE
