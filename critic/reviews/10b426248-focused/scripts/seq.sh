#!/bin/bash
cd /d/Tools/pyrefly-scratch/2026-11-01/r71-focused/scripts
export PYREFLY_BROWSER=gpu
B=http://127.0.0.1:5871/
while powershell -c "Get-Process -Id 91964" >/dev/null 2>&1; do sleep 10; done
echo "braska continuity process ended $(date -u +%T)"
for c in sin-face yojimbo-cavern seymour-omnis; do echo "=== ts $c 1.3"; node textsize.mjs --chapter=$c --size=1.3 --base=$B --tag=ts-$c-1.3 2>&1 | tail -3; done
for c in sin-face seymour-flux ffx2-bahamut; do echo "=== live $c"; node play.mjs --chapter=$c --base=https://echoesofspira.com/ --w=1600 --h=900 --tag=L-$c-1600 2>&1 | tail -2; done
cd /d/pyrefly-release55
for c in evrae-airship sin-face mirror-aeons ffx2-vegnagun-shuyin ffx2-fallen-aeons ffx2-ixion-djose; do
  echo "=== START $c $(date -u +%T)"
  node /d/Tools/pyrefly-scratch/2026-10-30/r69-focused/scripts/withlock.mjs 45 /d/pyrefly-release55 -- node critic/runner/lib/continuity.mjs --base=$B --evidence="D:/pyrefly-release55/critic/reviews/10b426248-focused/continuity" --chapters=$c --summary=continuity-summary-$c.json --tag=10b426248 2>&1 | tail -6
  echo "=== END $c $(date -u +%T)"
done
echo SEQ-DONE
