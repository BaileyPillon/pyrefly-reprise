#!/bin/bash
cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
export PYREFLY_QUERY='?coach=off'
D=critic/reviews/f91ff81d0-focused
until grep -q BDONE $D/runB.log; do sleep 20; done
sleep 100
bash $D/lock.sh take 12 || exit 1
node critic/runner/lib/continuity.mjs --base=https://echoesofspira.com/ --evidence="D:/pyrefly-release55/critic/reviews/f91ff81d0-focused/continuity-live/seymour-omnis" --chapters=seymour-omnis --tag=live-r74
echo "DONE live-omnis rc=$?"
bash $D/lock.sh drop
echo DALLDONE
