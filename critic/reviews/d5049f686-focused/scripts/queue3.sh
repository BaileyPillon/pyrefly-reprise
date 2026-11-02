#!/bin/bash
cd /d/pyrefly-release55/critic/reviews/d5049f686-focused/scripts
export PYREFLY_BROWSER=gpu
until grep -q QUEUE2-DONE queue2.log; do sleep 10; done
sleep 95
for spec in "evrae-F-live evrae-airship" "mirror-F-live mirror-aeons"; do set -- $spec
echo "=== START $1 $(date -u +%T)"
node runcont.mjs --id=$1 --chapter=$2 --query='?coach=off' --mode=force --minutes=20 --base=https://echoesofspira.com/ 2>&1 | tail -3
echo "=== END $1 $(date -u +%T)"; sleep 95; done
echo QUEUE3-DONE
