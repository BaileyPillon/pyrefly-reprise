#!/bin/bash
cd /d/pyrefly-release55/critic/reviews/d5049f686-focused/scripts
export PYREFLY_BROWSER=gpu
until grep -q QUEUE-ALL-DONE queue.log; do sleep 10; done
sleep 95
echo "=== START sin-F-pack $(date -u +%T)"
node runcont.mjs --id=sin-F-pack --chapter=sin-face --query='?coach=off&treated=pack' --mode=force --minutes=20 --force 2>&1 | tail -3
echo "=== END sin-F-pack $(date -u +%T)"
echo QUEUE2-DONE
